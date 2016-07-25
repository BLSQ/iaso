from subprocess import run, CalledProcessError
from urllib.parse import urlparse
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Setup couchdb'

    def handle(self, *args, **options):
        o = urlparse(settings.COUCHDB_URL)
        couchdb_url = '{}://{}:{}@{}'.format(
            o.scheme,
            settings.COUCHDB_USER, settings.COUCHDB_PASSWORD,
            o.netloc
        )
        try:
            run(['couchdb-bootstrap', couchdb_url, './couchdb'], check=True)
        except CalledProcessError as ex:
            self.stderr.write('Error setting up couchdb \n{}'.format(ex.output))
            raise CommandError('Error setting up couchdb')
        self.stdout.write('Successfully setup couchdb.')
