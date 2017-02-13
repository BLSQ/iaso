from django.core.management.base import BaseCommand
from hat.import_export.import_synced import import_synced_devices


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        result = import_synced_devices()
        num_total = sum(r['num_total'] for r in result)
        num_imported = sum(r['num_imported'] for r in result)
        num_errors = sum(len(r['errors']) for r in result)
        self.stdout.write('----------- Import done -----------')
        self.stdout.write('Total number of records:    {}'.format(num_total))
        self.stdout.write('Number of imported records: {}'.format(num_imported))
        self.stdout.write('Number of errors:           {}'.format(num_errors))
