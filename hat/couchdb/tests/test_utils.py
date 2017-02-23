from . import TestCase
from .. import api as couchdb
from .. import utils


class UtilsTests(TestCase):
    def test_walk_changes(self):
        num_total = 10
        num_seen = 0

        for i in range(num_total):
            couchdb.post(self.test_db, json={'i': i})

        def f(c):
            nonlocal num_seen
            self.assertEqual(c['doc']['i'], num_seen)
            num_seen = num_seen + 1

        utils.walk_changes(self.test_db, f, params={'limit': 2, 'include_docs': 'true'})
        self.assertEqual(num_seen, num_total)

    def test_force_put_doc(self):
        path = self.test_db + '/foo'

        utils.force_put_doc(path, {'_id': 'foo', 'new': True})
        r = couchdb.get(path)
        r.raise_for_status()
        self.assertTrue(r.json()['new'])

        utils.force_put_doc(path, {'_id': 'foo', 'new': False})
        r = couchdb.get(path)
        r.raise_for_status()
        self.assertFalse(r.json()['new'])

    def test_fetch_db_docs(self):
        # clean db
        d1 = utils.fetch_db_docs(self.test_db, 0)
        self.assertEqual(d1['last_seq'], 0, msg='last seq starts in 0')
        self.assertEqual(len(d1['docs']), 0, msg='empty db')

        # two new docs
        foo = couchdb.post(self.test_db, json={'_id': 'foo'}).json()
        couchdb.post(self.test_db, json={'_id': 'bar'})
        d2 = utils.fetch_db_docs(self.test_db, d1['last_seq'])
        self.assertNotEqual(d2['last_seq'], d1['last_seq'], msg='last seq changed')
        self.assertEqual(len(d2['docs']), 2, msg='changed or new docs')

        # one doc changed since last check
        couchdb.post(self.test_db, json={'_id': foo['id'], '_rev': foo['rev']})
        d3 = utils.fetch_db_docs(self.test_db, d2['last_seq'])
        self.assertNotEqual(d3['last_seq'], d2['last_seq'], msg='last seq changed')
        self.assertEqual(len(d3['docs']), 1, msg='1 doc changes since last seq')
        self.assertEqual(d3['docs'][0]['_id'], foo['id'])

        # no changes since last check
        d4 = utils.fetch_db_docs(self.test_db, d3['last_seq'])
        self.assertEqual(d4['last_seq'], d3['last_seq'], msg='last seq not changed')
        self.assertEqual(len(d4['docs']), 0, msg='No docs changed since last seq')
