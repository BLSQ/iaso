from datetime import datetime
import pandas
from django.test import TransactionTestCase
from django.utils import timezone
from ..export_csv import export_csv

# The number of types of cases in the fixtures
NUM_CASES = 6
NUM_HISTORIC_CASES = 2
NUM_BACKUP_CASES = 3
NUM_PV_CASES = 1
NUM_SUSPECTS = 1
NUM_ON_2016_1_2 = 2


class ExportTests(TransactionTestCase):
    fixtures = ['cases']

    def test_export(self):
        csv_file = export_csv()
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_CASES)

    def test_export_anon(self):
        csv_file = export_csv(anon=True)
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_CASES)
        self.assertTrue('name' not in df)

    def test_export_sources(self):
        csv_file = export_csv(sources=['historic'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_HISTORIC_CASES)

        csv_file = export_csv(sources=['pv'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_PV_CASES)

        csv_file = export_csv(sources=['mobile_backup'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_BACKUP_CASES)

        csv_file = export_csv(sources=['historic', 'pv'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_HISTORIC_CASES + NUM_PV_CASES)

    def test_export_suspects(self):
        csv_file = export_csv(only_suspects=True)
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), NUM_SUSPECTS)

    def test_export_dates(self):
        historic_date = datetime(2016, 1, 2)
        d = timezone.make_aware(historic_date)
        csv_file = export_csv(date_from=d, date_to=d)
        df = pandas.read_csv(csv_file)
        self.assertTrue(len(df), NUM_ON_2016_1_2)

    def test_export_sep(self):
        def read_file(filename):
            with open(filename, 'r') as file:
                return file.read()

        csv_default = read_file(export_csv())
        csv_comma = read_file(export_csv(sep=','))
        csv_custom = read_file(export_csv(sep='$'))

        self.assertEqual(csv_default, csv_comma)
        self.assertNotEqual(csv_default, csv_custom)

        self.assertTrue(',' in csv_comma)
        self.assertTrue('$' in csv_custom)
