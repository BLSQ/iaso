from urllib.parse import urlparse
from django.core.management.base import BaseCommand
from django.conf import settings
from hat.common.utils import run_cmd
import hat.couchdb as couchdb


class Command(BaseCommand):
    help = 'Setup couchdb'

    def add_arguments(self, parser):
        parser.add_argument('--dir', type=str, default='./couchdb',
                            help='Set the couchdb template dir')

    def handle(self, *args, **options):
        o = urlparse(settings.COUCHDB_URL)
        couchdb_url = '{}://{}:{}@{}'.format(
            o.scheme,
            settings.COUCHDB_USER, settings.COUCHDB_PASSWORD,
            o.netloc
        )
        cmd = ['couchdb-bootstrap', couchdb_url, options['dir']]

        # When testing, the db name will be '*_test' and if it already
        # exists, it will be dropped to start with an empty db.
        if settings.TESTING:
            test_db = settings.COUCHDB_DB
            cmd.append('--mapDbName={"hat":"' + test_db + '"}')
            r = couchdb.get(test_db)
            if r.status_code < 400:
                self.stdout.write('Couchdb "{}" already exists, dropping it...'.format(test_db))
                couchdb.delete(test_db)
            self.stdout.write('Setting up test couchdb...')
        else:
            self.stdout.write('Setting up couchdb...')

        r = run_cmd(cmd)
        self.stdout.write(r)
        self.stdout.write('Couchdb setup done.')
