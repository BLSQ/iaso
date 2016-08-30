from django.conf import settings
import hat.couchdb.api as couchdb
from hat.participants.models import HatParticipant
from ..import_backup import import_backup
from ..import_historic import import_historic
from ..import_pv import import_pv
from ..import_data import reimport
from . import DBTestCase, TEST_DATA

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'
enc_file = 'testdata/backup-v5.enc'


class ImportTests(DBTestCase):
    def test_import_historic(self):
        count = TEST_DATA['historic']['count']
        stats = import_historic('historic', TEST_DATA['historic']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(HatParticipant.objects.count(), count)
        self.assertGreater(HatParticipant.objects.filter(followup_done=True).count(), 0)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'historic_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_import_pv(self):
        count = TEST_DATA['pv']['count']
        stats = import_pv('pv', TEST_DATA['pv']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(HatParticipant.objects.count(), count)
        self.assertGreater(HatParticipant.objects.filter(followup_done=True).count(), 0)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'pv_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_import_backup(self):
        count = TEST_DATA['mobile_backup']['count']
        stats = import_backup('backup', TEST_DATA['mobile_backup']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(HatParticipant.objects.count(), count)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'backup_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_reimport(self):
        import_historic('historic', mdb_file, store=True)
        import_backup('backup', enc_file, store=True)
        import_pv('pv', TEST_DATA['pv']['file'], store=True)
        count = HatParticipant.objects.count()
        self.assertEqual(count, TEST_DATA['total_count'])
        HatParticipant.objects.all().delete()
        reimport()
        self.assertEqual(HatParticipant.objects.count(), count)
