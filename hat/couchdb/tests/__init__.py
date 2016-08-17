from uuid import uuid4
from django.test import TestCase as DjangoTestCase
from .. import api


class TestCase(DjangoTestCase):
    test_db = 'test-' + str(uuid4())

    def setUp(self):
        r = api.get(self.test_db)
        if r.status_code == 404:
            api.put(self.test_db)

    def tearDown(self):
        r = api.get(self.test_db)
        if r.status_code != 404:
            api.delete(self.test_db)
