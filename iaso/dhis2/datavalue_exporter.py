from django.core.paginator import Paginator
from django.utils import timezone
from dhis2 import RequestException
from dhis2 import Api
from .value_formatter import format_value
import json
from iaso.models import Instance, OrgUnit, Form, FormVersion, MappingVersion, ExportLog
import iaso.models as models
from timeit import default_timer as timer
import itertools

import logging

logger = logging.getLogger(__name__)


class InstanceExportError(BaseException):
    def __init__(self, *args):
        self.counts = args[1]
        self.descriptions = args[2]
        self.message = str(args[0]) + " : " + self.descriptions[0]

    def __str__(self):
        return "InstanceExportError, {0} ".format(self.message)


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


class AggregateHandler:
    def handle_exception(self, resp, message):
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

    def map_to_values(self, instance, form_mapping):
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

    def export_page(self, prefix, data, export_statuses, stats, api):
        if len(data) == 0:
            stats["batched_time"] = 0
            return []

        export_log = self.export_page_values(prefix, data, export_statuses, stats, api)
        export_log_complete_ds = self.mark_dataset_as_complete(data, api)
        return [export_log, export_log_complete_ds]

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

    def flatten(self, data):
        flattened = []
        for agg in data:
            for dv in agg["dataValues"]:
                dv["orgUnit"] = agg["orgUnit"]
                dv["period"] = agg["period"]
                flattened.append(dv)
        return flattened

    def export_log_on(self, status, export_status, export_logs):
        export_status.status = status
        for export_log in export_logs:
            export_status.export_logs.add(export_log)
        export_status.save()

    def export_page_values(self, prefix, data, export_statuses, stats, api):
        try:
            # print(prefix, "POSTING to dataValueSets {} ".format(request))
            batched_start = timer()

            request = {"dataValues": self.flatten(data)}

            resp = api.post("dataValueSets", request).json()
            exception = self.handle_exception({"response": resp}, "transient")
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

            exception = self.handle_exception({"response": resp}, message)

            export_log = ExportLog()
            export_log.sent = request
            export_log.received = resp
            export_log.http_code = dhis2_exception.code
            export_log.save()

            for export_status in export_statuses:
                self.export_log_on("errored", export_status, [export_log])

            raise exception


class EventHandler:
    def map_to_values(self, instance, form_mapping):

        event = {
            "program": form_mapping["program_id"],
            "event": instance.export_id,
            "orgUnit": instance.org_unit.source_ref,
            "eventDate": instance.created_at.strftime("%Y-%m-%d"),
            "status": "COMPLETED",
            "dataValues": [],
        }
        if instance.location:
            event["coordinate"] = {
                "latitude": instance.location.y,
                "longitude": instance.location.x,
            }
        errored = False
        event_errors = []
        question_mappings = form_mapping["question_mappings"]

        if instance.org_unit.source_ref == "" or instance.org_unit.source_ref == None:
            errored = True
            event_errors.append(
                [
                    "orgUnit",
                    Exception(
                        "unknown orgunit in dhis2 : "
                        + str(instance.org_unit.name)
                        + "("
                        + str(instance.org_unit.name)
                        + ")"
                    ),
                ]
            )
            print(event_errors)

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

                    if (
                        data_element.get("type")
                        == MappingVersion.QUESTION_MAPPING_MULTIPLE
                    ):
                        raw_values = raw_value.split(" ")

                        for value in data_element["values"]:
                            mapping_de = data_element["values"][value]
                            boolval = "1" if (value in raw_values) else "0"
                            data_value = {
                                "dataElement": mapping_de["id"],
                                "value": format_value(mapping_de, boolval)
                                # "debug": str(raw_value) + " " + question_key,
                            }
                            event["dataValues"].append(data_value)
                    else:
                        data_value = {
                            "dataElement": data_element["id"],
                            "value": format_value(data_element, raw_value),
                            # "debug": str(raw_value) + " " + question_key,
                        }
                        event["dataValues"].append(data_value)
                except Exception as error:
                    errored = True
                    event_errors.append([question_key, error])
                    print("ERROR Mapping", error, question_key)
        if errored:
            return (None, event_errors)
        else:
            return (event, None)

    def export_page(self, prefix, data, export_statuses, stats, api):
        if len(data) == 0:
            stats["batched_time"] = 0
            return []

        try:
            payload = {"events": data}
            print(json.dumps(payload, indent=2))
            resp = api.post("events", payload).json()
            print(resp)

            exception = self.handle_exception({"response": resp}, "transient")
            if exception:
                # fake it to behave like a bad request
                raise RequestException(
                    409, api.base_url + "/dataValueSets", json.dumps(resp)
                )

            export_log = ExportLog()
            export_log.sent = payload
            export_log.received = resp
            export_log.url = api.base_url + "/events"
            export_log.http_status = 200
            export_log.save()

            return [export_log]
        except RequestException as dhis2_exception:
            message = "ERROR while processing " + prefix
            resp = json.loads(dhis2_exception.description)
            exception = self.handle_exception(resp, message)
            raise exception

    def handle_exception(self, resp, message):
        response = resp["response"]

        if response["status"] == "ERROR":
            counts = {}

            for count_type in ("imported", "updated", "deleted", "ignored"):
                counts[count_type] = response.get(count_type, 0)
            import_summaries = (
                response.get("importSummaries")
                or response["response"]["importSummaries"]
            )
            descriptions = [
                m["description"] for m in import_summaries if "description" in m
            ]
            conflicts = [m["conflicts"] for m in import_summaries if "conflicts" in m]
            descriptions = uniquify(descriptions)
            print("---------------------------------------------------------")
            print("----------------------- EXPORT ERROR --------------------")
            print("Failed to create events got", descriptions, conflicts, resp)
            return InstanceExportError(message, counts, descriptions)


class EventTrackerHandler:
    def map_to_values(self, instance, form_mapping):
        question_mappings = form_mapping["question_mappings"]

        program_stage_ids = []
        for question_name in form_mapping["question_mappings"]:
            for mapping in question_mappings[question_name]:
                if "programStage" in mapping:
                    program_stage_id = mapping["programStage"]
                    if program_stage_id not in program_stage_ids:
                        program_stage_ids.append(program_stage_id)

        events = []
        errored = False

        for program_stage_id in program_stage_ids:
            event = {
                "program": form_mapping["program_id"],
                "programStage": program_stage_id,
                "event": instance.export_id,
                "orgUnit": instance.org_unit.source_ref,
                "eventDate": instance.created_at.strftime("%Y-%m-%d"),
                "status": "COMPLETED",
                "dataValues": [],
            }
            if instance.location:
                event["coordinate"] = {
                    "latitude": instance.location.y,
                    "longitude": instance.location.x,
                }

            event_errors = []

            for question_key in form_mapping["question_mappings"]:
                if question_key in instance.json.keys():
                    for mapping in question_mappings[question_key]:
                        if (
                            "programStage" in mapping
                            and mapping["programStage"] == program_stage_id
                        ):
                            if "dataElement" in mapping:
                                data_element = mapping["dataElement"]
                                raw_value = instance.json[question_key]
                                data_value = {
                                    "dataElement": data_element["id"],
                                    "value": format_value(data_element, raw_value),
                                }
                                event["dataValues"].append(data_value)
            if len(event["dataValues"]) > 0:
                events.append(event)
            else:
                print(f"no data for stage {program_stage_id}")

        tracked_entity_with_events = {"attributes": [], "events": events}

        for question_key in form_mapping["question_mappings"]:
            if question_key in instance.json.keys():
                for mapping in question_mappings[question_key]:
                    if "trackedEntityAttribute" in mapping:
                        tea = mapping["trackedEntityAttribute"]
                        raw_value = instance.json[question_key]
                        attribute = {
                            "attribute": tea["id"],
                            "value": format_value(tea, raw_value),
                            "displayName": tea["name"],
                            "valueType": tea["valueType"],
                        }
                        tracked_entity_with_events["attributes"].append(attribute)

        if errored:
            return (None, event_errors)
        else:
            return (tracked_entity_with_events, None)


class DataValueExporter:
    def __init__(self):
        self.form_mappings_cache = {}
        self.api_cache = {}
        self.handlers = {
            models.AGGREGATE: AggregateHandler(),
            models.EVENT: EventHandler(),
            models.EVENT_TRACKER: EventTrackerHandler(),
        }

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
        data = {models.AGGREGATE: [], models.EVENT: [], models.EVENT_TRACKER: []}

        for export_status in export_statuses:
            instance = export_status.instance

            form_mapping = export_status.mapping_version

            if not instance.json:
                skipped.append((instance.id, "no data json"))
                continue

            if not form_mapping:
                skipped.append((instance.id, "no mapping"))
                continue

            (values, map_errors) = self.handlers[
                form_mapping.mapping.mapping_type
            ].map_to_values(instance, form_mapping.json)

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
                data[form_mapping.mapping.mapping_type].append(values)
        return data

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
            try:
                export_statuses = paginator.page(page).object_list
                data = self.map_page_to_data_values(prefix, export_statuses, skipped)
                api = self.get_api(export_statuses[0].mapping_version)

                export_logs_aggregate = self.handlers[models.AGGREGATE].export_page(
                    prefix, data[models.AGGREGATE], export_statuses, stats, api
                )

                export_logs_event = self.handlers[models.EVENT].export_page(
                    prefix, data[models.EVENT], export_statuses, stats, api
                )

                export_logs = list(
                    itertools.chain(export_logs_aggregate, export_logs_event)
                )
                self.flag_as_exported(
                    export_request, export_statuses, stats, export_logs
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
