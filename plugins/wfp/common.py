from .models import *
from iaso.models import *
from datetime import datetime, timedelta, date
from dateutil.relativedelta import *


class ETL:
    def __init__(self, type=None):
        self.type = type

    def delete_beneficiaries(self):
        beneficiary = Beneficiary.objects.all().delete()

        print("EXISTING BENEFICIARY DELETED", beneficiary[1]["wfp.Beneficiary"])
        print("EXISTING STEPS DELETED", beneficiary[1]["wfp.Step"])
        print("EXISTING VISITS DELETED", beneficiary[1]["wfp.Visit"])
        print("EXISTING JOURNEY DELETED", beneficiary[1]["wfp.Journey"])

    def retrieve_entities(self):
        steps_id = ETL().steps_to_exclude()
        updated_at = date(2023, 7, 10)
        beneficiaries = (
            Instance.objects.filter(entity__entity_type__code=self.type)
            # .filter(entity__id__in=[1, 42, 46, 49, 58, 77, 90, 111, 322, 323, 330, 196, 226, 254,315, 424, 430, 431, 408, 19, 230, 359])
            # .filter(entity__id__in=[230, 359, 254])
            .filter(json__isnull=False)
            .filter(form__isnull=False)
            .filter(updated_at__gte=updated_at)
            .exclude(deleted=True)
            .exclude(entity__deleted_at__isnull=False)
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
                "entity__deleted_at",
                "source_created_at",
            )
            .order_by(
                "entity_id",
                "source_created_at",
            )
        )
        return beneficiaries

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
        elif (visit.get("discharge_note") is not None and visit.get("discharge_note") == "yes") or (
            visit.get("discharge_note__int__") is not None and visit.get("discharge_note__int__") == "1"
        ):
            exit_type = "cured"
        elif visit.get("_number_of_green_visits") is not None and int(visit.get("_number_of_green_visits")) > 1:
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
        elif exit_type == "transferredout":
            return "transferred_out"
        elif exit_type == "voluntarywithdrawal":
            return "voluntary_withdrawal"
        else:
            return exit_type

    def admission_type_converter(self, admission_type):
        if admission_type == "referred_from_other_otp":
            return "referred_from_otp_sam"
        elif admission_type == "referred_from_tsfp":
            return "referred_from_tsfp_mam"
        elif admission_type == "referred_from_sc_itp":
            return "referred_from_sc"
        elif admission_type == "returned_from_sc":
            return "referred_from_sc"
        elif admission_type == "returnee":
            return "returned_referral"
        else:
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
            "child_assistance_follow_up",
            "child_assistance_admission",
            "wfp_coda_pbwg_assistance",
            "wfp_coda_pbwg_assistance_followup",
        ]:
            if visit.get("next_visit__date__", None) is not None and visit.get("next_visit__date__", None) != "":
                next_visit_date = visit.get("next_visit__date__", None)
            elif (
                visit.get("new_next_visit__date__", None) is not None
                and visit.get("new_next_visit__date__", None) != ""
            ):
                next_visit_date = visit.get("new_next_visit__date__", None)

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

            if next_visit_date is not None and next_visit_date != "":
                nextSecondVisitDate = datetime.strptime(next_visit_date[:10], "%Y-%m-%d").date() + timedelta(
                    days=int(next_visit_days) + 1
                )
            missed_followup_visit = self.missed_followup_visit(
                visits, anthropometric_visit_forms, next_visit_date[:10], nextSecondVisitDate, next_visit_days
            )
        if missed_followup_visit > 0 and next_visit_date != "" and nextSecondVisitDate != "":
            exit = {"exit_type": "defaulter", "end_date": nextSecondVisitDate}
        return exit

    def journey_Formatter(self, visit, anthropometric_visit_form, followup_forms, current_journey, visits, index):
        default_anthropometric_followup_forms = followup_forms
        if visit["form_id"] == anthropometric_visit_form:
            current_journey["instance_id"] = visit.get("instance_id", None)
            current_journey["start_date"] = visit.get("start_date", None)
            current_journey["initial_weight"] = visit.get("initial_weight", None)
            if visit.get("registration_date", None) is not None and visit.get("registration_date", None) != "":
                current_journey["date"] = visit.get("registration_date", None)
            elif visit.get("_visit_date", None) is not None and visit.get("_visit_date", None) != "":
                current_journey["date"] = visit.get("_visit_date", None)

            current_journey["admission_criteria"] = self.admission_criteria(visit)
            current_journey["admission_type"] = self.admission_type(visit)
            current_journey["programme_type"] = self.program_mapper(visit)
            current_journey["org_unit_id"] = visit.get("org_unit_id")
            current_journey["visits"].append(visit)
        followup_forms.append(anthropometric_visit_form)
        exit = None

        if visit["form_id"] in followup_forms:
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
            and current_journey.get("exit_type", None) is None
            and current_journey.get("start_date") is not None
        ):
            current_journey["exit_type"] = exit["exit_type"]
            current_journey["end_date"] = exit["end_date"]
            duration = (
                datetime.strptime(datetime.strftime(exit["end_date"], "%Y-%m-%d"), "%Y-%m-%d")
                - datetime.strptime(current_journey["start_date"], "%Y-%m-%d")
            ).days
            current_journey["duration"] = duration
        return current_journey

    def assistance_to_step(self, assistance, visit, instance_id):
        current_step = Step()
        current_step.assistance_type = assistance.get("type", "")
        current_step.quantity_given = assistance.get("quantity", 0)
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

        if step.get("medication", None) is not None and step.get("medication", None) != "":
            given_medication = self.split_given_medication(step.get("medication"), quantity)
            given_assistance = given_assistance + given_medication

        if step.get("medicine_given_2") is not None:
            assistance = {"type": step.get("medicine_given_2"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medication_2", None) is not None and step.get("medication_2", None) != "":
            given_medication = self.split_given_medication(step.get("medication_2"), quantity)
            given_assistance = given_assistance + given_medication

        if step.get("ration_to_distribute") is not None or step.get("ration") is not None:
            quantity = 0
            ration_type = ""
            if step.get("_total_number_of_sachets") is not None:
                quantity = step.get("_total_number_of_sachets", 0)
            elif step.get("_csb_packets") is not None:
                quantity = step.get("_csb_packets", 0)

            if step.get("ration_to_distribute") is not None:
                ration_type = step.get("ration_to_distribute")
            elif step.get("ration") is not None:
                ration_type = step.get("ration")
            assistance = {"type": ration_type, "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("ration_type_tsfp") is not None:
            quantity = 0
            if step.get("_total_number_of_sachets") is not None and step.get("_total_number_of_sachets") != "":
                quantity = step.get("_total_number_of_sachets")
            assistance = {
                "type": step.get("ration_type_tsfp"),
                "quantity": quantity,
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
                        current_step.save()
                        all_steps.append(current_step)
        return all_steps

    def save_visit(self, visits, journey):
        saved_visits = []
        visit_number = 0
        for current_visit in visits:
            visit = Visit()
            visit.date = current_visit.get("date", None)
            visit.number = visit_number
            visit.journey = journey
            orgUnit = OrgUnit.objects.get(id=current_visit["org_unit_id"])
            visit.org_unit = orgUnit
            visit.instance_id = current_visit.get("instance_id", None)
            saved_visits.append(visit)
            visit.save()
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
