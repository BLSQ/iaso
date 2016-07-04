from django.core.management.base import BaseCommand, CommandError
from subprocess import run, CalledProcessError
from django.conf import settings

class Command(BaseCommand):
    help = 'Setup couchdb'

    def add_argument(self, parser):
        pass

    def handle(self, *args, **options):
        self.stdout.write('Setting up couchdb at: ' + settings.COUCHDB_URL)
        try:
            run(['couchdb-bootstrap', settings.COUCHDB_URL, './couchdb'],
                check=True)
        except CalledProcessError as ex:
            self.stderr.write('Error setting up couchdb \n{}'.format(ex.output))
            return
        self.stdout.write('Successfully setup couchdb.')