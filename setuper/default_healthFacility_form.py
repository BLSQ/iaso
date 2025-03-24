import random
import uuid

from datetime import datetime

from names_generator import generate_name
from submissions import (
    org_unit_gps_point,
    submission2xml,
    submission_org_unit_gps_point,
)


def setup_health_facility_level_default_form(account_name, iaso_client):
    print("-- Setting up a default form for Health Facility level")
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]

    org_unit_type_id = [
        out["id"] for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"
    ]

    sample_data = {
        "id": None,
        "name": "Data for Health facility/Données Formation sanitaire",
        "short_name": "Data for HF/Données FOSA",
        "depth": None,
        "org_unit_type_ids": org_unit_type_id,
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "coordonnees_gps_fosa",
        "label_keys": [],
    }
    sample_form_id = iaso_client.post("/api/forms/", json=sample_data)["id"]
    # associate it's form version and upload xlsform

    sample_file = "data/default_Health_facility_form.xlsx"
    data = {"form_id": sample_form_id, "xls_file": sample_file}
    form_files = {"xls_file": open(sample_file, "rb")}

    form_version = iaso_client.post("/api/formversions/", files=form_files, data=data)

    ######## creating submissions/instances
    print("-- Downloading org units")

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get(
        "/api/orgunits/",
        params={"limit": limit, "orgUnitTypeId": health_facility_type["id"]},
    )["orgunits"]
    print("-- Submitting %d submissions" % limit)

    for orgunit in orgunits:
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid
        local_path = "generated/%s" % file_name
        current_datetime = int(datetime.now().timestamp())

        instance_body = [
            {
                **org_unit_gps_point(orgunit),
                "id": the_uuid,
                "created_at": current_datetime,
                "updated_at": current_datetime,
                "orgUnitId": orgunit["id"],
                "formId": sample_form_id,
                "accuracy": 0,
                "imgUrl": "imgUrl",
                "file": local_path,
                "name": file_name,
            }
        ]

        iaso_client.post(f"/api/instances/?app_id={account_name}", json=instance_body)
        usable_vials_start_day = random.randint(10, 50)
        vials_used = random.randint(5, usable_vials_start_day)
        usable_vials_theoretical = usable_vials_start_day - vials_used
        usable_vials_physical = random.randint(11, 50)

        iaso_client.post(
            "/sync/form_upload/",
            files={
                "xml_submission_file": (
                    local_path,
                    submission2xml(
                        {
                            "start": "2022-09-07T17:54:55.805+02:00",
                            "end": "2022-09-07T17:55:31.192+02:00",
                            "geo_group": {
                                "responsable_fosa": generate_name(style="capital"),
                                "statut_fosa": random.choice(
                                    [
                                        "public",
                                        "prive_confessionel",
                                        "prive_laic",
                                        "militaire",
                                        "ong",
                                        "autre",
                                    ]
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
                            "stocks_group": {
                                "usable_vials_start_day": usable_vials_start_day,
                                "vials_used": vials_used,
                                "usable_vials_physical": usable_vials_physical,
                                "usable_vials_theoretical": usable_vials_theoretical,
                                "physical_vs_theoritical": usable_vials_theoretical
                                - (usable_vials_start_day - vials_used),
                            },
                            "meta": {"instanceID": "uuid:" + the_uuid},
                        },
                        form_version_id=form_version["version_id"],
                        form_id="SAMPLE_FORM_new6",
                    ),
                )
            },
        )
    print(
        iaso_client.get("/api/instances", params={"limit": 1})["count"],
        "instances created",
    )
