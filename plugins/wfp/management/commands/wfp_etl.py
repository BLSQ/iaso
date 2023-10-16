from django.core.management.base import BaseCommand
from wfp_etl_Under5 import Under5
from wfp_etl_pbwg import PBWG


class Command(BaseCommand):
    help = "Transform WFP collected data in a format usable for analytics"

    def handle(self, *args, **options):
        Under5.run()
        PBWG.run()
