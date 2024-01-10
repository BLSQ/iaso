from .models import *
from iaso.models import *
import datetime


class ETL:
    def __init__(self, type=None):
        self.type = type

    def retrieve_entities(self):
        steps_id = ETL().steps_to_exclude()
        updated_at = datetime.date(2023, 7, 10)
        beneficiaries = (
            Instance.objects.filter(entity__entity_type__name=self.type)
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
            .order_by("entity_id", "created_at")
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
            if visit.get("programme") is not None and visit.get("programme") != "NONE":
                program = visit.get("programme")
            elif visit.get("program") is not None and visit.get("program") != "NONE":
                program = visit.get("program")
            elif visit.get("program_two") is not None and visit.get("program_two") != "NONE":
                program = visit.get("program_two", None)
            elif visit.get("discharge_program") is not None and visit.get("discharge_program") != "NONE":
                program = visit.get("discharge_program")
            elif visit.get("_programme") is not None and visit.get("_programme") != "NONE":
                program = visit.get("_programme")
            elif visit.get("new_programme") is not None and visit.get("new_programme") != "NONE":
                program = visit.get("new_programme")
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
        if (
            (visit.get("_Xfinal_color_result") is not None and visit.get("_Xfinal_color_result") == "Y")
            and (visit.get("previous_child_color") is not None and visit.get("previous_child_color") == "Y")
            and (visit.get("_transfer_to_tsfp") is not None and visit.get("_transfer_to_tsfp") == "1")
        ):
            exit_type = "cured"
        elif (
            (visit.get("previous_whz_color") is not None and visit.get("previous_whz_color") == "R")
            and (visit.get("_Xwhz_color") is not None and visit.get("_Xwhz_color") == "R")
            and (visit.get("previous_muac_color") is not None and visit.get("previous_muac_color") == "R")
            and (visit.get("_Xmuac_color") is not None and visit.get("_Xmuac_color") == "R")
            and (visit.get("_transfer_to_tsfp") is not None and visit.get("_transfer_to_tsfp") == "1")
        ):
            exit_type = "transfer_to_tsfp"
        elif visit.get("_transfer_to_otp") is not None and visit.get("_transfer_to_otp") == "1":
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
        elif visit.get("_defaulter_admission_type") is not None and visit.get("_defaulter_admission_type") != "":
            exit_type = "defaulter"
        exit_type = self.exit_type_converter(exit_type)
        return exit_type

    def exit_type_converter(self, exit_type):
        if exit_type == "dismissedduetocheating":
            return "dismissed_due_to_cheating"
        elif exit_type == "transferredout":
            return "transferred_out"
        else:
            return exit_type

    def admission_type_converter(self, admission_type):
        if admission_type == "referred_from_other_otp":
            return "referred_from_otp_sam"
        elif admission_type == "referred_from_tsfp":
            return "referred_from_tsfp_mam"
        elif admission_type == "referred_from_sc_itp":
            return "referred_from_sc"
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

    def journey_Formatter(self, visit, anthropometric_visit_form, followup_forms, current_journey):
        current_journey["instance_id"] = visit.get("instance_id", None)
        if visit["form_id"] == anthropometric_visit_form:
            current_journey["date"] = visit.get("date", None)
            current_journey["admission_criteria"] = self.admission_criteria(visit)
            current_journey["admission_type"] = self.admission_type(visit)
            current_journey["programme_type"] = self.program_mapper(visit)
            current_journey["org_unit_id"] = visit.get("org_unit_id")

        if visit["form_id"] in followup_forms:
            current_journey["exit_type"] = self.exit_type(visit)
            if current_journey.get("exit_type") == "cured":
                current_journey["nutrition_programme"] = visit.get("discharge_program")

        followup_forms.append(anthropometric_visit_form)
        if visit["form_id"] in followup_forms:
            current_journey["visits"].append(visit)

        return current_journey

    def assistance_to_step(self, assistance, visit, instance_id):
        current_step = Step()
        current_step.assistance_type = assistance.get("type", "")
        current_step.quantity_given = assistance.get("quantity", 0)
        current_step.visit = visit
        current_step.instance_id = instance_id
        return current_step

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

        if step.get("medication") is not None:
            assistance = {"type": step.get("medication"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medicine_given_2") is not None:
            assistance = {"type": step.get("medicine_given_2"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("medication_2") is not None:
            assistance = {"type": step.get("medication_2"), "quantity": quantity}
            given_assistance.append(assistance)

        if step.get("ration_to_distribute") is not None:
            quantity = 0
            if step.get("_total_number_of_sachets") is not None:
                quantity = step.get("_total_number_of_sachets", 0)
            elif step.get("_csb_packets") is not None:
                quantity = step.get("_csb_packets", 0)

            assistance = {"type": step.get("ration_to_distribute"), "quantity": quantity}
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
        for visit in visits:
            for step in steps:
                given_assistance = []
                for sub_step in step:
                    current_step = None
                    given_assistance = ETL().map_assistance_step(sub_step, given_assistance)

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
