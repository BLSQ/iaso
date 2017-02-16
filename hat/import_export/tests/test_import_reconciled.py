from django.conf import settings
import hat.couchdb.api as couchdb
from hat.cases.models import Case
from . import DBTestCase
from ..import_reconciled import import_reconciled_file
from ..import_csv import import_csv_file
from ..reimport import reimport

xlsx_file = 'testdata/reconciled_cases.xlsx'
csv_file = 'testdata/test_cases.csv'


class ImportReconciledTests(DBTestCase):
    def test_import_reconciled(self):
        # Import some fixtures from a cases csv file
        stats_csv = import_csv_file('testdata', csv_file, True)
        self.assertEqual(len(stats_csv['errors']), 0)
        stats = import_reconciled_file('testdata', xlsx_file, True)
        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 7)
        self.assertEqual(stats['num_imported'], 6)

        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        self.assertEqual(Case.objects.filter(AS='Ipeke').count(), 3)
        self.assertEqual(Case.objects.filter(village='Ipoku').count(), 1)

        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()

    def test_reimport_reconciled(self):
        s1 = import_csv_file('testdata', csv_file, True)
        self.assertEqual(len(s1['errors']), 0)
        s2 = import_reconciled_file('testdata', xlsx_file, True)
        self.assertEqual(len(s2['errors']), 0)
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        Case.objects.all().delete()
        reimport()
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
