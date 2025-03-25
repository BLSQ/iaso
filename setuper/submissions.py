import random
import uuid

from datetime import datetime, timedelta

from dict2xml import dict2xml
from fake import fake_person
from names_generator import generate_name


def submission2xml(submission_dict, form_id, form_version_id, gen_uuid=False):
    root = "data"
    if gen_uuid:
        if "meta" not in submission_dict:
            submission_dict["meta"] = {}

        submission_dict["meta"]["instanceID"] = "uuid:" + str(uuid.uuid4())
    inner_xml = dict2xml(submission_dict).replace("\n", "").replace("  ", "")
    xml = f'<?xml version=\'1.0\' ?><{root} id="{form_id}" version="{form_version_id}" xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms">{inner_xml}</{root}>'

    return xml


def org_unit_gps_point(org_unit):
    return {
        "longitude": org_unit["longitude"],
        "latitude": org_unit["latitude"],
        "altitude": org_unit["altitude"],
    }


def submission_org_unit_gps_point(org_unit):
    return f"{org_unit['latitude']} {org_unit['longitude']} {org_unit['altitude']}"


def picture_by_org_unit_type_name(org_unit_type_name):
    picture_name = ""
    if org_unit_type_name == "Country/Pays - COUN":
        picture_name = "Ministry of health.webp"
    elif org_unit_type_name == "Region/Région - REG":
        picture_name = "Regional health authority.webp"
    elif org_unit_type_name == "District/Zone de santé - DIST":
        picture_name = "health district.webp"
    elif org_unit_type_name == "Health area/Aire de santé - AREA":
        picture_name = "health area.webp"
    return picture_name


def create_default_reference_submission(
    account_name, iaso_client, org_unit_id, form_id, uuid
):
    submissions_linked_to_org_unit = iaso_client.get(
        f"/api/instances/?app_id={account_name}",
        params={"orgUnitId": org_unit_id, "form_ids": form_id},
    )["instances"]
    reference_submission = [
        submission["id"]
        for submission in submissions_linked_to_org_unit
        if submission["uuid"] == uuid
    ]
    org_unit_reference_submission = {
        "id": org_unit_id,
        "reference_instance_id": random.choice(reference_submission),
        "reference_instance_action": "flag",
    }
    iaso_client.patch(
        f"/api/orgunits/{org_unit_id}/", json=org_unit_reference_submission
    )


def instance_by_LLIN_campaign_form(form, instance_id, orgunit=None):
    random_year = random.randint(1, 5)
    random_date = (datetime.now() - timedelta(days=(random_year * 365.25))).date()
    beneficiary_name = generate_name(style="capital")
    registration_date = datetime.now()
    code = random.randint(1000000000, 9999999999)
    ticket_number = random.randint(10000, 99999)
    instance_json = None

    if form["form_id"] == "pregnant_women_followup":
        instance_json = {
            "visit": {
                "oedema": random.choice([0, 1]),
                "need_followup": random.choice([0, 1]),
            }
        }
    elif form["form_id"] == "entity-child_registration_vaccination":
        age_entry = random.choice(["years", "birthdate"])
        name = beneficiary_name.split(" ")
        age_years = random.randint(10, 50)
        birth_date = (datetime.now() - timedelta(days=(age_years * 365.25))).date()
        food_assistance = random.choice(["yes", "no"])
        assistance_type = None
        if food_assistance == "yes":
            assistance_type = random.choice(
                [
                    "evoucher cash inkindfood",
                    "evoucher cash inkindfood other",
                    "evoucher inkindfood other",
                    "evoucher cash",
                ]
            )
        instance_json = {
            "consent_given": {
                "beneficiary": {
                    "registration_date": registration_date,
                    "first_name": name[0],
                    "last_name": name[1],
                    "gender": "female",
                },
                "age_group": {
                    "age_entry": age_entry,
                    "age_years": age_years,
                    "birth_date": birth_date,
                    "birthday": birth_date,
                    "age__int__": age_years,
                    "actual_birthday__date__": birth_date,
                },
                "card": {
                    "record_book_or_vaccination_card": random.choice(
                        ["vaccination_book", "antenatal_record_book"]
                    ),
                    "card_number": ticket_number,
                },
                "food_assistance": {
                    "general_food_assistance": food_assistance,
                    "assistance_type": assistance_type,
                },
            }
        }

    elif form["form_id"] == "cahier_de_denombrement_v1.1":
        number = random.randint(1, 15)
        child_number = random.randint(1, 5)
        default_number = random.randint(0, 2)
        total = number + default_number + child_number + child_number

        instance_json = {
            "group_theme": {
                "code_barre": code,
                "numero_ticket": ticket_number,
                "nom_prenoms": beneficiary_name.upper(),
                "contact": random.randint(ticket_number, code),
                "nombre_personne": total,
                "nombre_couchage": number,
                "enfants": child_number,
                "enfants1": child_number,
                "femme_enceinte": default_number,
                "somme_enfant_fe": total - number,
                "nombre_milda_donne": round(total * 0.5),
                "milda_recu_": round(total * 0.5),
                "a_recu_ses_mildas": round(total * 0.5),
                "milda_recu_note": "",
            }
        }

    elif form["form_id"] == "cahier_de_distribution_v1.1":
        milda = random.choice(["1", "2"])
        received_milda = 0
        if milda == "1":
            received_milda = random.randint(1, 5)
        instance_json = {
            "group_theme": {
                "codeQR": code,
                "recu": milda,
                "milda_recu": received_milda,
                "milda_recu_": received_milda,
                "a_recu_ses_mildas": 0 if received_milda < 1 else 1,
                "milda_recu_note": "",
            }
        }

    elif form["form_id"] == "entity-child_followup":
        instance_json = {
            "start": f"{random_date.strftime('%Y-%m-%d')}T17:54:55.805+02:00",
            "end": f"{random_date.strftime('%Y-%m-%d')}T17:55:31.192+02:00",
            "visit": {
                "oedema": 1,
                "need_followup": 0,
                "coordonnees_gps_fosa": submission_org_unit_gps_point(orgunit),
            },
        }
    elif form["form_id"] == "entity-child_registration":
        child = fake_person()

        instance_json = {
            "start": f"{random_date.strftime('%Y-%m-%d')}T17:54:55.805+02:00",
            "end": f"{random_date.strftime('%Y-%m-%d')}T17:55:31.192+02:00",
            "register": {
                "name": child["firstname"],
                "father_name": child["lastname"],
                "age_type": 1,
                "age": child["age_in_months"],
                "child_details": {
                    "gender": child["gender"],
                    "caretaker_name": child["lastname"],
                    "caretaker_rs": random.choice(
                        [
                            "mother",
                            "father",
                            "sister",
                            "brother",
                            "grandfather",
                            "grandmother",
                            "other",
                        ]
                    ),
                    "hc": random.choice(["hc_A", "hc_B", "hc_C", "hc_D", "hc_E"]),
                },
                "coordonnees_gps_fosa": submission_org_unit_gps_point(orgunit),
            },
        }

    instance_json["meta"] = instance_id
    return instance_json
