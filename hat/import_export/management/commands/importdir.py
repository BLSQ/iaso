import os
from os import path
from django.core.management.base import BaseCommand
from hat.import_export.import_cases import import_cases_file


class Command(BaseCommand):
    help = 'Import files from a directory'

    def add_arguments(self, parser):
        parser.add_argument('directory', type=str, help='Set the export filename')
        parser.add_argument('--store', action='store_true',
                            help='Store the imported file in couchdb')

    def handle(self, *args, **options):
        dir = options['directory']
        result = []
        files = [f for f in os.listdir(dir) if path.isfile(path.join(dir, f))]
        self.stdout.write('Importing {} files from {}'.format(len(files), options['directory']))
        for i, filename in enumerate(files):
            self.stdout.write('-- #{}/{} - {}'.format(i+1, len(files), filename))
            r = import_cases_file(filename, path.join(dir, filename), store=options['store'])
            if len(r['errors']) > 0:
                self.stdout.write('-- ERROR: {}'.format(r['errors']))
            else:
                self.stdout.write('-- SUCCESS: Imported {} of {} records'.format(
                    r['stats'].created, r['stats'].total))
            result.append(r)
        num_total = sum(r['stats'].total for r in result if r['stats'] is not None)
        num_imported = sum(r['stats'].created for r in result if r['stats'] is not None)
        num_errors = sum(len(r['errors']) for r in result)
        self.stdout.write('---------- Import done ----------')
        self.stdout.write('Total number of records:    {}'.format(num_total))
        self.stdout.write('Number of imported records: {}'.format(num_imported))
        self.stdout.write('Number of errors:           {}'.format(num_errors))
