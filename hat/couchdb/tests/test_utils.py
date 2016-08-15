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
