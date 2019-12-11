from django.core.management.base import BaseCommand
import json
from iaso.models import Instance

from dhis2 import Api

from ...dhis2.event_exporter import EventExporter


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

    def handle(self, *args, **options):
        # mapping_file = "./testdata/form-ihp.json"
        export = True
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
        )

        form_mapping = self.load_mapping(mapping_file)
        api = self.get_api(options)

        EventExporter().export_events(
            api=api, instances_qs=instances_qs, form_mapping=form_mapping, export=export
        )

        # self.seed_mapping(api, "q04UBOqq3rp")  # mapping["program_id"])

    def load_mapping(self, mapping_file):
        with open(mapping_file) as json_file:
            return json.load(json_file)
