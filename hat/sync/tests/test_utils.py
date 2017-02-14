from django.test import TransactionTestCase
from hat.couchdb import api

from . import clean_couch
from ..models import DeviceDB
from ..utils import fetch_devicedbs_info, fetch_devicedb_data
from hat.import_export.import_synced import import_synced_device


class UtilsTestCase(TransactionTestCase):
    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_fetch_devicedbs_info(self):
        device = DeviceDB(device_id='test_Xx')
        device.save()

        info1 = fetch_devicedbs_info()
        self.assertEqual(len(info1), 1)
        self.assertEqual(info1[0]['num_docs'], 0)
        self.assertEqual(info1[0]['num_cases'], 0)

        api.post(device.db_name, json={'_id': 'abc'})

        info2 = fetch_devicedbs_info()
        self.assertEqual(len(info2), 1)
        self.assertEqual(info2[0]['num_docs'], 1)
        self.assertEqual(info2[0]['num_cases'], 0, msg='not synced yet')

        import_synced_device(device)

        info3 = fetch_devicedbs_info()
        self.assertEqual(len(info3), 1)
        self.assertEqual(info3[0]['num_docs'], 1)
        self.assertEqual(info3[0]['num_cases'], 1, msg='already synced')

    def test_fetch_devicedb_data(self):
        device = DeviceDB(device_id='test_Zz')
        device.save()

        results1 = fetch_devicedb_data(device)
        self.assertEqual(len(results1['docs']), 0)

        api.post(device.db_name, json={'_id': '123'})

        results2 = fetch_devicedb_data(device)
        self.assertEqual(len(results2['docs']), 1)
