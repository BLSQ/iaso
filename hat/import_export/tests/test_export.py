from datetime import datetime
from io import StringIO
import pandas
from django.utils import timezone
from ..export_csv import export_csv
from ..import_backup import import_backup
from ..import_historic import import_historic
from ..import_pv import import_pv
from . import DBTestCase, TEST_DATA


class ExportTests(DBTestCase):
    def setUp(self):
        import_historic('historic', TEST_DATA['historic']['file'], store=True)
        import_pv('pv', TEST_DATA['pv']['file'], store=True)
        import_backup('backup', TEST_DATA['mobile_backup']['file'], store=True)

    def test_export(self):
        csv = export_csv()
        df = pandas.read_csv(StringIO(csv))
        self.assertEqual(len(df), TEST_DATA['total_count'])

    def test_export_anon(self):
        csv = export_csv(anon=True)
        df = pandas.read_csv(StringIO(csv))
        self.assertTrue('name' not in df)

    def test_export_sources(self):
        csv = export_csv(sources=['historic'])
        df = pandas.read_csv(StringIO(csv))
        self.assertEqual(len(df), TEST_DATA['historic']['count'])

        csv = export_csv(sources=['pv'])
        df = pandas.read_csv(StringIO(csv))
        self.assertEqual(len(df), TEST_DATA['pv']['count'])

        csv = export_csv(sources=['mobile_backup'])
        df = pandas.read_csv(StringIO(csv))
        self.assertEqual(len(df), TEST_DATA['mobile_backup']['count'])

    def test_export_dates(self):
        historic_date = datetime(2016, 7, 14)
        d = timezone.make_aware(historic_date)
        csv = export_csv(start_date=d, end_date=d)
        df = pandas.read_csv(StringIO(csv))
        self.assertTrue(len(df), TEST_DATA['historic']['count'])
