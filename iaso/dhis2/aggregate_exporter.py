from django.core.paginator import Paginator
from dhis2 import RequestException
from dhis2 import Api
from .value_formatter import format_value
import json
from iaso.models import Instance, OrgUnit, Form, FormVersion, Mapping


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
    if resp["status"] == "ERROR":

        for count_type in ("imported", "updated", "deleted", "ignored"):
            print(message, count_type, resp["response"][count_type])
        import_summaries = resp["response"]["importSummaries"]
        descriptions = [
            m["description"] for m in import_summaries if "description" in m
        ]
        conflicts = [m["conflicts"] for m in import_summaries if "conflicts" in m]
        descriptions = uniquify(descriptions)
        print("---------------------------------------------------------")
        print("----------------------- EXPORT ERROR --------------------")
        print("Failed to create events got", descriptions, conflicts, resp)


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

    def get_form_mappings(self, instance):
        # TODO use the ona_version to lookup the correct version
        # ona_version = instance.json()["_version"]
        ona_version = "latest"

        key = (instance.form_id, ona_version)
        if key in self.form_mappings_cache:
            mappings = self.form_mappings_cache[key]
            return mappings if mappings else None

        # TODO filter on ona_version id
        form_version = instance.form.form_versions.last()

        mappings = instance.form.form_versions.last().mappings.all()
        self.form_mappings_cache[key] = mappings
        return mappings if mappings else None

    def export_aggregates(self, api_old, instances_qs, export):
        paginator = Paginator(instances_qs, 100)
        skipped = []
        for page in range(1, paginator.num_pages + 1):
            errors = []
            for instance in paginator.page(page).object_list:
                if instance.json:
                    form_mappings = self.get_form_mappings(instance)
                    if form_mappings:
                        for form_mapping in form_mappings:
                            if form_mapping and form_mapping.name == "aggregate":
                                aggreg, map_errors = map_to_aggregate(
                                    instance, form_mapping.json
                                )
                                api = self.get_api(instance)
                                if export and not map_errors:
                                    try:
                                        resp = api.post("dataValueSets", aggreg).json()
                                        print(resp)
                                    except RequestException as dhis2_exception:
                                        message = (
                                            "error while processing page %d/%d"
                                            % (page, paginator.num_pages),
                                        )
                                        resp = json.loads(dhis2_exception.description)
                                        handle_exception(resp, message)

                                    print(json.dumps(aggreg, indent=4))
                            else:
                                # use the event ?
                                skipped.append((instance.id, "no aggregate mapping"))
            print(
                "done processing page %d/%d : %d skipped"
                % (page, paginator.num_pages, len(skipped))
            )
