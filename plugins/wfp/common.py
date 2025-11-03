import json
import logging

from datetime import date, datetime, timedelta
from itertools import groupby
from operator import itemgetter

from dateutil.relativedelta import *
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Case, CharField, F, IntegerField, Q, Sum, Value, When
from django.db.models.functions import Concat, Extract

from iaso.models import *
from iaso.models.base import Instance
from plugins.wfp.aggregate_journeys import AggregatedJourney

from .models import *


logger = logging.getLogger(__name__)


class ETL:
    def __init__(self, types=None):
        self.types = types

    def delete_beneficiaries(self):
        beneficiary = Beneficiary.objects.all().delete()
        MonthlyStatistics.objects.all().delete()

        print("EXISTING BENEFICIARY DELETED", beneficiary[1]["wfp.Beneficiary"])
        print("EXISTING STEPS DELETED", beneficiary[1]["wfp.Step"])
        print("EXISTING VISITS DELETED", beneficiary[1]["wfp.Visit"])
        print("EXISTING JOURNEY DELETED", beneficiary[1]["wfp.Journey"])

    def account_related_to_entity_type(self):
        entity_type = EntityType.objects.prefetch_related("account").filter(code__in=self.types).first()
        account = entity_type.account
        return account

    def get_updated_entity_ids(self, updated_at=None):
        entities = Instance.objects.filter(entity__entity_type__code__in=self.types)
        if updated_at is not None:
            entities = entities.filter(updated_at__gte=updated_at)
        entities = entities.values("entity_id").distinct()
        beneficiary_ids = list(map(lambda entity: entity["entity_id"], entities))
        return list(set(beneficiary_ids))

    def retrieve_entities(self, entity_ids):
        steps_id = ETL().steps_to_exclude()
        beneficiaries = (
            Instance.objects.filter(entity__entity_type__code__in=self.types)
            .filter(entity__id__in=entity_ids)
            .filter(json__isnull=False)
            .filter(form__isnull=False)
            .exclude(deleted=True)
            .exclude(entity__deleted_at__isnull=False)
            .exclude(id__in=steps_id)
            .select_related("entity")
            .prefetch_related("entity", "form", "org_unit")
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
                "entity__deleted_at",
                "source_created_at",
            )
            .order_by(
                "entity_id",
                "source_created_at",
            )
        )
        return Paginator(beneficiaries, 5000)

    def existing_beneficiaries(self):
        existing_beneficiaries = Beneficiary.objects.exclude(entity_id=None).values("entity_id")
        return list(map(lambda x: x["entity_id"], existing_beneficiaries))

    def instances_to_exclude(self):
        journey = Journey.objects.values("instance_id").distinct()
        return list(map(lambda x: x["instance_id"], journey))

    def visits_to_exclude(self):
        instances_id = self.instances_to_exclude()
        visits = Visit.objects.values("instance_id").distinct().exclude(instance_id__in=instances_id)
        visits_id = list(map(lambda x: x["instance_id"], visits))
        [instances_id.append(visit_id) for visit_id in visits_id if visit_id not in instances_id]
        return instances_id

    def steps_to_exclude(self):
        instances_id = self.visits_to_exclude()
        steps = Step.objects.values("instance_id").distinct().exclude(instance_id__in=instances_id)
        steps_id = list(map(lambda x: x["instance_id"], steps))
        [instances_id.append(step_id) for step_id in steps_id if step_id not in instances_id]
        return instances_id

    def program_mapper(self, visit):
        program = None
        if visit:
            if visit.get("programme") is not None:
                if visit.get("programme") != "NONE":
                    program = visit.get("programme")
                else:
                    program = ""
            elif visit.get("_programme") is not None:
                if visit.get("_programme") != "NONE":
                    program = visit.get("_programme")
                else:
                    program = ""
            elif visit.get("program") is not None:
                if visit.get("program") == "NONE":
                    if visit.get("previous_discharge_program", None) is not None:
                        program = visit.get("previous_discharge_program", None)
                    elif visit.get("program") != "NONE":
                        program = visit.get("program")
                    else:
                        program = ""
                else:
                    program = visit.get("program")
            elif visit.get("program_two") is not None and visit.get("program_two") != "NONE":
                program = visit.get("program_two", None)
            elif visit.get("discharge_program") is not None and visit.get("discharge_program") != "NONE":
                program = visit.get("discharge_program")
            elif visit.get("new_programme") is not None and visit.get("new_programme") != "NONE":
                program = visit.get("new_programme")
            elif (
                visit.get("program") is not None
                and visit.get("program") == "NONE"
                and visit.get("physiology_status") is not None
                and visit.get("physiology_status") != ""
            ):
                program = "TSFP"
        return program

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
        elif (
            visit.get("_defaulter_admission_type", None) is not None
            and visit.get("_defaulter_admission_type", None) != ""
        ):
            admission_type = visit.get("_defaulter_admission_type")
        admission_type = self.admission_type_converter(admission_type)
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

    def exit_type(self, visit):
        exit_type = None
        if visit.get("new_programme", None) is not None and visit.get("new_programme", None) == "NONE":
            exit_type = visit.get("reason_for_not_continuing", None)
        elif (visit.get("new_programme") is not None and visit.get("new_programme") == "TSFP") and (
            visit.get("transfer__int__") is not None and visit.get("transfer__int__") == "1"
        ):
            exit_type = "transfer_to_tsfp"
        elif (visit.get("new_programme") is not None and visit.get("new_programme") == "OTP") and (
            visit.get("transfer__int__") is not None and visit.get("transfer__int__") == "1"
        ):
            exit_type = "transfer_to_otp"
        elif (visit.get("_transfer_to_tsfp") is not None and visit.get("_transfer_to_tsfp") == "1") or (
            visit.get("transfer_from_otp__bool__") is not None and visit.get("transfer_from_otp__bool__") == "1"
        ):
            exit_type = "transfer_to_tsfp"

        elif (visit.get("_transfer_to_otp") is not None and visit.get("_transfer_to_otp") == "1") or (
            visit.get("transfer_from_tsfp__bool__") is not None and visit.get("transfer_from_tsfp__bool__") == "1"
        ):
            exit_type = "transfer_to_otp"
        elif visit.get("reason_for_not_continuing") is not None and visit.get("reason_for_not_continuing") != "":
            exit_type = visit.get("reason_for_not_continuing")

        elif visit.get("reasons_not_continuing") is not None and visit.get("reasons_not_continuing") != "":
            exit_type = visit.get("reasons_not_continuing")
        elif visit.get("reason_not_continue") is not None and visit.get("reason_not_continue") != "":
            exit_type = visit.get("reason_not_continue")

        elif visit.get("not_continue") is not None and visit.get("not_continue") != "":
            exit_type = visit.get("not_continue")

        elif (visit.get("non_respondent") is not None and visit.get("non_respondent") == "1") or (
            visit.get("non_respondent__int__") is not None and visit.get("non_respondent__int__") == "1"
        ):
            exit_type = "non_respondent"
        elif (
            (visit.get("discharge_note") is not None and visit.get("discharge_note") == "yes")
            or (visit.get("discharge_note__int__") is not None and visit.get("discharge_note__int__") == "1")
            or (visit.get("_number_of_green_visits") is not None and int(visit.get("_number_of_green_visits")) > 1)
        ):
            exit_type = "cured"
        elif visit.get("_defaulter") is not None and visit.get("_defaulter") == "1":
            exit_type = "defaulter"
        elif visit.get("_cured") is not None and visit.get("_cured") == "1":
            exit_type = "cured"
        exit_type = self.exit_type_converter(exit_type)
        return exit_type

    def exit_type_converter(self, exit_type):
        if exit_type == "dismissedduetocheating":
            return "dismissed_due_to_cheating"
        if exit_type == "dismissal":
            return "dismissed_due_to_cheating"
        if exit_type == "transferredout":
            return "transferred_out"
        if exit_type == "voluntarywithdrawal":
            return "voluntary_withdrawal"
        return exit_type

    def admission_type_converter(self, admission_type):
        if admission_type == "referred_from_other_otp":
            return "referred_from_otp_sam"
        if admission_type == "referred_from_tsfp":
            return "referred_from_tsfp_mam"
        if admission_type in ["referred_from_sc_itp", "returned_from_sc"]:
            return "referred_from_sc"
        if admission_type == "returnee":
            return "returned_referral"
        return admission_type

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

    def exit_by_defaulter(self, visits, visit, anthropometric_visit_forms):
        exit = None
        next_visit_date = ""
        next_visit_days = 0
        nextSecondVisitDate = ""
        missed_followup_visit = 0
        if visit["form_id"] in [
            "child_assistance_2nd_visit_tsfp",
            "child_assistance_follow_up",
            "child_assistance_follow_up_2",
            "assistance_admission_otp",
            "assistance_admission_2nd_visit_otp",
            "child_assistance_admission",
            "child_assistance_admission_2",
            "child_assistance_admission_2_u6",
            "assistance_u6",
            "ethiopia_child_assistance_follow_up",
            "wfp_coda_pbwg_assistance",
            "wfp_coda_pbwg_assistance_followup",
        ]:
            if visit.get("next_visit__date__") is not None and visit.get("next_visit__date__", None) != "":
                next_visit_date = visit.get("next_visit__date__", None)
            elif (
                visit.get("new_next_visit__date__", None) is not None
                and visit.get("new_next_visit__date__", None) != ""
            ):
                next_visit_date = visit.get("new_next_visit__date__", None)

            elif (
                visit.get("next_visit_date__date__", None) is not None
                and visit.get("next_visit_date__date__", None) != ""
            ):
                next_visit_date = visit.get("next_visit_date__date__", None)

            if visit.get("next_visit_days", None) is not None and visit.get("next_visit_days", None) != "":
                next_visit_days = visit.get("next_visit_days", None)
            elif (
                visit.get("number_of_days__int__", None) is not None and visit.get("number_of_days__int__", None) != ""
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
            elif (
                visit.get("tsfp_next_visit", None) is not None
                and visit.get("tsfp_next_visit", None) != ""
                and visit.get("tsfp_next_visit") != "--"
            ):
                next_visit_days = visit.get("tsfp_next_visit", None)
            elif (
                visit.get("otp_next_visit", None) is not None
                and visit.get("otp_next_visit", None) != ""
                and visit.get("otp_next_visit") != "--"
            ):
                next_visit_days = visit.get("otp_next_visit", None)
            elif (
                visit.get("number_of_days__int__") is not None
                and visit.get("number_of_days__int__") != ""
                and visit.get("number_of_days__int__") != "--"
            ):
                next_visit_days = visit.get("number_of_days__int__", None)

            if next_visit_date is not None and next_visit_date != "":
                nextSecondVisitDate = datetime.strptime(next_visit_date[:10], "%Y-%m-%d").date() + timedelta(
                    days=int(next_visit_days)
                )
            missed_followup_visit = self.missed_followup_visit(
                visits,
                anthropometric_visit_forms,
                next_visit_date[:10],
                nextSecondVisitDate,
                next_visit_days,
            )
        if missed_followup_visit > 1 and next_visit_date != "" and nextSecondVisitDate != "":
            exit = {"exit_type": "defaulter", "end_date": nextSecondVisitDate}
        return exit

    def journey_Formatter(
        self,
        visit,
        anthropometric_visit_form,
        followup_forms,
        current_journey,
        visits,
        index,
    ):
        default_anthropometric_followup_forms = followup_forms
        default_admission_form = None
        if visit["form_id"] in anthropometric_visit_form:
            default_admission_form = visit["form_id"]
            current_journey["instance_id"] = visit.get("instance_id", None)
            current_journey["start_date"] = visit.get("start_date", None)
            current_journey["initial_weight"] = visit.get("initial_weight", None)
            current_journey["muac_size"] = visit.get("muac", visit.get("muac_size"))
            current_journey["whz_score"] = visit.get("whz_score", None)
            current_journey["oedema"] = visit.get("oedema", None)
            if visit.get("registration_date", None) is not None and visit.get("registration_date", None) != "":
                current_journey["date"] = visit.get("registration_date", None)
            elif visit.get("_visit_date", None) is not None and visit.get("_visit_date", None) != "":
                current_journey["date"] = visit.get("_visit_date", None)

            current_journey["admission_criteria"] = self.admission_criteria(visit)
            current_journey["admission_type"] = self.admission_type(visit)
            current_journey["programme_type"] = self.program_mapper(visit)
            current_journey["org_unit_id"] = visit.get("org_unit_id")
            current_journey["visits"].append(visit)
        if default_admission_form is not None:
            followup_forms.append(default_admission_form)
        exit = None

        if visit["form_id"] in followup_forms:
            if visit["form_id"] != default_admission_form:
                current_journey["visits"].append(visit)
            end_date = visit.get("end_date", visit.get("source_created_at", ""))
            current_journey["end_date"] = (
                end_date if end_date is not None else visit.get("source_created_at", None).strftime("%Y-%m-%d")
            )
            current_journey["discharge_weight"] = visit.get("discharge_weight", None)
            current_journey["weight_difference"] = visit.get("weight_difference", None)
            current_journey["exit_type"] = self.exit_type(visit)

        """ Check if it's first followup visit, in order to calculate the defaulter case based on the number of days defined in the assistance
        admission form(previous form) and next visit date in the antropometric followup visit form.
        When it's Anthropometric admission form, it means we still in the admission visit(visit 0).
        Otherwise, it's Anthropometric followup form which is a start of first follow up visit(visit 1) """

        if visit["form_id"] in default_anthropometric_followup_forms:
            index = index - 1
            exit = self.exit_by_defaulter(visits, visits[index], followup_forms)
        else:
            exit = self.exit_by_defaulter(visits, visit, followup_forms)

        if (
            exit is not None
            and exit.get("exit_type") is not None
            and current_journey.get("exit_type") is None
            and current_journey.get("start_date") is not None
        ):
            current_journey["exit_type"] = exit["exit_type"]
            current_journey["end_date"] = exit["end_date"]
            duration = (
                datetime.strptime(
                    datetime.strftime(exit["end_date"], "%Y-%m-%d"),
                    "%Y-%m-%d",
                )
                - datetime.strptime(current_journey["start_date"], "%Y-%m-%d")
            ).days
            current_journey["duration"] = duration
        return current_journey

    def assistance_to_step(self, assistance, visit, instance_id):
        current_step = Step()
        current_step.assistance_type = assistance.get("type", "")
        current_step.quantity_given = assistance.get("quantity", 0)
        current_step.ration_size = assistance.get("ration_size")
        current_step.visit = visit
        current_step.instance_id = instance_id
        return current_step

    def split_given_medication(self, medication, quantity):
        given_medication = []

        for medication in medication.split(" "):
            given_medication.append({"type": medication, "quantity": quantity})
        return given_medication

    def map_assistance_step(self, step, given_assistance):
        quantity = 1
        ration_size = ""
        if (step.get("net_given") is not None and step.get("net_given") == "yes") or (
            step.get("net_given__bool__") is not None and step.get("net_given__bool__") == "1"
        ):
            assistance = {"type": "Mosquito Net", "quantity": quantity}
            given_assistance.append(assistance)

        if (step.get("soap_given") is not None and step.get("soap_given") == "yes") or (
            step.get("soap_given__bool__") is not None and step.get("soap_given__bool__") == "1"
        ):
            assistance = {"type": "Soap", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("ors_given") == "Yes" or step.get("ors_given") == "yes":
            assistance = {"type": "ORS", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medicine_given") is not None:
            assistance = {"type": step.get("medicine_given"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medication") is not None and step.get("medication") != "":
            given_medication = self.split_given_medication(step.get("medication"), quantity)
            given_assistance = given_assistance + given_medication

        if step.get("medicine_given_2") is not None and step.get("medicine_given_2") != "":
            assistance = {"type": step.get("medicine_given_2"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medication_2") is not None and step.get("medication_2") != "":
            given_medication = self.split_given_medication(step.get("medication_2"), quantity)
            given_assistance = given_assistance + given_medication

        if step.get("vitamins_given") == "1":
            assistance = {"type": "Vitamin", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("ab_given") == "1":
            assistance = {"type": "albendazole", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("measles_vacc") == "1":
            assistance = {"type": "Measles vaccination", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("art_given") == "1":
            assistance = {"type": "ART", "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("anti_helminth_given") is not None and step.get("anti_helminth_given") != "":
            assistance = {"type": step.get("anti_helminth_given"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("ration_to_distribute") is not None or step.get("ration") is not None:
            quantity = 0
            ration_type = ""
            if step.get("_total_number_of_sachets") is not None and step.get("_total_number_of_sachets") != "":
                quantity = step.get("_total_number_of_sachets", 0)
            elif step.get("_csb_packets") is not None:
                quantity = step.get("_csb_packets", 0)

            if step.get("ration_to_distribute") is not None:
                ration_type = step.get("ration_to_distribute")
            assistance = {
                "type": ration_type,
                "quantity": quantity,
                "ration_size": step.get("ration_size", step.get("ration_limit")),
            }
            given_assistance.append(assistance)

        if step.get("ration_type_tsfp") is not None:
            quantity = 0
            if step.get("_total_number_of_sachets") is not None and step.get("_total_number_of_sachets") != "":
                quantity = step.get("_total_number_of_sachets")
            assistance = {
                "type": step.get("ration_type_tsfp"),
                "quantity": quantity,
                "ration_size": step.get("ration_size", step.get("ration_limit")),
            }
            given_assistance.append(assistance)
        elif step.get("ration_type_otp") is not None:
            quantity = 0
            if step.get("_total_number_of_sachets") is not None and step.get("_total_number_of_sachets") != "":
                quantity = step.get("_total_number_of_sachets")
            assistance = {
                "type": step.get("ration_type_otp"),
                "quantity": quantity,
            }
            given_assistance.append(assistance)
        elif (
            (step.get("ration_type") is not None and step.get("ration_type") != "")
            or (step.get("ration") is not None and step.get("ration") != "")
            or (step.get("ration_type_tsfp") is not None and step.get("ration_type_tsfp") != "")
            or (step.get("ration_type_otp") is not None and step.get("ration_type_otp") != "")
        ):
            if step.get("ration_type") in ["csb", "csb1", "csb2"]:
                quantity = step.get("_csb_packets", 0)
            elif step.get("ration_type") == "lndf":
                quantity = step.get("_lndf_kgs", 0)
            elif (
                step.get(
                    "ration_type_tsfp",
                    step.get(
                        "ration",
                        step.get(
                            "ration_type",
                            step.get("ration_type_otp"),
                        ),
                    ),
                )
                == "cbt"
            ):
                quantity = 0
                ration_size = step.get("ration_size", step.get("ration_limit"))
            else:
                if step.get("_total_number_of_sachets_rutf") == "" or step.get("_total_number_of_sachets") == "":
                    quantity = 0
            assistance = {
                "type": step.get("ration_type", step.get("ration")),
                "quantity": quantity,
                "ration_size": ration_size,
            }
            given_assistance.append(assistance)

        return list(
            filter(
                lambda assistance: (assistance.get("type") and assistance.get("type") != ""),
                given_assistance,
            )
        )

    def save_steps(self, visits, steps):
        all_steps = []
        if len(visits) == len(steps):
            for index, step in enumerate(steps):
                visit = visits[index]
                for sub_step in step:
                    current_step = None
                    given_assistance = ETL().map_assistance_step(sub_step, [])
                    for assistance in given_assistance:
                        current_step = ETL().assistance_to_step(
                            assistance,
                            visit,
                            sub_step["instance_id"],
                        )
                        all_steps.append(current_step)
        return all_steps

    def save_visit(self, visits, journey):
        saved_visits = []
        visit_number = 0
        for current_visit in visits:
            visit = Visit()
            visit.date = current_visit.get("date", None)
            visit.number = visit_number
            visit.muac_size = current_visit.get("muac", current_visit.get("muac_size"))
            whz_color = ""
            if current_visit.get("whz_color", None) == "Y":
                whz_color = "Yellow"
            elif current_visit.get("whz_color", None) == "R":
                whz_color = "Red"
            elif current_visit.get("whz_color", None) == "G":
                whz_color = "Green"
            visit.whz_color = whz_color
            visit.journey = journey
            visit.org_unit_id = current_visit["org_unit_id"]
            visit.instance_id = current_visit.get("instance_id", None)
            saved_visits.append(visit)
            visit_number += 1
        return saved_visits

    def followup_visits_at_next_visit_date(self, visits, formIds, next_visit__date__, secondNextVisitDate):
        followup_visits_in_period = []

        for visit in visits:
            currentVisitDate = ""
            if visit["form_id"] in formIds:
                if visit.get("visit_date") is not None:
                    currentVisitDate = visit.get("visit_date", None)[:10]
                elif visit.get("date", None) is not None:
                    currentVisitDate = visit.get("date", None)[:10]
                elif visit.get("_visit_date", None) is not None:
                    currentVisitDate = visit.get("_visit_date", None)[:10]

                if next_visit__date__ == currentVisitDate or currentVisitDate == secondNextVisitDate:
                    followup_visits_in_period.append(visit)
        return followup_visits_in_period

    def missed_followup_visit(self, visits, formIds, next_visit__date__, secondNextVisitDate, next_visit_days):
        count_missed_visit = 0

        for visit in visits:
            currentVisitDate = ""
            if visit["form_id"] in formIds:
                if visit.get("visit_date") is not None:
                    currentVisitDate = visit.get("visit_date", None)[:10]
                elif visit.get("_visit_date", None) is not None:
                    currentVisitDate = visit.get("_visit_date", None)[:10]
                elif visit.get("date", None) is not None:
                    currentVisitDate = visit.get("date", None)[:10]

                today = date.today().strftime("%Y-%m-%d")
                if next_visit__date__ == "" and secondNextVisitDate == "":
                    count_missed_visit = count_missed_visit + 2
                elif (
                    next_visit_days == 0
                    or next_visit__date__ == ""
                    or secondNextVisitDate == ""
                    or (
                        secondNextVisitDate != ""
                        and today > secondNextVisitDate.strftime("%Y-%m-%d")
                        and next_visit__date__ != currentVisitDate
                        and currentVisitDate != secondNextVisitDate
                    )
                ):
                    count_missed_visit = count_missed_visit + 1
        return count_missed_visit

    def calculate_birth_date(self, current_record):
        age_entry = current_record.get("age_entry", None)
        age = current_record.get("age__int__", None)
        registration_date = current_record.get("registration_date", None)
        calculated_date = None
        if (age_entry is not None and age_entry != "") and (age is not None and age != ""):
            beneficiary_age = int(age)
            registered_at = datetime.strptime(registration_date[:10], "%Y-%m-%d").date()
            if age_entry == "years":
                calculated_date = registered_at - relativedelta(years=beneficiary_age)
            elif age_entry == "months":
                calculated_date = registered_at - relativedelta(months=beneficiary_age)
        return calculated_date

    def entity_journey_mapper(self, visits, anthropometric_visit_forms, admission_form, current_journey):
        journey = []
        for index, visit in enumerate(visits):
            if visit:
                current_journey["weight_gain"] = visit.get("weight_gain", None)
                current_journey["weight_loss"] = visit.get("weight_loss", None)
                if visit.get("duration") is not None and visit.get("duration") != "":
                    current_journey["duration"] = visit.get("duration")

                current_journey = ETL().journey_Formatter(
                    visit,
                    admission_form,
                    anthropometric_visit_forms,
                    current_journey,
                    visits,
                    index,
                )
            current_journey["steps"].append(visit)
        journey.append(current_journey)
        return journey

    def compute_gained_weight(self, initial_weight, current_weight, duration):
        weight_gain = 0
        weight_loss = 0

        weight_difference = 0
        if initial_weight and current_weight:
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
            "initial_weight": (
                float(initial_weight) if initial_weight is not None and initial_weight != "" else initial_weight
            ),
            "discharge_weight": (
                float(current_weight) if current_weight is not None and current_weight != "" else current_weight
            ),
            "weight_difference": weight_difference,
            "weight_gain": weight_gain,
            "weight_loss": weight_loss / 1000,
        }

    def save_entity_journey(self, journey, beneficiary, record, entity_type):
        journey.beneficiary = beneficiary
        journey.programme_type = entity_type
        journey.admission_criteria = record.get("admission_criteria")
        journey.muac_size = record.get("muac_size")
        journey.whz_score = record.get("whz_score")
        journey.admission_type = record.get("admission_type", None)
        journey.nutrition_programme = record.get("nutrition_programme")
        journey.exit_type = record.get("exit_type", None)
        journey.instance_id = record.get("instance_id", None)
        journey.start_date = record.get("start_date", None)
        journey.end_date = record.get("end_date", None)
        journey.duration = record.get("duration", None)

        return journey

    def save_monthly_journey(self, monthly_journey, account):
        monthly_Statistic = MonthlyStatistics()
        org_unit_id = monthly_journey.get("org_unit")
        monthly_Statistic.org_unit_id = org_unit_id
        monthly_Statistic.gender = monthly_journey.get("gender")
        monthly_Statistic.month = monthly_journey.get("month")
        monthly_Statistic.year = monthly_journey.get("year")
        monthly_Statistic.period = self.period_converter(monthly_journey.get("year"), monthly_journey.get("month"))
        monthly_Statistic.number_visits = monthly_journey.get("number_visits", 0)
        monthly_Statistic.programme_type = monthly_journey.get("programme_type")
        monthly_Statistic.nutrition_programme = monthly_journey.get("nutrition_programme")
        monthly_Statistic.admission_type = monthly_journey.get("admission_type")
        monthly_Statistic.admission_criteria = monthly_journey.get("admission_criteria")
        monthly_Statistic.given_sachet_rusf = monthly_journey.get("given_sachet_rusf")
        monthly_Statistic.given_sachet_rutf = monthly_journey.get("given_sachet_rutf")
        monthly_Statistic.given_quantity_csb = monthly_journey.get("given_quantity_csb")
        monthly_Statistic.given_ration_cbt = monthly_journey.get("given_ration_cbt")
        monthly_Statistic.muac_under_11_5 = monthly_journey.get("muac_under_11_5")
        monthly_Statistic.muac_11_5_12_4 = monthly_journey.get("muac_11_5_12_4")
        monthly_Statistic.muac_above_12_5 = monthly_journey.get("muac_above_12_5")
        monthly_Statistic.muac_under_23 = monthly_journey.get("muac_under_23")
        monthly_Statistic.muac_above_23 = monthly_journey.get("muac_above_23")

        monthly_Statistic.whz_score_2 = monthly_journey.get("whz_score_2")
        monthly_Statistic.whz_score_3 = monthly_journey.get("whz_score_3")
        monthly_Statistic.whz_score_3_2 = monthly_journey.get("whz_score_3_2")
        monthly_Statistic.oedema = monthly_journey.get("oedema")

        monthly_Statistic.beneficiary_with_admission_type = monthly_journey.get("beneficiary_with_admission_type")
        monthly_Statistic.beneficiary_with_exit_type = monthly_journey.get("beneficiary_with_exit_type")
        monthly_Statistic.dhis2_id = monthly_journey.get("dhis2_id")
        monthly_Statistic.exit_type = monthly_journey.get("exit_type")
        monthly_Statistic.account = account

        return monthly_Statistic

    def journey_with_visit_and_steps_per_visit(self, account, programme):
        aggregated_journeys = []
        journeys = (
            Step.objects.select_related(
                "visit",
                "visit__journey",
                "visit__org_unit",
                "visit__journey__beneficiary",
            )
            .filter(
                visit__journey__programme_type=programme,
                visit__journey__beneficiary__account=account,
            )
            .values(
                "visit__journey__admission_type",
                "assistance_type",
                "instance_id",
                "quantity_given",
                "ration_size",
                "visit",
                "visit__id",
                "visit__org_unit__source_ref",
                "visit__date",
                "visit__journey",
                "visit__journey__admission_criteria",
                "visit__journey__nutrition_programme",
                "visit__journey__programme_type",
                "visit__journey__end_date",
                "visit__journey__exit_type",
                "visit__journey__beneficiary__entity_id",
                "visit__journey__beneficiary__gender",
                "visit__journey__beneficiary__account",
                "visit__muac_size",
                "visit__whz_color",
                year=Extract("visit__date", "year"),
                month=Extract("visit__date", "month"),
                period=Concat(
                    Extract("visit__date", "year"),
                    Value("/"),
                    Extract("visit__date", "month"),
                    output_field=CharField(),
                ),
            )
            .annotate(org_unit=F("visit__org_unit_id"))
            .annotate(
                muac_under_11_5=Sum(
                    Case(
                        When(visit__muac_size__lt=11.5, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                )
            )
            .annotate(
                muac_11_5_12_4=Sum(
                    Case(
                        When(visit__muac_size__range=(11.5, 12.4), then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                )
            )
            .annotate(
                muac_above_12_5=Sum(
                    Case(When(visit__muac_size__gte=12.5, then=Value(1)), default=Value(0), output_field=IntegerField())
                )
            )
            .annotate(
                whz_score_2=Case(
                    When(visit__whz_color="Green", then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                whz_score_3=Case(
                    When(visit__whz_color="Red", then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                whz_score_3_2=Case(
                    When(visit__whz_color="Yellow", then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                oedema=Case(
                    When(visit__journey__admission_criteria="oedema", then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                admission_sc_itp_otp=Case(
                    When(
                        Q(visit__journey__admission_type="referred_from_sc")
                        | Q(visit__journey__admission_type="referred_from_otp_sam"),
                        then=Value(1),
                    ),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                transfer_sc_itp_otp=Case(
                    When(
                        Q(visit__journey__exit_type="transfer_to_sc_itp")
                        | Q(visit__journey__exit_type="transferred_to_otp"),
                        then=Value(1),
                    ),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                transfer_from_other_tsfp=Case(
                    When(
                        Q(visit__journey__exit_type="transfer_from_other_tsfp")
                        | Q(visit__journey__exit_type="transfer_to_tsfp"),
                        then=Value(1),
                    ),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                muac_under_23=Sum(
                    Case(When(visit__muac_size__lt=23, then=Value(1)), default=Value(0), output_field=IntegerField())
                )
            )
            .annotate(
                muac_above_23=Sum(
                    Case(When(visit__muac_size__gte=23, then=Value(1)), default=Value(0), output_field=IntegerField())
                )
            )
            .order_by("visit__id")
        )
        data_by_journey = groupby(list(journeys), key=itemgetter("org_unit"))

        for org_unit, journeys in data_by_journey:
            visits_by_period = groupby(journeys, key=itemgetter("period"))
            aggregated_journeys_by_period = AggregatedJourney().group_by_period(visits_by_period, org_unit)
            aggregated_journeys.extend(aggregated_journeys_by_period)
        monthly_journeys = list(
            map(
                lambda journey: self.save_monthly_journey(journey, account),
                aggregated_journeys,
            )
        )
        saved_monthlyStatistics = MonthlyStatistics.objects.bulk_create(monthly_journeys)
        logger.info(
            f"----------------------------------------  Aggregated {len(saved_monthlyStatistics)} Monthly Journeys for {account} {programme}  -----------------------------------"
        )

    def admission_forms(self, visits, admission_forms):
        admission_visits = [visit for visit in visits if visit["form_id"] in admission_forms]
        return admission_visits

    def period_converter(self, year, month):
        if int(month) < 10:
            return f"{year}0{month}"
        return f"{year}{month}"

    def aggregating_data_to_push_to_dhis2(self, account):
        monthlyStatistics = (
            MonthlyStatistics.objects.prefetch_related("account", "org_unit")
            .values()
            .filter(account=account)
            .filter(org_unit_id__in=[758, 622, 43])
        )
        journey_by_org_units = groupby(list(monthlyStatistics), key=itemgetter("org_unit_id"))
        dhis2_aggregated_data = []
        dataElements = None
        # Reading the dhis2 datalement mapper json file
        with open("plugins/wfp/dhis2_mapper.json") as mapper:
            data = json.load(mapper)

        for org_unit, journeys in journey_by_org_units:
            journeys = list(journeys)
            journey_by_org_units_period = groupby(journeys, key=itemgetter("period"))
            dataSet = {"dataSet": settings.DATASET_ID, "orgUnit": journeys[0]["dhis2_id"], "orgUnitId": org_unit}
            dataValues = []
            for period, journey_period in journey_by_org_units_period:
                dataSet["period"] = period
                journeys_by_program_type = groupby(list(journey_period), key=itemgetter("programme_type"))
                dataValues.extend(self.map_dhis2_data(journeys_by_program_type, data))
            dataSet["dataValues"] = dataValues
            dhis2_aggregated_data.append(dataSet)
        return dhis2_aggregated_data

    def map_dhis2_data(self, journeys, dataElements):
        dataValues = []
        for program_type, journey_by_program in journeys:
            dataElement = dataElements.get(program_type)
            journey = None
            categories = []
            sub_categories = []
            if program_type == "U5":
                categories = ["screening_reporting", "tsfp_reporting", "otp_reporting"]
                sub_categories = [
                    "muac_under_11_5",
                    "muac_11_5_12_4",
                    "muac_above_12_5",
                    "total_beneficiary",
                    "whz_score_3",
                    "total_with_exit_type",
                    "transfer_sc_itp_otp",
                ]
                journey = groupby(list(journey_by_program), key=itemgetter("gender"))
            elif program_type == "PLW":
                categories = ["screening_reporting", "tsfp_reporting"]
                sub_categories = ["total_beneficiary", "muac_under_23", "muac_above_23", "total_with_exit_type"]
                journey = groupby(list(journey_by_program), key=itemgetter("nutrition_programme"))

            for main_category, journey_by_category in journey:
                journey_by_categories = list(journey_by_category)
                admission_type = journey_by_categories[0]["admission_type"] if len(journey_by_categories) > 0 else ""
                admission_criteria = (
                    journey_by_categories[0]["admission_criteria"] if len(journey_by_categories) > 0 else ""
                )
                exit_type = journey_by_categories[0]["exit_type"] if len(journey_by_categories) > 0 else ""
                journey_by_gender_and_nutrition_program = groupby(
                    journey_by_categories, key=itemgetter("nutrition_programme")
                )
                rows = AggregatedJourney().aggregated_rows(journey_by_categories)

                for nutrition_programme, journey_program in journey_by_gender_and_nutrition_program:
                    for category in categories:
                        dataElement_by_category = dataElement.get(category)
                        dataElement_by_sub_category = dataElement_by_category
                        if nutrition_programme == "TSFP":
                            dataElement_by_sub_category = dataElement.get("tsfp_reporting")
                        elif nutrition_programme == "OTP":
                            dataElement_by_sub_category = dataElement.get("otp_reporting")
                        if dataElement_by_sub_category is not None:
                            if dataElement_by_category is not None:
                                dataElement_by_main_category = dataElement_by_category.get(main_category)
                                for sub_category in sub_categories:
                                    if dataElement_by_main_category is not None:
                                        dataValue = dataElement_by_main_category.get(sub_category)
                                        if sub_category == exit_type:
                                            rows[sub_category] = rows["total_with_exit_type"]
                                        elif sub_category == admission_type:
                                            rows[sub_category] = rows["total_beneficiary"]
                                    if dataValue is not None:
                                        dataValues.append({**dataValue, "value": rows[sub_category]})
        return dataValues
