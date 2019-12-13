from django.core.management.base import BaseCommand
import json
from django.utils import timezone
from iaso.models import Instance, Form
import datetime
from dhis2 import Api

from ...dhis2.event_exporter import EventExporter

from django.utils.six.moves import input


def boolean_input(question, default=None):
    result = input("%s " % question)
    if not result and default is not None:
        return default
    while len(result) < 1 or result[0].lower() not in "yn":
        result = input("Please answer yes or no: ")
    return result[0].lower() == "y"


"""
./manage.py export_events \
    --dhis2_url=https://play.dhis2.org/2.33.1 \
    --dhis2_user=admin \
    --dhis2_password=district \
    --mapping_file=./testdata/form-play.json \
    --form_id=RDC_Data_CS \
    --from=2019-08-1 \
    --to=2019-08-2
    ""
"""


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

        parser.add_argument(
            "--mapping_file",
            type=str,
            help="form mapping file see ./testdata/form-ihp.json as an example",
            required=True,
        )

        parser.add_argument(
            "--form_id",
            type=str,
            help="form_id : see Form.form_id eg 'RDC_Data_CS'",
            required=True,
        )

        parser.add_argument(
            "--export",
            action="store_true",
            help="really export to dhis2 or only dry run",
        )
        parser.add_argument(
            "--from",
            type=str,
            help="date %Y-%m-%d will filter created_at greater or eq than",
            required=True,
        )
        parser.add_argument(
            "--to",
            type=str,
            help="date %Y-%m-%d will filter created_at lower than",
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
        export = True if options["export"] else False
        mapping_file = options["mapping_file"]
        form_id = options["form_id"]

        date_from = datetime.datetime.strptime(options["from"], "%Y-%m-%d")
        date_to = datetime.datetime.strptime(options["to"], "%Y-%m-%d")
        date_from = timezone.make_aware(date_from, timezone.utc)
        date_to = timezone.make_aware(date_to, timezone.utc)

        instances_qs = (
            Instance.objects.filter(
                form__form_id=form_id,
                created_at__range=[date_from, date_to],
                org_unit__validated=True,
            )
            .prefetch_related("org_unit")
            .prefetch_related("form")
            .order_by("id")
        )

        form = Form.objects.get(form_id=form_id)
        message = "will REALLY export" if export else "will dryRun the export"
        print(
            message
            + " %d validated submissions of %s" % (instances_qs.count(), form.name)
        )
        print("with created between (>=)", date_from, " and (<) ", date_to)
        print("to ", options.get("dhis2_url"))
        confirm = boolean_input("DO YOU confirm ? (y/n)", False)
        if confirm:
            form_mapping = self.load_mapping(mapping_file)
            api = self.get_api(options)

            EventExporter().export_events(
                api=api,
                instances_qs=instances_qs,
                form_mapping=form_mapping,
                export=export,
            )

    def load_mapping(self, mapping_file):
        with open(mapping_file) as json_file:
            return json.load(json_file)
