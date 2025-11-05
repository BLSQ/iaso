import logging

from itertools import groupby
from operator import itemgetter

from plugins.wfp.common import ETL
from plugins.wfp.models import *


logger = logging.getLogger(__name__)

ADMISSION_ANTHROPOMETRIC_FORMS = [
    "Anthropometric visit child",
    "Anthropometric visit child_2",
    "Anthropometric visit child_U6",
]
ANTHROPOMETRIC_FOLLOWUP_FORMS = [
    "child_antropometric_followUp_tsfp",
    "child_antropometric_followUp_otp",
    "child_antropometric_followUp_tsfp_2",
    "child_antropometric_followUp_otp_2",
    "antropometric_followUp_otp_u6",
]


class Under5:
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
                    if current_record.get("guidelines"):
                        instances[i]["guidelines"] = current_record.get("guidelines")
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

                    if current_record.get("weight_kgs", None) is not None and current_record.get("weight_kgs") != "":
                        current_weight = current_record.get("weight_kgs", None)
                    elif current_record.get("weight_kgs") == "":
                        current_weight = 0
                    elif current_record.get("previous_weight_kgs__decimal__", None) is not None:
                        current_weight = current_record.get("previous_weight_kgs__decimal__", None)
                    current_date = visit.get(
                        "source_created_at",
                        visit.get(
                            "_visit_date",
                            visit.get(
                                "visit_date",
                                visit.get("_new_discharged_today", current_date),
                            ),
                        ),
                    )

                    if form_id in ADMISSION_ANTHROPOMETRIC_FORMS:
                        initial_weight = current_weight
                        instances[i]["initial_weight"] = initial_weight
                        visit_date = visit.get(
                            "source_created_at",
                            visit.get("_visit_date", visit.get("visit_date", current_date)),
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
                    current_record["muac_size"] = visit.get("muac")

                    visit_date = visit.get(
                        "source_created_at",
                        visit.get("_visit_date", visit.get("visit_date", current_date)),
                    )
                    if visit_date:
                        current_record["date"] = visit_date.strftime("%Y-%m-%d")
                        current_record["muac_size"] = current_record.get("muac")
                        current_record["whz_color"] = current_record.get(
                            "_Xwhz_color", current_record.get("_Xfinal_color_result")
                        )

                    current_record["instance_id"] = visit["id"]
                    current_record["form_id"] = form_id
                    instances[i]["visits"].append(current_record)
            i = i + 1
        return list(
            filter(
                lambda instance: (
                    instance.get("visits")
                    and instance.get("gender") is not None
                    and instance.get("gender") != ""
                    and instance.get("birth_date") is not None
                    and instance.get("birth_date") != ""
                    and len(ETL().admission_forms(instance.get("visits"), ADMISSION_ANTHROPOMETRIC_FORMS)) > 0
                ),
                instances,
            )
        )

    def journeyMapper(self, visits, admission_form):
        current_journey = {"visits": [], "steps": []}
        visit_nutrition_program = [visit for visit in visits if visit["form_id"] in admission_form]
        if len(visit_nutrition_program) > 0:
            current_journey["nutrition_programme"] = ETL().program_mapper(visit_nutrition_program[0])
        journey = ETL().entity_journey_mapper(visits, ANTHROPOMETRIC_FOLLOWUP_FORMS, admission_form, current_journey)
        return journey

    def save_journey(self, beneficiary, record):
        journey = Journey()
        journey.initial_weight = record.get("initial_weight", None)

        # Calculate the weight gain only for cured and Transfer from OTP to TSFP cases!
        if (
            record.get("exit_type", None) is not None
            and record.get("exit_type", None) != ""
            and record.get("exit_type", None) in ["cured", "transfer_to_tsfp"]
        ):
            journey.discharge_weight = record.get("discharge_weight", None)
            journey.weight_gain = record.get("weight_gain", 0)
            journey.weight_loss = record.get("weight_loss", 0)

        return ETL().save_entity_journey(journey, beneficiary, record, "U5")

    def run(self, type, updated_beneficiaries):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        beneficiaries = entity_type.retrieve_entities(updated_beneficiaries)
        pages = beneficiaries.page_range

        logger.info(f"Instances linked to Child Under 5 program: {beneficiaries.count} for {account}")

        for page in pages:
            entities = sorted(
                list(beneficiaries.page(page).object_list),
                key=itemgetter("entity_id"),
            )
            existing_beneficiaries = ETL().existing_beneficiaries()
            instances = self.group_visit_by_entity(entities)
            all_steps = []
            all_visits = []
            all_journeys = []
            all_beneficiaries = []
            for index, instance in enumerate(instances):
                logger.info(
                    f"---------------------------------------- Beneficiary N° {(index + 1)} {instance['entity_id']}-----------------------------------"
                )
                instance["journey"] = self.journeyMapper(
                    instance["visits"],
                    ADMISSION_ANTHROPOMETRIC_FORMS,
                )
                beneficiary = Beneficiary()
                if (
                    instance["entity_id"] not in existing_beneficiaries
                    and len(instance["journey"][0]["visits"]) > 0
                    and instance["journey"][0].get("nutrition_programme") is not None
                ):
                    beneficiary.gender = instance["gender"]
                    beneficiary.birth_date = instance["birth_date"]
                    beneficiary.entity_id = instance["entity_id"]
                    beneficiary.account = account
                    beneficiary.guidelines = instance.get("guidelines", "OLD")
                    all_beneficiaries.append(beneficiary)
                    logger.info("Created new beneficiary")
                else:
                    beneficiary = Beneficiary.objects.filter(entity_id=instance["entity_id"]).first()

                logger.info("Retrieving journey linked to beneficiary")
                if beneficiary is not None:
                    for journey_instance in instance["journey"]:
                        if len(journey_instance["visits"]) > 0:
                            journey = self.save_journey(beneficiary, journey_instance)
                            all_journeys.append(journey)
                            visits = ETL().save_visit(journey_instance["visits"], journey)
                            all_visits.extend(visits)
                            logger.info(f"Inserted {len(visits)} Visits")
                            grouped_steps = ETL().get_admission_steps(journey_instance["steps"])
                            admission_step = grouped_steps[0]

                            followUpVisits = ETL().group_followup_steps(grouped_steps, admission_step)
                            steps = ETL().save_steps(visits, followUpVisits)
                            all_steps.extend(steps)
                            logger.info(f"Inserted {len(steps)} Steps")
                        else:
                            logger.info("No new journey")
                    logger.info(
                        "---------------------------------------------------------------------------------------------\n\n"
                    )
            Beneficiary.objects.bulk_create(all_beneficiaries)
            Journey.objects.bulk_create(all_journeys)
            Visit.objects.bulk_create(all_visits)
            Step.objects.bulk_create(all_steps)
