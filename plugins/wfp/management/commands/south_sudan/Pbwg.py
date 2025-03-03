import logging

from itertools import groupby
from operator import itemgetter

from plugins.wfp.common import ETL
from plugins.wfp.models import *


logger = logging.getLogger(__name__)


class PBWG:
    def run(self, type):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        beneficiaries = entity_type.retrieve_entities()
        logger.info(f"Instances linked to PBWG program: {beneficiaries.count()} for {account}")
        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        existing_beneficiaries = ETL().existing_beneficiaries()
        instances = self.group_visit_by_entity(entities)

        # Cleaning monthly statistics then update the table with fresh data
        MonthlyStatistics.objects.all().filter(account=account, programme_type="PLW").delete()

        for index, instance in enumerate(instances):
            logger.info(
                f"---------------------------------------- Beneficiary N° {(index + 1)} {instance['entity_id']}-----------------------------------"
            )
            instance["journey"] = self.journeyMapper(instance["visits"], ["wfp_coda_pbwg_anthropometric"])
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries and len(instance["journey"][0]["visits"]) > 0:
                beneficiary.gender = ""
                beneficiary.entity_id = instance["entity_id"]
                beneficiary.account = account
                if instance.get("birth_date") is not None:
                    beneficiary.birth_date = instance["birth_date"]
                    beneficiary.save()
                    logger.info("Created new beneficiary")
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
                "---------------------------------------------------------------------------------------------\n\n"
            )

    def save_journey(self, beneficiary, record):
        journey = Journey()

        if record.get("exit_type", None) is not None and record.get("exit_type", None) != "":
            journey.duration = record.get("duration", None)
            journey.end_date = record.get("end_date", None)

        return ETL().save_entity_journey(journey, beneficiary, record, "PLW")

    def journeyMapper(self, visits, admission_form):
        current_journey = {"visits": [], "steps": []}
        anthropometric_visit_forms = [
            "wfp_coda_pbwg_luctating_followup_anthro",
            "wfp_coda_pbwg_followup_anthro",
        ]

        visit_nutrition_program = [visit for visit in visits if visit["form_id"] == "wfp_coda_pbwg_registration"][0]
        if len(visit_nutrition_program) > 0:
            current_journey["nutrition_programme"] = visit_nutrition_program.get("physiology_status", None)
        journey = ETL().entity_journey_mapper(visits, anthropometric_visit_forms, admission_form, current_journey)
        return journey

    def group_visit_by_entity(self, entities):
        instances = []
        i = 0
        instances_by_entity = groupby(list(entities), key=itemgetter("entity_id"))
        initial_date = None
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
                        current_record.get("actual_birthday") is not None
                        and current_record.get("actual_birthday", None) != ""
                    ):
                        birth_date = current_record.get("actual_birthday", None)
                        instances[i]["birth_date"] = birth_date[:10]
                    elif (
                        current_record.get("age_entry", None) is not None
                        and current_record.get("age_entry", None) != ""
                    ):
                        calculated_date = ETL().calculate_birth_date(current_record)
                        instances[i]["birth_date"] = calculated_date

                    if current_record.get("last_name") is not None:
                        instances[i]["last_name"] = current_record.get("last_name", "")

                    if current_record.get("first_name") is not None:
                        instances[i]["first_name"] = current_record.get("first_name", "")

                    form_id = visit.get("form__form_id")
                    current_record["org_unit_id"] = visit.get("org_unit_id", None)

                    visit_date = visit.get("source_created_at", visit.get("_visit_date", visit.get("visit_date", None)))
                    if form_id == "wfp_coda_pbwg_anthropometric":
                        initial_date = visit_date

                    if initial_date is not None:
                        current_record["date"] = visit_date.strftime("%Y-%m-%d")
                        current_record["start_date"] = initial_date.strftime("%Y-%m-%d")
                        duration = (visit_date - initial_date).days

                    current_record["end_date"] = visit_date.strftime("%Y-%m-%d")
                    current_record["duration"] = duration

                    current_record["instance_id"] = visit["id"]
                    current_record["form_id"] = form_id
                    instances[i]["visits"].append(current_record)
            i = i + 1
        return list(
            filter(
                lambda instance: (
                    instance.get("visits")
                    and len(instance.get("visits")) > 1
                    and instance.get("birth_date") is not None
                    and instance.get("birth_date") != ""
                ),
                instances,
            )
        )
