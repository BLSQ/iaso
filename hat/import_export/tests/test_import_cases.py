from django.test import TestCase
from hat.cases.models import Case
from ..import_cases import import_cases_file
from ..reimport import reimport
from . import TEST_DATA, get_events, get_import_cases_file_event
import datetime


def import_helper(orgname, filename):
    ''' Helper functions to bail on import errors '''
    stats = import_cases_file(orgname, filename)
    if stats['error'] is not None:
        print(stats)
        raise Exception(stats['error']['type'])
    return stats


class ImportCasesTests(TestCase):
    def test_import_historic(self):
        count = TEST_DATA['historic']['count']
        r = import_helper('historic', TEST_DATA['historic']['file'])
        self.assertEqual(r['stats'].total, count)
        self.assertEqual(r['stats'].created, count)
        self.assertEqual(Case.objects.count(), count)
        self.assertGreater(Case.objects.filter(followup_done=True).count(), 0)

        event = get_events()[0]
        self.assertEqual(event['type'], 'import_cases_file_event')
        self.assertEqual(event['total'], count)
        self.assertEqual(event['created'], count)
        event = get_import_cases_file_event(event['id'])
        self.assertEqual(event['source_type'], 'historic')

    def test_import_pv(self):
        count = TEST_DATA['pv']['count']
        r = import_helper('pv', TEST_DATA['pv']['file'])
        self.assertEqual(r['stats'].total, count)
        self.assertEqual(r['stats'].created, count)
        self.assertEqual(Case.objects.count(), count)
        self.assertGreater(Case.objects.filter(followup_done=True).count(), 0)

        event = get_events()[0]
        self.assertEqual(event['type'], 'import_cases_file_event')
        self.assertEqual(event['total'], count)
        self.assertEqual(event['created'], count)
        event = get_import_cases_file_event(event['id'])
        self.assertEqual(event['source_type'], 'pv')

    def test_import_backup(self):
        count = TEST_DATA['mobile_backup']['count']
        r = import_helper('backup', TEST_DATA['mobile_backup']['file'])
        self.assertEqual(r['stats'].total, count)
        self.assertEqual(r['stats'].created, count)
        self.assertEqual(Case.objects.count(), count)

        event = get_events()[0]
        self.assertEqual(event['type'], 'import_cases_file_event')
        self.assertEqual(event['total'], count)
        self.assertEqual(event['created'], count)
        event = get_import_cases_file_event(event['id'])
        self.assertEqual(event['source_type'], 'backup')

    def test_duplicate_merge_by_hash(self):
        # should import same person if it has been updated with a new result
        import_helper('backup-1', TEST_DATA['mobile_backup_duplicates_1']['file'])
        import_helper('backup-2', TEST_DATA['mobile_backup_duplicates_2']['file'])
        import_helper('backup-3', TEST_DATA['mobile_backup_duplicates_3']['file'])

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
        import_helper('historic.mdb', TEST_DATA['historic']['file'])
        import_helper('backup.enc', TEST_DATA['mobile_backup']['file'])
        import_helper('pv.mdb', TEST_DATA['pv']['file'])

        count = Case.objects.count()
        self.assertEqual(count, TEST_DATA['total_count'])
        events = get_events()
        self.assertEqual(len(events), 3, 'Three events from 3 imports')

        Case.objects.all().delete()
        reimport()
        self.assertEqual(Case.objects.count(), count)
        events = get_events()
        self.assertEqual(len(events), 3, 'Still just 3 events')

    def test_import_existing_file(self):
        import_cases_file('backup', TEST_DATA['mobile_backup']['file'])
        stats = import_cases_file('backup', TEST_DATA['mobile_backup']['file'])
        self.assertNotEqual(stats['error'], None)
