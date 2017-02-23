from django.core.management.base import BaseCommand
from hat.import_export.reimport import reimport


class Command(BaseCommand):
    help = 'Reimport data'

    def handle(self, *args, **options):
        results = reimport()
        total = sum(r.total for r in results)
        created = sum(r.created for r in results)
        updated = sum(r.updated for r in results)
        deleted = sum(r.deleted for r in results)
        self.stdout.write('---------- Re-import done ----------')
        self.stdout.write('Number of events reimported: {}'.format(len(results)))
        self.stdout.write('Total number of records:     {}'.format(total))
        self.stdout.write('Number of created records:   {}'.format(created))
        self.stdout.write('Number of updated records:   {}'.format(updated))
        self.stdout.write('Number of deleted records:   {}'.format(deleted))
