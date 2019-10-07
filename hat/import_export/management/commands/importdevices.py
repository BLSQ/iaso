import time
from datetime import datetime

from django.core.management.base import BaseCommand

from hat.common.utils import sns_notify, slack_notify
from hat.import_export.import_synced import import_synced_devices


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        start_time = time.time()
        start_date = datetime.now()
        results = import_synced_devices()
        num_total = sum(r['stats'].total for r in results if r['stats'] is not None)
        num_imported = sum(r['stats'].created for r in results if r['stats'] is not None)
        num_errors = sum(1 for r in results if r['error'] is not None)

        message = f"""
            ----------- Import done -----------
            Started: {str(start_date)}, time spent: {time.time()-start_time} sec
            Total number of records:    {num_total}
            Number of imported records: {num_imported}
            Number errors:              {num_errors}
        """

        if num_total > 0 or num_imported > 0 or num_errors > 0:
            sns_notify(message)
            slack_notify(message)
        self.stdout.write(message)
