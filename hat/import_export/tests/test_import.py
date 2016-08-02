from django.test import TestCase
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant
from ..import_backup import import_backup
from ..import_historic import import_historic

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'
enc_file = 'testdata/backup-v4.enc'


class ImportBackupTests(TestCase):
    def tearDown(self):
        # The sqlalchemy engine needs to be disposed to kill its connection
        # to the DB. Otherwise django will not be able to drop the test DB.
        engine.dispose()

    def test_import_historic(self):
        stats = import_historic('historic', mdb_file)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 6)
        self.assertEqual(stats['num_imported'], 6)
        self.assertEqual(HatParticipant.objects.count(), 6)

    def test_import_backup(self):
        stats = import_backup('backup', enc_file)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 4)
        self.assertEqual(stats['num_imported'], 4)
        self.assertEqual(HatParticipant.objects.count(), 4)
