from ...models import *
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Transform WFP collected data in a format usable for analytics"

    def handle(self, *args, **options):
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
