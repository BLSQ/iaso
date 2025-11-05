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
        self.assertEqual(Beneficiary.objects.count(), 4)

        journeys = Journey.objects.bulk_create(
            Journey(
                beneficiary=beneficiary,
                programme_type="U5",
                admission_criteria="muac",
                admission_type="new_case",
                nutrition_programme=random.choice(["TSFP", "OTP"]),
                exit_type="cured",
                start_date=datetime(2025, 8, 8),
                end_date=datetime(2025, 8, 31),
            )
            for beneficiary in beneficiaries
        )
        self.assertEqual(journeys[0].beneficiary.entity_id, 22)
        self.assertEqual(journeys[1].beneficiary.entity_id, 23)
        self.assertEqual(journeys[2].beneficiary.entity_id, 24)
        self.assertEqual(journeys[3].beneficiary.entity_id, 25)
        self.assertEqual(Journey.objects.count(), 4)

        orgUnit = OrgUnit(id=9854, name="TEST Malakia PHCC", created_at=datetime.utcnow())
        orgUnit.save()

        for journey in journeys:
            visit_count = random.randint(1, 6)
            for visit_number in range(visit_count):
                visit = Visit(
                    date=datetime(2025, 8, 8),
                    number=visit_number,
                    org_unit=orgUnit,
                    instance_id=random.randint(1, journey.id),
                    journey=journey,
                    muac_size=random.randint(12, 25),
                )
                visit.save()
                for ration in ["RUSF", "RUTF", "CSB++", ""]:
                    step = Step(
                        assistance_type=ration,
                        quantity_given=random.randint(1, 20),
                        visit=visit,
                        instance_id=visit.instance_id,
                    )
                    step.save()
