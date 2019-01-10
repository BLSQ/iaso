import json
import os

from django.test import TestCase
from hat.cases.models import Case, RES_POSITIVE
from hat.couchdb import api
from hat.sync.models import DeviceDB
from hat.sync.tests import clean_couch

from ..import_synced import import_synced_devices

with open(os.path.join(os.path.dirname(__file__), "regular_neg_rdt.json")) as f:
    part_regular_neg_rdt = json.load(f)
with open(os.path.join(os.path.dirname(__file__), "stfix_treatment_stated.json")) as f:
    stfix_treatment_stated = json.load(f)


class ImportMobileSyncDocuments(TestCase):
    fixtures = ['locations', 'users']

    def tearDown(self):
        super().tearDown()
        clean_couch()

    # This test contains most of the general document assertions
    def test_import_regular_neg_rdt(self):
        device_db = DeviceDB(device_id=part_regular_neg_rdt['deviceId'])
        device_db.save()

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=part_regular_neg_rdt).json()
        self.assertEqual(part_regular_neg_rdt['_id'], p1['id'])

        stats = import_synced_devices()[0]['stats']
        self.assertEqual(stats.total, 1)
        self.assertEqual(stats.created, 1)
        self.assertEqual(stats.updated, 0)
        self.assertEqual(stats.deleted, 0)

        device_db.refresh_from_db()
        self.assertNotEqual(device_db.last_synced_seq, '0')
        device_cases = Case.objects.filter(device_id=part_regular_neg_rdt['deviceId'])
        self.assertEqual(device_cases.count(), 1)
        case = device_cases[0]
        self.assertEquals(case.year_of_birth, 1956)
        # document date is when the document was created, so the test time or even just before the first test
        # entry date is when all the information was entered, so potentially much later (last modified)
        self.assertGreaterEqual(case.entry_date, case.document_date)

        # Test
        self.assertEquals(case.test_set.count(), 1, "There should only be one test")
        rdt_test = case.test_set.first()
        self.assertEquals(rdt_test.type, "RDT")
        self.assertEquals(rdt_test.date.isoformat(), "2019-01-03T13:52:13.297000+00:00")
        self.assertEquals(rdt_test.village.name, "Kisala")

        # Patient
        self.assertIsNotNone(case.normalized_patient)
        self.assertEquals(case.normalized_patient.first_name, "Getting")
        self.assertEquals(case.normalized_patient.last_name, "Richmond")
        self.assertEquals(case.normalized_patient.post_name, "Fitch")
        self.assertEquals(case.normalized_patient.mothers_surname, "Within")
        self.assertEquals(case.normalized_patient.year_of_birth, 1956)
        self.assertEquals(case.normalized_patient.origin_village.name, "Kisala")

    ####################
    # Dépistage passif #
    ####################
    def test_import_stfix_treatment_started(self):
        device_db = DeviceDB(device_id=stfix_treatment_stated['deviceId'])
        device_db.save()

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=stfix_treatment_stated).json()
        self.assertEqual(stfix_treatment_stated['_id'], p1['id'])

        stats = import_synced_devices()[0]['stats']
        self.assertEqual(stats.total, 1)
        self.assertEqual(stats.created, 1)
        self.assertEqual(stats.updated, 0)
        self.assertEqual(stats.deleted, 0)

        device_db.refresh_from_db()
        self.assertNotEqual(device_db.last_synced_seq, '0')
        device_cases = Case.objects.filter(device_id=stfix_treatment_stated['deviceId'])
        self.assertEqual(device_cases.count(), 1)
        case = device_cases[0]
        self.assertEquals(case.year_of_birth, 1933)

        # Test
        self.assertEquals(case.test_set.count(), 3, "There should only be one test")
        rdt_test = case.test_set.filter(type="RDT")[0]
        pl_test = case.test_set.filter(type="PL")[0]
        ctcwoo_test = case.test_set.filter(type="CTCWOO")[0]
        self.assertEquals(rdt_test.village.name, "Kisala")
        self.assertEquals(rdt_test.result, RES_POSITIVE)
        self.assertEquals(ctcwoo_test.village.name, "Kisala")
        self.assertEquals(ctcwoo_test.result, RES_POSITIVE)
        self.assertEquals(pl_test.village.name, "Kisala")
        self.assertEquals(pl_test.result, RES_POSITIVE)
        # TODO: this should be in the Test, not in Case
        self.assertEquals(case.test_pl_gb_mm3, 333)

        # Patient
        self.assertIsNotNone(case.normalized_patient)
        self.assertEquals(case.normalized_patient.first_name, "Louis")
        self.assertEquals(case.normalized_patient.last_name, "de France")
        self.assertEquals(case.normalized_patient.post_name, "XVI")
        self.assertEquals(case.normalized_patient.mothers_surname, "de Saxe")
        self.assertEquals(case.normalized_patient.year_of_birth, 1933)
        self.assertEquals(case.normalized_patient.origin_village.name, "Kisala")
