import datetime
import os
import uuid

from argparse import ArgumentParser
from logging import getLogger

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from django_xlsform_validator.validation import NamedBytesIO, XLSFormValidator

from hat.sync.views import process_instance_file
from iaso.api.instances.instances import import_data
from iaso.models import Form, FormVersion, Instance
from plugins.active_list.models import (
    TREATMENT_1STLINE,
    TREATMENT_2NDLINE,
    TREATMENT_3RDLINE,
    TREATMENT_LINE_UNKNOWN,
    Patient,
)


logger = getLogger(__name__)

HIV_MAPPING = {
    "HIV 1&2": "12",
    "HIV1": "1",
    "HIV2": "2",
}

TREATMENT_LINE_MAPPING = {
    TREATMENT_1STLINE: "1",
    TREATMENT_2NDLINE: "2",
    TREATMENT_3RDLINE: "3",
    TREATMENT_LINE_UNKNOWN: "4",
}

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

fields_to_include = [
    "id",  # or 'pk', model_to_dict usually includes the primary key
    "number",
    "region",
    "district",
    "code_ets",
    "facility_name",
    "period",
    "patient",  # This will be the ID of the related Patient object
    "sex",
    "age",
    "weight",
    "new_inclusion",
    "transfer_in",
    "return_to_care",
    "tb_hiv",
    "hiv_type",
    "treatment_line",
    "last_dispensation_date",
    "days_dispensed",
    "next_dispensation_date",
    "regimen",
    "stable",
    "discontinuation_date",
    "arv_stock_days",
    "received_arv",
    "transfer_out",
    "death",
    "art_stoppage",
    "served_elsewhere",
]


class Command(BaseCommand):
    help = """Finds all records without a submission and creates it."""

    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--name", type=str, required=False, help="Campaign obr name")

    def handle(self, name=None, *args, **options):
        patients = Patient.objects.filter(records__instance__isnull=True).distinct()
        form = Form.objects.get(form_id="file_active_excel_validation")

        form_version = FormVersion.objects.filter(form=form).order_by("created_at").last()

        registration_form = Form.objects.get(form_id="file_active_admission")
        registration_form_version = FormVersion.objects.filter(form=registration_form).order_by("created_at").last()
        validator = XLSFormValidator()
        with open("plugins/active_list/data/file_active_import_checker.xlsx", "rb") as f:
            content = f.read()

        named_buffer = NamedBytesIO(content, name="plugins/active_list/data/file_active_import_checker.xlsx")
        validator.parse_xlsform(named_buffer)

        for patient in patients:
            try:
                if not patient.entity:
                    create_registration(patient, registration_form_version.version_id)
                    patient.refresh_from_db()
                    print("Entity created", patient.entity)
                non_converted_records = patient.records.filter(instance__isnull=True)
                for record in non_converted_records:
                    d = model_to_dict(record)
                    print("d", d)

                    d_converted = convert_to_xml_schema(d)
                    print("d_converted", d_converted)
                    d_converted["identifier_code"] = patient.identifier_code

                    xml_result = validator.generate_xml_from_dict(d_converted, version=form_version.version_id)
                    ######## TODO: TO DELETE after doing it more cleanly ##########
                    xml_result = xml_result.replace("{'instanceID': None}", "")
                    xml_result = xml_result.replace("None", "data")
                    ######## TO DELETE ##########
                    print(xml_result)
                    the_uuid = str(uuid.uuid4())
                    file_name = "xls_import_from_xls%s.xml" % the_uuid
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

                    import_data(instance_body, record.import_source.user, "fileactive")
                    instance = Instance.objects.get(uuid=the_uuid)
                    process_instance_file(instance, instance_file, record.import_source.user)
                    record.instance = instance
                    record.save()
            except:
                logger.exception("Error processing patient %s", patient.identifier_code)


def create_registration(patient, version):  # to refactor to work as the excel import using generate_xml_from_dict
    xml = xml_template
    # f.close()
    the_uuid = str(uuid.uuid4())
    file_name = "register_from_xls%s.xml" % the_uuid

    identifier_code = patient.identifier_code

    split = identifier_code.split("/")
    code_ets, code_site, annee, num_ordre = split[0], split[1], split[2], split[3]
    if len(split) == 5:
        code_enfant = split[4]
    else:
        code_enfant = ""
    # concat(${code_ets},’ / ’, ${code_site},’ / ’, ${annee},’ / ’, ${num_ordre},${code_enfant})
    genre = "m" if patient.last_record.sex == "H" else "f"
    tb_vih = 1 if patient.last_record.tb_hiv else 0

    hiv_type = HIV_MAPPING.get(patient.last_record.hiv_type, "1")  ###### shouldn't have a 1 as default

    variables = {
        "REGISTRY_FORM_VERSION": version,
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
        "adm_ligne_thera": TREATMENT_LINE_MAPPING.get(patient.last_record.treatment_line, "4"),  # 4 is unknown
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

    import_data(instance_body, patient.last_record.import_source.user, "fileactive")
    instance = Instance.objects.get(uuid=the_uuid)
    process_instance_file(instance, instance_file, patient.last_record.import_source.user)
    patient.entity = instance.entity
    patient.save()

    patient.last_record.instance = instance
    patient.last_record.save()


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
        return sex_str  # Return original or None if not MALE/FEMALE or not a string

    def format_date_to_str(date_obj):
        """Formats datetime.date object to 'YYYY-MM-DD' string."""
        if isinstance(date_obj, datetime.date):
            return date_obj.strftime("%Y-%m-%d")
        return date_obj  # Return original or None if not a date object

    def convert_hiv_type(hiv_type):
        """Converts HIV type string to a standardized code."""
        return HIV_MAPPING.get(hiv_type, "1")

    def convert_treatment_line(treatment_line):
        """Converts treatment line string to a standardized code."""
        treatment_line = TREATMENT_LINE_MAPPING.get(
            treatment_line, "4"
        )  # FIXME there should probably not be a default here
        return treatment_line

    def convert_month_format(date_string):
        """Converts a YYYY-MM date string to Mon-YY format.

        Args:
          date_string: The date string in YYYY-MM format (e.g., "2025-05").

        Returns:
          The date string in Mon-YY format (e.g., "May-25").
        """
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
        ("type_vih", "hiv_type", convert_hiv_type),  # XML example: '1', source: 'HIV2'. Using source value.
        (
            "treatment_line",
            "treatment_line",
            convert_treatment_line,
        ),  # XML example: '1', source: 'nan'. Using source value.
        ("last_dispensiation_date", "last_dispensation_date", format_date_to_str),  # Note XML spelling
        ("number_of_days_given", "days_dispensed", None),
        ("regimen", "regimen", None),
        ("stable", "stable", None),  # Source 'stable': 0 (int) matches XML expectation
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
        # else:
        # If an old_key might be missing and needs a default value in the
        # transformed_dict, that logic would go here.
        # For this specific problem, the original_dict is fully provided.

    # Handle nested structure for 'meta/instanceID'
    instance_value = original_dict.get("instance")
    transformed_dict["meta"] = {"instanceID": instance_value}
    # If 'instance' from original_dict is None, 'instanceID' will be None.
    # If an empty string is preferred for a None 'instanceID':
    # transformed_dict['meta'] = {'instanceID': instance_value if instance_value is not None else ""}

    return transformed_dict
