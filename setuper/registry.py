import uuid

from datetime import datetime

from submissions import submission2xml


def setup_registry(account_name, iaso_client):
    print("-- Setting up a form")
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]

    health_area_type = [out for out in org_unit_types if out["name"] == "Health area/Aire de santé - AREA"][0]
    health_area_type_id = health_area_type["id"]

    # create a form
    data = {
        "id": None,
        "name": "Registry - Population Health area",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [health_area_type_id],
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "gps",
        "label_keys": [],
    }

    form = iaso_client.post("/api/forms/", json=data)
    form_id = form["id"]

    # associate it's form version and upload xlsform

    test_file = "data/registry-population_commune.xlsx"
    data = {"form_id": form_id, "xls_file": test_file}
    form_files = {"xls_file": open(test_file, "rb")}

    form_version = iaso_client.post("/api/formversions/", files=form_files, data=data)

    ou_type = iaso_client.get(f"/api/v2/orgunittypes/{health_area_type_id}/")
    ou_type["reference_forms_ids"] = [form["id"]]
    ou_type["allow_creating_sub_unit_type_ids"] = [p["id"] for p in ou_type["allow_creating_sub_unit_types"]]
    ou_type["sub_unit_type_ids"] = [p["id"] for p in ou_type["sub_unit_types"]]
    ou_type["project_ids"] = [p["id"] for p in ou_type["projects"]]
    resp = iaso_client.put(f"/api/v2/orgunittypes/{health_area_type_id}/", json=ou_type)
    print(resp)
    ou_type = iaso_client.get(f"/api/v2/orgunittypes/{health_area_type_id}/")
    print(ou_type)

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": health_area_type_id})[
        "orgunits"
    ]
    print(orgunits)

    org_unit_ids = [ou["id"] for ou in orgunits]

    print("-- Submitting %d submissions" % limit)
    for org_unit_id in org_unit_ids:
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid

        local_path = "generated/%s" % file_name
        current_datetime = int(datetime.now().timestamp())

        instance_data = {
            "id": the_uuid,
            "latitude": None,
            "created_at": current_datetime,
            "updated_at": current_datetime,
            "orgUnitId": org_unit_id,
            "formId": form_id,
            "longitude": None,
            "accuracy": 0,
            "altitude": 0,
            "imgUrl": "imgUrl",
            "file": local_path,
            "name": file_name,
        }
        iaso_client.post(f"/api/instances/?app_id={account_name}", json=[instance_data])
        iaso_client.post(
            "/sync/form_upload/",
            files={
                "xml_submission_file": (
                    local_path,
                    submission2xml(
                        {
                            "start": "2022-09-07T17:54:55.805+02:00",
                            "end": "2022-09-07T17:55:31.192+02:00",
                            "target_population_9_59_easily_accessible": 10,
                            "target_population_9_59_accessible_by_advanced_team": 11,
                            "target_population_9_59_hard_to_access": 123,
                            "target_population_9_59_humanitarian_target_mobile": 12,
                            "target_population_9_59_total": 1,
                            "population_2023": 456,
                            "children_0_11_month": 54,
                            "children_12_23_month": 13,
                            "meta": {"instanceID": "uuid:" + the_uuid},
                        },
                        form_version_id=form_version["version_id"],
                        form_id="entity-child_registration",
                    ),
                )
            },
        )
