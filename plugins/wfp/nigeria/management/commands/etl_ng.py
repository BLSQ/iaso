from django.core.management.base import BaseCommand
from ....tasks import etl_ng


class Command(BaseCommand):
    help = "Transform WFP collected data in a format usable for analytics"

    def handle(self, *args, **options):
        etl_ng()
