import random
import uuid
from datetime import datetime
from submissions import (
    create_default_reference_submission,
    org_unit_gps_point,
    submission2xml,
    submission_org_unit_gps_point,
)
from names_generator import generate_name


def define_health_facility_reference_form(iaso_client):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/?with_units_count=true")["orgUnitTypes"]
    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]
    forms = iaso_client.get("/api/forms/")["forms"]
    reference_form = [form for form in forms if form["name"] == "Data for Health facility/Données Formation sanitaire"][
        0
    ]

    # Add this form as reference form for the org unit type
    health_facility_type["reference_forms_ids"] = [reference_form["id"]]
    health_facility_type["project_ids"] = [project["id"] for project in health_facility_type["projects"]]
    health_facility_type["sub_unit_type_ids"] = [sub_unit["id"] for sub_unit in health_facility_type["sub_unit_types"]]
    health_facility_type["allow_creating_sub_unit_type_ids"] = [
        sub_unit_type["id"] for sub_unit_type in health_facility_type["allow_creating_sub_unit_types"]
    ]
    update_reference_forms = iaso_client.put(
        f"/api/v2/orgunittypes/{health_facility_type['id']}/", json=health_facility_type
    )
    form_ids = [form["id"] for form in update_reference_forms.get("reference_forms")]
    org_unit_type_reference_forms = {
        "org_unit_type_id": health_facility_type["id"],
        "form_ids": form_ids,
        "number_of_org_units": health_facility_type["units_count"],
    }

    return org_unit_type_reference_forms


def create_submission_with_picture(account_name, iaso_client):
    print("-- Creating submissions with picture")
    form = define_health_facility_reference_form(iaso_client=iaso_client)
    # fetch orgunit ids
    limit = form["number_of_org_units"]
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": form["org_unit_type_id"]})[
        "orgunits"
    ]
    current_datetime = int(datetime.now().timestamp())

    # Creating 2 submissions with picture by org unit for first 10 Health facilities and setting up reference instance
    pictures = ["CS_communautaire.png", "burkina_cs.jpg"]
    for picture in pictures:
        for orgunit in orgunits:
            org_unit_id = orgunit["id"]
            the_uuid = str(uuid.uuid4())
            file_name = "example_%s.xml" % the_uuid
            local_path = "generated/%s" % file_name
            form_id = form["form_ids"][0]

            instance_body = [
                {
                    **org_unit_gps_point(orgunit),
                    "id": the_uuid,
                    "created_at": current_datetime,
                    "updated_at": current_datetime,
                    "orgUnitId": org_unit_id,
                    "formId": form_id,
                    "accuracy": 0,
                    "imgUrl": "imgUrl",
                    "file": local_path,
                    "name": file_name,
                    "is_reference_instance": True,
                    "is_instance_of_reference_form": True,
                }
            ]
            iaso_client.post(f"/api/instances/?app_id={account_name}", json=instance_body)
            form_versions = iaso_client.get(f"/api/formversions/")["form_versions"]
            form_version = [form_version for form_version in form_versions if form_version["form_id"] == form_id]

            instance_json = {
                "start": "2022-09-07T17:54:55.805+02:00",
                "end": "2022-09-07T17:55:31.192+02:00",
                "geo_group": {
                    "responsable_fosa": generate_name(style="capital"),
                    "statut_fosa": random.choice(
                        ["public", "prive_confessionel", "prive_laic", "militaire", "ong", "autre"]
                    ),
                    "coordonnees_gps_fosa": submission_org_unit_gps_point(orgunit),
                },
                "equipment_group": {
                    "HFR_CS_16": random.choice(["yes", "no"]),
                    "HFR_CS_17": random.choice(["pub", "gr_elect", "syst_sol", "autre"]),
                    "HFR_CS_18": random.choice(["res_pub", "forage", "puit", "puit_non_prot"]),
                },
                "services_group": {
                    "HFR_CS_26": random.choice(["yes", "no"]),
                    "HFR_CS_28": random.choice(["yes", "no"]),
                    "HFR_CS_29": random.choice(["yes", "no"]),
                    "HFR_CS_32": random.choice(["yes", "no"]),
                    "HFR_CS_33": random.choice(["yes", "no"]),
                    "HFR_CS_40": random.choice(["yes", "no"]),
                },
                "meta": {"instanceID": "uuid:" + the_uuid},
            }

            with open(f"./data/{picture}", "rb") as fp_image:
                iaso_client.post(
                    "/sync/form_upload/",
                    files={
                        "xml_submission_file": (
                            local_path,
                            submission2xml(
                                instance_json,
                                form_version_id=form_version[0]["version_id"],
                                form_id="SAMPLE_FORM_new6",
                            ),
                        ),
                        "photo_fosa": fp_image,
                    },
                )
                # Creating default reference submission for the org unit
                create_default_reference_submission(account_name, iaso_client, org_unit_id, form_id, the_uuid)
