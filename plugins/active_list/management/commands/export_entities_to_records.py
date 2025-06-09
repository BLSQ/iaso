import datetime

from argparse import ArgumentParser
from collections import defaultdict
from logging import getLogger

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models.functions import TruncMonth
from django.utils.timezone import make_naive

from iaso.models import Form, Instance
from plugins.active_list.models import (
    HIV_HIV1,
    HIV_HIV1_AND_2,
    HIV_HIV2,
    HIV_UNKNOWN,
    SEX_FEMALE,
    SEX_MALE,
    TREATMENT_1STLINE,
    TREATMENT_2NDLINE,
    TREATMENT_3RDLINE,
    TREATMENT_LINE_UNKNOWN,
    Import,
    Patient,
    Record,
)


LINE_MAPPING = {"1": TREATMENT_1STLINE, "2": TREATMENT_2NDLINE, "3": TREATMENT_3RDLINE}
GENDER_MAPPING = {"m": SEX_MALE, "f": SEX_FEMALE}
HIV_TYPE_MAPPING = {
    "1": HIV_HIV1,
    "2": HIV_HIV2,
    "12": HIV_HIV1_AND_2,
}

logger = getLogger(__name__)


class Command(BaseCommand):
    help = """checks all the patients to see if they should be marked as lost and updates the patient status"""

    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--name", type=str, required=False, help="Campaign obr name")

    def handle(self, name=None, *args, **options):
        # Handle admission forms
        admission_form = Form.objects.get(form_id="file_active_admission")
        # Handle follow-up forms
        followup_form = Form.objects.get(form_id="file_active_suivi")

        limit_date = datetime.datetime.now() - datetime.timedelta(days=30)

        # Process admission instances
        admission_instances = (
            Instance.objects.filter(form=admission_form)
            .filter(created_at__gt=limit_date)
            .filter(deleted=False)
            .exclude(org_unit__isnull=True)
            .filter(records__isnull=True)
            .annotate(month=TruncMonth("created_at"))
            .order_by("month", "org_unit_id", "created_at")
        )

        # Process follow-up instances
        followup_instances = (
            Instance.objects.filter(form=followup_form)
            .filter(created_at__gt=limit_date)
            .filter(deleted=False)
            .exclude(org_unit__isnull=True)
            .filter(records__isnull=True)
            .annotate(month=TruncMonth("created_at"))
            .order_by("month", "org_unit_id", "created_at")
        )

        # Process admission instances
        self.process_instances(admission_instances, "admission")

        # Process follow-up instances
        self.process_instances(followup_instances, "followup")

    def process_instances(self, instances, form_type):
        """Process instances and group them by month and org_unit"""
        # Dictionary to group instances
        grouped = defaultdict(list)

        # Group instances by (month, org_unit)
        for instance in instances:
            month = make_naive(instance.month)  # Convert to naive datetime if needed
            grouped[(month, instance.org_unit)].append(instance)

        # Iterate through the groups and process instances
        for (month, org_unit), group_instances in grouped.items():
            import_source = Import.objects.create(
                org_unit=org_unit, month=month.strftime("%Y-%m"), source="IASO_ENTITIES"
            )
            for instance in group_instances:
                if form_type == "admission":
                    create_patient_and_first_record(instance, import_source)
                elif form_type == "followup":
                    create_followup_record(instance, import_source)


class DataImportError(Exception):
    """Custom exception for data import issues."""


def create_patient_and_first_record(instance, import_source):
    """
    Processes the file_content of a submission (assumed to be an Import instance)
    to create a Patient and their first Record if the patient doesn't exist.
    """
    file_content = instance.json
    org_unit = instance.org_unit
    if not isinstance(file_content, dict):
        raise DataImportError("file_content is not a dictionary.")

    # --- 1. Extract and Validate Patient Identifier ---
    # Prefer "computed_code_patient" if available, otherwise "code_patient"
    patient_identifier_code = file_content.get("computed_code_patient") or file_content.get("code_patient")
    if not patient_identifier_code:
        raise DataImportError(
            "Patient identifier ('computed_code_patient' or 'code_patient') is missing from file_content."
        )

    # --- 2. Fetch Related OrgUnit ---
    code_ets = file_content.get("code_ets")

    try:
        with transaction.atomic():
            # --- 3. Get or Create Patient ---
            # We use get_or_create to avoid creating duplicates based on identifier_code
            patient, patient_created = Patient.objects.get_or_create(
                identifier_code=patient_identifier_code,
                defaults={
                    "active": True,
                    "entity": instance.entity,
                },
            )

            if patient_created:
                print(f"Patient '{patient.identifier_code}' created.")
            else:
                print(f"Patient '{patient.identifier_code}' already exists. Proceeding to create record.")
                # If patient already exists, you might want to update their 'active' status
                # or 'entity' if it's different, though this function's primary goal
                # is for initial creation. For simplicity, we'll leave existing patient data as is,
                # except for 'last_record' later.

            # --- 4. Prepare Data for Record ---
            # Date conversions
            last_dispensation_date_str = file_content.get("adm_date_rapportage")
            last_dispensation_date = None
            if last_dispensation_date_str:
                try:
                    last_dispensation_date = datetime.datetime.strptime(last_dispensation_date_str, "%Y-%m-%d").date()
                except ValueError:
                    raise DataImportError(
                        f"Invalid date format for 'adm_date_rapportage': {last_dispensation_date_str}"
                    )

            days_dispensed_str = file_content.get("adm_jours_disp")
            days_dispensed = None
            if days_dispensed_str and days_dispensed_str.isdigit():
                days_dispensed = int(days_dispensed_str)
            elif days_dispensed_str:  # if it's not None but also not a digit
                raise DataImportError(f"Invalid value for 'adm_jours_disp': {days_dispensed_str}. Expected a number.")

            next_dispensation_date = None
            if last_dispensation_date and days_dispensed is not None:
                next_dispensation_date = last_dispensation_date + datetime.timedelta(days=days_dispensed)

            # Patient status mapping for boolean fields
            statut_patient = file_content.get("adm_statut_patient", "").lower()  # Use adm_statut_patient
            new_inclusion = statut_patient == "nv"
            transferred_elsewhere = statut_patient == "sa"
            transfer_in = statut_patient == "ti"
            return_to_care = False

            # Integer conversions with checks
            try:
                age = int(file_content.get("adm_age_patient"))
            except (ValueError, TypeError) as e:
                raise DataImportError(f"Invalid integer value for age or num_ordre: {e}")

            weight_str = file_content.get("adm_poids_patient")
            weight = int(weight_str) if weight_str and weight_str.isdigit() else None

            stable_str = file_content.get("adm_stable")  # from JSON it's "1"
            stable = int(stable_str) if stable_str and stable_str.isdigit() else None

            # --- 5. Create Record ---
            # Note: This creates a *new* record. If you have logic to update existing records
            # for a given period/patient, that would be more complex.
            # This function assumes it's for encoding the *first* or *a new* record.
            month = last_dispensation_date.strftime("%Y-%m")

            hiv_type = HIV_TYPE_MAPPING.get(file_content.get("type_vih"), HIV_UNKNOWN)

            gender = GENDER_MAPPING.get(file_content.get("adm_genre_patient", "").lower())

            district_name = org_unit.parent.name if org_unit.parent else "N/A"
            if org_unit.parent:
                district = org_unit.parent
                region_name = district.parent.name if district.parent else "N/A"
            else:
                region_name = "N/A"

            treatment_line = LINE_MAPPING.get(file_content.get("adm_ligne_thera"), TREATMENT_LINE_UNKNOWN)

            record = Record.objects.create(
                number=0,
                region=region_name,
                district=district_name,
                code_ets=code_ets,
                facility_name=org_unit.name,
                period=month,
                patient=patient,
                sex=gender,
                age=age,
                weight=weight,
                new_inclusion=new_inclusion,
                transfer_in=transfer_in,
                return_to_care=return_to_care,
                tb_hiv=file_content.get("adm_tb_vih") == "1",
                hiv_type=hiv_type,  # e.g., "1"
                treatment_line=treatment_line,  # e.g., "1"
                last_dispensation_date=last_dispensation_date,
                days_dispensed=days_dispensed,
                next_dispensation_date=next_dispensation_date,
                regimen=file_content.get("adm_regime"),
                stable=stable,
                received_arv=bool(days_dispensed and days_dispensed > 0),
                import_source=import_source,
                org_unit=org_unit,
                transfer_out=False,
                death=False,
                art_stoppage=False,
                served_elsewhere=transferred_elsewhere,  # not sure it's the right field, but it seems to fit
                instance=instance,
            )
            print(f"Record {record.id} created for patient '{patient.identifier_code}'.")

            # --- 6. Update Patient's last_record ---
            # Ensure this is the chronologically latest record if there's other import logic.
            # For this function, we assume this new record becomes the last_record.
            patient.last_record = record
            patient.save(update_fields=["last_record", "updated_at"])  # Also update 'entity' if modified

            patient.evaluate_loss(save=True)  # Uncomment if needed

            return patient, record

    except KeyError as e:
        raise DataImportError(f"Missing expected key in file_content: {e}")
    except ValueError as e:  # Catch potential int conversion errors not caught above
        raise DataImportError(f"Data type conversion error: {e}")


def create_followup_record(instance, import_source):
    """
    Processes follow-up form submissions (file_active_suivi) to create follow-up records
    for existing patients.

    Args:
        instance: An instance of the follow-up form submission
        import_source: The import source for tracking
    """
    file_content = instance.json
    org_unit = instance.org_unit

    if not isinstance(file_content, dict):
        raise DataImportError("file_content is not a dictionary.")

    # --- 1. Extract and Validate Patient Identifier ---
    # For follow-up forms, we need to find the existing patient
    patient_identifier_code = file_content.get("code_patient")
    if not patient_identifier_code:
        raise DataImportError("Patient identifier ('code_patient') is missing from file_content.")

    try:
        # Find the existing patient
        patient = Patient.objects.get(identifier_code=patient_identifier_code)
        print(f"Found existing patient '{patient.identifier_code}' for follow-up record.")
    except Patient.DoesNotExist:
        logger.warning(f"Patient with identifier '{patient_identifier_code}' not found. Skipping follow-up record.")
        return None

    # --- 2. Fetch Related OrgUnit ---
    code_ets = file_content.get("code_ets")

    try:
        with transaction.atomic():
            # --- 3. Prepare Data for Follow-up Record ---
            # Date conversions for follow-up forms
            visit_date_str = file_content.get("date_rapportage")
            visit_date = None
            if visit_date_str:
                try:
                    visit_date = datetime.datetime.strptime(visit_date_str, "%Y-%m-%d").date()
                except ValueError:
                    raise DataImportError(f"Invalid date format for visit date: {visit_date_str}")

            # Last dispensation date
            last_dispensation_date_str = file_content.get("date_der_disp")
            last_dispensation_date = None
            if last_dispensation_date_str:
                try:
                    last_dispensation_date = datetime.datetime.strptime(last_dispensation_date_str, "%Y-%m-%d").date()
                except ValueError:
                    raise DataImportError(
                        f"Invalid date format for last dispensation date: {last_dispensation_date_str}"
                    )

            # Patient basic information from follow-up form
            weight_str = file_content.get("rep_poids_patient")
            weight = int(weight_str) if weight_str and weight_str.isdigit() else None

            age_str = file_content.get("rep_age_patient")
            age = int(age_str) if age_str and age_str.isdigit() else None

            # Gender mapping
            gender = GENDER_MAPPING.get(file_content.get("genre_patient", "").lower())

            # Treatment information for follow-up
            regimen = file_content.get("regime")

            # Days dispensed in follow-up
            days_dispensed_str = file_content.get("jours_disp")
            days_dispensed = None
            if days_dispensed_str and days_dispensed_str.isdigit():
                days_dispensed = int(days_dispensed_str)

            # Next dispensation date calculation
            next_dispensation_date = None
            if last_dispensation_date and days_dispensed is not None:
                next_dispensation_date = last_dispensation_date + datetime.timedelta(days=days_dispensed)

            # Follow-up status indicators
            stable_str = file_content.get("rep_stable")
            stable = int(stable_str) if stable_str and stable_str.isdigit() else None

            # Patient status - check for follow-up specific statuses
            patient_status = file_content.get("rep_statut_patient", "").lower()

            # Patient outcomes for follow-up - these may need to be inferred from status #todo check this
            transfer_out = patient_status == "to"  # transfer out
            death = patient_status == "dc"  # deceased
            art_stoppage = patient_status == "at"  # ART stoppage
            served_elsewhere = patient_status == "se"  # served elsewhere
            return_to_care = patient_status == "rc"  # return to care

            # Treatment line for follow-up
            treatment_line_str = file_content.get("ligne_thera")
            treatment_line = LINE_MAPPING.get(treatment_line_str, TREATMENT_LINE_UNKNOWN)

            # HIV type for follow-up
            hiv_type_str = file_content.get("rep_type_vih")

            hiv_type = HIV_TYPE_MAPPING.get(hiv_type_str, HIV_UNKNOWN)

            # TB/HIV co-infection status
            tb_hiv = file_content.get("rep_tb_vih") == "1"

            # Org unit hierarchy
            district_name = org_unit.parent.name if org_unit.parent else "N/A"
            if org_unit.parent:
                district = org_unit.parent
                region_name = district.parent.name if district.parent else "N/A"
            else:
                region_name = "N/A"

            # Use visit date or current date for period
            period_date = visit_date or datetime.date.today()
            month = period_date.strftime("%Y-%m")

            # --- 4. Create Follow-up Record ---
            record = Record.objects.create(
                number=0,  # This may need to be calculated based on existing records
                region=region_name,
                district=district_name,
                code_ets=code_ets
                or (patient.last_record.code_ets if patient.last_record else ""),  # todo check this strange code
                facility_name=org_unit.name,
                period=month,
                patient=patient,
                sex=gender,
                age=age,
                weight=weight,
                new_inclusion=False,
                transfer_in=False,
                return_to_care=return_to_care,
                tb_hiv=tb_hiv,
                hiv_type=hiv_type,
                treatment_line=treatment_line,
                last_dispensation_date=last_dispensation_date,
                days_dispensed=days_dispensed,
                next_dispensation_date=next_dispensation_date,
                regimen=regimen,
                stable=stable,
                received_arv=bool(days_dispensed and days_dispensed > 0),
                import_source=import_source,
                org_unit=org_unit,
                transfer_out=transfer_out,
                death=death,
                art_stoppage=art_stoppage,
                served_elsewhere=served_elsewhere,
                instance=instance,
            )
            print(f"Follow-up record {record.id} created for patient '{patient.identifier_code}'.")

            # --- 5. Update Patient's last_record if this is the most recent ---
            # Update patient's last record if this follow-up is more recent
            if not patient.last_record or (
                record.last_dispensation_date
                and patient.last_record.last_dispensation_date
                and record.last_dispensation_date > patient.last_record.last_dispensation_date
            ):
                patient.last_record = record
                patient.save(update_fields=["last_record", "updated_at"])
            patient.evaluate_loss(save=True)
            return patient, record

    except Exception as e:
        logger.exception(f"Error creating follow-up record for patient {patient_identifier_code}: {e}")
        raise DataImportError(f"Failed to create follow-up record: {e}")
