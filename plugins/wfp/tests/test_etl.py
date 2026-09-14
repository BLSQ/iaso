import json
import random

from datetime import datetime, timedelta

from django.test import TestCase

from iaso import models as m
from plugins.wfp.common import ETL, extract_exit_type
from plugins.wfp.models import *


def load_fixture(mapping_file):
    with open("./plugins/wfp/tests/fixtures/" + mapping_file) as json_file:
        return json.load(json_file)


class ETLTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="WFP")
        cls.form = m.Form.objects.create(
            name="Hydroponics study",
            period_type=m.MONTH,
            single_per_period=True,
            form_id="form_1",
        )
        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)
        cls.form.projects.add(cls.project)
        cls.entity_type = m.EntityType.objects.create(name="Type 1", reference_form=cls.form, account=cls.account)
        cls.entities = m.Entity.objects.bulk_create(
            m.Entity(entity_type=cls.entity_type, account=cls.account) for _ in range(7)
        )

    def test_create_beneficiary(self):
        beneficiary = Beneficiary(birth_date="2022-08-08", gender="Male", entity=self.entities[0])
        beneficiary.save()
        self.assertEqual(beneficiary.entity.id, self.entities[0].id)

    def test_create_journey(self):
        random_birth = random.randint(1, 1825)
        gender = random.choice(["Male", "Female"])
        birth_date = datetime.utcnow() - timedelta(days=random_birth)
        beneficiary = Beneficiary(birth_date=birth_date, gender=gender, entity=self.entities[6])
        beneficiary.save()
        journey = Journey(
            beneficiary=beneficiary,
            programme_type="U5",
            admission_criteria=random.choice(["whz", "muac"]),
            admission_type="new_case",
            nutrition_programme=random.choice(["TSFP", "OTP"]),
            weight_gain=5,
            exit_type=random.choice(
                [
                    "cured",
                    "dismissed_due_to_cheating",
                    "voluntary_withdrawal",
                    "transferred_out",
                ]
            ),
            instance_id=1,
        )
        journey.save()

        self.assertEqual(journey.instance_id, 1)

    def test_create_visit(self):
        visit_count = random.randint(1, 6)
        journey = Journey(instance_id=1)
        journey.save()
        self.assertEqual(journey.instance_id, 1)

        for visit_number in range(visit_count):
            orgUnit = OrgUnit(id=9854, name="TEST OU Children under5", created_at=datetime.utcnow())
            orgUnit.save()
            visit = Visit(number=visit_number, org_unit=orgUnit, instance_id=421, journey=journey)
            visit.save()

            self.assertEqual(visit.instance_id, 421)

            for ration in ["RUSF", "RUTF", "CSB++", ""]:
                step = Step(
                    assistance_type=ration,
                    quantity_given=random.randint(1, 20),
                    visit=visit,
                    instance_id=visit.instance_id,
                )
                step.save()

                self.assertEqual(step.instance_id, visit.instance_id)

    def test_create_beneficiay_journey_visits_steps(self):
        beneficiaries = Beneficiary.objects.bulk_create(
            [
                Beneficiary(
                    birth_date="2025-01-27",
                    gender="Male",
                    entity=self.entities[0],
                    account=self.account,
                    guidelines="NEW",
                ),
                Beneficiary(
                    birth_date="2023-12-27",
                    gender="Male",
                    entity=self.entities[1],
                    account=self.account,
                    guidelines="OLD",
                ),
                Beneficiary(
                    birth_date="2025-07-10",
                    gender="Female",
                    entity=self.entities[2],
                    account=self.account,
                    guidelines="NEW",
                ),
                Beneficiary(
                    birth_date="2024-10-10",
                    gender="Female",
                    entity=self.entities[3],
                    account=self.account,
                    guidelines="OLD",
                ),
            ]
        )
        self.assertEqual(beneficiaries[0].entity.id, self.entities[0].id)
        self.assertEqual(beneficiaries[1].entity.id, self.entities[1].id)
        self.assertEqual(beneficiaries[2].entity.id, self.entities[2].id)
        self.assertEqual(beneficiaries[3].entity.id, self.entities[3].id)
        self.assertEqual(Beneficiary.objects.count(), 4)

        journeys = Journey.objects.bulk_create(
            [
                Journey(
                    beneficiary=beneficiaries[0],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="TSFP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 1),
                    end_date=datetime(2025, 9, 12),
                    duration=(datetime(2025, 9, 12) - datetime(2025, 8, 1)).days,
                    instance_id=1,
                ),
                Journey(
                    beneficiary=beneficiaries[1],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="OTP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 5),
                    end_date=datetime(2025, 8, 19),
                    duration=(datetime(2025, 8, 19) - datetime(2025, 8, 5)).days,
                    instance_id=100,
                ),
                Journey(
                    beneficiary=beneficiaries[2],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="TSFP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 1),
                    end_date=datetime(2025, 8, 29),
                    duration=(datetime(2025, 8, 29) - datetime(2025, 8, 1)).days,
                    instance_id=72,
                ),
                Journey(
                    beneficiary=beneficiaries[3],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="OTP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 5),
                    end_date=datetime(2025, 8, 19),
                    duration=(datetime(2025, 8, 19) - datetime(2025, 8, 5)).days,
                    instance_id=1012,
                ),
            ]
        )
        self.assertEqual(journeys[0].beneficiary.entity.id, self.entities[0].id)
        self.assertEqual(journeys[1].beneficiary.entity.id, self.entities[1].id)
        self.assertEqual(journeys[2].beneficiary.entity.id, self.entities[2].id)
        self.assertEqual(journeys[3].beneficiary.entity.id, self.entities[3].id)
        self.assertEqual(Journey.objects.count(), 4)

        orgUnit = OrgUnit(id=9854, name="TEST Malakia PHCC", created_at=datetime.utcnow())
        orgUnit.save()

        journey_1_visits = [
            Visit(
                date=datetime(2025, 8, 1),
                number=0,
                org_unit=orgUnit,
                instance_id=1,
                journey=journeys[0],
                muac_size=10,
                whz_color="Red",
            ),
            Visit(
                date=datetime(2025, 8, 1) + timedelta(days=14),
                number=1,
                org_unit=orgUnit,
                instance_id=2,
                journey=journeys[0],
                muac_size=random.randint(12, 25),
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 15) + timedelta(days=14),
                number=2,
                org_unit=orgUnit,
                instance_id=3,
                journey=journeys[0],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 29) + timedelta(days=14),
                number=3,
                org_unit=orgUnit,
                instance_id=4,
                journey=journeys[0],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        visits_beneficiary_1 = Visit.objects.bulk_create(journey_1_visits)
        self.assertEqual(len(visits_beneficiary_1), 4)
        assistance_types = [
            {"type": "Soap", "quantity": 1},
            {"type": "Mosquito Net", "quantity": 1},
            {"type": "rusf", "quantity": 14},
            {"type": "rutf", "quantity": 28},
        ]
        for visit in visits_beneficiary_1:
            steps = Step.objects.bulk_create(
                Step(
                    visit=visit,
                    assistance_type=assistance_type["type"],
                    quantity_given=assistance_type["quantity"],
                    instance_id=visit.instance_id,
                )
                for assistance_type in assistance_types
            )
            self.assertEqual(len(steps), 4)

        journey_2_visits = [
            Visit(
                date=datetime(2025, 8, 5),
                number=0,
                org_unit=orgUnit,
                instance_id=101,
                journey=journeys[1],
                muac_size=random.randint(12, 25),
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 5) + timedelta(days=7),
                number=1,
                org_unit=orgUnit,
                instance_id=102,
                journey=journeys[1],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 12) + timedelta(days=7),
                number=2,
                org_unit=orgUnit,
                instance_id=103,
                journey=journeys[1],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        visits_beneficiary_2 = Visit.objects.bulk_create(journey_2_visits)
        self.assertEqual(len(visits_beneficiary_2), 3)
        for visit in visits_beneficiary_2:
            steps = Step.objects.bulk_create(
                Step(
                    visit=visit,
                    assistance_type=assistance_type["type"],
                    quantity_given=assistance_type["quantity"],
                    instance_id=visit.instance_id,
                )
                for assistance_type in assistance_types
            )
            self.assertEqual(len(steps), 4)

        journey_3_visits = [
            Visit(
                date=datetime(2025, 8, 1),
                number=0,
                org_unit=orgUnit,
                instance_id=72,
                journey=journeys[2],
                muac_size=random.randint(12, 25),
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 1) + timedelta(days=14),
                number=1,
                org_unit=orgUnit,
                instance_id=73,
                journey=journeys[2],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 15) + timedelta(days=14),
                number=2,
                org_unit=orgUnit,
                instance_id=74,
                journey=journeys[2],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        visits_beneficiary_3 = Visit.objects.bulk_create(journey_3_visits)
        self.assertEqual(len(visits_beneficiary_3), 3)
        for visit in visits_beneficiary_3:
            steps = Step.objects.bulk_create(
                Step(
                    visit=visit,
                    assistance_type=assistance_type["type"],
                    quantity_given=assistance_type["quantity"],
                    instance_id=visit.instance_id,
                )
                for assistance_type in assistance_types
            )
            self.assertEqual(len(steps), 4)

        journey_4_visits = [
            Visit(
                date=datetime(2025, 8, 5),
                number=0,
                org_unit=orgUnit,
                instance_id=1012,
                journey=journeys[3],
                muac_size=random.randint(12, 25),
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 5) + timedelta(days=7),
                number=1,
                org_unit=orgUnit,
                instance_id=1013,
                journey=journeys[3],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 12) + timedelta(days=7),
                number=2,
                org_unit=orgUnit,
                instance_id=1014,
                journey=journeys[3],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        visits_beneficiary_4 = Visit.objects.bulk_create(journey_4_visits)
        self.assertEqual(len(visits_beneficiary_4), 3)
        for visit in visits_beneficiary_4:
            steps = Step.objects.bulk_create(
                Step(
                    visit=visit,
                    assistance_type=assistance_type["type"],
                    quantity_given=assistance_type["quantity"],
                    instance_id=visit.instance_id,
                )
                for assistance_type in assistance_types
            )
            self.assertEqual(len(steps), 4)

    def test_aggregate_monthly_data(self):
        orgUnit = OrgUnit(
            id=9810, name="TEST Gabat Static CHC-CHP", source_ref="OU_DHIS2_ID", created_at=datetime.utcnow()
        )
        orgUnit.save()

        beneficiaries = Beneficiary.objects.bulk_create(
            [
                Beneficiary(
                    birth_date="2025-01-27",
                    gender="Male",
                    entity=self.entities[0],
                    account=self.account,
                    guidelines="NEW",
                ),
                Beneficiary(
                    birth_date="2023-12-27",
                    gender="Female",
                    entity=self.entities[1],
                    account=self.account,
                    guidelines="OLD",
                ),
            ]
        )
        self.assertEqual(beneficiaries[0].entity.id, self.entities[0].id)
        self.assertEqual(beneficiaries[1].entity.id, self.entities[1].id)
        journeys = Journey.objects.bulk_create(
            [
                Journey(
                    beneficiary=beneficiaries[0],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="TSFP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 1),
                    end_date=datetime(2025, 9, 12),
                    duration=(datetime(2025, 9, 12) - datetime(2025, 8, 1)).days,
                    instance_id=42,
                ),
                Journey(
                    beneficiary=beneficiaries[1],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="OTP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 5),
                    end_date=datetime(2025, 8, 19),
                    duration=(datetime(2025, 8, 19) - datetime(2025, 8, 5)).days,
                    instance_id=140,
                ),
            ]
        )
        self.assertEqual(len(journeys), 2)
        visits = [
            Visit(
                date=datetime(2025, 8, 1),
                number=0,
                org_unit=orgUnit,
                instance_id=42,
                journey=journeys[0],
                muac_size=10,
                whz_color="Red",
            ),
            Visit(
                date=datetime(2025, 8, 1) + timedelta(days=14),
                number=1,
                org_unit=orgUnit,
                instance_id=43,
                journey=journeys[0],
                muac_size=11.7,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 15) + timedelta(days=14),
                number=2,
                org_unit=orgUnit,
                instance_id=44,
                journey=journeys[0],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 29) + timedelta(days=14),
                number=3,
                org_unit=orgUnit,
                instance_id=45,
                journey=journeys[0],
                muac_size=12.5,
                whz_color="Green",
            ),
            Visit(
                date=datetime(2025, 8, 5),
                number=0,
                org_unit=orgUnit,
                instance_id=140,
                journey=journeys[1],
                muac_size=12.2,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 5) + timedelta(days=7),
                number=1,
                org_unit=orgUnit,
                instance_id=141,
                journey=journeys[1],
                muac_size=11.6,
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 12) + timedelta(days=7),
                number=2,
                org_unit=orgUnit,
                instance_id=142,
                journey=journeys[1],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        created_visits = Visit.objects.bulk_create(visits)
        self.assertEqual(len(created_visits), 7)
        u5_journeys = load_fixture("monthly_U5_data.json")

        created_U5_monthlyStatistics = ETL._process_monthly_data("U5", u5_journeys, self.account)

        self.assertEqual(len(created_U5_monthlyStatistics), 6)
        self.assertEqual(created_U5_monthlyStatistics[0].period, "202508")
        self.assertEqual(created_U5_monthlyStatistics[0].dhis2_id, orgUnit.source_ref)
        self.assertEqual(created_U5_monthlyStatistics[0].account, self.account)
        self.assertEqual(created_U5_monthlyStatistics[1].period, "202509")
        self.assertEqual(created_U5_monthlyStatistics[2].period, "202509")

        pbwg_journeys = load_fixture("monthly_PBWG_data.json")
        created_PBWG_monthlyStatistics = ETL._process_monthly_data("PLW", pbwg_journeys, self.account)
        self.assertEqual(len(created_PBWG_monthlyStatistics), 2)
        self.assertEqual(created_PBWG_monthlyStatistics[1].physiology_status, "Breastfeeding")
        self.assertEqual(created_PBWG_monthlyStatistics[1].period, "202508")


class BangladeshExitTypeTestCase(TestCase):
    """discharge_program (Bangladesh anthropometric form) exit detection."""

    def test_discharge_program_referred_to_bsfp_takes_priority(self):
        # referred_to_BSFP wins even when new_programme also has a value.
        data = {"discharge_program": "TSFP", "referred_to_BSFP": "1", "new_programme": "BSFP"}
        self.assertEqual(extract_exit_type(data), "transfer_to_bsfp")

    def test_discharge_program_without_new_programme_or_referral_is_empty(self):
        # Discharged from TSFP/OTP, not referred to BSFP, and no new
        # programme recorded yet -> explicit "no exit reason known" ("").
        data = {"discharge_program": "OTP", "new_programme": ""}
        self.assertEqual(extract_exit_type(data), "")

    def test_discharge_program_with_new_programme_and_no_referral_is_not_an_exit(self):
        # Discharged from TSFP/OTP with a new_programme already assigned
        # (a same-programme continuation/transfer handled elsewhere) and no
        # BSFP referral -> not treated as an exit event.
        data = {"discharge_program": "TSFP", "new_programme": "OTP"}
        self.assertIsNone(extract_exit_type(data))

    def test_discharge_program_short_circuits_other_exit_signals(self):
        # Once discharge_program matches TSFP/OTP, later exit signals
        # (e.g. reason_for_not_continuing) are not consulted.
        data = {"discharge_program": "TSFP", "new_programme": "OTP", "reason_for_not_continuing": "death"}
        self.assertIsNone(extract_exit_type(data))

    def test_discharge_program_matches_as_substring(self):
        data = {"discharge_program": "Transferred to TSFP"}
        self.assertEqual(extract_exit_type(data), "")

    def test_discharge_program_bsfp_alone_is_not_a_tsfp_otp_discharge(self):
        # BSFP is a target of a referral, not a discharge_program value that
        # triggers the TSFP/OTP branch on its own.
        data = {"discharge_program": "BSFP"}
        self.assertIsNone(extract_exit_type(data))

    def test_discharge_program_without_known_programme_is_ignored(self):
        data = {"discharge_program": "NONE"}
        self.assertIsNone(extract_exit_type(data))

    def test_missing_discharge_program_is_ignored(self):
        self.assertIsNone(extract_exit_type({}))


class ETLFormScopingTestCase(TestCase):
    """bsfp_child_visit / bsfp_pbwg_visit must only be recognized for Bangladesh."""

    def test_bangladesh_under5_includes_bsfp_visit_forms(self):
        etl = ETL("bangladesh_under5")
        self.assertIn("bsfp_child_visit", etl.admission_forms)
        self.assertIn("bsfp_pbwg_visit", etl.admission_forms)
        self.assertIn("bsfp_child_visit", etl.assistance_forms)
        self.assertIn("bsfp_pbwg_visit", etl.assistance_forms)
        self.assertIn("bsfp_child_visit", etl.all_anthropometric_forms)
        self.assertIn("bsfp_pbwg_visit", etl.all_anthropometric_forms)

    def test_bangladesh_pbwg_includes_bsfp_visit_forms(self):
        etl = ETL("bangladesh_pbwg")
        self.assertIn("bsfp_child_visit", etl.admission_forms)
        self.assertIn("bsfp_pbwg_visit", etl.assistance_forms)

    def test_other_countries_do_not_include_bsfp_visit_forms(self):
        for entity_type in ("south_sudan_under5", "nigeria_under5", "ethiopia_under5", "south_sudan_pbwg"):
            etl = ETL(entity_type)
            self.assertNotIn("bsfp_child_visit", etl.admission_forms)
            self.assertNotIn("bsfp_pbwg_visit", etl.admission_forms)
            self.assertNotIn("bsfp_child_visit", etl.assistance_forms)
            self.assertNotIn("bsfp_pbwg_visit", etl.assistance_forms)
            self.assertNotIn("bsfp_child_visit", etl.all_anthropometric_forms)
            self.assertNotIn("bsfp_pbwg_visit", etl.all_anthropometric_forms)

    def test_no_entity_type_does_not_include_bsfp_visit_forms(self):
        etl = ETL()
        self.assertNotIn("bsfp_child_visit", etl.all_anthropometric_forms)


class ETLGetAccountTestCase(TestCase):
    """get_account() must degrade gracefully when the EntityType doesn't exist."""

    def test_returns_none_for_unknown_entity_type_code(self):
        self.assertIsNone(ETL("bangladesh_under5").get_account())
