from django.core.management.base import BaseCommand
from hat.import_export.import_locations import import_locations_file


class Command(BaseCommand):
    help = 'Import all locations from a dbf file passed as an argument'

    def add_arguments(self, parser):
        parser.add_argument('dbf_file', type=str)

    def handle(self, *args, **options):
        result = import_locations_file("UCLA", options.get("dbf_file"))
        print(result)

