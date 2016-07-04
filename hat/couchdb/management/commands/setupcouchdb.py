from django.core.management.base import BaseCommand, CommandError
from subprocess import run, CalledProcessError
from django.conf import settings

class Command(BaseCommand):
    help = 'Setup couchdb'

    def handle(self, *args, **options):
        try:
            run(['couchdb-bootstrap', settings.COUCHDB_URL, './couchdb'],
                check=True)
        except CalledProcessError as ex:
            self.stderr.write('Error setting up couchdb \n{}'.format(ex.output))
            return
        self.stdout.write('Successfully setup couchdb.')