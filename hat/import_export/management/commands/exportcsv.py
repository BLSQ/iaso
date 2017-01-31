from django.core.management.base import BaseCommand
from hat.import_export.export_csv import export_csv


class Command(BaseCommand):
    help = 'Export data as csv'

    def handle(self, *args, **options):
        filename = export_csv(False)
        self.stdout.write('CSV written to {}.'.format(filename))
