import datetime
import os
import uuid

from logging import getLogger

from django.core.files.base import ContentFile
from django.forms.models import model_to_dict
from django_xlsform_validator.validation import NamedBytesIO, XLSFormValidator

from beanstalk_worker import task_decorator
from hat.sync.views import process_instance_file
from iaso.api.instances.instances import import_data
from iaso.models import Form, FormVersion, Instance
from plugins.active_list.models import TREATMENT_1STLINE, TREATMENT_2NDLINE, TREATMENT_3RDLINE, Patient, Record


logger = getLogger(__name__)

HIV_MAPPING = {
    "HIV 1&2": "12",
    "HIV1": "1",
    "HIV2": "2",
}

LINE_MAPPING = {TREATMENT_1STLINE: "1", TREATMENT_2NDLINE: "2", TREATMENT_3RDLINE: "3"}

REGISTRY_FORM_ID = os.environ.get("REGISTRY_FORM_ID", 1)
REGISTRY_FORM_VERSION = os.environ.get("REGISTRY_FORM_VERSION", "2025050304")
ENTITY_TYPE_ID = int(os.environ.get("ENTITY_TYPE_ID", 1))
xml_template = """<?xml version='1.0' ?><data id="file_active_admission" version="{REGISTRY_FORM_VERSION}" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:orx="http://openrosa.org/xforms" xmlns:odk="http://www.opendatakit.org/xforms">
    <main_title>
        <statut>
            <adm_statut_patient>{adm_statut_patient}</adm_statut_patient>
        </statut>
        <group_entete>
            <code_ets>{code_ets}</code_ets>
            <adm_date_rapportage>{adm_date_rapportage}</adm_date_rapportage>
            <adm_resp_ex>{adm_resp_ex}</adm_resp_ex>
        </group_entete>
        <group_identifiant>
            <code_site>{code_site}</code_site>
            <annee>{annee}</annee>
            <num_ordre>{num_ordre}</num_ordre>
            <enfant>{enfant}</enfant>
            <code_enfant>{code_enfant}</code_enfant>
        </group_identifiant>
        <code>
            <inserted_code_patient/>
            <computed_code_patient>{adm_code_patient}</computed_code_patient>
            <adm_code_patient>{adm_code_patient}</adm_code_patient>
            <note_1/>
        </code>
        <group_suivi_patient>
            <adm_genre_patient>{adm_genre_patient}</adm_genre_patient>
            <adm_age_patient>{adm_age_patient}</adm_age_patient>
            <adm_poids_patient>{adm_poids_patient}</adm_poids_patient>
            <adm_jours_disp>{adm_jours_disp}</adm_jours_disp>
            <adm_regime>{adm_regime}</adm_regime>
            <adm_stable>{adm_stable}</adm_stable>
            <adm_tb_vih>{adm_tb_vih}</adm_tb_vih>
            <adm_type_vih>{adm_type_vih}</adm_type_vih>
            <adm_ligne_thera>{adm_ligne_thera}</adm_ligne_thera>
        </group_suivi_patient>
    </main_title>
    <statut_patient>{statut_patient}</statut_patient>
    <code_patient>{code_patient}</code_patient>
    <genre_patient>{genre_patient}</genre_patient>
    <age_patient>{age_patient}</age_patient>
    <poids_patient>{poids_patient}</poids_patient>
    <stable>{stable}</stable>
    <tb_vih>{tb_vih}</tb_vih>
    <type_vih>{type_vih}</type_vih>
    <adm_is_done>{adm_is_done}</adm_is_done>
    <meta>
    <instanceID>uuid:{instanceID}</instanceID>
    </meta>
</data>
"""


@task_decorator(task_name="export_records_to_entities")
def export_records_to_entities(task=None):
    """Finds all records without an entity and creates a registration for them."""

    task.report_progress_and_stop_if_killed(
        progress_value=1,
        end_value=6,
        progress_message="Starting export of records to entities",
    )

    # Get records without instances
    records = Record.objects.filter(instance__isnull=True)
    patients = Patient.objects.filter(last_record__in=records).distinct()

    task.report_progress_and_stop_if_killed(
        progress_value=2,
        end_value=6,
        progress_message=f"Found {patients.count()} patients with records needing entities",
    )

    # Get required forms
    form = Form.objects.get(form_id="file_active_excel_validation")
    form_version = FormVersion.objects.filter(form=form).order_by("created_at").last()

    task.report_progress_and_stop_if_killed(
        progress_value=3,
        end_value=6,
        progress_message="Forms loaded. Setting up XLS validator",
    )

    # Set up XLS validator
    validator = XLSFormValidator()
    with open("plugins/active_list/data/file_active_import_checker.xlsx", "rb") as f:
        content = f.read()

    named_buffer = NamedBytesIO(content, name="plugins/active_list/data/file_active_import_checker.xlsx")
    validator.parse_xlsform(named_buffer)

    task.report_progress_and_stop_if_killed(
        progress_value=4,
        end_value=6,
        progress_message="XLS validator ready. Processing patients",
    )

    processed_count = 0
    total_patients = patients.count()

    for patient in patients:
        try:
            # Create registration if patient doesn't have an entity
            if not patient.entity:
                create_registration(patient)
                patient.refresh_from_db()
                logger.info(f"Entity created for patient {patient.identifier_code}: {patient.entity}")

            # Process non-converted records
            non_converted_records = patient.records.filter(instance__isnull=True)
            for record in non_converted_records:
                d = model_to_dict(record)
                logger.debug(f"Processing record data: {d}")

                d_converted = convert_to_xml_schema(d)
                logger.debug(f"Converted record data: {d_converted}")
                d_converted["identifier_code"] = patient.identifier_code

                xml_result = validator.generate_xml_from_dict(d_converted)

                # Clean up XML result
                xml_result = xml_result.replace("1.0", form_version.version_id)
                xml_result = xml_result.replace("{'instanceID': None}", "")
                xml_result = xml_result.replace("None", "data")

                logger.debug(f"Generated XML: {xml_result}")

                the_uuid = str(uuid.uuid4())
                file_name = f"xls_import_from_xls{the_uuid}.xml"
                instance_file = ContentFile(xml_result, name=file_name)

                timestamp = int(record.import_source.creation_date.timestamp() * 1000)
                instance_body = [
                    {
                        "id": the_uuid,
                        "latitude": None,
                        "longitude": None,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                        "orgUnitId": record.org_unit_id,
                        "formId": form.id,
                        "accuracy": 0,
                        "altitude": 0,
                        "file": file_name,
                        "name": "Excel import",
                        "entityUuid": patient.entity.uuid,
                        "entityTypeId": ENTITY_TYPE_ID,
                    }
                ]
                logger.debug(f"Instance body: {instance_body}")

                import_data(instance_body, record.import_source.user, "fileactive")
                instance = Instance.objects.get(uuid=the_uuid)
                process_instance_file(instance, instance_file, record.import_source.user)
                record.instance = instance
                record.save()

            processed_count += 1

        except Exception as e:
            logger.exception(f"Error processing patient {patient.identifier_code}: {e}")
            continue

    task.report_progress_and_stop_if_killed(
        progress_value=5,
        end_value=6,
        progress_message=f"Processed {processed_count} of {total_patients} patients",
    )

    task.report_success(
        message=f"Export completed successfully. Processed {processed_count} patients with {records.count()} records.",
    )


def create_registration(patient):
    """Create registration XML and instance for a patient"""
    xml = xml_template
    the_uuid = str(uuid.uuid4())
    file_name = f"register_from_xls{the_uuid}.xml"

    identifier_code = patient.identifier_code

    split = identifier_code.split("/")
    code_ets, code_site, annee, num_ordre = split[0], split[1], split[2], split[3]
    if len(split) == 5:
        code_enfant = split[4]
    else:
        code_enfant = ""

    # Patient data mapping
    genre = "m" if patient.last_record.sex == "H" else "f"
    tb_vih = 1 if patient.last_record.tb_hiv else 0
    hiv_type = HIV_MAPPING.get(patient.last_record.hiv_type, "1")

    form = Form.objects.get(form_id="file_active_admission")
    form_version = FormVersion.objects.filter(form=form).order_by("created_at").last()

    variables = {
        "REGISTRY_FORM_VERSION": form_version.version_id,
        "adm_statut_patient": "nv",
        "statut_patient": "nv",
        "code_patient": identifier_code,
        "adm_code_patient": identifier_code,
        "code_ets": code_ets,
        "code_site": code_site,
        "adm_date_rapportage": patient.last_record.import_source.creation_date.strftime("%Y-%m-%d"),
        "annee": annee,
        "num_ordre": num_ordre,
        "code_enfant": code_enfant,
        "adm_genre_patient": genre,
        "genre_patient": genre,
        "adm_age_patient": patient.last_record.age,
        "age_patient": patient.last_record.age,
        "adm_poids_patient": patient.last_record.weight,
        "poids_patient": patient.last_record.weight,
        "adm_jours_disp": patient.last_record.days_dispensed,
        "adm_regime": patient.last_record.regimen,
        "adm_stable": patient.last_record.stable,
        "stable": patient.last_record.stable,
        "adm_tb_vih": tb_vih,
        "tb_vih": tb_vih,
        "adm_type_vih": hiv_type,
        "type_vih": hiv_type,
        "adm_ligne_thera": "1" if patient.last_record.treatment_line == "" else 2,
        "adm_resp_ex": patient.last_record.import_source.user.username
        if patient.last_record.import_source.user
        else "",
        "enfant": "1" if code_enfant else "0",
        "adm_is_done": 1,
        "instanceID": the_uuid,
    }

    instance_xml = xml.format(**variables)
    instance_file = ContentFile(instance_xml, name=file_name)

    timestamp = int(patient.last_record.import_source.creation_date.timestamp() * 1000)
    instance_body = [
        {
            "id": the_uuid,
            "latitude": None,
            "created_at": timestamp,
            "updated_at": timestamp,
            "orgUnitId": patient.last_record.org_unit_id,
            "formId": REGISTRY_FORM_ID,
            "longitude": None,
            "accuracy": 0,
            "altitude": 0,
            "file": file_name,
            "name": "Registry of patient",
            "entityUuid": the_uuid,
            "entityTypeId": ENTITY_TYPE_ID,
        }
    ]

    logger.debug(f"Registration instance body: {instance_body}")
    import_data(instance_body, patient.last_record.import_source.user, "fileactive")
    instance = Instance.objects.get(uuid=the_uuid)
    process_instance_file(instance, instance_file, patient.last_record.import_source.user)
    patient.entity = instance.entity
    patient.save()


def convert_to_xml_schema(original_dict):
    """
    Converts a patient data dictionary to a new format matching specified XML keys.

    This includes renaming keys, transforming data types (e.g., boolean to int,
    formatting dates), and restructuring for nested elements like 'meta'.
    """

    transformed_dict = {}

    # Helper functions for value transformations
    def to_int_bool(value):
        """Converts boolean to 0 or 1."""
        return 1 if value else 0

    def format_sex_code(sex_str):
        """Converts sex string: 'MALE' to 'm', 'FEMALE' to 'f'."""
        if isinstance(sex_str, str):
            if sex_str.upper() == "MALE":
                return "m"
            if sex_str.upper() == "FEMALE":
                return "f"
        return sex_str

    def format_date_to_str(date_obj):
        """Formats datetime.date object to 'YYYY-MM-DD' string."""
        if isinstance(date_obj, datetime.date):
            return date_obj.strftime("%Y-%m-%d")
        return date_obj

    def convert_hiv_type(hiv_type):
        """Converts HIV type string to a standardized code."""
        return HIV_MAPPING.get(hiv_type, "1")

    def convert_treatment_line(treatment_line):
        """Converts treatment line string to a standardized code."""
        treatment_line = LINE_MAPPING.get(treatment_line, "1")
        return treatment_line

    def convert_month_format(date_string):
        """Converts a YYYY-MM date string to Mon-YY format."""
        try:
            dt_object = datetime.datetime.strptime(date_string[:7], "%Y-%m")
        except ValueError:
            return date_string
        return dt_object.strftime("%b-%y")

    # Mappings: (new_xml_key, old_dict_key, optional_transform_function)
    key_mappings = [
        ("n", "patient", None),
        ("region", "region", None),
        ("district", "district", None),
        ("code_ets", "code_ets", None),
        ("sites", "facility_name", None),
        ("period", "period", convert_month_format),
        ("sexe", "sex", format_sex_code),
        ("age", "age", None),
        ("weight", "weight", lambda x: float(x) if x is not None else None),
        ("new_inclusion", "new_inclusion", to_int_bool),
        ("transfer_in", "transfer_in", to_int_bool),
        ("back_to_care", "return_to_care", to_int_bool),
        ("tb_vih", "tb_hiv", to_int_bool),
        ("type_vih", "hiv_type", convert_hiv_type),
        ("treatment_line", "treatment_line", convert_treatment_line),
        ("last_dispensiation_date", "last_dispensation_date", format_date_to_str),
        ("number_of_days_given", "days_dispensed", None),
        ("regimen", "regimen", None),
        ("stable", "stable", None),
        ("transfer_out", "transfer_out", to_int_bool),
        ("death", "death", to_int_bool),
        ("art_stop", "art_stoppage", to_int_bool),
        ("served_elsewhere", "served_elsewhere", to_int_bool),
    ]

    for new_key, old_key, transform_func in key_mappings:
        if old_key in original_dict:
            value = original_dict[old_key]
            if transform_func:
                transformed_dict[new_key] = transform_func(value)
            else:
                transformed_dict[new_key] = value

    # Handle nested structure for 'meta/instanceID'
    instance_value = original_dict.get("instance")
    transformed_dict["meta"] = {"instanceID": instance_value}

    return transformed_dict
