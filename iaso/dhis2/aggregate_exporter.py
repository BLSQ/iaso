from django.core.paginator import Paginator
from django.utils import timezone
from dhis2 import RequestException
from dhis2 import Api
from .value_formatter import format_value
import json
from iaso.models import Instance, OrgUnit, Form, FormVersion, MappingVersion, ExportLog


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
        descriptions.append(response["description"])
    if "conflicts" in response:
        descriptions = [m["value"] for m in response["conflicts"]]
    descriptions = uniquify(descriptions)
    print("----------------------- EXPORT ERROR --------------------")
    print("Failed to create dataValueSets got", message, counts, descriptions)

    return InstanceExportError(message, counts, descriptions)


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
                data_element["question_key"] = question_key
                raw_value = instance.json[question_key]
                data_value = {
                    "dataElement": data_element["id"],
                    "value": format_value(data_element, raw_value),
                    "debug": str(raw_value) + " " + question_key,
                }
                if "categoryOptionCombo" in data_element:
                    data_value["categoryOptionCombo"] = data_element[
                        "categoryOptionCombo"
                    ]
                data_set_entry["dataValues"].append(data_value)
            except Exception as error:
                errored = True
                mapping_errors.append([question_key, error])
                print("ERROR Mapping", error, question_key)
    if errored:
        return (None, mapping_errors)
    else:
        return (data_set_entry, None)


class AggregateExporter:
    def __init__(self):
        self.form_mappings_cache = {}
        self.api_cache = {}

    def get_api(self, instance):
        version = instance.org_unit.version
        if not version.id in self.api_cache:
            credentials = instance.org_unit.version.data_source.credentials
            self.api_cache[version.id] = Api(
                credentials.url, credentials.login, credentials.password
            )
        return self.api_cache[version.id]

    def export_instances(self, export_request, export):
        export_request.status = "running"
        export_request.started_at = timezone.now()
        export_request.save()

        paginator = Paginator(export_request.exportstatus_set.order_by("id").all(), 100)
        skipped = []
        exported_count = 0
        errored_count = 0
        for page in range(1, paginator.num_pages + 1):
            errors = []
            for export_status in paginator.page(page).object_list:
                try:
                    instance = export_status.instance
                    form_mapping = export_status.mapping_version
                    if not instance.json:
                        skipped.append((instance.id, "no data json"))
                        continue

                    if not form_mapping or form_mapping.name != "aggregate":
                        skipped.append((instance.id, "no aggregate mapping"))
                        continue

                    (aggreg, map_errors) = map_to_aggregate(instance, form_mapping.json)
                    api = self.get_api(instance)
                    if map_errors:
                        message = (
                            "ERROR while processing page %d/%d, instance_id %d"
                            % (page, paginator.num_pages, instance.id,)
                        )
                        exception = InstanceExportError(
                            message,
                            {},
                            list(map(lambda x: x[0] + " " + str(x[1]), map_errors)),
                        )

                        raise exception

                    if export and not map_errors:
                        try:
                            print("POSTING to dataValueSets", aggreg, map_errors)
                            resp = api.post("dataValueSets", aggreg).json()
                            print(resp)

                            exported_count += 1

                            export_log = ExportLog()
                            export_log.sent = aggreg
                            export_log.received = resp
                            export_log.save()

                            export_status.status = "exported"
                            export_status.export_log = export_log
                            export_status.save()
                        except RequestException as dhis2_exception:
                            message = (
                                "ERROR while processing page %d/%d, instance_id %d"
                                % (page, paginator.num_pages, instance.id)
                            )
                            resp = json.loads(dhis2_exception.description)
                            exception = handle_exception({"response": resp}, message)

                            export_log = ExportLog()
                            export_log.sent = aggreg
                            export_log.received = resp
                            export_log.save()

                            export_status.status = "errored"
                            export_status.export_log = export_log
                            export_status.save()
                            raise exception

                except InstanceExportError as exception:
                    errored_count = errored_count + 1
                    export_status.status = "errored"
                    export_status.save()

                    export_request.status = "errored"
                    export_request.ended_at = timezone.now()
                    export_request.finished = True
                    export_request.errored_count = errored_count
                    export_request.exported_count = exported_count
                    export_request.last_error_message = exception.message
                    export_request.save()

                    # TODO should we mark other export_status as errored ?

                    raise exception

            print(
                "done processing page %d/%d : %d skipped"
                % (page, paginator.num_pages, len(skipped))
            )
            print(skipped)

        export_request.status = "exported"
        export_request.finished = True
        export_request.errored_count = errored_count
        export_request.exported_count = exported_count
        export_request.ended_at = timezone.now()
        export_request.save()
