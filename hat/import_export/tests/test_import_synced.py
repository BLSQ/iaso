from hat.couchdb import api
from hat.sync import couchdb_helpers as helpers
from hat.sync.tests import clean_couch
from hat.sync.models import DeviceDB, DeviceDBEntry
from . import DBTestCase
from ..import_synced import import_synced_device

device_id = 'test_Xx'
participant1 = {
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
        self.assertEqual(result['type'], 'synced_import')
        self.assertEqual(result['device_id'], device_id)
        self.assertEqual(result['num_total'], 0)
        self.assertEqual(result['num_imported'], 0)
        self.assertEqual(result['last_seq'], 0)

        # create documents in device db and sync
        db_name = helpers.generate_db_name(device_id)
        p1 = api.post(db_name, json=participant1).json()
        self.assertEqual(participant1['_id'], p1['id'])

        result = import_synced_device(devicedb)
        self.assertEqual(result['num_total'], 1)
        self.assertEqual(result['num_imported'], 1)
        self.assertNotEqual(result['last_seq'], 0)
        entries = DeviceDBEntry.objects.filter(device_id=device_id)
        self.assertEqual(entries.count(), 1)

        # re-sync without changes
        result = import_synced_device(devicedb)
        self.assertEqual(result['num_total'], 0)
        self.assertEqual(result['num_imported'], 0)
        entries = DeviceDBEntry.objects.filter(device_id=device_id)
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertEqual(entry.device_doc_id, p1['id'])
        self.assertEqual(entry.device_doc_rev, p1['rev'])

        # update record and re-sync
        participant1['_rev'] = p1['rev']
        participant1['person']['mothersSurname'] = 'MS'
        p2 = api.post(db_name, json=participant1).json()

        result = import_synced_device(devicedb)
        self.assertEqual(result['num_total'], 1)
        self.assertEqual(result['num_imported'], 1)
        entries = DeviceDBEntry.objects.filter(device_id=device_id)
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertEqual(entry.device_doc_id, p1['id'])
        self.assertNotEqual(entry.device_doc_rev, p1['rev'])
        self.assertEqual(entry.device_doc_rev, p2['rev'])

        # re-sync without changes
        result = import_synced_device(devicedb)
        self.assertEqual(result['num_total'], 0)
        self.assertEqual(result['num_imported'], 0)
        entries = DeviceDBEntry.objects.filter(device_id=device_id)
        self.assertEqual(entries.count(), 1)
        entry = entries.first()
        self.assertEqual(entry.device_doc_id, p1['id'])
        self.assertNotEqual(entry.device_doc_rev, p1['rev'])
        self.assertEqual(entry.device_doc_rev, p2['rev'])
