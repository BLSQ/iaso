from django.core.paginator import Paginator
from dhis2 import RequestException
from .value_formatter import format_value
import json


def uniquify(seq, idfun=None):  # Alex Martelli ******* order preserving
    if idfun is None:

        def idfun(x):
            return x

    seen = {}
    result = []
    for item in seq:
        marker = idfun(item)
        # in old Python versions:
        # if seen.has_key(marker)
        # but in new ones:
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
        # "orgUnit": instance.org_unit.source_ref,
        "orgUnit": "Rp268JB6Ne4",
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
    for question_key in instance.json.keys():
        if question_key in question_mappings:
            try:
                data_element = question_mappings[question_key]
                data_element["question_key"] = question_key
                raw_value = instance.json[question_key]
                data_value = {
                    "dataElement": data_element["id"],
                    "value": format_value(data_element, raw_value),
                    # "debug": str(raw_value)+" "+str(data_element)
                    "debug": str(raw_value) + " " + question_key,
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
        paginator = Paginator(instances_qs, 100)
        events = []
        errors = []

        for page in range(1, paginator.num_pages + 1):
            for instance in paginator.page(page).object_list:
                if instance.json:
                    event, event_errors = map_to_event(instance, form_mapping)
                    if not event_errors:
                        events.append(event)
                    else:
                        errors.append(event_errors)
            if export:
                try:
                    resp = api.post("events", {"events": events}).json()
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
        print(json.dumps(events, indent=4))
        print("instances", paginator.count)
        print("events", len(events))
        print("errors", len(errors))
