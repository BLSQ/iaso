from wfp.models import *
from django.core.management.base import BaseCommand
from itertools import groupby
from operator import itemgetter
import datetime


class Command(BaseCommand):
    help = "Transform Child under 5 data for WFP in a format usable for tableau dashboard"

    def existing_beneficiaries(self):
        existing_beneficiaries = Beneficiary.objects.exclude(entity_id=None).values(
            "entity_id"
        )
        return list(map(lambda x: x["entity_id"], existing_beneficiaries))

    def instances_to_exclude(self):
        journey = Journey.objects.values("instance_id").distinct()
        return list(map(lambda x: x["instance_id"], journey))

    def visits_to_exclude(self):
        instances_id = self.instances_to_exclude()
        visits = (
            Visit.objects.values("instance_id")
            .distinct()
            .exclude(instance_id__in=instances_id)
        )
        visits_id = list(map(lambda x: x["instance_id"], visits))
        [
            instances_id.append(visit_id)
            for visit_id in visits_id
            if visit_id not in instances_id
        ]
        return instances_id

    def steps_to_exclude(self):
        instances_id = self.visits_to_exclude()
        steps = (
            Step.objects.values("instance_id")
            .distinct()
            .exclude(instance_id__in=instances_id)
        )
        steps_id = list(map(lambda x: x["instance_id"], steps))
        [
            instances_id.append(step_id)
            for step_id in steps_id
            if step_id not in instances_id
        ]
        return instances_id

    def admission_type(self, visit):
        admission_type = None
        if visit.get("admission_type"):
            admission_type = visit.get("admission_type")
        elif visit.get("admission_type_red"):
            admission_type = visit.get("admission_type_red")
        elif visit.get("admission_TSFP"):
            admission_type = visit.get("admission_TSFP")
        elif visit.get("admission_type_yellow"):
            admission_type = visit.get("admission_type_yellow")
        elif visit.get("_admission_type"):
            admission_type = visit.get("_admission_type")
        return admission_type

    def admission_criteria(self, visit):
        admission_criteria = None
        if visit.get("Admission_choice"):
            admission_criteria = visit.get("Admission_choice")
        elif visit.get("admission_choice"):
            admission_criteria = visit.get("admission_choice")
        elif visit.get("admission_criteria"):
            admission_criteria = visit.get("admission_criteria")
        elif visit.get("admission_criteria_yellow"):
            admission_criteria = visit.get("admission_criteria_yellow")
        elif visit.get("admission_criteria_red"):
            admission_criteria = visit.get("admission_criteria_red")
        elif visit.get("admission_criteria_red_no_oedema"):
            admission_criteria = visit.get("admission_criteria_red_no_oedema")
        elif visit.get("_admission_criteria"):
            admission_criteria = visit.get("_admission_criteria")
        return admission_criteria

    def compute_gained_weight(self, initial_weight, current_weight):
        weight_gain = 0
        if initial_weight is not None and current_weight is not None:
            weight_gain = float(current_weight) - float(initial_weight)
        return weight_gain

    def group_visit_by_entity(self, entities):
        instances = []
        i = 0
        instances_by_entity = groupby(list(entities), key=itemgetter("entity_id"))
        initial_weight = None
        current_weight = None

        for entity_id, entity in instances_by_entity:
            instances.append({"entity_id": entity_id, "visits": [], "journey": []})
            for visit in entity:
                current_record = visit.get("json", None)
                instances[i]["program"] = self.program_mapper(current_record)
                if current_record is not None and current_record != None:
                    if current_record.get("actual_birthday__date__") is not None:
                        birth_date = current_record.get("actual_birthday__date__", None)
                        instances[i]["birth_date"] = birth_date[:10]
                    if current_record.get("gender") is not None:
                        gender = current_record.get("gender")
                        instances[i]["gender"] = gender
                    if current_record.get("last_name") is not None:
                        instances[i]["last_name"] = current_record.get("last_name", "")

                    if current_record.get("first_name") is not None:
                        instances[i]["first_name"] = current_record.get(
                            "first_name", ""
                        )

                    form_id = visit.get("form__form_id")
                    current_record["org_unit_id"] = visit.get("org_unit_id", None)
                    current_weight = current_record.get("weight_kgs", None)

                    if form_id == "Anthropometric visit child":
                        initial_weight = current_weight
                        instances[i]["initial_weight"] = initial_weight

                    current_record["weight_gain"] = self.compute_gained_weight(
                        initial_weight, current_weight
                    )
                    if visit.get("updated_at"):
                        current_record["date"] = visit.get("updated_at").strftime(
                            "%Y-%m-%d"
                        )

                    current_record["instance_id"] = visit["id"]
                    current_record["form_id"] = form_id
                    instances[i]["visits"].append(current_record)

            i = i + 1
        return list(
            filter(
                lambda instance: (
                    instance.get("visits") and len(instance.get("visits")) > 0
                )
                and instance.get("gender") is not None
                and instance.get("birth_date") is not None
                and instance.get("birth_date") != ""
                and instance.get("gender") != "",
                instances,
            )
        )

    def program_mapper(self, visit):
        program = None
        if visit:
            if visit.get("programme") is not None:
                program = visit.get("programme")
            elif visit.get("program") is not None:
                program = visit.get("program")
            elif visit.get("program_two") is not None:
                program = visit.get("program_two", None)
        return program

    def exit_type(self, visit):
        exit_type = None
        if (visit.get("reasons_not_continuing") is not None and visit.get("reasons_not_continuing") != ""):
            exit_type = visit.get("reasons_not_continuing")
        elif visit.get("non_respondent") is not None and visit.get("non_respondent") == "1":
            exit_type = "non_respondent"
        elif visit.get("discharge_note") is not None and visit.get("discharge_note") == "yes":
            exit_type = "cured"
        return exit_type

    def journeyMapper(self, visits):
        journey = []
        current_journey = {"visits": [], "steps": []}

        for visit in visits:
            if visit:
                current_journey["instance_id"] = visit.get("instance_id", None)

                if visit["form_id"] == "Anthropometric visit child":
                    current_journey["date"] = visit.get("date", None)
                    current_journey["admission_criteria"] = self.admission_criteria(
                        visit
                    )
                    current_journey["admission_type"] = self.admission_type(visit)

                    if (
                        visit.get("programme") is not None
                        and visit.get("programme") != "NONE"
                        and visit.get("program") != "NONE"
                        and visit.get("program_two") != "NONE"
                    ):
                        current_journey["programme_type"] = self.program_mapper(visit)
                        current_journey["nutrition_programme"] = self.program_mapper(
                            visit
                        )
                    current_journey["org_unit_id"] = visit.get("org_unit_id")

                if visit["form_id"] == "child_antropometric_followUp_tsfp":
                    current_journey["exit_type"] = self.exit_type(visit)

                if (
                    visit.get("weight_gain", None) is not None
                    and visit.get("weight_gain", None) > 0
                ):
                    current_journey["weight_gain"] = visit.get("weight_gain")

                if visit["form_id"] in [
                    "Anthropometric visit child",
                    "child_antropometric_followUp_tsfp",
                    "child_antropometric_followUp_otp",
                ]:
                    current_journey["visits"].append(visit)
                current_journey["steps"].append(visit)

        journey.append(current_journey)
        return journey

    def save_journey(self, beneficiary, record):
        journey = Journey()
        journey.beneficiary = beneficiary
        journey.programme_type = "U5"
        journey.admission_criteria = record["admission_criteria"]
        journey.admission_type = record.get("admission_type", None)
        journey.nutrition_programme = record["nutrition_programme"]
        journey.weight_gain = record.get("weight_gain", 0)
        journey.exit_type = record.get("exit_type", None)
        journey.instance_id = record.get("instance_id", None)
        journey.save()

        return journey

    def save_visit(self, visits, journey):
        saved_visits = []
        visit_number = 0
        for current_visit in visits:
            visit = Visit()
            visit.date = current_visit["date"]
            visit.number = visit_number
            visit.journey = journey
            orgUnit = OrgUnit.objects.get(id=current_visit["org_unit_id"])
            visit.org_unit = orgUnit
            visit.instance_id = current_visit.get("instance_id", None)
            saved_visits.append(visit)
            visit.save()
            visit_number += 1

        return saved_visits

    def get_admission_steps(self, steps):
        step_visits = []
        for step in range(0, len(steps), 4):
            step_visits.append(steps[step : step + 4])
        return step_visits

    def group_followup_steps(self, steps, admission):
        steps.pop(0)
        followUpVisits = []
        for sub_steps in steps:
            for step in sub_steps:
                followUpVisits.append(step)
        followUp_steps = []
        for i in range(0, len(followUpVisits), 3):
            followUp_steps.append(followUpVisits[i : i + 3])
        followUp_steps.insert(0, admission)
        return followUp_steps

    def map_assistance_step(self, step, given_assistance):
        if step.get("_net") == "Yes" or step.get("_net") == "yes":
            given_assistance.append("Mosquito Net")

        if step.get("_soap") == "Yes" or step.get("_soap") == "yes":
            given_assistance.append("Soap")

        if step.get("ors_given") == "Yes" or step.get("ors_given") == "yes":
            given_assistance.append("ORS")

        if step.get("medicine_given") is not None:
            given_assistance.append(step.get("medicine_given"))

        if step.get("medication") is not None:
            given_assistance.append(step.get("medication"))

        if step.get("medicine_given_2") is not None:
            given_assistance.append(step.get("medicine_given_2"))

        if step.get("medication_2") is not None:
            given_assistance.append(step.get("medication_2"))
        return given_assistance

    def assistance_to_step(self, assistance, quantity, visit, instance_id):
        current_step = Step()
        current_step.assistance_type = assistance
        current_step.quantity_given = quantity
        current_step.visit = visit
        current_step.instance_id = instance_id
        return current_step

    def save_steps(self, visits, steps):
        all_steps = []
        for visit in visits:
            for step in steps:
                given_assistance = []
                for sub_step in step:
                    current_step = None
                    quantity = 1
                    given_assistance = self.map_assistance_step(
                        sub_step, given_assistance
                    )

                    if sub_step.get("_counselling") is not None:
                        given_assistance.append(sub_step.get("_counselling"))
                        if (
                            sub_step.get("_csb_packets") is not None
                            and sub_step.get("_csb_packets") != ""
                        ):
                            quantity = sub_step.get("_csb_packets")

                    for assistance in given_assistance:
                        current_step = self.assistance_to_step(
                            assistance, quantity, visit, sub_step["instance_id"]
                        )
                        current_step.save()
                        all_steps.append(current_step)
        return all_steps

    def handle(self, *args, **options):
        steps_id = self.steps_to_exclude()
        updated_at = datetime.date(2023,7,10)
        beneficiaries = (
            Instance.objects.filter(entity__entity_type__id=7)
            .filter(json__isnull=False)
            .filter(form__isnull=False)
            .filter(updated_at__gte=updated_at)
            .exclude(id__in=steps_id)
            .values(
                "id",
                "created_at",
                "entity_id",
                "json",
                "deleted",
                "form__form_id",
                "org_unit_id",
                "updated_at",
                "form",
            )
            .order_by("created_at")
        )

        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        instances = self.group_visit_by_entity(entities)
        existing_beneficiaries = self.existing_beneficiaries()

        for index, instance in enumerate(instances):
            print(
                f"---------------------------------------- Beneficiary N° {(index+1)} -----------------------------------"
            )
            last_name = instance.get("last_name", "")
            first_name = instance.get("first_name", "")
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries:
                beneficiary.gender = instance["gender"]
                beneficiary.birth_date = instance["birth_date"]
                beneficiary.entity_id = instance["entity_id"]
                beneficiary.save()
                print(f"Created new beneficiary {last_name} {first_name}")
            else:
                beneficiary = Beneficiary.objects.get(entity_id=instance["entity_id"])
            instance["journey"] = self.journeyMapper(instance["visits"])

            print(
                "Retreiving journey linked to beneficiary ", f"{last_name} {first_name}"
            )
            for journey_instance in instance["journey"]:
                if (
                    len(journey_instance["visits"]) > 0
                    and journey_instance.get("nutrition_programme") is not None
                ):

                    journey = self.save_journey(beneficiary, journey_instance)
                    visits = self.save_visit(journey_instance["visits"], journey)
                    print(f"Inserted {len(visits)} Visits")
                    grouped_steps = self.get_admission_steps(journey_instance["steps"])
                    admission_step = grouped_steps[0]

                    followUpVisits = self.group_followup_steps(
                        grouped_steps, admission_step
                    )

                    steps = self.save_steps(visits, followUpVisits)
                    print(f"Inserted {len(steps)} Steps")
                else:
                    print(f"No new journey for {last_name} {first_name}")
            print(
                f"---------------------------------------------------------------------------------------------\n\n"
            )
