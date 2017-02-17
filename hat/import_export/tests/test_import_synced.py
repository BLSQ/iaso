from hat.cases.models import Case
from hat.couchdb import api
from hat.sync.models import DeviceDB
from hat.sync.tests import clean_couch

from . import DBTestCase
from ..import_synced import import_synced_device

device_id = 'test_Xx'
participant = {
   '_id': 'participant-1',
   'person': {
       'forename': 'FF',
       'postname': 'PP',
       'surname': 'SS',
       'birthYear': 2008,
       'gender': 'Female',
       'mothersSurname': 'MM',
       'location': {
           'zone': 'bokoro',
           'area': 'kemba-secteur',
           'village': 'mushie'
       }
   },
   'participant': {
       'memberType': 'resident',
       'screenings': {
           'pl': {
               'result': 'positive',
               'group': '2005-07-03T22:00:00.000Z'
           }
       },
       'screeningLocation': {
           'zone': 'bokoro',
           'area': 'kemba-secteur',
           'village': 'mushie'
       },
       'hatId': 'SSPPFFM2008F',
       'version': 5
   },
   'type': 'participant',
   'appVersion': '0.0.0',
   'dateCreated': '2017-02-10T16:17:36.179Z',
   'dateModified': '2017-02-10T16:17:36.179Z',
   'deviceId': device_id
}


class ImportSyncedTests(DBTestCase):
    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_import_sync_device(self):
        devicedb = DeviceDB(device_id=device_id)
        devicedb.save()

        # nothing to import (empty db)
        result = import_synced_device(devicedb)
        self.assertEqual(result['log'].source, 'synced_import')
        self.assertEqual(result['log'].num_total, 0)
        self.assertEqual(result['log'].num_created, 0)
        self.assertEqual(result['log'].num_updated, 0)
        self.assertEqual(result['log'].num_deleted, 0)
        self.assertEqual(result['device'].device_id, device_id)
        self.assertEqual(result['device'].last_synced_seq, 0)

        # create documents in device db and sync
        p1 = api.post(devicedb.db_name, json=participant).json()
        self.assertEqual(participant['_id'], p1['id'])

        result = import_synced_device(devicedb)
        self.assertEqual(result['log'].num_total, 1)
        self.assertEqual(result['log'].num_created, 1)
        self.assertEqual(result['log'].num_updated, 0)
        self.assertEqual(result['log'].num_deleted, 0)
        self.assertNotEqual(result['device'].last_synced_seq, 0)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 1)

        # re-sync without changes
        result = import_synced_device(devicedb)
        self.assertEqual(result['log'].num_total, 0)
        self.assertEqual(result['log'].num_created, 0)
        self.assertEqual(result['log'].num_updated, 0)
        self.assertEqual(result['log'].num_deleted, 0)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 1)

        # update record and re-sync
        participant['_rev'] = p1['rev']
        participant['person']['mothersSurname'] = 'MS'
        p2 = api.post(devicedb.db_name, json=participant).json()
        self.assertEqual(p2['id'], p1['id'])

        result = import_synced_device(devicedb)
        self.assertEqual(result['log'].num_total, 1)
        # changing mother's surname triggers new case instead of updating the existing one
        # P A R T Y ! ! !
        self.assertEqual(result['log'].num_created, 1)
        self.assertEqual(result['log'].num_updated, 0)
        self.assertEqual(result['log'].num_deleted, 0)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 2)

        # re-sync without changes
        result = import_synced_device(devicedb)
        self.assertEqual(result['log'].num_total, 0)
        self.assertEqual(result['log'].num_created, 0)
        self.assertEqual(result['log'].num_updated, 0)
        self.assertEqual(result['log'].num_deleted, 0)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 2)
