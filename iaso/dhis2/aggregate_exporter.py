from django.core.paginator import Paginator
from django.utils import timezone
from dhis2 import RequestException
from dhis2 import Api
from .value_formatter import format_value
import json
from iaso.models import Instance, OrgUnit, Form, FormVersion, MappingVersion, ExportLog
from timeit import default_timer as timer

import logging

logger = logging.getLogger(__name__)


class InstanceExportError(Exception):
    def __init__(self, *args):
        self.counts = args[1]
        self.descriptions = args[2]
        self.message = str(args[0]) + " : " + self.descriptions[0]

    def __str__(self):
        return "AggregateExportError, {0} ".format(self.message)


def uniquify(seq, idfun=None):
    if idfun is None:

        def idfun(x):
            return x

    seen = {}
    result = []
    for item in seq:
        marker = idfun(item)
        if marker not in seen:
            seen[marker] = 1
            result.append(item)

    return result


def handle_exception(resp, message):
    response = resp["response"]
    counts = {}
    descriptions = []
    if "importCount" in response:
        for count_type in ("imported", "updated", "deleted", "ignored"):
            counts[count_type] = response["importCount"][count_type]
    if response["status"] == "ERROR":
        if "description" in response:
            descriptions.append(response["description"])
        if "message" in response:
            descriptions.append(response["message"])
    if "conflicts" in response:
        descriptions = [m["value"] for m in response["conflicts"]]
    descriptions = uniquify(descriptions)
    if len(descriptions) > 0:
        logger.warn(
            "----------------------- aggregate EXPORT ERROR --------------------\n"
            + "Failed to create dataValueSets got {} {} {}".format(
                message, counts, descriptions
            )
        )
        return InstanceExportError(message, counts, descriptions)

    return None


def map_to_aggregate(instance, form_mapping):
    data_set_entry = {
        "dataSet": form_mapping["data_set_id"],
        "completeDate": instance.created_at.strftime("%Y-%m-%d"),
        "period": instance.period,
        "orgUnit": instance.org_unit.source_ref,
        "dataValues": [],
    }

    errored = False
    mapping_errors = []
    question_mappings = form_mapping["question_mappings"]
    for question_key in instance.json.keys():
        if question_key in question_mappings:
            try:
                data_element = question_mappings[question_key]
                if (
                    data_element.get("type")
                    == MappingVersion.QUESTION_MAPPING_NEVER_MAPPED
                ):
                    continue

                data_element["question_key"] = question_key
                raw_value = instance.json[question_key]
                data_value = {
                    "dataElement": data_element["id"],
                    "value": format_value(data_element, raw_value),
                    "comment": str(instance.id)
                    + " "
                    + str(raw_value)
                    + " "
                    + question_key,
                }
                if "categoryOptionCombo" in data_element:
                    data_value["categoryOptionCombo"] = data_element[
                        "categoryOptionCombo"
                    ]

                if "attributeOptionCombo" in data_element:
                    data_value["attributeOptionCombo"] = data_element[
                        "attributeOptionCombo"
                    ]
                data_set_entry["dataValues"].append(data_value)
            except Exception as error:
                errored = True
                mapping_errors.append([question_key, error])
                logger.warn("ERROR Mapping {} {}".format(error, question_key))
    if errored:
        return (None, mapping_errors)
    else:
        return (data_set_entry, None)


class AggregateExporter:
    def __init__(self):
        self.form_mappings_cache = {}
        self.api_cache = {}

    def get_api(self, mapping_version):

        if not mapping_version.id in self.api_cache:
            credentials = mapping_version.mapping.data_source.credentials
            self.api_cache[mapping_version.id] = Api(
                credentials.url, credentials.login, credentials.password
            )
        return self.api_cache[mapping_version.id]

    def export_log_on(self, status, export_status, export_logs):
        export_status.status = status
        for export_log in export_logs:
            export_status.export_logs.add(export_log)
        export_status.save()

    def map_page_to_data_values(self, prefix, export_statuses, skipped):
        data = []

        for export_status in export_statuses:
            instance = export_status.instance

            form_mapping = export_status.mapping_version

            if not instance.json:
                skipped.append((instance.id, "no data json"))
                continue

            if not form_mapping or not form_mapping.mapping.is_aggregate():
                skipped.append((instance.id, "no aggregate mapping"))
                continue
            (aggreg, map_errors) = map_to_aggregate(instance, form_mapping.json)

            if map_errors:
                message = (
                    "ERROR while processing "
                    + prefix
                    + ", instance_id %d" % (instance.id,)
                )
                exception = InstanceExportError(
                    message, {}, list(map(lambda x: x[0] + " " + str(x[1]), map_errors))
                )

                raise exception
            else:
                data.append(aggreg)
        return data

    def flatten(self, data):
        flattened = []
        for agg in data:
            for dv in agg["dataValues"]:
                dv["orgUnit"] = agg["orgUnit"]
                dv["period"] = agg["period"]
                flattened.append(dv)
        return flattened

    def export_page(self, prefix, request, export_statuses, stats, api):
        try:
            # print(prefix, "POSTING to dataValueSets {} ".format(request))
            batched_start = timer()
            print(request)
            resp = api.post("dataValueSets", request).json()

            exception = handle_exception({"response": resp}, "transient")
            if exception:
                # fake it to behave like a bad request
                raise RequestException(
                    409, api.base_url + "/dataValueSets", json.dumps(resp)
                )

            batched_end = timer()
            batched_time = batched_end - batched_start
            stats["batched_time"] = batched_time

            print(prefix, resp)

            export_log = ExportLog()
            export_log.sent = request
            export_log.received = resp
            export_log.url = api.base_url + "/dataValueSets"
            export_log.http_status = 200
            export_log.save()

            return export_log

        except RequestException as dhis2_exception:
            message = "ERROR while processing " + prefix
            resp = {}
            try:
                resp = json.loads(dhis2_exception.description)
            except:
                resp = {
                    "status": "ERROR",
                    "description": "non json response return by server",
                }

            exception = handle_exception({"response": resp}, message)

            export_log = ExportLog()
            export_log.sent = request
            export_log.received = resp
            export_log.http_code = dhis2_exception.code
            export_log.save()

            for export_status in export_statuses:
                self.export_log_on("errored", export_status, [export_log])

            raise exception

    def flag_as_errored(self, export_request, export_statuses, message, stats):
        for export_status in export_statuses:
            stats["errored_count"] += len(export_statuses)
            export_status.status = "errored"
            export_status.save()

        export_request.exportstatus_set.filter(status="QUEUED").update(status="SKIPPED")

        export_request.status = "errored"
        export_request.ended_at = timezone.now()
        export_request.finished = True
        export_request.errored_count = stats["errored_count"]
        export_request.exported_count = stats["exported_count"]
        export_request.last_error_message = message
        export_request.save()

    def flag_as_exported(self, export_request, export_statuses, stats, export_logs):
        stats["exported_count"] += len(export_statuses)
        for export_status in export_statuses:
            self.export_log_on("exported", export_status, export_logs)

        for export_status in export_statuses:
            instance = export_status.instance
            instance.last_export_success_at = timezone.now()
            instance.save()

        export_request.errored_count = stats["errored_count"]
        export_request.exported_count = stats["exported_count"]
        export_request.save()

    def mark_dataset_as_complete(self, data, api):
        def to_complete_data_set_registration(data_value_set):
            return {
                "period": data_value_set["period"],
                "dataSet": data_value_set["dataSet"],
                "organisationUnit": data_value_set["orgUnit"],
                "date": data_value_set["completeDate"],
            }

        complete_data_set_registrations = list(
            map(to_complete_data_set_registration, data)
        )
        request = {"completeDataSetRegistrations": complete_data_set_registrations}
        resp_complete = api.post("completeDataSetRegistrations", request)

        print("completeDataSetRegistrations response", resp_complete.json())
        export_log = ExportLog()
        export_log.sent = request
        export_log.received = resp_complete.json()
        export_log.url = api.base_url + "/completeDataSetRegistrations"
        export_log.save()
        return export_log

    def export_instances(self, export_request, export, page_size=50):
        export_request.status = "running"
        export_request.started_at = timezone.now()
        export_request.save()

        paginator = Paginator(
            export_request.exportstatus_set.prefetch_related("mapping_version")
            .prefetch_related("instance")
            .prefetch_related("instance__org_unit")
            .prefetch_related("instance__org_unit__version")
            .order_by("id")
            .all(),
            page_size,
        )
        skipped = []
        stats = {"exported_count": 0, "errored_count": 0}
        for page in range(1, paginator.num_pages + 1):
            page_start = timer()
            prefix = "page %d/%d" % (page, paginator.num_pages)
            export_statuses = paginator.page(page).object_list
            try:
                data = self.map_page_to_data_values(prefix, export_statuses, skipped)
                # TODO assuming a single dhis2
                # ideally map_page_to_data_values should return a dictionary { server: mapped_values }
                api = self.get_api(export_statuses[0].mapping_version)

                # TODO uncomplete if necessary ?
                # data_set_ids = list(set(map(lambda x: x["dataSet"],data)))
                # periods = list(set(map(lambda x: x["period"],data)))
                # org_unit_ids = list(set(map(lambda x: x["orgUnit"],data)))

                export_log = self.export_page(
                    prefix,
                    {"dataValues": self.flatten(data)},
                    export_statuses,
                    stats,
                    api,
                )

                export_log_complete_ds = self.mark_dataset_as_complete(data, api)

                self.flag_as_exported(
                    export_request,
                    export_statuses,
                    stats,
                    [export_log, export_log_complete_ds],
                )

                page_end = timer()
                page_time = page_end - page_start
                print(
                    prefix
                    + " in %1.2f sec (dhis2 time %1.2f batched): %d skipped"
                    % (page_time, stats["batched_time"], len(skipped))
                )

            except InstanceExportError as exception:
                self.flag_as_errored(
                    export_request, export_statuses, exception.message, stats
                )
                raise exception

            # it's ok to catch BaseException, we want to be able to mark it as errored if cancelled or worst
            except BaseException as exception:
                self.flag_as_errored(
                    export_request,
                    export_statuses,
                    repr(exception) + " : " + type(exception).__name__,
                    stats,
                )
                raise exception

        export_request.status = "exported"
        export_request.finished = True
        export_request.errored_count = stats["errored_count"]
        export_request.exported_count = stats["exported_count"]
        export_request.ended_at = timezone.now()
        export_request.save()
