from django.test import TestCase
from plugins.wfp.models import *
from datetime import timedelta, datetime
import random


class ETLTestCase(TestCase):
    def test_create_beneficiary(self):
        beneficiary = Beneficiary(birth_date="2022-08-08", gender="Male", entity_id=18)
        beneficiary.save()
        print(f"CREATED BENEFICIARY WITH ENTITY ID {beneficiary.entity_id}")
        print("\n")
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
        print("CREATED JOURNEY ", journey.id)
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
            print("CREATED VISIT ", visit.id)
            self.assertEqual(visit.instance_id, 421)

            for ration in ["RUSF", "RUTF", "CSB++", ""]:
                step = Step(
                    assistance_type=ration,
                    quantity_given=random.randint(1, 20),
                    visit=visit,
                    instance_id=visit.instance_id,
                )
                step.save()
                print("CREATED STEP ", step.id)
                self.assertEqual(step.instance_id, visit.instance_id)
            print("\n")
