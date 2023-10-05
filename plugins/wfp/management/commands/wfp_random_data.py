from ...models import *  # type: ignore
from django.core.management.base import BaseCommand

from ...tasks import generate_random_data


class Command(BaseCommand):
    help = "Insert random data in the database for 2000 beneficiaries"

    def handle(self, *args, **options):
        generate_random_data()
