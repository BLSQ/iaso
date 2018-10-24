from django.core.management.base import BaseCommand

from hat.couchdb.utils import fetch_db_docs
from hat.import_export.import_synced import import_synced_population
from hat.sync.models import DeviceDB


class Command(BaseCommand):
    help = 'Import synced devices data'

    def handle(self, *args, **options):
        results = {}
        for device in DeviceDB.objects.all():
            try:
                data = fetch_db_docs(device.db_name, 0)
                docs = data['docs']
                results[device.id] = import_synced_population(docs, device.device_id)
            except Exception as e:
                self.stdout.write('Failed to import device {}: {}'.format(device.id, str(e)))

        self.stdout.write('----------- Import done -----------')
        for device, result in results.items():
            self.stdout.write('Device {} imported {} PTR records'.format(device, result))
