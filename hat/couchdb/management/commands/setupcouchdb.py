from urllib.parse import urlparse
from django.core.management.base import BaseCommand
from django.conf import settings
from hat.common.utils import run_cmd


class Command(BaseCommand):
    help = 'Setup couchdb'

    def handle(self, *args, **options):
        o = urlparse(settings.COUCHDB_URL)
        couchdb_url = '{}://{}:{}@{}'.format(
            o.scheme,
            settings.COUCHDB_USER, settings.COUCHDB_PASSWORD,
            o.netloc
        )
        run_cmd(['couchdb-bootstrap', couchdb_url, './couchdb'])
        self.stdout.write('Successfully setup couchdb.')
