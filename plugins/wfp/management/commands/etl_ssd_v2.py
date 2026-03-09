from django.core.management.base import BaseCommand

from plugins.wfp.tasks import etl_ssd_v2


class Command(BaseCommand):
    help = "Transform WFP collected data in a format usable for analytics (ETL v2)"

    def add_arguments(self, parser):
        parser.add_argument("all_data", nargs="?", help="Run ETL on the whole data")

    def handle(self, *args, **options):
        all_data = options["all_data"]
        etl_ssd_v2(all_data)
