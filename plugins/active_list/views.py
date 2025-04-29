import calendar
import hashlib
import os
import uuid
from datetime import timedelta
from datetime import datetime
from datetime import date
import datetime
import calendar
import pytz

import pandas as pd
import math
import openpyxl
from django.core.exceptions import FieldDoesNotExist

from django.db.models import Max
from django.http import HttpResponse
from django.db import models
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse


from django.shortcuts import render, get_object_or_404, redirect


from iaso.models import OrgUnit
from .forms import ValidationForm, ActivePatientsListForm
from .settings import OPENHEXA_USER, OPENHEXA_PASSWORD
from django.utils.encoding import smart_str
from .openhexa import *

from .models import (
    Import,
    SOURCE_EXCEL,
    Record,
    VALIDATION_STATUS_CHOICES,
    Validation,
    PATIENT_LIST_DISPLAY_FIELDS,
    HIV_UNKNOWN,
    HIV_HIV1,
    HIV_HIV2,
    HIV_HIV1_AND_2,
    PATIENT_HISTORY_DISPLAY_FIELDS,
    Patient,
    PatientInactiveEvent,
)
from ..polio.settings import DISTRICT

UPLOAD_FOLDER = "upload"  # Create this folder in your project directory
FA_DISTRICT_ORG_UNIT_TYPE_ID = os.environ.get("FA_DISTRICT_ORG_UNIT_TYPE_ID", 349)
FA_HF_ORG_UNIT_TYPE_ID = os.environ.get("FA_HF_ORG_UNIT_TYPE_ID", 350)

ALLOWED_EXTENSIONS = {"xlsx", "xls", "ods", "csv", "xlsb", "xltm", "xltx", "xlsm"}
OK = "OK"
ERROR_FILE_ALREADY_UPLOADED = "ERROR_FILE_ALREADY_UPLOADED"
ERROR_PERIOD_ALREADY_UPLOADED = "ERROR_PERIOD_ALREADY_UPLOADED"
ERROR_NO_FILE = "ERROR_NO_FILE"
ERROR_WRONG_FILE_FORMAT = "ERROR_WRONG_FILE_FORMAT"
ERROR_UNKNOWN = "ERROR_UNKNOWN"

RESPONSES = {
    OK: {"message": "Merci! Votre fichier est bien enregistré!", "status": 201},
    ERROR_FILE_ALREADY_UPLOADED: {
        "message": "Ce fichier a déjà été uploadé, êtes vous sûr?",
        "status": 400,
        "bypassable": True,
    },
    ERROR_PERIOD_ALREADY_UPLOADED: {
        "message": "Cette période a déjà été encodée pour cet établissement, êtes vous sûr de vouloir continuer?",
        "status": 400,
        "bypassable": True,
    },
    ERROR_NO_FILE: {"message": "Vous n'avez pas ajouté de fichier", "status": 400, "bypassable": False},
    ERROR_WRONG_FILE_FORMAT: {"message": "Ce fichier n'est pas un fichier excel", "status": 400, "bypassable": True},
    ERROR_UNKNOWN: {"message": "Erreur", "status": 400, "bypassable": False},
}


@login_required
def homepage(request):
    return render(request, "homepage.html", {})


@login_required
def patient_list(request):
    return render(
        request,
        "patient_list.html",
        {
            "FA_HF_ORG_UNIT_TYPE_ID": FA_HF_ORG_UNIT_TYPE_ID,
            "FA_DISTRICT_ORG_UNIT_TYPE_ID": FA_DISTRICT_ORG_UNIT_TYPE_ID,
        },
    )


@login_required
def completeness(request, region_id, month):
    # Get the OrgUnit object, or raise a 404 error if it doesn't exist
    region = get_object_or_404(OrgUnit, id=region_id)
    districts = OrgUnit.objects.filter(parent=region).order_by("name")

    active_patients_list = Record.objects.filter(org_unit=org_unit, period=month).order_by("id")

    context = {
        "org_unit": region,
        "active_patients": active_patients_list,
        "PATIENT_LIST_DISPLAY_FIELDS": PATIENT_LIST_DISPLAY_FIELDS,
    }

    # Render the template with the context data
    return render(request, "completeness.html", context)


@login_required
def patient_history(request):
    identifier = request.GET.get("identifier", "")
    if identifier:
        # Fetch the patient based on the identifier
        patient = get_object_or_404(Patient, identifier_code=identifier)

        latest_ids = Record.objects.filter(patient=patient).values("period").annotate(latest_id=Max("id"))

        records = Record.objects.filter(id__in=[item["latest_id"] for item in latest_ids]).order_by("-period")
        data = []
        for record in records:
            patient_object = {"Période": record.period[:7], "FOSA": record.org_unit.name}
            for field in PATIENT_HISTORY_DISPLAY_FIELDS:
                patient_object[PATIENT_HISTORY_DISPLAY_FIELDS[field]] = get_human_readable_value(record, field)
            data.append(patient_object)
        return render(request, "patient_history.html", {"data": data, "patient": patient})

    return render(request, "patient_history.html", {"data": []})


@login_required
def patient_search(request):
    return render(request, "patient_search.html", {})


@login_required
def import_detail_view(request, import_id):
    """
    View to display a single Import object and its associated ActivePatientsList entries in a table.
    Args:
        request: The HTTP request object.
        import_id: The ID of the Import object to retrieve.
    Returns:
        A rendered HTML template with the Import object and its ActivePatientsList entries.
    """
    # Get the Import object, or raise a 404 error if it doesn't exist
    import_obj = get_object_or_404(Import, id=import_id)

    # Get the ActivePatientsList entries associated with the Import, ordered by some field (e.g., 'id')
    active_patients_list = Record.objects.filter(import_source=import_obj).order_by("id")

    context = {
        "import_obj": import_obj,
        "active_patients": active_patients_list,
        "PATIENT_LIST_DISPLAY_FIELDS": PATIENT_LIST_DISPLAY_FIELDS,
    }

    # Render the template with the context data
    return render(request, "import.html", context)


@login_required
def upload(request):
    if request.method == "POST":
        org_unit_id = request.POST.get("org_unit_id")
        period = request.POST.get("period")
        bypass = request.POST.get("bypass")

        if "file" not in request.FILES:
            result = ERROR_NO_FILE
        else:
            file = request.FILES["file"]
            if file.name == "":
                result = ERROR_NO_FILE
            elif not allowed_file(file.name):
                result = ERROR_WRONG_FILE_FORMAT
            elif file and allowed_file(file.name):
                filename = smart_str(file.name)
                result = upload_to_openhexa(filename, file, org_unit_id, period, bypass)
            else:
                result = ERROR_UNKNOWN

        return JsonResponse(RESPONSES[result], status=RESPONSES[result]["status"])

    return render(
        request,
        "upload.html",
        {
            "FA_HF_ORG_UNIT_TYPE_ID": FA_HF_ORG_UNIT_TYPE_ID,
            "FA_DISTRICT_ORG_UNIT_TYPE_ID": FA_DISTRICT_ORG_UNIT_TYPE_ID,
        },
    )


@login_required
def validation(request):
    org_unit = None
    if request.method == "POST":
        form = ValidationForm(request.POST)
        if form.is_valid():
            form.instance.user_id = request.user.id
            form.instance.user_name = request.user.username
            form.instance.level = DISTRICT
            form.instance.save()
            # return redirect('validation_list') # Replace 'validation_list' with the actual URL name
    else:
        form = ValidationForm()
    return render(
        request,
        "validation.html",
        {
            "org_unit": org_unit,
            "statuses": VALIDATION_STATUS_CHOICES,
            "request": request,
            "form": form,
            "FA_HF_ORG_UNIT_TYPE_ID": FA_HF_ORG_UNIT_TYPE_ID,
            "FA_DISTRICT_ORG_UNIT_TYPE_ID": FA_DISTRICT_ORG_UNIT_TYPE_ID,
        },
    )


def patient_form(request, patient_id=None):
    """
    View for creating or updating an ActivePatientsList instance.
    """
    if patient_id:
        patient = get_object_or_404(Record, pk=patient_id)
        form = ActivePatientsListForm(request.POST or None, instance=patient)
    else:
        form = ActivePatientsListForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect("patient_list")  # Replace 'patient_list' with your list view name

    res = render(request, "patient_form.html", {"form": form, "patient_id": patient_id})

    return res


def active_count(org_unit_id):
    return Patient.objects.filter(active=True).filter(last_record__org_unit_id=org_unit_id).count()


def received_count(org_unit_id, month):
    """
    Returns the count of ActivePatientsList entries for a given org_unit and month.
    """
    latest_ids = Record.objects.filter(org_unit_id=org_unit_id).annotate(latest_id=Max("id"))

    records = Record.objects.filter(id__in=[item["latest_id"] for item in latest_ids])
    records = filter_received_patients_for_the_month(records, month)
    return records.count()


def stats(org_unit_id, month):
    """
    Returns the count of ActivePatientsList entries for a given org_unit and month.
    """
    previous_month = get_previous_period(month) + "-01"
    anteprevious_month = get_previous_period(month) + "-01"
    month = month + "-01"
    latest_ids = Record.objects.filter(org_unit_id=org_unit_id).values("id").annotate(latest_id=Max("id"))

    records = Record.objects.filter(id__in=[item["latest_id"] for item in latest_ids])

    """
    Perdus de Vue, Décédés et Arrêts de Traitement
    Nouvelles inclusions
    Patient de retour après interruption
    This is not correct, we need to check better this code
    """
    lost = (
        PatientInactiveEvent.objects.filter(org_unit_id=org_unit_id)
        .filter(date__gte=previous_month)
        .filter(date__lt=month)
        .count()
    )
    previous_lost = (
        PatientInactiveEvent.objects.filter(org_unit_id=org_unit_id)
        .filter(date__gte=anteprevious_month)
        .filter(date__lt=previous_month)
        .count()
    )

    records = filter_received_patients_for_the_month(records, month)
    previous_records = filter_received_patients_for_the_month(records, previous_month)
    deceased = records.filter(death=True).count()
    previous_deceased = previous_records.filter(death=True).count()
    stopped = records.filter(art_stoppage=True).count()
    previous_stopped = previous_records.filter(art_stoppage=True).count()
    new = records.filter(new_inclusion=True).count()
    previous_new = previous_records.filter(new_inclusion=True).count()
    return_to_care = records.filter(return_to_care=True).count()
    previous_return_to_care = previous_records.filter(return_to_care=True).count()

    return {
        "Perdu de vue": "%d (%d)" % (lost, previous_lost),
        "Décédé": "%d (%d)" % (deceased, previous_deceased),
        "Arrêt TAR": "%d (%d)" % (stopped, previous_stopped),
        "Nouveau": "%d (%d)" % (new, previous_new),
        "Retour en soin": "%d (%d)" % (return_to_care, previous_return_to_care),
    }


def get_previous_period(period):
    """
    Computes the 'yy-mm' format for the month preceding the given period.

    Args:
        period (str): The current period in "yy-mm" format.

    Returns:
        str: The previous month in "yy-mm" format.
    """

    # Convert the period string to a datetime object
    current_date = datetime.datetime.strptime(period, "%Y-%m")

    # Subtract one month using timedelta
    first_of_current_month = current_date.replace(day=1)
    last_of_previous_month = first_of_current_month - timedelta(days=1)

    # Format the result back to "yy-mm"
    previous_period = last_of_previous_month.strftime("%Y-%m")
    return previous_period


@login_required
def validation_api(request, org_unit_id, month):
    org_units = OrgUnit.objects.filter(parent_id=org_unit_id).order_by("name")
    previous_period = get_previous_period(month)
    table_content = []
    report_count = 0
    for org_unit in org_units:
        obj = {}
        obj["Site"] = org_unit.name
        latest_import = Import.objects.filter(org_unit=org_unit).filter(month=month).order_by("-creation_date").first()

        obj["A rapporté"] = "Non"
        obj["Actifs"] = ""
        obj["Reçus"] = ""
        obj.update(stats(org_unit.id, month))
        obj["Statut"] = ""
        obj["Observation"] = ""
        obj["Niveau Validation"] = ""
        obj["Dernière modification"] = ""
        obj["import_id"] = None

        if latest_import:
            report_count = report_count + 1
            obj["A rapporté"] = "Oui"
            latest_validation = (
                Validation.objects.filter(period=month).filter(org_unit_id=org_unit_id).order_by("-created_at").first()
            )
            obj["Actifs"] = active_count(org_unit_id)
            obj["Reçus"] = "%d (%d)" % (
                received_count(org_unit_id, month),
                received_count(org_unit_id, previous_period),
            )
            if latest_validation:
                obj["Statut"] = latest_validation.validation_status
                obj["Observation"] = latest_validation.comment
                obj["Niveau Validation"] = latest_validation.level
            else:
                obj["Statut"] = ""
                obj["Observation"] = ""
                obj["Niveau Validation"] = ""
            obj["Dernière modification"] = latest_import.creation_date.strftime(("%d/%m/%y %H:%M:%S"))
            obj["import_id"] = latest_import.id
        table_content.append(obj)

    res = {"table_content": table_content, "completeness": "%s/%s" % (report_count, len(org_units))}
    return JsonResponse(res, status=200, safe=False)


def get_human_readable_value(model_instance, field_name):
    """
    Returns the human-readable value of a choice field in a Django model.

    Args:
      model_instance: An instance of a Django model.
      field_name: The name of the choice field.

    Returns:
      The human-readable value of the field, or None if the field is not a choice field
      or does not exist.
    """
    try:
        field = model_instance._meta.get_field(field_name)
        if field.choices:
            method_name = f"get_{field_name}_display"
            return getattr(model_instance, method_name)()
        elif isinstance(field, models.BooleanField):
            return "Oui" if getattr(model_instance, field_name) else "Non"
    except FieldDoesNotExist:
        return None

    return getattr(model_instance, field_name)


def get_first_and_last_day(date_str):
    """
    Calculates the first and last day of the month given a date string in the format "YYYY-MM".

    Args:
      date_str: A string representing the year and month in the format "YYYY-MM".

    Returns:
      A tuple containing two strings:
        - The first day of the month in the format "YYYY-MM-DD".
        - The last day of the month in the format "YYYY-MM-DD".
    """
    year, month = map(int, date_str[:7].split("-"))

    # Get the number of days in the month
    _, last_day = calendar.monthrange(year, month)

    # Format the first and last days
    first_day_str = f"{year}-{month:02d}-01"
    last_day_str = f"{year}-{month:02d}-{last_day}"

    return first_day_str, last_day_str


def filter_expected_patients_for_the_month(patients, month):
    first_day_str, last_day_str = get_first_and_last_day(month)
    return patients.filter(next_dispensation_date__gte=first_day_str).filter(next_dispensation_date__lte=last_day_str)


def filter_received_patients_for_the_month(patients, month):
    first_day_str, last_day_str = get_first_and_last_day(month)
    return patients.filter(last_dispensation_date__gte=first_day_str).filter(last_dispensation_date__lte=last_day_str)


@login_required
def patient_list_api(request, org_unit_id, month):
    format = request.GET.get("format", "json")
    mode = request.GET.get("mode", "default")

    if mode == "default":
        last_import = Import.objects.filter(org_unit=org_unit_id)
        last_import = last_import.filter(month=month).order_by("-creation_date").first()
        records = Record.objects.filter(import_source=last_import).order_by("number")
    elif mode == "expected":
        records = Record.objects.filter(org_unit_id=org_unit_id)
        records = filter_expected_patients_for_the_month(records, month).order_by("next_dispensation_date")
    elif mode == "active":
        records = Record.objects.filter(patient__active=True).filter(org_unit_id=org_unit_id)
    elif mode == "lost":
        first_day, last_day = get_first_and_last_day(month)
        inactive_events = (
            PatientInactiveEvent.objects.filter(org_unit_id=org_unit_id)
            .filter(date__gte=first_day)
            .filter(date__lte=last_day)
        )
        records = [event.last_patient_record_at_time_of_loss for event in inactive_events]

    if format == "xls":
        org_unit = OrgUnit.objects.get(pk=org_unit_id)
        return export_active_patients_excel(records, org_unit.name, month)
    else:
        table_content = []
        for record in records:
            patient_object = {"Code identifiant": record.patient.identifier_code, "Actif": record.patient.active}

            for field in PATIENT_LIST_DISPLAY_FIELDS:
                patient_object[PATIENT_LIST_DISPLAY_FIELDS[field]] = get_human_readable_value(record, field)
                if mode in ("expected", "lost", "active"):
                    if field == "days_dispensed":
                        patient_object["Date de rupture"] = get_human_readable_value(record, "next_dispensation_date")
            patient_object["Voir"] = (
                '<a href="/active_list/patient_history/?identifier=%s">Voir</a>' % record.patient.identifier_code
            )
            table_content.append(patient_object)
        res = {
            "table_content": table_content,
        }
        if format == "json":
            return JsonResponse(res, status=200, safe=False)
        else:
            return render(request, "partials/patient_table.html", {"data": table_content})


@login_required
def patient_search_api(request):
    """
    View to handle search functionality for patients.
    """
    # Perform search logic here (e.g., filter ActivePatientsList based on query)
    query = request.GET.get("query", "")
    patients = (
        Patient.objects.filter(identifier_code__icontains=query)
        .distinct("identifier_code")
        .order_by("identifier_code")[:20]
    )
    table_content = []
    for patient in patients:
        patient_object = {}
        last_record = patient.last_record

        patient_object["Code identificateur"] = patient.identifier_code
        patient_object["Sexe"] = get_human_readable_value(last_record, "sex")
        patient_object["Âge"] = get_human_readable_value(last_record, "age")
        patient_object["Poids"] = get_human_readable_value(last_record, "weight")

        patient_object["Voir"] = (
            '<a href="/active_list/patient_history/?identifier=%s">Voir</a>' % patient.identifier_code
        )
        table_content.append(patient_object)
    # Render the results in a template
    return render(request, "partials/patient_table.html", {"data": table_content})


def export_active_patients_excel(active_patients, name, period):
    workbook = openpyxl.Workbook()
    worksheet = workbook.active

    # Add headers using French names from PATIENT_LIST_DISPLAY_FIELDS
    headers = list(PATIENT_LIST_DISPLAY_FIELDS.values())
    for col_num, header in enumerate(headers, 1):
        worksheet.cell(row=1, column=col_num).value = header

    for row_num, patient in enumerate(active_patients, 2):
        for col_num, field in enumerate(PATIENT_LIST_DISPLAY_FIELDS.keys(), 1):
            worksheet.cell(row=row_num, column=col_num).value = get_human_readable_value(patient, field)

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = 'attachment; filename="active_patients-%s-%s.xlsx"' % (name, period)
    workbook.save(response)
    return response


def check_presence(file_hash, org_unit_id, month):
    hash_exists = Import.objects.filter(hash_key=file_hash).exists()
    period_exists = Import.objects.filter(org_unit_id=org_unit_id, month=month).exists()

    if hash_exists:
        return "ERROR_FILE_ALREADY_UPLOADED"

    if period_exists:
        return "ERROR_PERIOD_ALREADY_UPLOADED"
    return "OK"


def hash_blob(binary_blob):
    """
    Calculates the SHA-256 hash of a binary blob.

    Args:
      binary_blob: The binary data as bytes.

    Returns:
      The hexadecimal representation of the SHA-256 hash.
    """

    hasher = hashlib.sha256()
    hasher.update(binary_blob)
    return hasher.hexdigest()


def upload_to_openhexa(file_name, file, org_unit_id, month, bypass=False):
    client = OpenHEXAClient("https://app.openhexa.org/")
    client.authenticate(with_credentials=(OPENHEXA_USER, OPENHEXA_PASSWORD), with_token=None)
    content = file.read()
    h = hash_blob(content)
    result = check_presence(h, org_unit_id, month)
    # TODO store all the errors of the file and not only one of the error results
    file_check = result
    name_exists = Import.objects.filter(file_name=file_name).exists()
    if name_exists:
        base, ext = os.path.splitext(file_name)  # Split into base name and extension
        file_name = f"{base}_{uuid.uuid4()}{ext}"
    if bypass:
        result = OK
    if result == OK:
        client.upload_object(
            "civ-lhspla-file-active-db7fae",
            "uploads-lhspla/%s" % file_name,
            content,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        i = Import(
            hash_key=h,
            file_name=file_name,
            org_unit_id=org_unit_id,
            month=month,
            file_check=file_check,
            source=SOURCE_EXCEL,
        )
        i.save()
        import_data(content, i)
    return result


def validate_import(the_import):
    month = the_import.month
    import_lines = Record.objects.filter(import_source=the_import)
    viewed_patients_count = filter_expected_patients_for_the_month(import_lines, month).count()
    latest_ids = (
        Record.objects.filter(org_unit_id=the_import.org_unit_id)
        .values("identifier_code")
        .annotate(latest_id=Max("id"))
    )

    active_list = Record.objects.filter(id__in=[item["latest_id"] for item in latest_ids])

    patients = patients.filter(active=True).filter(org_unit_id=org_unit_id)


def check_file(file):
    # To implement
    # warning on multiple sheets
    # needed columns are not there -> refuse file
    # unrecognized value in column
    # wrong value in column (wrong type, wrong choice in a selection
    # name of facility does not match with the one that was picked
    pass


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def month_string_to_utc_timestamp(month_string):
    """
    Converts a month string in "YYYY-MM" format to a UTC timestamp representing the first day of the month.
    """
    year, month = map(int, month_string.split("-"))
    dt = datetime.datetime(year, month, 1, tzinfo=pytz.utc)
    timestamp = calendar.timegm(dt.utctimetuple())
    return dt


def import_data(file, the_import):
    # the code of this function is relatively bad, it has been generated by AI
    pd.set_option("display.max_rows", None)
    pd.set_option("display.max_columns", None)

    # Read the CSV file into a DataFrame
    df = pd.read_excel(file, sheet_name=0)
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)  # trimming all white spaces
    # Rename columns
    df = df.rename(
        columns={
            "N°": "number",
            "CODE ETS": "code_ets",
            "CODE": "code_ets",
            "NOM ETABLISSEMENT": "facility_name",
            "Periode": "period",
            "MOIS DE RAPPORTAGE": "period",
            "CODE IDENTIFIANT": "identifier_code",
            "SEXE": "sex",
            "POIDS": "weight",
            "Nouvelle inclusion": "new_inclusion",
            "Transfert-In": "transfer_in",
            "Retour dans les soins": "return_to_care",
            "TB / VIH": "tb_hiv",
            "Type de VIH": "hiv_type",
            "Régime": "REGIME",
            "régime": "REGIME",
            "regime": "REGIME",
            "Ligne therapeuthique": "treatment_line",
            "Ligne thérapeutique": "treatment_line",
            "Date de la dernière dispensation": "last_dispensation_date",
            "Nombre de jours dispensés": "days_dispensed",
            "STABLE": "stable",
            "Transfert Out": "transfer_out",
            "Décès": "death",
            "Arrêt TARV": "art_stoppage",
            "Servi ailleurs": "served_elsewhere",
        }
    )

    # Convert columns to boolean
    for col in [
        "new_inclusion",
        "transfer_in",
        "return_to_care",
        "tb_hiv",
        "transfer_out",
        "death",
        "art_stoppage",
        "served_elsewhere",
    ]:
        df[col] = df[col].apply(lambda x: True if x == 1 else False)

    # Map values in column `stable`
    df["stable"] = df["stable"].replace({"Oui": True, "Non": False})
    df["sex"] = df["sex"].replace({"F": "FEMALE", "M": "MALE"})
    df["treatment_line"] = df["treatment_line"].replace(
        {
            "1er Ligne": "1STLINE",
            "2e Ligne": "2NDLINE",
            "3e Ligne": "3RDLINE",
            "1": "1STLINE",
            "2": "2NDLINE",
            "3": "3RDLINE",
            1: "1STLINE",
            2: "2NDLINE",
            3: "3RDLINE",
        }
    )

    df["REGIME"] = df["REGIME"].replace(
        {
            "TDF 3TC DTG": "TDF/3TC/DTG",
            "ABC 3TC DTG": "ABC/3TC/DTG",
            "ABC 3TC ATV-r": "ABC/3TC/ATV-r",
            "ABC 3TC EFV": "ABC/3TC/EFV",
            "ABC 3TC LPV-r": "ABC/3TC/LPV-r",
            "ABC 3TC NVP": "ABC/3TC/NVP",
            "AZT 3TC ABC": "AZT/3TC/ABC",
            "AZT 3TC ATV-r": "AZT/3TC/ATV-r",
            "AZT 3TC DTG": "AZT/3TC/DTG",
            "AZT 3TC EFV": "AZT/3TC/EFV",
            "AZT 3TC LPV-r": "AZT/3TC/LPV-r",
            "AZT 3TC TDF": "AZT/3TC/TDF",
            "TDF 3TC ATV-r": "TDF/3TC/ATV-r",
            "TDF 3TC EFV": "TDF/3TC/EFV",
            "TDF 3TC LPV-r": "TDF/3TC/LPV-r",
        }
    )

    df["hiv_type"] = df["hiv_type"].replace(
        {
            1: HIV_HIV1,
            2: HIV_HIV2,
            "1&2": HIV_HIV1_AND_2,
            math.nan: HIV_UNKNOWN,
            "nan": HIV_UNKNOWN,
            "VIH 1 + 2": HIV_HIV1_AND_2,
            "VIH 1": HIV_HIV1,
            "VIH 2": HIV_HIV2,
        }
    )

    # Convert `last_dispensation_date` to datetime
    df["last_dispensation_date"] = pd.to_datetime(df["last_dispensation_date"])

    # Create a list of dictionaries
    data = []
    for _, row in df.iterrows():
        data.append(
            {
                "number": row["number"],
                "region": row["REGION"],
                "district": row["DISTRICT"],
                "code_ets": row["code_ets"],
                "facility_name": row.get("facility_name") if row.get("facility_name") else "",
                "period": row["period"],
                "identifier_code": row["identifier_code"],
                "sex": row["sex"],
                "age": row["AGE"],
                "weight": row["weight"] if not math.isnan(row["weight"]) else None,
                "new_inclusion": row["new_inclusion"],
                "transfer_in": row["transfer_in"],
                "return_to_care": row["return_to_care"],
                "tb_hiv": row["tb_hiv"],
                "hiv_type": row["hiv_type"],
                "treatment_line": row["treatment_line"],
                "last_dispensation_date": row["last_dispensation_date"],
                "days_dispensed": row["days_dispensed"],
                "regimen": row["REGIME"],
                "stable": row["stable"],
                "transfer_out": row["transfer_out"],
                "death": row["death"],
                "art_stoppage": row["art_stoppage"],
                "served_elsewhere": row["served_elsewhere"],
            }
        )
    # this will need to be updated to use batched queries
    for row in data:
        active = not (
            row["art_stoppage"] or row["death"]
        )  # will need to decide what to do with row["served_elsewhere"] row["transfer_out"]
        next_dispensation_date = row["last_dispensation_date"] + timedelta(days=row["days_dispensed"])

        patient, created = Patient.objects.get_or_create(identifier_code=row["identifier_code"])
        new_period = row["period"]

        record = Record(
            number=row["number"],
            region=row["region"],
            district=row["district"],
            code_ets=row["code_ets"],
            facility_name=row["facility_name"],
            sex=row["sex"],
            age=row["age"],
            weight=row["weight"],
            new_inclusion=row["new_inclusion"],
            transfer_in=row["transfer_in"],
            return_to_care=row["return_to_care"],
            tb_hiv=row["tb_hiv"],
            hiv_type=row["hiv_type"],
            treatment_line=row["treatment_line"],
            last_dispensation_date=row["last_dispensation_date"],
            days_dispensed=row["days_dispensed"],
            next_dispensation_date=next_dispensation_date,
            regimen=row["regimen"],
            stable=row["stable"],
            transfer_out=row["transfer_out"],
            death=row["death"],
            art_stoppage=row["art_stoppage"],
            served_elsewhere=row["served_elsewhere"],
            import_source=the_import,
            org_unit=the_import.org_unit,
            patient=patient,
            period=row["period"],
        )
        record.save()

        if created:
            patient.active = active
            patient.last_record = record
            print("Creating patient %s" % patient.identifier_code, "record", record.id)
        else:
            if not (patient.last_record) or (new_period.strftime("%y-%m") > patient.last_record.period[:7]):
                patient.active = active
                print("Updating patient %s" % patient.identifier_code, "record", record.id)
                patient.last_record = record
        patient.save()
        patient.evaluate_loss(save=True)
