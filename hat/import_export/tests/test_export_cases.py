from datetime import datetime
import pandas
from django.test import TestCase
from django.utils import timezone
from ..import_cases import import_cases_file
from ..export_csv import export_csv
from . import TEST_DATA


class ExportTests(TestCase):
    def setUp(self):
        import_cases_file('historic', TEST_DATA['historic']['file'])
        import_cases_file('pv', TEST_DATA['pv']['file'])
        import_cases_file('backup', TEST_DATA['mobile_backup']['file'])

    def test_export(self):
        csv_file = export_csv()
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['total_count'])

    def test_export_anon(self):
        csv_file = export_csv(anon=True)
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['total_count'])
        self.assertTrue('name' not in df)

    def test_export_sources(self):
        csv_file = export_csv(sources=['historic'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['historic']['count'])

        csv_file = export_csv(sources=['pv'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['pv']['count'])

        csv_file = export_csv(sources=['mobile_backup'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['mobile_backup']['count'])

        csv_file = export_csv(sources=['historic', 'pv'])
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), TEST_DATA['historic']['count'] + TEST_DATA['pv']['count'])

    def test_export_suspects(self):
        csv_file = export_csv(only_suspects=True)
        df = pandas.read_csv(csv_file)
        self.assertEqual(len(df), 2)

    def test_export_dates(self):
        historic_date = datetime(2016, 7, 14)
        d = timezone.make_aware(historic_date)
        csv_file = export_csv(date_from=d, date_to=d)
        df = pandas.read_csv(csv_file)
        self.assertTrue(len(df), TEST_DATA['historic']['count'])

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
