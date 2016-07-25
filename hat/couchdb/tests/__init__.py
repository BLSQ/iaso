from uuid import uuid4
from django.test import TestCase
import hat.couchdb as couch


class CouchDBTests(TestCase):
    test_db = 'test-' + str(uuid4())

    def setUp(self):
        _, r = couch.get(self.test_db)
        if r.status_code == 404:
            couch.put(self.test_db)

    def tearDown(self):
        _, r = couch.get(self.test_db)
        if r.status_code != 404:
            couch.delete(self.test_db)

    def test_get_db(self):
        j, r = couch.get(self.test_db)
        self.assertLess(r.status_code, 400)

    def test_put_doc(self):
        data = {'put': True}
        j, r = couch.put(self.test_db + '/test_put_doc', json=data)
        self.assertLess(r.status_code, 400)
        self.assertTrue(j['ok'])

    def test_post_doc(self):
        data = {'post': True, '_id': 'test_post_doc'}
        j, r = couch.post(self.test_db, json=data)
        self.assertLess(r.status_code, 400)
        self.assertTrue(j['ok'])

    def test_get_doc(self):
        couch.post(self.test_db, json={'_id': 'test_get_doc', 'get': True})
        j, r = couch.get(self.test_db + '/test_get_doc',
                         params={'include_docs': 'true'})
        self.assertLess(r.status_code, 400)
        self.assertTrue(j['get'])

    def test_delete_doc(self):
        couch.post(self.test_db, json={'_id': 'test_delete_doc', 'get': True})
        j, r = couch.get(self.test_db + '/test_delete_doc')
        self.assertLess(r.status_code, 400)
        _, r = couch.delete(self.test_db + '/test_delete_doc',
                            params={'rev': j['_rev']})
        self.assertLess(r.status_code, 400)
        _, r = couch.get(self.test_db + '/test_delete_doc')
        self.assertEqual(r.status_code, 404)
