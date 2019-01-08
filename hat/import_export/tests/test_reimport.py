from unittest import skip

from django.test import TransactionTestCase

from hat.cases.event_log import get_events
from hat.cases.models import Case
from . import TEST_DATA, import_helper
from ..reimport import reimport


class ReimportTests(TransactionTestCase):
    @skip("Not working on dev workstations")
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
