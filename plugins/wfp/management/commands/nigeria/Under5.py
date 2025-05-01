import logging

from itertools import groupby
from operator import itemgetter

from iaso.models import *
from plugins.wfp.common import ETL
from plugins.wfp.models import *


logger = logging.getLogger(__name__)


class NG_Under5:
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

                    if form_id in [
                        "anthropometric_admission",
                        "Anthropometric visit child",
                        "anthropometric_admission_otp",
                    ]:
                        initial_weight = current_weight
                        instances[i]["initial_weight"] = initial_weight
                        visit_date = visit.get(
                            "source_created_at", visit.get("_visit_date", visit.get("visit_date", current_date))
                        )
                        initial_date = visit_date

                    if initial_date is not None:
                        duration = (current_date - initial_date).days
                        current_record["start_date"] = initial_date.strftime("%Y-%m-%d")

                    weight = ETL().compute_gained_weight(initial_weight, current_weight, duration)
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

    def run(self, type):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        beneficiaries = entity_type.retrieve_entities()

        logger.info(f"Instances linked to Child Under 5 program: {beneficiaries.count()} for {account}")
        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        existing_beneficiaries = ETL().existing_beneficiaries()
        instances = self.group_visit_by_entity(entities)

        # Cleaning monthly statistics then update the table with fresh data
        MonthlyStatistics.objects.all().filter(account=account, programme_type="U5").delete()

        for index, instance in enumerate(instances):
            logger.info(
                f"---------------------------------------- Beneficiary N° {(index + 1)} {instance['entity_id']}-----------------------------------"
            )
            instance["journey"] = self.journeyMapper(
                instance["visits"],
                ["Anthropometric visit child", "anthropometric_admission", "anthropometric_admission_otp"],
            )
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries and len(instance["journey"][0]["visits"]) > 0:
                beneficiary.gender = instance["gender"]
                beneficiary.birth_date = instance["birth_date"]
                beneficiary.entity_id = instance["entity_id"]
                beneficiary.account = account
                beneficiary.save()
                logger.info("Created new beneficiary")
            else:
                beneficiary = Beneficiary.objects.filter(entity_id=instance["entity_id"]).first()

            logger.info("Retrieving journey linked to beneficiary")

            for journey_instance in instance["journey"]:
                if journey_instance.get("nutrition_programme") is not None and len(journey_instance["visits"]) > 0:
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
                "---------------------------------------------------------------------------------------------\n\n"
            )

    def journeyMapper(self, visits, admission_form):
        current_journey = {"visits": [], "steps": []}
        anthropometric_visit_forms = [
            "anthropometric_second_visit_tsfp",
            "anthropometric_second_visit_otp",
        ]
        visit_nutrition_program = [visit for visit in visits if visit["form_id"] in admission_form]

        if len(visit_nutrition_program) > 0:
            nutrition_programme = ETL().program_mapper(visit_nutrition_program[0])
            if nutrition_programme in ["TSFP_MAM", "TSFP-MAM", "TSFP"]:
                current_journey["nutrition_programme"] = "TSFP"
            elif nutrition_programme in ["OTP_SAM", "OTP-SAM", "OTP"]:
                current_journey["nutrition_programme"] = "OTP"
            else:
                current_journey["nutrition_programme"] = nutrition_programme
        journey = ETL().entity_journey_mapper(visits, anthropometric_visit_forms, admission_form, current_journey)
        return journey

    def save_journey(self, beneficiary, record):
        journey = Journey()
        journey.initial_weight = record.get("initial_weight", None)

        # Calculate the weight gain only for exited cases!
        if record.get("exit_type", None) is not None and record.get("exit_type", None) != "":
            journey.discharge_weight = record.get("discharge_weight", None)
            journey.weight_gain = record.get("weight_gain", 0)
            journey.weight_loss = record.get("weight_loss", 0)
        return ETL().save_entity_journey(journey, beneficiary, record, "U5")
