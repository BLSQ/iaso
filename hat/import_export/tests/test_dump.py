from django.db import connection
from django.test import TransactionTestCase
import hat.cases.event_log as evl
from ..dump import dump_events, load_events_dump


class EventsDumpTests(TransactionTestCase):
    def test_events_dump(self):
        NUM_EVENTS = 4

        # Insert some events
        stats = evl.EventStats(1, 0, 0, 0)
        file = evl.EventFile('foo', 'foo', 'foo')
        evl.log_cases_file_import(stats, file, 'foo')
        evl.log_reconciled_file_import(stats, file)
        evl.log_cases_merge('foo', 'bar')
        evl.log_sync_import(stats, [{'foo': 'bar'}], 'device-xxx')
        self.assertEqual(len(evl.get_events()), NUM_EVENTS)

        filename = dump_events()

        # Insert another event to have a different table than in the dump
        evl.log_cases_merge('foo', 'bar')
        self.assertEqual(len(evl.get_events()), NUM_EVENTS + 1)

        load_events_dump(filename)
        self.assertEqual(len(evl.get_events()), NUM_EVENTS)

        # Check that the id sequence for the events table is fine
        with connection.cursor() as cursor:
            cursor.execute('SELECT max(id) FROM hat_event')
            max_id = cursor.fetchone()[0]
            cursor.execute("SELECT nextval('hat_event_id_seq')")
            next_id = cursor.fetchone()[0]
            self.assertEqual(next_id, max_id + 1)

        # Important:
        # We need manually cleanup the events table, because the events
        # created by `pg_restore` which was called by `load_events_dump`
        # will not be removed by the `TransactionTestCase` and might lead
        # to wierd results in subsequent tests.
        with connection.cursor() as cursor:
            cursor.execute('TRUNCATE hat_event CASCADE')
