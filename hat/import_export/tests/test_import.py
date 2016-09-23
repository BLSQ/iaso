from django.conf import settings
import hat.couchdb.api as couchdb
from hat.cases.models import Case
# from ..import_backup import import_backup
# from ..import_historic import import_historic
# from ..import_pv import import_pv
from ..import_data import reimport, import_file
from . import DBTestCase, TEST_DATA
import datetime

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'
enc_file = 'testdata/backup-v5.enc'


class ImportTests(DBTestCase):
    def test_import_historic(self):
        count = TEST_DATA['historic']['count']
        stats = import_file('historic', TEST_DATA['historic']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(Case.objects.count(), count)
        self.assertGreater(Case.objects.filter(followup_done=True).count(), 0)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'historic_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_import_pv(self):
        count = TEST_DATA['pv']['count']
        stats = import_file('pv', TEST_DATA['pv']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(Case.objects.count(), count)
        self.assertGreater(Case.objects.filter(followup_done=True).count(), 0)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'pv_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_import_backup(self):
        count = TEST_DATA['mobile_backup']['count']
        stats = import_file('backup', TEST_DATA['mobile_backup']['file'], store=True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], count)
        self.assertEqual(stats['num_imported'], count)
        self.assertEqual(Case.objects.count(), count)
        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()
        self.assertEqual(r.json()['type'], 'backup_import')
        r = couchdb.head(settings.COUCHDB_DB + '/' + stats['store_id'] + '/file')
        r.raise_for_status()

    def test_duplicate_merge_by_hash(self):
        # should import same person if it has been updated with a new result
        import_file('backup-1', TEST_DATA['mobile_backup_duplicates_1']['file'], store=True)
        import_file('backup-2', TEST_DATA['mobile_backup_duplicates_2']['file'], store=True)
        import_file('backup-3', TEST_DATA['mobile_backup_duplicates_3']['file'], store=True)
        # only one object in db
        self.assertEqual(
            Case.objects.count(),
            TEST_DATA['mobile_backup_duplicates_1']['count']
        )

        merged = Case.objects.first()
        # Merges in all test results
        self.assertEqual(merged.hat_id, 'AAXXBBF1999C')
        self.assertEqual(merged.test_rdt, True)
        self.assertEqual(merged.test_maect, True)
        self.assertEqual(merged.test_pg, False)
        # Keep document_date, entry_date as the first entry

        # '2016-09-07T14:59:16.006Z'
        merged_doc_date = merged.document_date
        self.assertEqual(
            merged_doc_date.replace(tzinfo=None),
            datetime.datetime(2016, 9, 7, 14, 59, 16, 6000)
        )

    def test_reimport(self):
        import_file('historic', mdb_file, store=True)
        import_file('backup', enc_file, store=True)
        import_file('pv', TEST_DATA['pv']['file'], store=True)
        count = Case.objects.count()
        self.assertEqual(count, TEST_DATA['total_count'])
        Case.objects.all().delete()
        reimport()
        self.assertEqual(Case.objects.count(), count)

    def test_import_existing_file(self):
        stats1 = import_file('backup', enc_file, store=True)
        stats2 = import_file('backup', enc_file, store=True)

        self.assertEqual(stats1['type'], 'backup_import')
        self.assertEqual(stats2['type'], 'import_error')
        self.assertEqual(stats2['orgname'], 'backup')
