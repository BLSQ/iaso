import unittest
from django.test import TestCase
from hat.cases.models import Case
from ..load import load_cases_into_db
from ..import_reconciled import import_reconciled_file
from ..reimport import reimport
from . import get_events

xlsx_file = 'testdata/reconciled_cases.xlsx'
csv_file = 'testdata/test_cases.csv'


def import_csv_file(filename):
    import pandas
    df = pandas.read_csv(filename, sep=';')
    stats = load_cases_into_db(df)
    return stats


class ImportReconciledTests(TestCase):
    def test_import_reconciled(self):
        # Import some fixtures from a cases csv file
        stats_csv = import_csv_file(csv_file)
        self.assertEqual(stats_csv.created, 9)
        r = import_reconciled_file('testdata', xlsx_file)
        self.assertEqual(r['error'], None)
        self.assertEqual(r['stats'].total, 7)
        self.assertEqual(r['stats'].updated, 6)

        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        self.assertEqual(Case.objects.filter(AS='Ipeke').count(), 3)
        self.assertEqual(Case.objects.filter(village='Ipoku').count(), 1)

        event = get_events()[0]
        self.assertEqual(event['type'], 'import_reconciled_file_event')
        self.assertEqual(event['total'], 7)
        self.assertEqual(event['updated'], 6)

    @unittest.skip("import csv does not work with reimport momentarily")
    def test_reimport_reconciled(self):
        # TODO: the problem is the csv file is not in the log
        import_csv_file(csv_file)
        r = import_reconciled_file('testdata', xlsx_file)
        self.assertEqual(r['error'], None)
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        events = get_events()
        self.assertEqual(len(events), 1, 'Only one event from the import')

        Case.objects.all().delete()
        reimport()
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        events = get_events()
        self.assertEqual(len(events), 1, 'Still just one event')
