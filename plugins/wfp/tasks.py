from .models import *
from datetime import timedelta, datetime
import random
from celery import shared_task


@shared_task()
def generate_random_data():
    """Insert random data in the database for 2000 beneficiaries"""
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


@shared_task()
def etl():
    """Extract beneficiary data from Iaso tables and store them in the format expected by existing tableau dashboards"""
    entity_type_u5 = EntityType.objects.get(id=7)
    entities = Entity.objects.filter(entity_type=entity_type_u5)
    count = 0
    for entity in entities:
        rf = entity.attributes

        if rf.json and rf.json.get("actual_birthday"):
            if count % 10 == 0:
                print("Inserted %d beneficiaries" % count)
            b = Beneficiary()
            b.gender = rf.json.get("gender")
            b.birth_date = rf.json.get("actual_birthday")[:10]

            b.entity_id = entity.id
            b.save()

            journey = None
            visit = None
            visit_number = 1
            current_weight = None
            initial_weight = None
            for instance in entity.instances.order_by("-id"):
                if journey is None:
                    journey = Journey()
                    journey.save()

                if visit is None:
                    visit = Visit()
                    visit.number = visit_number
                    visit_number += 1
                    visit.journey = journey
                    visit.save()

                form_id = instance.form.form_id
                if form_id == "wfp_coda_child_registration":
                    journey.beneficiary = b
                    journey.programme_type = "U5"
                    journey.save()
                    visit.date = instance.updated_at.date()
                    visit.save()

                if form_id == "Anthropometric visit child":
                    admission_criteria = instance.json.get("admission_criteria", None)
                    journey.admission_criteria = admission_criteria
                    journey.nutrition_programme = instance.json.get("programme", None)
                    journey.save()
                    current_weight = instance.json.get("weight_kgs", None)
                treatment = instance.json.get("speficy_treatment", None)

                if treatment is not None:
                    step = Step()
                    step.assistance_type = treatment
                    step.visit = visit
                    step.instance_id = instance.id
                    visit.save()
            count += 1
