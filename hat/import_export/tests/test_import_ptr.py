import json
import os
import uuid

from django.test import TestCase

from hat.couchdb import api
from hat.geo.models import Village
from hat.import_export.utils import replace_in_dict_recursive
from hat.sync.models import DeviceDB
from hat.sync.tests import clean_couch
from ..import_synced import import_synced_devices


def load_document(filename, device_db_name=None):
    if device_db_name:
        device_db = DeviceDB.objects.get(device_id=device_db_name)
    else:
        device_db_name = filename + str(uuid.uuid4())
        device_db = DeviceDB.objects.create(device_id=device_db_name)
    with open(os.path.join(os.path.dirname(__file__), filename)) as f:
        document = json.load(f)
        if "-ptr-village-" not in document['_id']:
            document['_id'] = str(uuid.uuid4())  # Avoid updates in couch
        document['deviceId'] = device_db_name
        # update the device_id everywhere in the document
        document = replace_in_dict_recursive(document, "device", device_db_name)
        return document, device_db


class ImportMobileSyncDocuments(TestCase):
    fixtures = ['locations', 'users']

    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_import_create_village_ptr(self):
        regular_create_village_ptr, device_db = load_document("regular_create_village_ptr.json")
        ptr_create_village_ptr, _ = load_document("ptr_create_village_ptr.json", device_db.device_id)

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=regular_create_village_ptr).json()
        ptr = api.post(device_db.db_name, json=ptr_create_village_ptr).json()
        self.assertEqual(regular_create_village_ptr['_id'], p1['id'])
        self.assertEqual(ptr_create_village_ptr['_id'], ptr['id'])

        response = import_synced_devices()
        stats = response[0]['stats']
        self.assertEqual(stats.total, 1)
        device_db.refresh_from_db()

        villages = Village.objects.filter(name="Nouveau Village Ptr").filter(AS_id=111)
        self.assertEqual(villages.count(), 1)
        village = villages.first()
        self.assertEqual(village.population, 2011)

    def test_import_create_village_noptr(self):
        regular_create_village_noptr, device_db = load_document("regular_create_village_noptr.json")

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=regular_create_village_noptr).json()
        self.assertEqual(regular_create_village_noptr['_id'], p1['id'])

        response = import_synced_devices()
        stats = response[0]['stats']
        self.assertEqual(stats.total, 1)
        device_db.refresh_from_db()

        villages = Village.objects.filter(name="Nouveau Village Noptr").filter(AS_id=111)
        self.assertEqual(villages.count(), 1)
        village = villages.first()
        self.assertIsNone(village.population)

    def test_import_ptr_only(self):
        ptr_create_village_ptr, device_db = load_document("ptr_alone.json")

        # create documents in device db and sync
        ptr = api.post(device_db.db_name, json=ptr_create_village_ptr).json()
        self.assertEqual(ptr_create_village_ptr['_id'], ptr['id'])

        response = import_synced_devices()
        # stats = response[0]['stats']
        # self.assertEqual(stats.total, 0)
        device_db.refresh_from_db()

        villages = Village.objects.filter(name="Ptr Sans Village").filter(AS_id=111)
        self.assertEqual(villages.count(), 1)
        village = villages.first()
        self.assertEqual(village.population, 1984)
