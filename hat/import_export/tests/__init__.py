from django.test import TransactionTestCase
from hat.common.sqlalchemy import engine
from hat.couchdb.setup import setup_couchdb


TEST_DATA = {
    'historic': {
        'file': 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb',
        'count': 6
    },
    'mobile_backup': {
        'file': 'testdata/backup-v5.enc',
        'count': 4
    },
    'total_count': 10
}


class DBTestCase(TransactionTestCase):
    def tearDown(self):
        # The sqlalchemy engine needs to be disposed to kill its connection
        # to the DB. Otherwise django will not be able to drop the test DB.
        engine.dispose()
        # This will recreate the test couchdb to drop any data created in the test
        setup_couchdb()
