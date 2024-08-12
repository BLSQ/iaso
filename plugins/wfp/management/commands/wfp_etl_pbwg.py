from ...models import *
from django.core.management.base import BaseCommand
from itertools import groupby
from operator import itemgetter
from ...common import ETL
import logging

logger = logging.getLogger(__name__)


class PBWG:
    def run(self):
        beneficiaries = ETL("PBWG").retrieve_entities()
        logger.info(f"Instances linked to PBWG program: {beneficiaries.count()}")
        entities = sorted(list(beneficiaries), key=itemgetter("entity_id"))
        existing_beneficiaries = ETL().existing_beneficiaries()
        instances = self.group_visit_by_entity(entities)

        for index, instance in enumerate(instances):
            logger.info(
                f"---------------------------------------- Beneficiary N° {(index+1)} {instance['entity_id']}-----------------------------------"
            )
            beneficiary = Beneficiary()
            if instance["entity_id"] not in existing_beneficiaries:
                beneficiary.gender = ""
                beneficiary.entity_id = instance["entity_id"]
                if instance.get("birth_date") is not None:
                    beneficiary.birth_date = instance["birth_date"]
                    beneficiary.save()
                    logger.info(f"Created new beneficiary")
            else:
                beneficiary = Beneficiary.objects.get(entity_id=instance["entity_id"])

            instance["journey"] = self.journeyMapper(instance["visits"])

            logger.info("Retrieving journey linked to beneficiary")

            for journey_instance in instance["journey"]:
                if len(journey_instance["visits"]) > 0 and journey_instance.get("nutrition_programme") is not None:
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

    def save_journey(self, beneficiary, record):
        journey = Journey()
        journey.beneficiary = beneficiary
        journey.programme_type = "PLW"
        journey.admission_criteria = record["admission_criteria"]
        journey.admission_type = record.get("admission_type", None)
        journey.nutrition_programme = record["nutrition_programme"]
        journey.exit_type = record.get("exit_type", None)
        journey.instance_id = record.get("instance_id", None)
        journey.start_date = record.get("start_date", None)
        journey.end_date = record.get("end_date", None)

        if record.get("exit_type", None) is not None and record.get("exit_type", None) != "":
            journey.duration = record.get("duration", None)
            journey.end_date = record.get("end_date", None)
        journey.save()

        return journey

    def journeyMapper(self, visits):
        journey = []
        current_journey = {"visits": [], "steps": []}
        anthropometric_visit_forms = [
            "wfp_coda_pbwg_luctating_followup_anthro",
            "wfp_coda_pbwg_followup_anthro",
        ]

        for index, visit in enumerate(visits):
            if visit:
                if visit.get("duration", None) is not None and visit.get("duration", None) != "":
                    current_journey["duration"] = visit.get("duration")

                if visit["form_id"] == "wfp_coda_pbwg_registration":
                    current_journey["nutrition_programme"] = visit.get("physiology_status", None)

                current_journey = ETL().journey_Formatter(
                    visit, "wfp_coda_pbwg_anthropometric", anthropometric_visit_forms, current_journey, visits, index
                )
                current_journey["steps"].append(visit)
        journey.append(current_journey)
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
                    if current_record.get("actual_birthday__date__") is not None:
                        birth_date = current_record.get("actual_birthday__date__", None)
                        instances[i]["birth_date"] = birth_date[:10]

                    if current_record.get("actual_birthday") is not None:
                        birth_date = current_record.get("actual_birthday", None)
                        instances[i]["birth_date"] = birth_date[:10]

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
        return instances
