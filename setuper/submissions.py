from dict2xml import dict2xml
import uuid, random
from datetime import datetime, timedelta
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


def create_default_reference_submission(account_name, iaso_client, org_unit_id, form_id, uuid):
    submissions_linked_to_org_unit = iaso_client.get(
        f"/api/instances/?app_id={account_name}",
        params={"orgUnitId": org_unit_id, "form_ids": form_id},
    )["instances"]
    reference_submission = [
        submission["id"] for submission in submissions_linked_to_org_unit if submission["uuid"] == uuid
    ]
    org_unit_reference_submission = {
        "id": org_unit_id,
        "reference_instance_id": random.choice(reference_submission),
        "reference_instance_action": "flag",
    }
    iaso_client.patch(f"/api/orgunits/{org_unit_id}/", json=org_unit_reference_submission)


def instance_json_by_form(form, instance_id):
    random_day = random.randint(1, 30)
    registration_date = datetime.now() - timedelta(days=random_day)

    if form["form_id"] == "pregnant_women_followup":
        instance_json = {
            "visit": {
                "oedema": random.choice([0, 1]),
                "need_followup": random.choice([0, 1]),
            },
            "meta": instance_id,
        }
    elif form["form_id"] == "entity-child_registration_vaccination":
        age_entry = random.choice(["years", "birthdate"])
        name = f"Name {random.randint(1, 30)}"
        default_year = random.randint(10, 50)
        age = {
            "age_years": None,
            "birthday": None,
        }
        if age_entry == "years":
            age["age_years"] = default_year
        elif age_entry == "birthdate":
            age["birthday"] = datetime.now() - timedelta(days=(default_year * 365.25))
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
            "beneficiary": {
                "registration_date": registration_date,
                "first_name": name,
                "last_name": f"Other {name}",
                "gender": "female",
            },
            "age_group": {
                "age_entry": age_entry,
                "age_years": age["age_years"],
                "birth_date": age["birthday"],
            },
            "card": {
                "record_book_or_vaccination_card": random.choice(["vaccination_book", "antenatal_record_book"]),
                "card_number": f"{random.randint(454, 524785)}",
            },
            "food_assistance": {
                "general_food_assistance": random.choice(["yes", "no"]),
                "assistance_type": assistance_type,
            },
            "meta": instance_id,
        }

    elif form["form_id"] == "cahier_de_denombrement_v1.1":
        number = random.randint(1, 15)
        child_number = random.randint(1, 5)
        beneficiary_name = generate_name(style="capital")
        print("BENEFICIARY NAME ...:", beneficiary_name)

        instance_json = {
            "group_theme": {
                "code_barre": random.randint(1000000000000, 9999999999999),
                "numero_ticket": random.randint(10000, 99999),
                "nom_prenoms": beneficiary_name.upper(),
                "contact": random.randint(1000000000, 9999999999),
                "nombre_personne": number,
                "nombre_couchage": number,
                "enfants": child_number,
                "enfants1": child_number,
                "femme_enceinte": random.randint(0, 3),
            },
            "meta": instance_id,
        }

    elif form["form_id"] == "cahier_de_distribution_v1":
        milda = random.choice(["yes", "no"])
        received_milda = 0
        if milda == "yes":
            received_milda = (random.randint(1, 5),)
        instance_json = {
            "group_theme": {
                "codeQR": random.randint(1000000000000, 9999999999999),
                "recu": milda,
                "milda_recu": received_milda,
            },
            "meta": instance_id,
        }
    print("INSTANCE JSON ", instance_json)
    return instance_json
