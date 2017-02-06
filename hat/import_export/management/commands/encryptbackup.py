from django.core.management.base import BaseCommand
from django.conf import settings
from hat.common.utils import run_cmd


class Command(BaseCommand):
    help = 'Encrypt mobile backup file'

    def add_arguments(self, parser):
        parser.add_argument('input_file', type=str, help='The input file')
        parser.add_argument('output_file', type=str, help='The encrypted filename')

    def handle(self, *args, **options):
        input = options['input_file']
        output = options['output_file']
        r = run_cmd(['./scripts/encrypt_mobilebackup.js', settings.MOBILE_KEY, input])
        with open(output, 'w') as file:
            file.write(r)
        self.stdout.write('done.')
