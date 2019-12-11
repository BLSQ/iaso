from django.core.management.base import BaseCommand
import json
from iaso.models import OrgUnit, OrgUnitType, Instance
from django.db import connection
from django.core.paginator import Paginator
from dhis2 import Api, RequestException

"""
https://docs.dhis2.org/2.30/en/developer/html/dhis2_developer_manual_full.html#webapi_csv_data_elements

supported   Value type	        Description
n        Age	                  -
n        COORDINATE             Coordinate     A point coordinate specified as longitude and latitude in decimal degrees. All coordinate should be specified in the format "-19.23 , 56.42" with a comma separating the longitude and latitude.
n        DATE                   Date           Dates rendered as calendar widget in data entry.
n        DATETIME               Date & time	        -
n        EMAIL                  Email	                Email.
n        FILE_RESOURCE          File            A file resource where you can store external files, for example documents and photos.
y        INTEGER                Integer	        Any whole number (positive and negative), including zero.
n        LETTER                 Letter              A single letter.
y        LONG_TEXT              Long text           Textual value. Renders as text area with no length constraint in forms.
y        INTEGER_NEGATIVE       Negative integer	Any whole number less than (but not including) zero.
y        NUMBER                 Number	            Any real numeric value with a single decimal point. Thousands separators and scientific notation is not supported.
n        PERCENTAGE             Percentage	        Whole numbers inclusive between 0 and 100.
n        PHONE_NUMBER           Phone number	        Phone number.
y        INTEGER_POSITIVE       Positive integer	Any whole number greater than (but not including) zero.
y        INTEGER_ZERO_OR_POSITIVE   Positive of zero integer	Any positive whole number, including zero.
n        Organisation unit	    Organisation units rendered as a hierarchy tree widget.
n        UNIT_INTERVAL          Unit interval    Any real number greater than or equal to 0 and less than or equal to 1.
y        TEXT                   Text            Textual value. The maximum number of allowed characters per value is 50,000.
n        ??                     Time	            "Time is stored in HH:mm format. HH is a number between 0 and 23 mm is a number between 00 and 59"
n        ???                    Tracker associate	Tracked entity instance. Rendered as dialog with a list of tracked entity instances and a search field.
n        ???                    Username	        DHIS 2 user. Rendered as a dialog with a list of users and a search field.
y        BOOLEAN                Yes/No	            Boolean values, renders as drop-down lists in data entry.
n        TRUE_ONLY              Yes only	        True values, renders as check-boxes in data entry.
"""


def translate_optionset(data_element, raw_value):
    if "optionSet" in data_element:
        if raw_value == "":
            return None

        for options in data_element["optionSet"]["options"]:
            if options.get("odk") == raw_value:
                return options["code"]

        for options in data_element["optionSet"]["options"]:
            if options["code"] == raw_value:
                return raw_value

        raise Exception(
            "no value matching : '" + raw_value + "' in " + str(data_element)
        )
    return raw_value


def format_value(data_element, raw_value):
    data_element_type = None
    if "valueType" in data_element:
        data_element_type = data_element["valueType"]
    else:
        raise Exception("no valueType for ", data_element)

    translated_value = translate_optionset(data_element, raw_value)

    if data_element_type == "NUMBER":
        if translated_value == "":
            return None
        try:
            return float(translated_value)
        except:
            raise Exception("Bad value for float", raw_value, data_element)

    if (
        data_element_type == "INTEGER_ZERO_OR_POSITIVE"
        or data_element_type == "INTEGER"
        or data_element_type == "INTEGER_POSITIVE"
        or data_element_type == "INTEGER_NEGATIVE"
    ):
        if translated_value == "":
            return None
        try:
            return int(translated_value)
        except:
            raise Exception("Bad value for int", raw_value, data_element)

    if data_element_type == "TEXT" or data_element_type == "LONG_TEXT":
        return str(translated_value)

    if data_element_type == "BOOLEAN":
        if translated_value == "1":
            return True
        elif translated_value == "0":
            return False
        elif translated_value == "":
            return None
        else:
            raise Exception(
                raw_value + " bad value for '" + data_element_type + "'", raw_value
            )

    raise Exception("unsupported data element type : " + str(data_element), raw_value)


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


class Command(BaseCommand):
    help = "Export to instances (form submissions) to a dhis2"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dhis2_url",
            type=str,
            help="Dhis2 url to import from (without user/password)",
            required=True,
        )
        parser.add_argument(
            "--dhis2_user", type=str, help="dhis2 user name", required=True
        )
        parser.add_argument(
            "--dhis2_password",
            type=str,
            help="dhis2 password of the dhis2_user",
            required=True,
        )

    def get_api(self, options):
        return Api(
            options.get("dhis2_url"),
            options.get("dhis2_user"),
            options.get("dhis2_password"),
        )

    """
    base on program id generate a template for odk mapping
    assumes codes are the question_key in the form
    """

    def seed_mapping(self, api, program_id):
        program = api.get(
            "programs/" + program_id,
            params={
                "fields": ":all,programStages[id,name,programStageDataElements[dataElement[id,code,name,valueType,optionSet[id,name,options[id,name,code]]]]]"
            },
        )
        question_mappings = {}
        for program_stage in program.json()["programStages"]:
            for psde in program_stage["programStageDataElements"]:
                question_mappings[psde["dataElement"]["code"]] = psde["dataElement"]

        mapping = {
            "type": "simple_event",
            "program_id": program_id,
            "question_mappings": question_mappings,
        }
        print(json.dumps(mapping, indent=4))

    def handle(self, *args, **options):
        # mapping_file = "./testdata/form-ihp.json"
        export = False
        mapping_file = "./testdata/form-play.json"
        form_id = "RDC_Data_CS"

        instances_qs = (
            Instance.objects.filter(
                form__form_id=form_id
                # , org_unit__validated= True ?
            )
            .prefetch_related("org_unit")
            .prefetch_related("form")
            .order_by("id")
            .all()
        )
        paginator = Paginator(instances_qs, 100)
        mapping = self.load_mapping(mapping_file)

        print("How to create a mapping file from a program id")
        api = self.get_api(options)
        self.seed_mapping(api, "q04UBOqq3rp")  # mapping["program_id"])

        events = []
        errors = []

        for page in range(1, paginator.num_pages + 1):
            for instance in paginator.page(page).object_list:
                if instance.json:
                    event = {
                        "program": mapping["program_id"],
                        "event": instance.export_id,
                        "orgUnit": instance.org_unit.source_ref,  # play "Rp268JB6Ne4",
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
                    question_mappings = mapping["question_mappings"]
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
                                print("ERROR", error, question_key)

                    if not errored:
                        events.append(event)
                    else:
                        errors.append(event_errors)
            if export:
                try:
                    resp = api.post("events", {"events": events}).json()
                    print(resp)
                except RequestException as dhis2_exception:
                    resp = json.loads(dhis2_exception.description)
                    if resp["status"] == "ERROR":
                        message = "error while processing page %d/%d" % (
                            page,
                            paginator.num_pages,
                        )
                        for count_type in ("imported", "updated", "deleted", "ignored"):
                            print(message, count_type, resp["response"][count_type])
                        import_summaries = resp["response"]["importSummaries"]
                        descriptions = [
                            m["description"]
                            for m in import_summaries
                            if "description" in m
                        ]
                        conflicts = [
                            m["conflicts"] for m in import_summaries if "conflicts" in m
                        ]
                        descriptions = uniquify(descriptions)
                        print(
                            "---------------------------------------------------------"
                        )
                        print(
                            "----------------------- EXPORT ERROR --------------------"
                        )
                        print(
                            "Failed to create events got", descriptions, conflicts, resp
                        )
            print(
                "done processing page %d/%d" % (page, paginator.num_pages), len(events)
            )
        print(errors)
        print(json.dumps(events, indent=4))
        print("instances", paginator.count)
        print("events", len(events))
        print("errors", len(errors))

    def load_mapping(self, mapping_file):
        with open(mapping_file) as json_file:
            return json.load(json_file)
