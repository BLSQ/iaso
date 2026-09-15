import json
import random

from datetime import datetime, timedelta, timezone

from django.test import TestCase

from iaso import models as m
from plugins.wfp.common import ETL, extract_bangladesh_exit_type, extract_exit_type, extract_form_visit_date
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


class ExitTypeDischargeProgramTestCase(TestCase):
    """discharge_program is only read by the Bangladesh exit extraction."""

    def test_other_countries_keep_their_exit_signals(self):
        data = {"discharge_program": "TSFP", "reason_for_not_continuing": "death"}
        self.assertEqual(extract_exit_type(data), "death")

    def test_missing_discharge_program_is_ignored(self):
        self.assertIsNone(extract_exit_type({}))


class BangladeshExitTypeTestCase(TestCase):
    """Exit detection on the Bangladesh anthropometric forms, with the field values the forms save."""

    def test_tsfp_follow_up_still_in_programme_is_not_an_exit(self):
        # Form 82, second green visit, discharge answered No: the calculated flags must not end the journey.
        data = {
            "_programme": "TSFP",
            "discharge_program": "",
            "_number_of_green_visits": "2",
            "non_respondent__int__": "0",
        }
        self.assertIsNone(extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data))

    def test_tsfp_follow_up_cured(self):
        data = {
            "_programme": "NONE",
            "discharge_program": "TSFP",
            "discharge_note__int__": "1",
            "referred_to_BSFP": "0",
        }
        self.assertEqual(extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data), "cured")

    def test_tsfp_follow_up_cured_and_referred_to_bsfp(self):
        data = {
            "_programme": "BSFP",
            "discharge_program": "TSFP",
            "discharge_note__int__": "1",
            "referred_to_BSFP": "1",
        }
        self.assertEqual(extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data), "transfer_to_bsfp")

    def test_tsfp_follow_up_referred_to_otp(self):
        data = {"_programme": "NONE", "discharge_program": "TSFP", "confirm_discharge_tsfp__int__": "1"}
        self.assertEqual(extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data), "transfer_to_otp")

    def test_tsfp_follow_up_not_continuing(self):
        data = {"_programme": "NONE", "discharge_program": "TSFP", "reasons_not_continuing": "dismissedduetocheating"}
        self.assertEqual(
            extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data), "dismissed_due_to_cheating"
        )

    def test_transferred_out_keeps_the_programme(self):
        data = {"_programme": "TSFP", "discharge_program": "", "reasons_not_continuing": "transferredout"}
        self.assertEqual(extract_bangladesh_exit_type("child_antropometric_followUp_tsfp_2", data), "transferred_out")

    def test_pbwg_tsfp_follow_up_referred_to_bsfp(self):
        data = {"programme": "BSFP", "discharge_program": "TSFP", "confirm_BFP_referral": "yes"}
        self.assertEqual(extract_bangladesh_exit_type("wfp_coda_pbwg_followup_anthro", data), "transfer_to_bsfp")

    def test_pbwg_tsfp_follow_up_cured(self):
        data = {"programme": "NONE", "discharge_program": "TSFP", "_cured": "1"}
        self.assertEqual(extract_bangladesh_exit_type("wfp_coda_pbwg_followup_anthro", data), "cured")

    def test_bsfp_child_still_in_programme_is_not_an_exit(self):
        data = {"_programme": "NSEP", "is_child_alive": "1", "beneficiary_continuing_facility": "1"}
        self.assertIsNone(extract_bangladesh_exit_type("bsfp_child_followup_visit", data))

    def test_bsfp_child_not_continuing_keeps_its_programme_in_the_form(self):
        data = {
            "_programme": "NSEP",
            "is_child_alive": "1",
            "beneficiary_continuing_facility": "0",
            "reason_not_continue": "dismissed_due_to_cheating",
        }
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_followup_visit", data), "dismissed_due_to_cheating")

    def test_bsfp_pbwg_voluntary_withdrawal(self):
        data = {"_programme": "NONE", "beneficiary_continuing_facility": "0", "reason_not_continue": "voluntary"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_pbwg_followup_visit", data), "voluntary_withdrawal")

    def test_bsfp_child_death(self):
        data = {"_programme": "NONE", "is_child_alive": "0"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_followup_visit", data), "death")

    def test_bsfp_child_referred_to_otp_or_tsfp(self):
        otp = {"_programme": "NONE", "is_child_alive": "1", "confirm_otp_referral": "1"}
        tsfp = {"_programme": "NONE", "is_child_alive": "1", "confirm_tsfp_referral": "1"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_followup_visit", otp), "transfer_to_otp")
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_visit", tsfp), "transfer_to_tsfp")

    def test_bsfp_child_not_continuing(self):
        data = {
            "_programme": "NONE",
            "is_child_alive": "1",
            "beneficiary_continuing_facility": "0",
            "reason_not_continue": "other",
        }
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_followup_visit", data), "other")

    def test_bsfp_child_reaching_36_months(self):
        data = {"_programme": "NONE", "is_child_alive": "1", "_age_band": "exit"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_child_followup_visit", data), "age_limit")

    def test_bsfp_pbwg_infant_older_than_6_months(self):
        # In the PBWG forms is_child_alive is about the infant, never a death of the beneficiary.
        data = {"_programme": "NONE", "status_of_woman": "breastfeeding", "is_child_alive": "1", "_infant_exit": "1"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_pbwg_followup_visit", data), "age_limit")

    def test_bsfp_pbwg_infant_death_is_not_a_death_of_the_woman(self):
        data = {"_programme": "NONE", "status_of_woman": "breastfeeding", "is_child_alive": "0"}
        self.assertEqual(extract_bangladesh_exit_type("bsfp_pbwg_followup_visit", data), "other")


class BangladeshVisitDateTestCase(TestCase):
    def test_form_visit_date_is_used(self):
        submission = {
            "json": {"visit_date": "2026-08-20"},
            "source_created_at": datetime(2026, 8, 25, 21, 30, tzinfo=timezone.utc),
        }
        self.assertEqual(extract_form_visit_date(submission), datetime(2026, 8, 20, 12, 0, tzinfo=timezone.utc))

    def test_falls_back_to_the_submission_date(self):
        created = datetime(2026, 8, 25, 21, 30, tzinfo=timezone.utc)
        self.assertEqual(extract_form_visit_date({"json": {}, "source_created_at": created}), created)
        self.assertEqual(
            extract_form_visit_date({"json": {"visit_date": "not a date"}, "source_created_at": created}), created
        )

    def test_other_countries_keep_the_submission_date(self):
        created = datetime(2026, 8, 25, 21, 30, tzinfo=timezone.utc)
        submission = {"json": {"visit_date": "2026-08-20"}, "source_created_at": created}
        self.assertEqual(ETL("south_sudan_under5")._extract_visit_date(submission), created)


class BangladeshJourneysTestCase(TestCase):
    """Journeys and visits built from a sequence of Bangladesh submissions."""

    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="WFP Bangladesh")

    @staticmethod
    def _submissions(*forms):
        created = datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc)
        submissions = []
        for index, (form_id, data) in enumerate(forms):
            submissions.append(
                {
                    "id": 1000 + index,
                    "entity_id": 1,
                    "json": data,
                    "form__form_id": form_id,
                    "org_unit_id": None,
                    "source_created_at": created + timedelta(days=14 * index),
                    "created_at": created + timedelta(days=14 * index, hours=2),
                }
            )
        return submissions

    def _process(self, entity_type, program_type, submissions):
        result = ETL(entity_type)._process_entity(program_type, 1, submissions, self.account, set())
        self.assertIsNotNone(result)
        _beneficiary, journeys, visits, _steps = result
        return journeys, visits

    def test_nsep_child_follow_ups_and_exit(self):
        registration = {"gender": "M", "actual_birthday__date__": "2024-03-15T00:00:00.000+06:00"}
        enrollment = {"_programme": "NSEP", "muac": "13.5", "admission_type": "new_admission", "is_child_alive": "1"}
        follow_up = {
            "_programme": "NSEP",
            "muac": "13.2",
            "is_child_alive": "1",
            "beneficiary_continuing_facility": "1",
        }
        submissions = self._submissions(
            ("wfp_coda_child_registration", registration),
            ("bsfp_child_visit", enrollment),
            ("bsfp_child_followup_visit", {**follow_up, "visit_date": "2026-06-27"}),
            ("bsfp_child_followup_visit", {**follow_up, "visit_date": "2026-07-13"}),
            (
                "bsfp_child_followup_visit",
                # The form keeps _programme = NSEP when the child does not continue.
                {
                    **follow_up,
                    "visit_date": "2026-07-26",
                    "beneficiary_continuing_facility": "0",
                    "reason_not_continue": "other",
                },
            ),
        )

        journeys, visits = self._process("bangladesh_under5", "U5", submissions)

        self.assertEqual(len(journeys), 1)
        self.assertEqual(journeys[0].nutrition_programme, "NSEP")
        self.assertEqual(journeys[0].exit_type, "other")
        self.assertEqual(journeys[0].end_date, "2026-07-26")
        self.assertEqual(len(visits), 4)
        self.assertEqual(
            [visit.date.date().isoformat() for visit in visits],
            ["2026-06-15", "2026-06-27", "2026-07-13", "2026-07-26"],
        )

    def test_tsfp_child_cured_then_referred_to_bsfp(self):
        registration = {"gender": "F", "actual_birthday__date__": "2025-10-15T00:00:00.000+06:00"}
        green_visit = {"_programme": "TSFP", "discharge_program": "", "muac": "13.5", "_number_of_green_visits": "1"}
        submissions = self._submissions(
            ("wfp_coda_child_registration", registration),
            (
                "Anthropometric visit child_U6",
                {"_programme": "TSFP", "muac": "12.0", "admission_type": "new_case_muac"},
            ),
            ("child_antropometric_followUp_tsfp_2", {**green_visit, "visit_date": "2026-06-29"}),
            (
                "child_antropometric_followUp_tsfp_2",
                {
                    **green_visit,
                    "_programme": "BSFP",
                    "discharge_program": "TSFP",
                    "visit_date": "2026-07-13",
                    "_number_of_green_visits": "2",
                    "discharge_note__int__": "1",
                    "referred_to_BSFP": "1",
                },
            ),
            (
                "bsfp_child_visit",
                {"_programme": "BSFP", "muac": "13.5", "is_child_alive": "1", "visit_date": "2026-07-27"},
            ),
        )

        journeys, visits = self._process("bangladesh_under5", "U5", submissions)

        self.assertEqual([journey.nutrition_programme for journey in journeys], ["TSFP", "BSFP"])
        self.assertEqual(journeys[0].exit_type, "transfer_to_bsfp")
        self.assertEqual(journeys[0].end_date, "2026-07-13")
        self.assertIsNone(journeys[1].exit_type)

    def test_tsfp_child_cured_without_referral(self):
        registration = {"gender": "M", "actual_birthday__date__": "2025-10-15T00:00:00.000+06:00"}
        submissions = self._submissions(
            ("wfp_coda_child_registration", registration),
            ("Anthropometric visit child_U6", {"_programme": "TSFP", "muac": "12.0"}),
            (
                "child_antropometric_followUp_tsfp_2",
                {"_programme": "NONE", "discharge_program": "TSFP", "muac": "13.5", "discharge_note__int__": "1"},
            ),
        )

        journeys, _visits = self._process("bangladesh_under5", "U5", submissions)

        self.assertEqual(len(journeys), 1)
        self.assertEqual(journeys[0].exit_type, "cured")

    def test_bsfp_woman_follow_ups_until_infant_is_6_months(self):
        registration = {"actual_birthday__date__": "2001-09-14T00:00:00.000+06:00"}
        follow_up = {"_programme": "BSFP", "status_of_woman": "breastfeeding", "muac": "23.0", "_infant_exit": "0"}
        submissions = self._submissions(
            ("wfp_coda_pbwg_registration", registration),
            ("bsfp_pbwg_visit", {**follow_up, "admission_type": "new_case"}),
            ("bsfp_pbwg_followup_visit", {**follow_up, "visit_date": "2026-06-29"}),
            (
                "bsfp_pbwg_followup_visit",
                {**follow_up, "_programme": "NONE", "_infant_exit": "1", "visit_date": "2026-07-13"},
            ),
        )

        journeys, visits = self._process("bangladesh_pbwg", "PLW", submissions)

        self.assertEqual(len(journeys), 1)
        self.assertEqual(journeys[0].nutrition_programme, "BSFP")
        self.assertEqual(journeys[0].exit_type, "age_limit")
        self.assertEqual(len(visits), 3)


class ETLFormScopingTestCase(TestCase):
    """Bangladesh BSFP forms must only be recognized for Bangladesh."""

    def test_bangladesh_under5_includes_bsfp_visit_forms(self):
        etl = ETL("bangladesh_under5")
        self.assertIn("bsfp_child_visit", etl.admission_forms)
        self.assertIn("bsfp_pbwg_visit", etl.admission_forms)
        self.assertIn("bsfp_child_visit", etl.assistance_forms)
        self.assertIn("bsfp_pbwg_visit", etl.assistance_forms)
        self.assertIn("bsfp_child_visit", etl.all_anthropometric_forms)
        self.assertIn("bsfp_pbwg_visit", etl.all_anthropometric_forms)
        self.assertIn("bsfp_child_followup_visit", etl.all_anthropometric_forms)
        self.assertIn("bsfp_pbwg_followup_visit", etl.all_anthropometric_forms)
        self.assertNotIn("bsfp_child_followup_visit", etl.admission_forms)

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
            self.assertNotIn("bsfp_child_followup_visit", etl.all_anthropometric_forms)
            self.assertNotIn("bsfp_pbwg_followup_visit", etl.all_anthropometric_forms)

    def test_no_entity_type_does_not_include_bsfp_visit_forms(self):
        etl = ETL()
        self.assertNotIn("bsfp_child_visit", etl.all_anthropometric_forms)


class ETLGetAccountTestCase(TestCase):
    """get_account() must degrade gracefully when the EntityType doesn't exist."""

    def test_returns_none_for_unknown_entity_type_code(self):
        self.assertIsNone(ETL("bangladesh_under5").get_account())
