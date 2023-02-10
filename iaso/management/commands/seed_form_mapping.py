import json

from dhis2 import Api
from django.core.management.base import BaseCommand

from iaso.models import Form
from ...dhis2.form_mapping import seed_event_mapping

"""
./manage.py seed_form_mapping \
    --dhis2_url=https://play.dhis2.org/2.33.1 \
    --dhis2_user=admin \
    --dhis2_password=district \
    --dhis2_program_id=lxAQ7Zs9VYR \
    --form_id= form_id

"""


class Command(BaseCommand):
    help = "Export to instances (form submissions) to a dhis2"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dhis2_url", type=str, help="Dhis2 url to import from (without user/password)", required=True
        )
        parser.add_argument("--dhis2_user", type=str, help="dhis2 user name", required=True)
        parser.add_argument("--dhis2_password", type=str, help="dhis2 password of the dhis2_user", required=True)
        parser.add_argument(
            "--dhis2_program_id",
            type=str,
            help="dhis2 program_id to generate a default form mapping json",
            required=True,
        )
        parser.add_argument("--form_id", type=str, help="iaso form_id eg ", required=True)

    def get_api(self, options):
        return Api(options.get("dhis2_url"), options.get("dhis2_user"), options.get("dhis2_password"))

    def handle(self, *args, **options):
        api = self.get_api(options)

        mapping, missing_data_elements = seed_event_mapping(api, options.get("dhis2_program_id"))

        usual_ona_meta = [
            "end",
            "imei",
            "meta",
            "uuid",
            "year",
            "start",
            "today",
            "deviceid",
            "simserial",
            "phonenumber",
            "subscriberid",
            "instanceid",
        ]

        usual_dc_meta = ["fosa", "region", "prefecture", "quarter", "district", "sous-prefecture"]

        print(json.dumps(mapping, indent=4))
        print("******** Mapped questions")
        form = Form.objects.get(form_id=options["form_id"])
        for field in form.possible_fields:
            if field in mapping["question_mappings"]:
                de = mapping["question_mappings"][field]
                print(field, de["id"], de["name"])
        print("******** Unmapped questions")
        form = Form.objects.get(form_id=options["form_id"])
        for field in form.possible_fields:
            if not field in mapping["question_mappings"]:
                status = "ERROR no corresponding"
                if not (field in usual_ona_meta or field in usual_dc_meta):
                    print(field, status)
        print("******** Unmapped questions but might be ok")
        form = Form.objects.get(form_id=options["form_id"])
        for field in form.possible_fields:
            if not field in mapping["question_mappings"]:
                if field in usual_ona_meta or field in usual_dc_meta:
                    status = "WARN usually data collect metadata should not be in the program"
                    print(field, status)
        print("******** data elements in the program but not in the form at all")
        for missing_data_element in missing_data_elements:
            print(missing_data_element)
