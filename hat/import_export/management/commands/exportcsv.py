from django.core.management.base import BaseCommand
from hat.import_export.export_csv import export_csv


class Command(BaseCommand):
    help = 'Export data as csv'

    def add_arguments(self, parser):
        parser.add_argument('filename', type=str, help='Set the export filename')

    def handle(self, *args, **options):
        csv = export_csv(False)
        with open(options['filename'], 'w') as fd:
            fd.write(csv)
        self.stdout.write('CSV written to {}.'.format(options['filename']))
