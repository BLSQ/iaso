from argparse import ArgumentParser
from django.core.management.base import BaseCommand
from iaso.models import Instance
from plugins.active_list.models import Patient
from logging import getLogger
import uuid
from django.core.files.base import ContentFile
from iaso.api.instances.instances import import_data
from hat.sync.views import process_instance_file
logger = getLogger(__name__)

xml_template = """<?xml version='1.0' ?><data id="file_active_admission" version="2025050304" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:orx="http://openrosa.org/xforms" xmlns:odk="http://www.opendatakit.org/xforms">
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

class Command(BaseCommand):
    help = """checks all the patients to see if they should be marked as lost and updates the patient status"""

    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--name", type=str, required=False, help="Campaign obr name")

    def handle(self, name=None, *args, **options):
        patients = Patient.objects.all()
        for patient in patients:
            if not patient.entity:

                xml = xml_template
               # f.close()
                the_uuid = str(uuid.uuid4())
                file_name = "register_from_xls%s.xml" % the_uuid

                identifier_code = patient.identifier_code
                print("identifier_code", identifier_code)
                split = identifier_code.split("/")
                code_ets, code_site, annee, num_ordre = split[0], split[1], split[2], split[3]
                if len(split) == 5:
                    code_enfant = split[4]
                else:
                    code_enfant = ""
                # concat(${code_ets},’ / ’, ${code_site},’ / ’, ${annee},’ / ’, ${num_ordre},${code_enfant})
                genre = "m" if patient.last_record.sex == "H" else "f"
                tb_vih = 1 if patient.last_record.tb_hiv else 0
                hiv_mapping = {
                    "HIV 1&2": "12",
                    "HIV1": "1",
                    "HIV2": "2",
                }
                hiv_type = hiv_mapping.get(patient.last_record.hiv_type,"1")
                print(patient.last_record.regimen)
                variables = {
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
                    "adm_ligne_thera": "1" if patient.last_record.treatment_line == "" else 2, #à corriger
                    "adm_resp_ex": patient.last_record.import_source.user.username if patient.last_record.import_source.user else "",
                    "enfant": "1" if code_enfant else "0",
                    "adm_is_done": 1,
                    "instanceID": the_uuid,
                }

                instance_xml = xml.format(**variables)
                print(identifier_code, patient.last_record.regimen)
                instance_file = ContentFile(instance_xml, name=file_name)

                timestamp = int(patient.last_record.import_source.creation_date.timestamp()*1000)
                instance_body = [
                    {
                        "id": the_uuid,
                        "latitude": None,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                        "orgUnitId": patient.last_record.org_unit_id,
                        "formId": 1,
                        "longitude": None,
                        "accuracy": 0,
                        "altitude": 0,
                        "file": file_name,
                        "name": "Registry of patient",
                        "entityUuid": the_uuid,
                        "entityTypeId": 1,
                    }
                ]
                print(instance_body)
                import_data(instance_body, patient.last_record.import_source.user, "fileactive")
                instance = Instance.objects.get(uuid=the_uuid)
                process_instance_file(instance, instance_file, patient.last_record.import_source.user)
                patient.entity = instance.entity
                patient.save()

