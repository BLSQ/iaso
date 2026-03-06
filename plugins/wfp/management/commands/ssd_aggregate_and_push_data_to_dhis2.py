from django.core.management.base import BaseCommand

from plugins.wfp.tasks import ssd_aggregate_and_push_data_to_dhis2


class Command(BaseCommand):
    help = "Aggregate WFP monthly analytics data by org unit and push to dhis2"

    def add_arguments(self, parser):
        parser.add_argument("all_data", nargs="?", help="Aggregate monthly analytics data and Push to dhis2")

    def handle(self, *args, **options):
        all_data = options["all_data"]
        ssd_aggregate_and_push_data_to_dhis2(all_data)
