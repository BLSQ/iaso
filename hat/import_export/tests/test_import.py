from django.test import TestCase
from django.conf import settings
from hat.common.sqlalchemy import engine
import hat.couchdb as couchdb
from hat.participants.models import HatParticipant
from ..import_backup import import_backup
from ..import_historic import import_historic
from ..import_data import reimport

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'
enc_file = 'testdata/backup-v4.enc'


class ImportBackupTests(TestCase):
    def tearDown(self):
        # We manually clear the table because it was populated by pandas.to_sql
        # and not by methods of djangos model.
        table_name = HatParticipant.objects.model._meta.db_table
        with engine.begin() as conn:
            conn.execute('DELETE FROM ' + table_name)
        # The sqlalchemy engine needs to be disposed to kill its connection
        # to the DB. Otherwise django will not be able to drop the test DB.
        engine.dispose()

    def test_import_historic(self):
        stats = import_historic('historic', mdb_file, store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 6)
        self.assertEqual(stats['num_imported'], 6)
        self.assertEqual(HatParticipant.objects.count(), 6)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'historic_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_import_backup(self):
        stats = import_backup('backup', enc_file, store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 4)
        self.assertEqual(stats['num_imported'], 4)
        self.assertEqual(HatParticipant.objects.count(), 4)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'backup_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_reimport(self):
        # This test assumes that 'test_import_historic' and 'test_import_backup'
        # have run and the raw data from those tests is in the test couchdb.
        self.assertEqual(HatParticipant.objects.count(), 0)
        reimport()
        self.assertEqual(HatParticipant.objects.count(), 10)
