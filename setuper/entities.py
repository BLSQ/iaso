from datetime import datetime
import uuid
import os


def setup_entities(account_name, iaso_client):
    print("-- Setting up entity")
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]

    hf_out = [out for out in org_unit_types if out["name"] == "Formation sanitaire"][0]

    print("-- Setting up reference form")

    # create a form
    reg_form_data = {
        "id": None,
        "name": "Child - Registration",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [hf_out["id"]],
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "",
        "label_keys": [],
    }

    reg_form_id = iaso_client.post("/api/forms/", json=reg_form_data)["id"]

    # associate it's form version and upload xlsform

    reg_test_file = "data/entity-child_registration_2022090701.xlsx"
    reg_form_version_data = {"form_id": reg_form_id, "xls_file": reg_test_file}
    reg_form_files = {"xls_file": open(reg_test_file, "rb")}

    iaso_client.post("/api/formversions/", files=reg_form_files, data=reg_form_version_data)

    # create a form
    follow_form_data = {
        "id": None,
        "name": "Child - Follow up",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [hf_out["id"]],
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "",
        "label_keys": [],
    }

    follow_form_id = iaso_client.post("/api/forms/", json=follow_form_data)["id"]

    # associate it's form version and upload xlsform

    follow_test_file = "data/entity-child_followup.xlsx"
    follow_form_version_data = {"form_id": follow_form_id, "xls_file": follow_test_file}
    follow_form_files = {"xls_file": open(follow_test_file, "rb")}

    iaso_client.post("/api/formversions/", files=follow_form_files, data=follow_form_version_data)

    current_user = iaso_client.get("/api/profiles/me/")

    print("-- Setting up entity type")

    # create entity types
    entity_type = iaso_client.post(
        "/api/entitytypes/",
        json={
            "name": "Child",
            "reference_form": reg_form_id,
            "fields_detail_info_view": [
                "name",
                "father_name",
                "age_type",
                "age",
                "birth_date",
                "gender",
                "caretaker_name",
                "caretaker_rs",
            ],
            "fields_list_view": ["name", "father_name", "age", "gender"],
            "account": current_user["account"]["id"],  # suspicious... should have been deduced from user
        },
    )

    # couldn't find the id in the entity_type
    # so refetching it
    # and no wrapping element here
    entity_type = iaso_client.get("/api/entitytypes/")[0]

    wfw_version = iaso_client.post(
        "/api/workflowversions/", json={"name": "Child program", "entity_type_id": entity_type["id"]}
    )

    iaso_client.post(
        "/api/workflowfollowups/?version_id=" + str(wfw_version["version_id"]),
        {"condition": True, "form_ids": [follow_form_id], "order": 0},
    )

    with open("data/entity-child_registration.xml", "r") as f:
        xml = f.read()

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": hf_out["id"]})["orgunits"]
    org_unit_ids = [ou["id"] for ou in orgunits]

    print("-- Submitting %d form instances" % limit)
    count = 0
    for org_unit_id in org_unit_ids:
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid
        variables = {"uuid": the_uuid}  # TO DO: we should update the version of the form here too

        instance_xml = xml.format(**variables)

        local_path = "generated/%s" % file_name
        f = open(local_path, "w")
        f.write(instance_xml)
        f.close()
        current_datetime = int(datetime.now().timestamp())

        instance_body = [
            {
                "id": the_uuid,
                "latitude": None,
                "created_at": current_datetime,
                "updated_at": current_datetime,
                "orgUnitId": org_unit_id,
                "formId": reg_form_id,
                "longitude": None,
                "accuracy": 0,
                "altitude": 0,
                "imgUrl": "imgUrl",
                "file": local_path,
                "name": file_name,
            }
        ]

        iaso_client.post(f"/api/instances/?app_id={account_name}", json=instance_body)

        with open(local_path) as fp_xml:
            iaso_client.post("/sync/form_upload/", files={"xml_submission_file": fp_xml})

        current_datetime = int(datetime.now().timestamp())
        entity_data = {
            "name": "New Client",
            "entity_type": entity_type["id"],
            "entity_type_id": entity_type["id"],
            "attributes": the_uuid,
            "account": current_user["account"]["id"],
            "created_at": current_datetime,
            "updated_at": current_datetime,
        }
        iaso_client.post(f"/api/entities/bulk_create/?app_id={account_name}", json=[entity_data])

        count = count + 1

        os.remove(local_path)
    print(iaso_client.get("/api/instances", params={"limit": 1})["count"], "instances created")
