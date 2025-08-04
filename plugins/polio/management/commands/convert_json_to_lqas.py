import json

from argparse import ArgumentParser
from logging import getLogger

from django.core.management.base import BaseCommand

from plugins.polio.api.lqas_im.lqas_data_manager import LqasDataManager


logger = getLogger(__name__)


class Command(BaseCommand):
    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--data", type=str, required=True, help="path to LQAS json data")

    def handle(self, data, *args, **options):
        with open(data) as f:
            json_data = json.load(f)
        manager = LqasDataManager()
        manager.parse_json_and_update_lqas_activities(json_data)
