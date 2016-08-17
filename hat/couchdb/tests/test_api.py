from . import TestCase
from .. import api


class ApiTests(TestCase):
    def test_get_db(self):
        r = api.get(self.test_db)
        self.assertLess(r.status_code, 400)

    def test_head_db(self):
        r = api.head(self.test_db)
        self.assertLess(r.status_code, 400)

    def test_put_doc(self):
        data = {'put': True}
        r = api.put(self.test_db + '/test_put_doc', json=data)
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['ok'])

    def test_post_doc(self):
        data = {'post': True, '_id': 'test_post_doc'}
        r = api.post(self.test_db, json=data)
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['ok'])

    def test_get_doc(self):
        api.post(self.test_db, json={'_id': 'test_get_doc', 'get': True})
        r = api.get(self.test_db + '/test_get_doc', params={'include_docs': 'true'})
        self.assertLess(r.status_code, 400)
        j = r.json()
        self.assertTrue(j['get'])

    def test_delete_doc(self):
        api.post(self.test_db, json={'_id': 'test_delete_doc', 'get': True})
        r = api.get(self.test_db + '/test_delete_doc')
        self.assertLess(r.status_code, 400)
        j = r.json()
        r = api.delete(self.test_db + '/test_delete_doc', params={'rev': j['_rev']})
        self.assertLess(r.status_code, 400)
        r = api.get(self.test_db + '/test_delete_doc')
        self.assertEqual(r.status_code, 404)
