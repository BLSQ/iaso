from ...models import *  # type: ignore
from django.core.management.base import BaseCommand
from ...tasks import ETL


class Command(BaseCommand):
    help = "Transform WFP collected data in a format usable for analytics"

    def handle(self, *args, **options):
        ETL().run()
