from ...models import *
from django.core.management.base import BaseCommand
from itertools import groupby
from operator import itemgetter
from ...common import ETL
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class Under5:
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
                instances[i]["program"] = ETL().program_mapper(current_record)
                if current_record is not None and current_record != None:
                    if current_record.get("actual_birthday__date__") is not None:
                        birth_date = current_record.get("actual_birthday__date__", None)
                        instances[i]["birth_date"] = birth_date[:10]
                    if current_record.get("gender") is not None:
                        gender = current_record.get("gender", "")
                        if current_record.get("gender") == "F":
                            gender = "Female"
                        elif current_record.get("gender") == "M":
                            gender = "Male"
                        instances[i]["gender"] = gender
                    if current_record.get("last_name") is not None:
                        instances[i]["last_name"] = current_record.get("last_name", "")

                    if current_record.get("first_name") is not None:
                        instances[i]["first_name"] = current_record.get("first_name", "")

                    form_id = visit.get("form__form_id")
                    current_record["org_unit_id"] = visit.get("org_unit_id", None)
                    current_weight = current_record.get("weight_kgs", None)

                    if form_id == "Anthropometric visit child":
                        initial_weight = current_weight
                        instances[i]["initial_weight"] = initial_weight

                    current_record["weight_gain"] = self.compute_gained_weight(initial_weight, current_weight)
                    if visit.get("created_at"):
                        current_record["date"] = visit.get("created_at").strftime("%Y-%m-%d")

                    current_record["instance_id"] = visit["id"]
                    current_record["form_id"] = form_id
                    instances[i]["visits"].append(current_record)

            i = i + 1
        return list(
            filter(
                lambda instance: (instance.get("visits") and len(instance.get("visits")) > 0)
                and instance.get("gender") is not None
                and instance.get("birth_date") is not None
                and instance.get("birth_date") != ""
                and instance.get("gender") != "",
                instances,
            )
        )

    def journeyMapper(self, visits):
        journey = []
        current_journey = {"visits": [], "steps": []}

        for visit in visits:
            if visit:
                if visit.get("weight_gain", None) is not None and visit.get("weight_gain", None) > 0:
                    current_journey["weight_gain"] = visit.get("weight_gain")

                if visit["form_id"] == "Anthropometric visit child":
                    current_journey["nutrition_programme"] = ETL().program_mapper(visit)
                anthropometric_visit_forms = [
                    "child_antropometric_followUp_tsfp",
                    "child_antropometric_followUp_otp",
                ]

                current_journey = ETL().journey_Formatter(
                    visit,
                    "Anthropometric visit child",
                    anthropometric_visit_forms,
                    current_journey,
                )

                if visit["form_id"] in ["child_assistance_follow_up", "child_assistance_admission"]:
                    next_visit_date = ""
                    next_visit_days = 0
                    nextSecondVisitDate = ""

                    if (
                        visit.get("next_visit__date__", None) is not None
                        and visit.get("next_visit__date__", None) != ""
                    ):
                        next_visit_date = visit.get("next_visit__date__", None)
                    elif (
                        visit.get("new_next_visit__date__", None) is not None
                        and visit.get("new_next_visit__date__", None) != ""
                    ):
                        next_visit_date = visit.get("new_next_visit__date__", None)

                    if visit.get("next_visit_days", None) is not None and visit.get("next_visit_days", None) != "":
                        next_visit_days = visit.get("next_visit_days", None)
                    elif (
                        visit.get("number_of_days__int__", None) is not None
                        and visit.get("number_of_days__int__", None) != ""
                    ):
                        next_visit_days = visit.get("number_of_days__int__", None)
                    elif (
                        visit.get("OTP_next_visit", None) is not None
                        and visit.get("OTP_next_visit", None) != ""
                        and visit.get("OTP_next_visit") != "--"
                    ):
                        next_visit_days = visit.get("OTP_next_visit", None)
                    elif (
                        visit.get("TSFP_next_visit", None) is not None
                        and visit.get("TSFP_next_visit", None) != ""
                        and visit.get("TSFP_next_visit") != "--"
                    ):
                        next_visit_days = visit.get("TSFP_next_visit", None)

                    if next_visit_date is not None and next_visit_date != "":
                        nextSecondVisitDate = datetime.strptime(next_visit_date[:10], "%Y-%m-%d").date() + timedelta(
                            days=int(next_visit_days)
                        )

                    missed_followup_visit = ETL().missed_followup_visit(
                        visits, anthropometric_visit_forms, next_visit_date[:10], nextSecondVisitDate, next_visit_days
                    )
                    if current_journey.get("exit_type", None) is None and missed_followup_visit > 1:
                        current_journey["exit_type"] = "defaulter"

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
        journey.exit_type = record.get("exit_type", None)
        journey.instance_id = record.get("instance_id", None)
        journey.weight_gain = record.get("weight_gain", 0)
        journey.save()
        return journey

    def run(self):
        beneficiaries = ETL("Child Under 5").retrieve_entities()
        logger.info(f"Instances linked to Child Under 5 program: {beneficiaries.count()}")
        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        existing_beneficiaries = ETL().existing_beneficiaries()
        instances = self.group_visit_by_entity(entities)

        for index, instance in enumerate(instances):
            logger.info(
                f"---------------------------------------- Beneficiary N° {(index+1)} {instance['entity_id']}-----------------------------------"
            )
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries:
                beneficiary.gender = instance["gender"]
                beneficiary.birth_date = instance["birth_date"]
                beneficiary.entity_id = instance["entity_id"]
                beneficiary.save()
                logger.info(f"Created new beneficiary")
            else:
                beneficiary = Beneficiary.objects.get(entity_id=instance["entity_id"])
            instance["journey"] = self.journeyMapper(instance["visits"])
            logger.info("Retrieving journey linked to beneficiary")

            for journey_instance in instance["journey"]:
                if len(journey_instance["visits"]) > 0 and journey_instance.get("nutrition_programme") is not None:
                    if journey_instance.get("admission_criteria") is not None:
                        journey = self.save_journey(beneficiary, journey_instance)
                        visits = ETL().save_visit(journey_instance["visits"], journey)
                        logger.info(f"Inserted {len(visits)} Visits")
                        grouped_steps = ETL().get_admission_steps(journey_instance["steps"])
                        admission_step = grouped_steps[0]

                        followUpVisits = ETL().group_followup_steps(grouped_steps, admission_step)

                        steps = ETL().save_steps(visits, followUpVisits)
                        logger.info(f"Inserted {len(steps)} Steps")
                else:
                    logger.info("No new journey")
            logger.info(
                f"---------------------------------------------------------------------------------------------\n\n"
            )
