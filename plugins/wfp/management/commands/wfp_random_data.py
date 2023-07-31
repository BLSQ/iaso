from ...models import *  # type: ignore
from django.core.management.base import BaseCommand
from datetime import timedelta, datetime
import random


class Command(BaseCommand):
    help = "Insert random data in the database for 2000 beneficiaries"

    def handle(self, *args, **options):
        admission_types = [t[0] for t in ADMISSION_TYPES]

        facilities = OrgUnit.objects.filter(org_unit_type=1)
        for i in range(2000):
            if i % 10 == 0:
                print("Inserted %d beneficiaries" % i)
            b = Beneficiary()
            b.gender = random.choice(["male", "female"])
            random_birth = random.randint(1, 1825)
            b.birth_date = datetime.utcnow() - timedelta(days=random_birth)
            b.save()

            journey_count = random.randint(1, 3)

            for j in range(journey_count):
                journey = Journey()
                journey.beneficiary = b
                journey.nutrition_programme = random.choice(["TSFP", "OTP"])
                journey.admission_criteria = random.choice(["WHZ", "MUAC"])
                journey.admission_type = random.choice(admission_types)
                journey.weight_gain = random.randint(-1000, 5000) / 1000.0
                journey.exit_type = random.choice(
                    [
                        "cured",
                        "default",
                        "non-respondent",
                        "death",
                        "refered-for-medical-investigation",
                        "referred-to-sc-itp",
                        "volontary-withdrawal",
                        "dismissal-cheating",
                    ]
                )
                r = random.randint(1, 5)
                journey.programme_type = "PLW" if r < 2 else "U5"

                journey.save()

            visit_count = random.randint(1, 6)

            number = 1

            visit_offsets = [random.randint(1, random_birth) for l in range(visit_count)]
            visit_offsets.sort()

            facility = random.choice(facilities)
            for k in range(visit_count):
                visit = Visit()
                visit.number = number
                visit.org_unit = facility
                number += 1
                visit.date = b.birth_date + timedelta(days=visit_offsets[k])
                visit.journey = journey

                visit.save()

                step = Step()
                step.assistance_type = random.choice(["RUSF", "RUTF", "CSB++", ""])
                step.quantity_given = random.randint(1, 20)
                step.visit = visit
                step.save()
