import random

from datetime import datetime, timedelta

from django.test import TestCase

from plugins.wfp.models import *


class ETLTestCase(TestCase):
    def test_create_beneficiary(self):
        beneficiary = Beneficiary(birth_date="2022-08-08", gender="Male", entity_id=18)
        beneficiary.save()

        self.assertEqual(beneficiary.entity_id, 18)

    def test_create_journey(self):
        random_birth = random.randint(1, 1825)
        gender = random.choice(["Male", "Female"])
        birth_date = datetime.utcnow() - timedelta(days=random_birth)
        beneficiary = Beneficiary(birth_date=birth_date, gender=gender, entity_id=18)
        beneficiary.save()
        journey = Journey(
            beneficiary=beneficiary,
            programme_type="U5",
            admission_criteria=random.choice(["whz", "muac"]),
            admission_type="new_case",
            nutrition_programme=random.choice(["TSFP", "OTP"]),
            weight_gain=5,
            exit_type=random.choice(["cured", "dismissed_due_to_cheating", "voluntary_withdrawal", "transferred_out"]),
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
        account = Account(name="WFP")
        account.save()
        self.assertEqual(account.name, "WFP")

        beneficiaries = Beneficiary.objects.bulk_create(
            [
                Beneficiary(birth_date="2025-01-27", gender="Male", entity_id=22, account=account, guidelines="NEW"),
                Beneficiary(birth_date="2023-12-27", gender="Male", entity_id=23, account=account, guidelines="OLD"),
                Beneficiary(birth_date="2025-07-10", gender="Female", entity_id=24, account=account, guidelines="NEW"),
                Beneficiary(birth_date="2024-10-10", gender="Female", entity_id=25, account=account, guidelines="OLD"),
            ]
        )
        self.assertEqual(beneficiaries[0].entity_id, 22)
        self.assertEqual(beneficiaries[1].entity_id, 23)
        self.assertEqual(beneficiaries[2].entity_id, 24)
        self.assertEqual(beneficiaries[3].entity_id, 25)
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
                    end_date=datetime(2025, 8, 29),
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
                    start_date=datetime(2025, 8, 8),
                    end_date=datetime(2025, 8, 31),
                    duration=(datetime(2025, 8, 31) - datetime(2025, 8, 8)).days,
                    instance_id=72,
                ),
                Journey(
                    beneficiary=beneficiaries[3],
                    programme_type="U5",
                    admission_criteria="muac",
                    admission_type="new_case",
                    nutrition_programme="OTP",
                    exit_type="cured",
                    start_date=datetime(2025, 8, 1),
                    end_date=datetime(2025, 8, 31),
                    duration=(datetime(2025, 8, 31) - datetime(2025, 8, 1)).days,
                    instance_id=1012,
                ),
            ]
        )
        self.assertEqual(journeys[0].beneficiary.entity_id, 22)
        self.assertEqual(journeys[1].beneficiary.entity_id, 23)
        self.assertEqual(journeys[2].beneficiary.entity_id, 24)
        self.assertEqual(journeys[3].beneficiary.entity_id, 25)
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
                number=2,
                org_unit=orgUnit,
                instance_id=4,
                journey=journeys[0],
                muac_size=12.5,
                whz_color="Green",
            ),
        ]
        visits_beneficiary_1 = Visit.objects.bulk_create(journey_1_visits)
        self.assertEqual(len(visits_beneficiary_1), 4)
        print("VISITS BEN 1 ", visits_beneficiary_1)
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
                number=1,
                org_unit=orgUnit,
                instance_id=101,
                journey=journeys[1],
                muac_size=random.randint(12, 25),
                whz_color="Yellow",
            ),
            Visit(
                date=datetime(2025, 8, 5) + timedelta(days=7),
                number=2,
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
