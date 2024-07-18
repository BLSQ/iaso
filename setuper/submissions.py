from dict2xml import dict2xml
import uuid


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
    match org_unit_type_name:
        case "Country/Pays - COUN":
            picture_name = "Ministry of health.webp"

        case "Region/Région - REG":
            picture_name = "Regional health authority.webp"

        case "District/Zone de santé - DIST":
            picture_name = "health district.webp"

        case "Health area/Aire de santé - AREA":
            picture_name = "health area.webp"

    return picture_name
