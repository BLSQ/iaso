from uuid import uuid4
from django.test import TestCase
import hat.couchdb as couchdb


class CouchDBTests(TestCase):
    test_db = 'test-' + str(uuid4())

    def setUp(self):
        r = couchdb.get(self.test_db)
        if r.status_code == 404:
            couchdb.put(self.test_db)

    def tearDown(self):
        r = couchdb.get(self.test_db)
        if r.status_code != 404:
            couchdb.delete(self.test_db)

    def test_get_db(self):
        r = couchdb.get(self.test_db)
        self.assertLess(r.status_code, 400)

    def test_head_db(self):
        r = couchdb.head(self.test_db)
        self.assertLess(r.status_code, 400)

    def test_put_doc(self):
        data = {'put': True}
        r = couchdb.put(self.test_db + '/test_put_doc', json=data)
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['ok'])

    def test_post_doc(self):
        data = {'post': True, '_id': 'test_post_doc'}
        r = couchdb.post(self.test_db, json=data)
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['ok'])

    def test_get_doc(self):
        couchdb.post(self.test_db, json={'_id': 'test_get_doc', 'get': True})
        r = couchdb.get(self.test_db + '/test_get_doc', params={'include_docs': 'true'})
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['get'])

    def test_delete_doc(self):
        couchdb.post(self.test_db, json={'_id': 'test_delete_doc', 'get': True})
        r = couchdb.get(self.test_db + '/test_delete_doc')
        self.assertLess(r.status_code, 400)
        j = r.json()
        r = couchdb.delete(self.test_db + '/test_delete_doc', params={'rev': j['_rev']})
        self.assertLess(r.status_code, 400)
        r = couchdb.get(self.test_db + '/test_delete_doc')
        self.assertEqual(r.status_code, 404)

    def test_walk_changes(self):
        num_total = 10
        num_seen = 0

        for i in range(num_total):
            couchdb.post(self.test_db, json={'i': i})

        def f(c):
            nonlocal num_seen
            self.assertEqual(c['doc']['i'], num_seen)
            num_seen = num_seen + 1

        couchdb.walk_changes(self.test_db, f, params={'limit': 2, 'include_docs': 'true'})
        self.assertEqual(num_seen, num_total)
