from ...models import *
from django.core.management.base import BaseCommand
from itertools import groupby
from operator import itemgetter
from ...common import ETL
import logging

logger = logging.getLogger(__name__)


class Under5:
    def compute_gained_weight(self, initial_weight, current_weight, duration):
        weight_gain = 0
        weight_loss = 0

        weight_difference = 0
        if initial_weight is not None and current_weight is not None and current_weight != "":
            initial_weight = float(initial_weight)
            current_weight = float(current_weight)
            weight_difference = round(((current_weight * 1000) - (initial_weight * 1000)), 4)
            if weight_difference >= 0:
                if duration == 0:
                    weight_gain = 0
                elif duration > 0 and current_weight > 0 and initial_weight > 0:
                    weight_gain = round((weight_difference / (initial_weight * float(duration))), 4)
            elif weight_difference < 0:
                weight_loss = abs(weight_difference)
        return {
            "initial_weight": float(initial_weight) if initial_weight is not None else initial_weight,
            "discharge_weight": (
                float(current_weight) if current_weight is not None and current_weight != "" else current_weight
            ),
            "weight_difference": weight_difference,
            "weight_gain": weight_gain,
            "weight_loss": weight_loss / 1000,
        }

    def group_visit_by_entity(self, entities):
        instances = []
        i = 0
        instances_by_entity = groupby(list(entities), key=itemgetter("entity_id"))
        initial_weight = None
        current_weight = None
        initial_date = None
        current_date = None
        duration = 0
        for entity_id, entity in instances_by_entity:
            instances.append({"entity_id": entity_id, "visits": [], "journey": []})
            for visit in entity:
                current_record = visit.get("json", None)
                instances[i]["program"] = ETL().program_mapper(current_record)
                if current_record is not None and current_record != None:
                    if (
                        current_record.get("actual_birthday__date__") is not None
                        and current_record.get("actual_birthday__date__", None) != ""
                    ):
                        birth_date = current_record.get("actual_birthday__date__", None)
                        instances[i]["birth_date"] = birth_date[:10]
                    elif (
                        current_record.get("age_entry", None) is not None
                        and current_record.get("age_entry", None) != ""
                    ):
                        calculated_date = ETL().calculate_birth_date(current_record)
                        instances[i]["birth_date"] = calculated_date
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

                    if current_record.get("weight_kgs", None) is not None:
                        current_weight = current_record.get("weight_kgs", None)
                    elif current_record.get("previous_weight_kgs__decimal__", None) is not None:
                        current_weight = current_record.get("previous_weight_kgs__decimal__", None)
                    current_date = visit.get(
                        "source_created_at",
                        visit.get(
                            "_visit_date", visit.get("visit_date", visit.get("_new_discharged_today", current_date))
                        ),
                    )

                    if form_id == "Anthropometric visit child":
                        initial_weight = current_weight
                        instances[i]["initial_weight"] = initial_weight
                        visit_date = visit.get(
                            "source_created_at", visit.get("_visit_date", visit.get("visit_date", current_date))
                        )
                        initial_date = visit_date

                    if initial_date is not None:
                        duration = (current_date - initial_date).days
                        current_record["start_date"] = initial_date.strftime("%Y-%m-%d")

                    weight = self.compute_gained_weight(initial_weight, current_weight, duration)
                    current_record["end_date"] = current_date.strftime("%Y-%m-%d")
                    current_record["weight_gain"] = weight["weight_gain"]
                    current_record["weight_loss"] = weight["weight_loss"]
                    current_record["initial_weight"] = weight["initial_weight"]
                    current_record["discharge_weight"] = weight["discharge_weight"]
                    current_record["weight_difference"] = weight["weight_difference"]
                    current_record["duration"] = duration

                    visit_date = visit.get(
                        "source_created_at", visit.get("_visit_date", visit.get("visit_date", current_date))
                    )
                    if visit_date:
                        current_record["date"] = visit_date.strftime("%Y-%m-%d")

                    current_record["instance_id"] = visit["id"]
                    current_record["form_id"] = form_id
                    instances[i]["visits"].append(current_record)
            i = i + 1
        return list(
            filter(
                lambda instance: (
                    instance.get("visits")
                    and len(instance.get("visits")) > 1
                    and instance.get("gender") is not None
                    and instance.get("gender") != ""
                    and instance.get("birth_date") is not None
                    and instance.get("birth_date") != ""
                ),
                instances,
            )
        )

    def journeyMapper(self, visits):
        current_journey = {"visits": [], "steps": []}
        anthropometric_visit_forms = [
            "child_antropometric_followUp_tsfp",
            "child_antropometric_followUp_otp",
        ]
        admission_form = "Anthropometric visit child"
        visit_nutrition_program = [visit for visit in visits if visit["form_id"] == admission_form]
        if len(visit_nutrition_program) > 0:
            current_journey["nutrition_programme"] = ETL().program_mapper(visit_nutrition_program[0])
        journey = ETL().entity_journey_mapper(visits, anthropometric_visit_forms, admission_form, current_journey)
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
        journey.initial_weight = record.get("initial_weight", None)
        journey.start_date = record.get("start_date", None)
        journey.duration = record.get("duration", None)
        journey.end_date = record.get("end_date", None)

        # Calculate the weight gain only for cured and Transfer from OTP to TSFP cases!
        if (
            record.get("exit_type", None) is not None
            and record.get("exit_type", None) != ""
            and record.get("exit_type", None) in ["cured", "transfer_to_tsfp"]
        ):
            journey.discharge_weight = record.get("discharge_weight", None)
            journey.weight_gain = record.get("weight_gain", 0)
            journey.weight_loss = record.get("weight_loss", 0)
        journey.save()
        return journey

    def run(self):
        entity_type = ETL("child_under_5_1")
        account = entity_type.account_related_to_entity_type()
        beneficiaries = entity_type.retrieve_entities()
        logger.info(f"Instances linked to Child Under 5 program: {beneficiaries.count()}")
        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        existing_beneficiaries = ETL().existing_beneficiaries()
        instances = self.group_visit_by_entity(entities)

        for index, instance in enumerate(instances):
            logger.info(
                f"---------------------------------------- Beneficiary N° {(index+1)} {instance['entity_id']}-----------------------------------"
            )
            instance["journey"] = self.journeyMapper(instance["visits"])
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries and len(instance["journey"][0]["visits"]) > 0:
                beneficiary.gender = instance["gender"]
                beneficiary.birth_date = instance["birth_date"]
                beneficiary.entity_id = instance["entity_id"]
                beneficiary.account = account
                beneficiary.save()
                logger.info(f"Created new beneficiary")
            else:
                beneficiary = Beneficiary.objects.filter(entity_id=instance["entity_id"]).first()

            logger.info("Retrieving journey linked to beneficiary")

            for journey_instance in instance["journey"]:
                if len(journey_instance["visits"]) > 0:
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
