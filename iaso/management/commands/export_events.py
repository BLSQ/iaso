from django.core.management.base import BaseCommand
import json
from iaso.models import OrgUnit, OrgUnitType, Instance
from django.db import connection
from django.core.paginator import Paginator


def format_value(data_element, raw_value):
    data_element_type = None
    if "valueType" in data_element:
        data_element_type = data_element["valueType"]
    else:
        raise Exception("no valueType for ", data_element)

    if data_element_type == "INTEGER_ZERO_OR_POSITIVE":
        try:
            return int(raw_value)
        except:
            return Exception("Bad value for int", raw_value, data_element)

    if data_element_type == "TEXT":
        if "option_set" in data_element:
            for options in data_element["option_set"]["options"]:
                if options["odk"] == raw_value:
                    return options["code"]

            for options in data_element["option_set"]["options"]:
                if options["code"] == raw_value:
                    return raw_value
        return str(raw_value)

    if data_element_type == "BOOLEAN":
        if raw_value == "1":
            return True
        elif raw_value == "0":
            return False
        elif raw_value == "":
            return None
        else:
            raise Exception(
                raw_value + " bad value for '" + data_element_type + "'", raw_value
            )

    raise Exception("unsupported data element type : " + data_element, raw_value)


class Command(BaseCommand):
    help = "Export to instances (form submissions) to a dhis2"

    def handle(self, *args, **options):

        instances_qs = (
            Instance.objects.filter(form__form_id="RDC_Data_CS")
            .prefetch_related("org_unit")
            .prefetch_related("form")
            .all()
        )
        paginator = Paginator(instances_qs, 10)
        mapping = self.load_mapping()
        events = []

        for page in range(1, paginator.num_pages + 1):
            for instance in paginator.page(page).object_list:
                event = {
                    "program": mapping["program_id"],
                    "event": instance.export_id,
                    "orgUnit": instance.org_unit.source_ref,
                    "eventDate": "TODO",
                    "status": "COMPLETED",
                    "dataValues": [],
                }
                if instance.location:
                    event["coordinate"] = {
                        "latitude": instance.location.y,
                        "longitude": instance.location.x,
                    }

                if instance.json:
                    errored = False
                    question_mappings = mapping["question_mappings"]
                    for question_key in instance.json.keys():
                        if question_key in question_mappings:
                            try:
                                question_mappings["question_key"] = question_key
                                data_element = question_mappings[question_key]
                                raw_value = instance.json[question_key]
                                data_value = {
                                    "dataElement": data_element["id"],
                                    "value": format_value(data_element, raw_value),
                                }
                                event["dataValues"].append(data_value)
                            except Exception as error:
                                errored = True

                                print("ERROR", error, question_key)
                    if not errored:
                        events.append(event)

            print("done processing page %d/%d" % (page, paginator.num_pages))

    def load_mapping(self):
        with open("./testdata/form-ihp.json") as json_file:
            return json.load(json_file)
