import collections
import json
import os
import uuid

from django.test import TestCase

from hat.cases.models import Case, RES_POSITIVE
from hat.couchdb import api
from hat.import_export.utils import replace_in_dict_recursive
from hat.sync.models import DeviceDB
from hat.sync.tests import clean_couch
from ..import_synced import import_synced_devices


def load_document(filename):
    device_db_name = filename + str(uuid.uuid4())
    device_db = DeviceDB.objects.create(device_id=device_db_name)
    with open(os.path.join(os.path.dirname(__file__), filename)) as f:
        document = json.load(f)
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

    # This test contains most of the general document assertions
    def test_import_regular_neg_rdt(self):
        part_regular_neg_rdt, device_db = load_document("regular_neg_rdt.json")

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
        stfix_treatment_started, device_db = load_document("stfix_treatment_started.json")

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=stfix_treatment_started).json()
        self.assertEqual(stfix_treatment_started['_id'], p1['id'])

        stats = import_synced_devices()[0]['stats']
        self.assertEqual(stats.total, 1)
        self.assertEqual(stats.created, 1)
        self.assertEqual(stats.updated, 0)
        self.assertEqual(stats.deleted, 0)

        device_db.refresh_from_db()
        self.assertNotEqual(device_db.last_synced_seq, '0')
        device_cases = Case.objects.filter(device_id=stfix_treatment_started['deviceId'])
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
        self.assertEquals(int(case.test_pl_gb_mm3), 333)

        # Patient
        self.assertIsNotNone(case.normalized_patient)
        patient = case.normalized_patient
        self.assertEquals(patient.first_name, "Louis")
        self.assertEquals(patient.last_name, "de France")
        self.assertEquals(patient.post_name, "XVI")
        self.assertEquals(patient.mothers_surname, "de Saxe")
        self.assertEquals(patient.year_of_birth, 1933)
        self.assertEquals(patient.origin_village.name, "Kisala")
        self.assertEquals(patient.dead, False)
        self.assertIsNone(patient.death_date)
        self.assertIsNone(patient.death_location)
        self.assertIsNone(patient.death_device_id)

        # Depistage Passif
        treatments = case.normalized_patient.treatment_set
        self.assertEquals(treatments.count(), 1)
        melarsoprol = treatments.get(medicine="melarsoprol")
        self.assertIsNotNone(melarsoprol.location)
        self.assertEquals(melarsoprol.index, 0)
        self.assertEquals(len(melarsoprol.issues), 0)
        self.assertEquals(len(melarsoprol.incomplete_reasons), 0)
        self.assertIsNone(melarsoprol.lost)
        self.assertIsNone(melarsoprol.end_date)

    def test_import_stfix_treatment_ended(self):
        stfix_treatment_ended, device_db = load_document("stfix_treatment_ended.json")

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=stfix_treatment_ended).json()
        self.assertEqual(stfix_treatment_ended['_id'], p1['id'])

        stats = import_synced_devices()[0]['stats']
        self.assertEqual(stats.total, 1)
        self.assertEqual(stats.created, 1)
        self.assertEqual(stats.updated, 0)
        self.assertEqual(stats.deleted, 0)

        device_db.refresh_from_db()
        self.assertNotEqual(device_db.last_synced_seq, '0')
        device_cases = Case.objects.filter(device_id=stfix_treatment_ended['deviceId'])
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
        self.assertEquals(int(case.test_pl_gb_mm3), 333)

        # Patient
        self.assertIsNotNone(case.normalized_patient)
        patient = case.normalized_patient
        self.assertEquals(patient.first_name, "Louis")
        self.assertEquals(patient.last_name, "de France")
        self.assertEquals(patient.post_name, "XVI")
        self.assertEquals(patient.mothers_surname, "de Saxe")
        self.assertEquals(patient.year_of_birth, 1933)
        self.assertEquals(patient.origin_village.name, "Kisala")
        self.assertEquals(patient.dead, False)
        self.assertIsNone(patient.death_date)
        self.assertIsNone(patient.death_location)
        self.assertIsNone(patient.death_device_id)

        # Depistage Passif
        treatments = case.normalized_patient.treatment_set
        self.assertEquals(treatments.count(), 1)
        melarsoprol = treatments.get(medicine="melarsoprol")
        self.assertIsNotNone(melarsoprol.location)
        self.assertEquals(melarsoprol.index, 0)
        self.assertEquals(len(melarsoprol.issues), 1)
        self.assertEquals(melarsoprol.issues[0], "vomiting")
        self.assertEquals(len(melarsoprol.incomplete_reasons), 1)
        self.assertEquals(melarsoprol.incomplete_reasons[0], "abandon")
        self.assertFalse(melarsoprol.dead)
        self.assertFalse(melarsoprol.lost)
        self.assertFalse(melarsoprol.adverse_effects)
        self.assertEquals(str(melarsoprol.end_date), "2019-01-10")

    def test_import_stfix_treatment_dead(self):
        stfix_treatment_dead, device_db = load_document("stfix_treatment_dead.json")

        # create documents in device db and sync
        p1 = api.post(device_db.db_name, json=stfix_treatment_dead).json()
        self.assertEqual(stfix_treatment_dead['_id'], p1['id'])

        response = import_synced_devices()
        self.assertEquals(len(response), 1)
        self.assertTrue('stats' in response[0])
        stats = response[0]['stats']
        self.assertEqual(stats.total, 1)
        self.assertEqual(stats.created, 1)
        self.assertEqual(stats.updated, 0)
        self.assertEqual(stats.deleted, 0)

        device_db.refresh_from_db()
        self.assertNotEqual(device_db.last_synced_seq, '0')
        device_cases = Case.objects.filter(device_id=stfix_treatment_dead['deviceId'])
        self.assertEqual(device_cases.count(), 1)
        case = device_cases[0]
        self.assertIsNone(case.year_of_birth)

        # Test
        self.assertEquals(case.test_set.count(), 3, "There should only be 3 tests")
        rdt_test = case.test_set.get(type="RDT")
        pl_test = case.test_set.get(type="PL")
        ctcwoo_test = case.test_set.get(type="MAECT")
        self.assertEquals(rdt_test.village.name, "Polongo")
        self.assertEquals(rdt_test.result, RES_POSITIVE)
        self.assertEquals(ctcwoo_test.village.name, "Polongo")
        self.assertEquals(ctcwoo_test.result, RES_POSITIVE)
        self.assertEquals(pl_test.village.name, "Polongo")
        self.assertEquals(pl_test.result, RES_POSITIVE)

        # Patient
        self.assertIsNotNone(case.normalized_patient)
        patient = case.normalized_patient
        self.assertEquals(patient.first_name, "Dexia")
        self.assertEquals(patient.last_name, "Clay")
        self.assertEquals(patient.post_name, "Héros")
        self.assertEquals(patient.mothers_surname, "Belfius")
        self.assertIsNone(patient.year_of_birth)
        self.assertEquals(patient.origin_village.name, "Polongo")
        self.assertEquals(patient.dead, True)
        self.assertEquals(str(patient.death_date), "2019-01-03")
        self.assertIsNotNone(patient.death_location)
        self.assertEquals(patient.death_location.coords, (33.4009249, 53.8367285))
        self.assertEquals(patient.death_device_id, device_db.id)

        # Depistage Passif
        treatments = case.normalized_patient.treatment_set
        self.assertEquals(treatments.count(), 5)
        pentamidine = treatments.get(medicine="pentamidine")
        self.assertIsNotNone(pentamidine.location)
        self.assertEquals(pentamidine.index, 0)
        self.assertEquals(len(pentamidine.issues), 11)
        self.assertEquals(pentamidine.issues, ["behaviour", "neuro", "convulsion", "acute respiratory failure",
                                               "septicemy", "vomiting", "diarrhea", "obnubilation", "desorientation",
                                               "coma", "other"])
        self.assertEquals(pentamidine.other_issues, "Patient grew a third eye and started speaking Greek")
        self.assertEquals(len(pentamidine.incomplete_reasons), 3)
        self.assertEquals(pentamidine.incomplete_reasons, ["patientincapacity", "abandon", "outofstock"])
        self.assertFalse(pentamidine.dead)
        self.assertFalse(pentamidine.lost)
        self.assertFalse(pentamidine.adverse_effects)
        self.assertEquals(str(pentamidine.start_date), "2019-01-01")
        self.assertEquals(str(pentamidine.end_date), "2019-01-02")
        eflornithine = treatments.get(medicine="eflornithine")
        self.assertIsNotNone(eflornithine.location)
        self.assertEquals(eflornithine.index, 1)
        self.assertEquals(len(eflornithine.issues), 0)
        self.assertEquals(len(eflornithine.incomplete_reasons), 0)
        self.assertFalse(eflornithine.dead)
        self.assertFalse(eflornithine.lost)
        self.assertFalse(eflornithine.adverse_effects)
        self.assertEquals(str(eflornithine.start_date), "2019-01-02")
        self.assertIsNone(eflornithine.end_date)
        nect = treatments.get(medicine="nect")
        self.assertIsNotNone(nect.location)
        self.assertEquals(nect.index, 2)
        self.assertEquals(len(nect.issues), 0)
        self.assertEquals(len(nect.incomplete_reasons), 0)
        self.assertFalse(nect.dead)
        self.assertFalse(nect.lost)
        self.assertFalse(nect.adverse_effects)
        self.assertEquals(str(nect.start_date), "2019-01-02")
        self.assertIsNone(nect.end_date)
        fexinidazole = treatments.get(medicine="fexinidazole")
        self.assertIsNotNone(fexinidazole.location)
        self.assertEquals(fexinidazole.index, 3)
        self.assertEquals(len(fexinidazole.issues), 0)
        self.assertEquals(len(fexinidazole.incomplete_reasons), 0)
        self.assertFalse(fexinidazole.dead)
        self.assertFalse(fexinidazole.lost)
        self.assertFalse(fexinidazole.adverse_effects)
        self.assertEquals(str(fexinidazole.start_date), "2019-01-02")
        self.assertIsNone(fexinidazole.end_date)
        acoziborole = treatments.get(medicine="acoziborole")
        self.assertIsNotNone(acoziborole.location)
        self.assertEquals(acoziborole.index, 4)
        self.assertEquals(len(acoziborole.issues), 0)
        self.assertEquals(len(acoziborole.incomplete_reasons), 1)
        self.assertEquals(acoziborole.incomplete_reasons[0], "death")
        self.assertFalse(acoziborole.dead)
        self.assertFalse(acoziborole.lost)
        self.assertFalse(acoziborole.adverse_effects)
        self.assertEquals(str(acoziborole.start_date), "2019-01-02")
        self.assertEquals(str(acoziborole.end_date), "2019-01-10")
