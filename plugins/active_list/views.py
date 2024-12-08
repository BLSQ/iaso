import hashlib
import os
import uuid
import pandas as pd
import math

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render

from iaso.models import OrgUnit
from .settings import OPENHEXA_USER, OPENHEXA_PASSWORD
from django.utils.encoding import smart_str
from .openhexa import *

from .models import (
    Import,
    SOURCE_EXCEL,
    ActivePatientsList,
    VALIDATION_STATUS_CHOICES,
    Validation,
    PATIENT_LIST_DISPLAY_FIELDS,
)

UPLOAD_FOLDER = "upload"  # Create this folder in your project directory

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
    return render(request, "patient_list.html", {})


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

    return render(request, "upload.html", {})


@login_required
def validation(request, org_unit_id=None, period=None):
    org_unit = None

    return render(
        request,
        "validation.html",
        {
            "org_unit": org_unit,
            "period": period,
            "statuses": VALIDATION_STATUS_CHOICES,
            "request": request,
        },
    )


def validation_api(request, org_unit_id, period):
    org_units = OrgUnit.objects.filter(parent_id=org_unit_id).order_by("name")

    table_content = []
    report_count = 0
    for org_unit in org_units:
        obj = {}
        obj["Site"] = org_unit.name
        latest_import = Import.objects.filter(org_unit=org_unit).filter(month=period).order_by("-creation_date").first()
        if latest_import:
            report_count = report_count + 1
            obj["A rapporté"] = "Oui"
            latest_validation = Validation.objects.filter(source_import=latest_import).order_by("-created_at").first()
            if latest_validation:
                obj["Statut"] = latest_validation.validation_status
                obj["Observation"] = latest_validation.comment
            else:
                obj["Statut"] = ""
                obj["Observation"] = ""
            obj["Dernière modification"] = latest_import.creation_date.strftime(("%d/%m/%y %H:%M:%S"))
        else:
            obj["A rapporté"] = "Non"
            obj["Statut"] = ""
            obj["Observation"] = ""
            obj["Dernière modification"] = ""
        table_content.append(obj)

    res = {"table_content": table_content, "completeness": "%s/%s" % (report_count, len(org_units))}
    return JsonResponse(res, status=200, safe=False)


def patient_list_api(request, org_unit_id, period):
    last_import = Import.objects.filter(org_unit=org_unit_id).filter(month=period).order_by("-creation_date").first()
    patients = ActivePatientsList.objects.filter(import_source=last_import).order_by("number").all()

    table_content = []
    for patient in patients:
        patient_object = {}
        for field in PATIENT_LIST_DISPLAY_FIELDS:
            patient_object[PATIENT_LIST_DISPLAY_FIELDS[field]] = getattr(patient, field)
        table_content.append(patient_object)
    print(table_content)
    res = {
        "table_content": table_content,
        # "completeness": "%s/%s" % (report_count, len(org_units))
    }
    return JsonResponse(res, status=200, safe=False)


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


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def import_data(file, the_import):
    # the code of this function is relatively bad, it has been generated by AI
    pd.set_option("display.max_rows", None)
    pd.set_option("display.max_columns", None)

    # Read the CSV file into a DataFrame
    df = pd.read_excel(file, sheet_name=0)

    # Rename columns
    df = df.rename(
        columns={
            "N°": "number",
            "CODE ETS": "code_ets",
            "NOM ETABLISSEMENT": "facility_name",
            "Periode": "period",
            "CODE IDENTIFIANT": "identifier_code",
            "SEXE": "sex",
            "POIDS": "weight",
            "Nouvelle inclusion": "new_inclusion",
            "Transfert-In": "transfer_in",
            "Retour dans les soins": "return_to_care",
            "TB / VIH": "tb_hiv",
            "Type de VIH": "hiv_type",
            "Ligne therapeuthique": "treatment_line",
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
    df["stable"] = df["stable"].map({"Oui": True, "Non": False})
    df["sex"] = df["sex"].map({"F": "FEMALE", "M": "MALE"})
    df["treatment_line"] = df["treatment_line"].map(
        {"1er Ligne": "1STLINE", "2e Ligne": "2NDLINE", "3e Ligne": "3RDLINE"}
    )
    df["hiv_type"] = df["hiv_type"].map({"1": "HIV1", "2": "HIV2", "1&2": "HIV 1&2"})

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
                "facility_name": row["facility_name"],
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

    # Create ActivePatientsList objects
    active_patients_list = []

    for row in data:
        active_patients_list.append(
            ActivePatientsList(
                number=row["number"],
                region=row["region"],
                district=row["district"],
                code_ets=row["code_ets"],
                facility_name=row["facility_name"],
                period=row["period"],
                identifier_code=row["identifier_code"],
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
                regimen=row["regimen"],
                stable=row["stable"],
                transfer_out=row["transfer_out"],
                death=row["death"],
                art_stoppage=row["art_stoppage"],
                served_elsewhere=row["served_elsewhere"],
                active=True,
                import_source=the_import,
                validation_status="waiting_for_validation",
                org_unit=the_import.org_unit,
            )
        )

    # Save the objects into the database
    ActivePatientsList.objects.bulk_create(active_patients_list)
