from django.core.management import call_command
from django.test import TestCase
from hat.cases.models import Case
from ..import_reconciled import import_reconciled_file
from ..reimport import reimport
from hat.cases.event_log import get_events, EventTable

xlsx_file = 'testdata/reconciled_cases.xlsx'
csv_file = 'testdata/test_cases.csv'


class ImportReconciledTests(TestCase):
    fixtures = ['cases']

    def test_import_reconciled(self):
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 0)
        self.assertEqual(Case.objects.filter(AS='Ipeke').count(), 0)
        self.assertEqual(Case.objects.filter(village='Ipoku').count(), 0)

        r = import_reconciled_file('testdata', xlsx_file)
        self.assertEqual(r['error'], None)
        self.assertEqual(r['stats'].total, 7)
        self.assertEqual(r['stats'].updated, 6)

        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        self.assertEqual(Case.objects.filter(AS='Ipeke').count(), 3)
        self.assertEqual(Case.objects.filter(village='Ipoku').count(), 1)

        event = get_events()[0]
        self.assertEqual(EventTable(event['table_name']), EventTable.reconciled_file)
        self.assertEqual(event['total'], 7)
        self.assertEqual(event['updated'], 6)

    def test_reimport_reconciled(self):
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 0)
        r = import_reconciled_file('testdata', xlsx_file)
        self.assertEqual(r['error'], None)
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        self.assertEqual(len(get_events()), 1, 'Only one event from the import')

        # reload the cases fixtures to have unreconciled data
        Case.objects.all().delete()
        call_command('loaddata', 'cases', verbosity=0)

        # reimport without deleting the fresh fixtures
        reimport(delete_data=False)
        self.assertEqual(Case.objects.filter(ZS='Bokoro').count(), 6)
        self.assertEqual(len(get_events()), 1, 'Still just one event')
