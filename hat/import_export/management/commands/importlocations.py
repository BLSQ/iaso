from django.core.management.base import BaseCommand
from hat.import_export.import_locations import import_locations_file


class Command(BaseCommand):
    help = 'Import locations file'

    def add_arguments(self, parser):
        parser.add_argument('filename', type=str, help='The DBF file to import')

    def handle(self, *args, **options):
        filename = options['filename']
        result = import_locations_file(filename, filename)
        self.stdout.write('----------- Import done -----------')
        self.stdout.write('Success:                     {}'.format(result['success']))
        self.stdout.write('Total number of villages:    {}'.format(result['num_total']))
        self.stdout.write('Number of imported villages: {}'.format(result['num_imported']))
        self.stdout.write('With population data:        {}'.format(result['num_with_population']))
        self.stdout.write('Error:                       {}'.format(result['error']))
