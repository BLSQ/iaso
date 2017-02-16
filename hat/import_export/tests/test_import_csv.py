from django.conf import settings
import hat.couchdb.api as couchdb
from hat.cases.models import Case
from . import DBTestCase
from ..import_csv import import_csv_file
from ..reimport import reimport

csv_file = 'testdata/test_cases.csv'


class ImportCSVTests(DBTestCase):
    def test_import_csv(self):
        stats = import_csv_file('testdata', csv_file, True)

        self.assertEqual(len(stats['errors']), 0)
        self.assertEqual(stats['num_total'], 9)
        self.assertEqual(stats['num_imported'], 9)

        cases = Case.objects.all()
        self.assertEqual(cases.count(), 9)
        self.assertEqual(cases[0].document_id, '9')

        r = couchdb.get(settings.COUCHDB_DB + '/' + stats['store_id'])
        r.raise_for_status()

    def test_reimport_csv(self):
        import_csv_file('testdata', csv_file, True)
        self.assertEqual(Case.objects.all().count(), 9)
        Case.objects.all().delete()
        reimport()
        self.assertEqual(Case.objects.all().count(), 9)
