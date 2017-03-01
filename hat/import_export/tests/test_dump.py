from django.db import connection
from django.test import TransactionTestCase
import hat.cases.event_log as evl
from ..dump import dump_events, load_events_dump

NUM_EVENTS = 4


class EventsDumpTests(TransactionTestCase):
    def setUp(self):
        stats = evl.EventStats(1, 0, 0, 0)
        file = evl.EventFile('foo', 'foo', 'foo')
        evl.log_cases_file_import(stats, file, 'foo')
        evl.log_reconciled_file_import(stats, file)
        evl.log_cases_merge('foo', 'bar')
        evl.log_sync_import(stats, [{'foo': 'bar'}], 'device-xxx')
        self.assertEqual(len(evl.get_events()), NUM_EVENTS)

    def test_events_dump(self):
        filename = dump_events()
        with connection.cursor() as cursor:
            cursor.execute('TRUNCATE hat_event CASCADE')
        self.assertEqual(len(evl.get_events()), 0)
        load_events_dump(filename)
        self.assertEqual(len(evl.get_events()), NUM_EVENTS)
