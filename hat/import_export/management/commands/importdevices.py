import os
import time
from datetime import datetime

from django.core.management.base import BaseCommand

from hat.common.utils import sns_notify, slack_notify
from hat.import_export.import_synced import import_synced_devices


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        env_name = os.environ.get("ENVIRONMENT_NAME", "Unknown env")
        start_time = time.time()
        start_date = datetime.now()
        results = import_synced_devices()
        num_total = sum(r['stats'].total for r in results if r['stats'] is not None)
        num_imported = sum(r['stats'].created for r in results if r['stats'] is not None)
        num_errors = sum(1 for r in results if r['error'] is not None)
        per_device_total = [
            f"{res['device_id']} ({res['device_user']}): total: {res['stats'].total}, error: {res['error']}"
            for res in results
            if res['stats'].total > 0
        ]

        message = f"""
----------- Import done ({env_name}) -----------
Started: {str(start_date)}, time spent: {time.time()-start_time} sec
Total number of records:    {num_total}
Number of imported records: {num_imported}
Number errors:              {num_errors}
---
        """

        if num_total > 0 or num_imported > 0 or num_errors > 0:
            sns_notify(message + "\n".join(per_device_total))
            slack_notify(
                message,
                attachments=[
                    {
                        "color": "good" if res['error'] is None else "red",
                        "fallback": f"{res['device_id']} ({res['device_user']}): total: {res['stats'].total}, "
                                    f"error: {res['error']}",
                        "fields": [
                            {
                                "title": k,
                                "value": v,
                                "short": "true"
                            } for k, v in [
                                ("device", res['device_id']),
                                ("user", res['device_user']),
                                ("error", res['error']),
                                ("total", res['stats'].total),
                                ("created", res['stats'].created),
                                ("updated", res['stats'].updated),
                                ("deleted", res['stats'].deleted),
                            ] if v  # Only show stats that are != None and 0
                        ],
                    } for res in results if res['stats'].total > 0
                ]
            )
        self.stdout.write(message + "\n".join(per_device_total))
