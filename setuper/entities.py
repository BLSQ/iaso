from datetime import datetime
import uuid

from fake import fake_person
from submissions import submission2xml
from random import randint


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

    reg_form = iaso_client.post("/api/forms/", json=reg_form_data)
    reg_form_id = reg_form["id"]

    # associate it's form version and upload xlsform

    reg_test_file = "data/entity-child_registration_2022090701.xlsx"
    reg_form_version_data = {"form_id": reg_form_id, "xls_file": reg_test_file}
    reg_form_files = {"xls_file": open(reg_test_file, "rb")}

    reg_form_version = iaso_client.post("/api/formversions/", files=reg_form_files, data=reg_form_version_data)

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

    follow_form = iaso_client.post("/api/forms/", json=follow_form_data)
    follow_form_id = follow_form["id"]

    # associate it's form version and upload xlsform

    follow_test_file = "data/entity-child_followup.xlsx"
    follow_form_version_data = {"form_id": follow_form_id, "xls_file": follow_test_file}
    follow_form_files = {"xls_file": open(follow_test_file, "rb")}

    follow_form_version = iaso_client.post("/api/formversions/", files=follow_form_files, data=follow_form_version_data)

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

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": hf_out["id"]})["orgunits"]
    org_unit_ids = [ou["id"] for ou in orgunits]

    print("-- Submitting %d form instances" % limit)
    count = 0
    for org_unit_id in org_unit_ids:
        child = fake_person()

        the_uuid = str(uuid.uuid4())
        child_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid

        local_path = "generated/%s" % file_name
        current_datetime = int(datetime.now().timestamp())

        instance_data = {
            "id": the_uuid,
            "latitude": None,
            "created_at": current_datetime,
            "updated_at": current_datetime,
            "orgUnitId": org_unit_id,
            "formId": reg_form_id,
            "longitude": None,
            "entityUuid": child_uuid,
            "entityTypeId": entity_type["id"],
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
                            "register": {
                                "name": child["firstname"],
                                "father_name": child["lastname"],
                                "age_type": 1,
                                "age": child["age_in_months"],
                                "child_details": {
                                    "gender": child["gender"],
                                    "caretaker_name": child["lastname"],
                                    "caretaker_rs": "brother",
                                    "hc": "hc_E",
                                },
                            },
                            "meta": {"instanceID": "uuid:" + the_uuid},
                        },
                        form_version_id=reg_form_version["version_id"],
                        form_id="entity-child_registration",
                    ),
                )
            },
        )

        current_datetime = int(datetime.now().timestamp())

        for i in range(0, randint(0, 5)):
            the_uuid = str(uuid.uuid4())
            file_name = "example_%s.xml" % the_uuid

            local_path = "generated/%s" % file_name
            current_datetime = int(datetime.now().timestamp())

            iaso_client.post(
                f"/api/instances/?app_id={account_name}",
                json=[
                    {
                        "id": the_uuid,
                        "latitude": None,
                        "created_at": current_datetime,
                        "updated_at": current_datetime,
                        "orgUnitId": org_unit_id,
                        "formId": follow_form_id,
                        "entityUuid": child_uuid,
                        "entityTypeId": entity_type["id"],
                        "longitude": None,
                        "accuracy": 0,
                        "altitude": 0,
                        "imgUrl": "imgUrl",
                        "file": local_path,
                        "name": file_name,
                    }
                ],
            )
            iaso_client.post(
                "/sync/form_upload/",
                files={
                    "xml_submission_file": (
                        local_path,
                        submission2xml(
                            {
                                "start": "2022-09-07T17:54:55.805+02:00",
                                "end": "2022-09-07T17:55:31.192+02:00",
                                "visit": {
                                    "oedema": 1,
                                    "need_followup": 0,
                                },
                                "meta": {"instanceID": "uuid:" + the_uuid},
                            },
                            form_version_id=follow_form_version["version_id"],
                            form_id="entity-child_followup",
                        ),
                    )
                },
            )

        count = count + 1

    print(iaso_client.get("/api/instances", params={"limit": 1})["count"], "instances created")
