from django.core.management.base import BaseCommand
from hat.import_export.reimport import reimport


class Command(BaseCommand):
    help = 'Reimport data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--really-sure',
            action='store_true',
            dest='really-sure',
            help='This should not be performed anymore unless you are *REALLY* sure that it should be done.',
        )

    def handle(self, *args, **options):
        if options['really-sure']:
            results = reimport()
            total = sum(r.total for r in results)
            created = sum(r.created for r in results)
            updated = sum(r.updated for r in results)
            deleted = sum(r.deleted for r in results)
            self.stdout.write('Total number of records:     {}'.format(total))
            self.stdout.write('Number of created records:   {}'.format(created))
            self.stdout.write('Number of updated records:   {}'.format(updated))
            self.stdout.write('Number of deleted records:   {}'.format(deleted))
        else:
            print("Please don't do this, it will delete all the data and reimport it again. If you *REALLY* mean"
                  " this, please confirm it with the appropriate parameter.")
