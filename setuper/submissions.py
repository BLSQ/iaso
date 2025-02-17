import random
import uuid

from dict2xml import dict2xml


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
