from django.test import TestCase
import hat.cases.event_log as evl

test_stats = evl.EventStats(
    total=4,
    created=3,
    updated=1,
    deleted=0
)
test_file = evl.EventFile(
    name='file',
    hash='hash',
    contents='contents'
)


def assertStats(test, row, stats):
    test.assertEqual(row['created'], stats.created)
    test.assertEqual(row['updated'], stats.updated)
    test.assertEqual(row['deleted'], stats.deleted)
    test.assertEqual(row['total'], stats.total)


def assertFile(test, row, file):
    test.assertEqual(row['filename'], file.name)
    test.assertEqual(row['file_hash'], file.hash)
    test.assertEqual(bytes(row['contents']).decode('utf-8'), file.contents)


class EventLogTests(TestCase):
    def test_log_cases_file_import(self):
        self.assertEqual(len(evl.get_events()), 0)
        id = evl.log_cases_file_import(test_stats, test_file, 'foo')
        self.assertEqual(len(evl.get_events()), 1)
        e = evl.get_event_of_type(evl.EventTable.cases_file, id)
        self.assertIsNotNone(e['stamp'])
        self.assertEqual(e['table_name'], evl.EventTable.cases_file.value)
        self.assertEqual(e['source_type'], 'foo')
        assertStats(self, e, test_stats)
        assertFile(self, e, test_file)

    def test_log_reconciled_file_import(self):
        self.assertEqual(len(evl.get_events()), 0)
        id = evl.log_reconciled_file_import(test_stats, test_file)
        self.assertEqual(len(evl.get_events()), 1)
        e = evl.get_event_of_type(evl.EventTable.reconciled_file, id)
        self.assertIsNotNone(e['stamp'])
        self.assertEqual(e['table_name'], evl.EventTable.reconciled_file.value)
        assertStats(self, e, test_stats)
        assertFile(self, e, test_file)

    def test_log_cases_merge(self):
        self.assertEqual(len(evl.get_events()), 0)
        id = evl.log_cases_merge('doc1', 'doc2')
        self.assertEqual(len(evl.get_events()), 1)
        e = evl.get_event_of_type(evl.EventTable.cases_merge, id)
        self.assertIsNotNone(e['stamp'])
        self.assertEqual(e['table_name'], evl.EventTable.cases_merge.value)
        documents = e['documents']
        self.assertEqual(documents['older_id'], 'doc1')
        self.assertEqual(documents['younger_id'], 'doc2')
        assertStats(self, e, evl.EventStats(total=0, created=0, updated=1, deleted=1))

    def test_log_sync_import(self):
        self.assertEqual(len(evl.get_events()), 0)
        id = evl.log_sync_import(test_stats, [{'foo': 'bar'}], 'device-id')
        self.assertEqual(len(evl.get_events()), 1)
        e = evl.get_event_of_type(evl.EventTable.sync, id)
        self.assertIsNotNone(e['stamp'])
        self.assertEqual(e['table_name'], evl.EventTable.sync.value)
        self.assertEqual(e['documents'][0]['foo'], 'bar')
        self.assertEqual(e['device_id'], 'device-id')
        assertStats(self, e, test_stats)

    def test_dont_log_when_stats_empty(self):
        self.assertEqual(len(evl.get_events()), 0)
        empty_stats = evl.EventStats(created=0, updated=0, deleted=0, total=0)
        id = evl.log_sync_import(empty_stats, [{'foo': 'bar'}], 'device-id')
        self.assertIsNone(id)
        self.assertEqual(len(evl.get_events()), 0)
