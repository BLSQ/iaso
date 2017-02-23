from django.core.management.base import BaseCommand
from hat.import_export.import_synced import import_synced_devices


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        results = import_synced_devices()
        num_total = sum(r['stats'].total for r in results if r['stats'] is not None)
        num_imported = sum(r['stats'].created for r in results if r['stats'] is not None)
        num_errors = sum(1 for r in results if r['error'] is not None)

        self.stdout.write('----------- Import done -----------')
        self.stdout.write('Total number of records:    {}'.format(num_total))
        self.stdout.write('Number of imported records: {}'.format(num_imported))
        self.stdout.write('Number errors:              {}'.format(num_errors))
