from django.test import TransactionTestCase
from hat.couchdb import api
from hat.cases.models import Case

from . import clean_couch
from ..models import DeviceDB
from ..utils import fetch_devicedbs_info, fetch_devicedb_data
from hat.import_export.import_synced import import_synced_device

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


class UtilsTestCase(TransactionTestCase):
    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_fetch_devicedbs_info(self):
        device = DeviceDB(device_id=device_id)
        device.save()

        info1 = fetch_devicedbs_info()
        self.assertEqual(len(info1), 1)
        self.assertEqual(info1[0]['num_docs'], 0)
        self.assertEqual(info1[0]['num_cases'], 0)

        api.post(device.db_name, json=participant)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 0)

        info2 = fetch_devicedbs_info()
        self.assertEqual(len(info2), 1)
        self.assertEqual(info2[0]['num_docs'], 1)
        self.assertEqual(info2[0]['num_cases'], 0, msg='not synced yet')

        import_synced_device(device)
        self.assertEqual(Case.objects.filter(device_id=device_id).count(), 1)

        info3 = fetch_devicedbs_info()
        self.assertEqual(len(info3), 1)
        self.assertEqual(info3[0]['num_docs'], 1)
        self.assertEqual(info3[0]['num_cases'], 1, msg='already synced')

    def test_fetch_devicedb_data(self):
        device = DeviceDB(device_id=device_id)
        device.save()

        results1 = fetch_devicedb_data(device)
        self.assertEqual(len(results1['docs']), 0)

        api.post(device.db_name, json=participant)

        results2 = fetch_devicedb_data(device)
        self.assertEqual(len(results2['docs']), 1)
