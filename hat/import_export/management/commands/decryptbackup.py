from django.core.management.base import BaseCommand
from django.conf import settings
from hat.common.utils import run_cmd


class Command(BaseCommand):
    help = 'Decrypt mobile backup file'

    def add_arguments(self, parser):
        parser.add_argument('backup_file', type=str, help='The mobile backup file')
        parser.add_argument('output_file', type=str, help='The output json filename')

    def handle(self, *args, **options):
        backup = options['backup_file']
        output = options['output_file']
        r = run_cmd(['./scripts/decrypt_mobilebackup.js', settings.MOBILE_KEY, backup])
        with open(output, 'w') as file:
            file.write(r)
        self.stdout.write('done.')
