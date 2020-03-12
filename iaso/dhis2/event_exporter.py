from django.core.paginator import Paginator
from dhis2 import RequestException
from .value_formatter import format_value
import json


class CaseInsensitiveDict(dict):
    @classmethod
    def _k(cls, key):
        return key.lower() if isinstance(key, str) else key

    def __init__(self, *args, **kwargs):
        super(CaseInsensitiveDict, self).__init__(*args, **kwargs)
        self._convert_keys()

    def __getitem__(self, key):
        return super(CaseInsensitiveDict, self).__getitem__(self.__class__._k(key))

    def __setitem__(self, key, value):
        super(CaseInsensitiveDict, self).__setitem__(self.__class__._k(key), value)

    def __delitem__(self, key):
        return super(CaseInsensitiveDict, self).__delitem__(self.__class__._k(key))

    def __contains__(self, key):
        return super(CaseInsensitiveDict, self).__contains__(self.__class__._k(key))

    def has_key(self, key):
        return super(CaseInsensitiveDict, self).has_key(self.__class__._k(key))

    def pop(self, key, *args, **kwargs):
        return super(CaseInsensitiveDict, self).pop(
            self.__class__._k(key), *args, **kwargs
        )

    def get(self, key, *args, **kwargs):
        return super(CaseInsensitiveDict, self).get(
            self.__class__._k(key), *args, **kwargs
        )

    def setdefault(self, key, *args, **kwargs):
        return super(CaseInsensitiveDict, self).setdefault(
            self.__class__._k(key), *args, **kwargs
        )

    def update(self, E={}, **F):
        super(CaseInsensitiveDict, self).update(self.__class__(E))
        super(CaseInsensitiveDict, self).update(self.__class__(**F))

    def _convert_keys(self):
        for k in list(self.keys()):
            v = super(CaseInsensitiveDict, self).pop(k)
            self.__setitem__(k, v)


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


def map_to_event(instance, form_mapping):

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
    question_mappings = CaseInsensitiveDict(form_mapping["question_mappings"])

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
                data_element["question_key"] = question_key
                raw_value = instance.json[question_key]

                if data_element.get("type") == "multiple":
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


class EventExporter:
    def export_events(self, api, instances_qs, form_mapping, export):
        paginator = Paginator(instances_qs, 50)
        events = []
        errors = []
        skipped = []

        for page in range(1, paginator.num_pages + 1):
            for instance in paginator.page(page).object_list:
                if instance.json:
                    event, event_errors = map_to_event(instance, form_mapping)
                    if event and len(event["dataValues"]) == 0:
                        # todo throw ?
                        print("WARN no davaValues but had values", instance.json)
                    if not event_errors:
                        events.append(event)
                    else:
                        errors.append(event_errors)
                else:
                    skipped.append((instance.id, "no json data"))
            if export and len(events) > 0:
                try:
                    payload = {"events": events}
                    print(json.dumps(payload, indent=2))
                    resp = api.post("events", payload).json()
                    print(resp)
                except RequestException as dhis2_exception:
                    message = (
                        "error while processing page %d/%d"
                        % (page, paginator.num_pages),
                    )
                    resp = json.loads(dhis2_exception.description)
                    handle_exception(resp, message)

            print(
                "done processing page %d/%d" % (page, paginator.num_pages), len(events)
            )
        print(errors)
        # print(json.dumps(events, indent=4))
        print("instances", paginator.count)
        print("events", len(events))
        print("errors", len(errors))
        print("skipped", len(skipped), skipped)
