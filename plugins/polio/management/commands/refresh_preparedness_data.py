import pprint
from logging import getLogger

from django.core.management.base import BaseCommand

from plugins.polio.tasks.refresh_preparedness_data import refresh_data

logger = getLogger(__name__)


class Command(BaseCommand):
    help = ""

    def add_arguments(self, parser):
        parser.add_argument("campaigns", type=str, nargs="*")

    def handle(self, campaigns, **options):
        the_task = refresh_data(campaigns=campaigns)
        print(f"Task {the_task} created")
        the_task()
        print(f"Task {the_task} launched")
        pprint.pprint(the_task.as_dict())
