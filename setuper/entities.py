import uuid

from datetime import datetime, timedelta
from random import randint

from submissions import (
    instance_by_LLIN_campaign_form,
    org_unit_gps_point,
    rename_entity_submission_picture,
    submission2xml,
)


def create_forms_and_entities(iaso_client):
    print("-- Setting up reference form")

    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    hf_out = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][0]

    # create registration form form
    reg_form_data = {
        "id": None,
        "name": "Child/Enfant - Registration/Enregistrement",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [hf_out["id"]],
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "coordonnees_gps_fosa",
        "label_keys": [],
    }

    reg_form = iaso_client.post("/api/forms/", json=reg_form_data)
    reg_form_id = reg_form["id"]

    # associate it's form version and upload xlsform

    reg_test_file = "data/entity-child_registration_2022090701.xlsx"
    reg_form_version_data = {"form_id": reg_form_id, "xls_file": reg_test_file}
    reg_form_files = {"xls_file": open(reg_test_file, "rb")}

    iaso_client.post("/api/formversions/", files=reg_form_files, data=reg_form_version_data)

    # create followup form
    followUp_form_data = {
        "id": None,
        "name": "Child/Enfant - Follow-up/Suivi",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [hf_out["id"]],
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "coordonnees_gps_fosa",
        "label_keys": [],
    }

    follow_form = iaso_client.post("/api/forms/", json=followUp_form_data)
    follow_form_id = follow_form["id"]

    # associate it's form version and upload xlsform
    follow_test_file = "data/entity-child_followup.xlsx"
    follow_form_version_data = {"form_id": follow_form_id, "xls_file": follow_test_file}
    follow_form_files = {"xls_file": open(follow_test_file, "rb")}

    iaso_client.post("/api/formversions/", files=follow_form_files, data=follow_form_version_data)


def create_additional_entities(account_name, iaso_client, orgunit, entity_type):
    reference_form = entity_type["reference_form"]
    current_datetime = int(datetime.now().timestamp())
    the_uuid = str(uuid.uuid4())
    entity_uuid = str(uuid.uuid4())
    file_name = "example_%s.xml" % the_uuid
    local_path = "generated/%s" % file_name
    org_unit_id = orgunit["id"]

    instance_data = {
        **org_unit_gps_point(orgunit),
        "id": the_uuid,
        "created_at": current_datetime,
        "updated_at": current_datetime,
        "orgUnitId": org_unit_id,
        "formId": reference_form["id"],
        "entityUuid": entity_uuid,
        "entityTypeId": entity_type["id"],
        "accuracy": 0,
        "imgUrl": "imgUrl",
        "file": local_path,
        "name": file_name,
    }
    iaso_client.post(f"/api/instances/?app_id={account_name}", json=[instance_data])
    instance_json = instance_by_LLIN_campaign_form(reference_form, {"instanceID": "uuid:" + the_uuid}, orgunit)
    files = {
        "xml_submission_file": (
            local_path,
            submission2xml(
                instance_json,
                form_version_id=reference_form["latest_form_version"]["version_id"],
                form_id=reference_form["form_id"],
            ),
        )
    }
    if instance_json.get("consent_given") is not None:
        picture = instance_json["consent_given"]["beneficiary"]["picture"]
        path = "./data/women-pictures"
        files = rename_entity_submission_picture(path, picture, files, "picture", the_uuid)

    iaso_client.post(
        "/sync/form_upload/",
        files=files,
    )


def create_child_entities(account_name, iaso_client, orgunit, entity_type):
    reference_form = entity_type["reference_form"]
    followup_form = entity_type["followup_form"]
    current_datetime = int(datetime.now().timestamp())

    the_uuid = str(uuid.uuid4())
    entity_uuid = str(uuid.uuid4())
    file_name = "example_%s.xml" % the_uuid
    local_path = "generated/%s" % file_name
    org_unit_id = orgunit["id"]

    instance_data = {
        **org_unit_gps_point(orgunit),
        "id": the_uuid,
        "created_at": current_datetime,
        "updated_at": current_datetime,
        "orgUnitId": org_unit_id,
        "formId": reference_form["id"],
        "entityUuid": entity_uuid,
        "entityTypeId": entity_type["id"],
        "accuracy": 0,
        "imgUrl": "picture",
        "file": local_path,
        "name": file_name,
    }
    iaso_client.post(f"/api/instances/?app_id={account_name}", json=[instance_data])

    instance_json = instance_by_LLIN_campaign_form(reference_form, {"instanceID": "uuid:" + the_uuid}, orgunit)
    image = f"{int(randint(1, 13))}.jpg"
    instance_json["register"]["picture"] = image
    path = "./data/children-pictures"

    files = {
        "xml_submission_file": (
            local_path,
            submission2xml(
                instance_json,
                form_version_id=reference_form["latest_form_version"]["version_id"],
                form_id=reference_form["form_id"],
            ),
        )
    }
    files = rename_entity_submission_picture(path, image, files, "picture", the_uuid)
    iaso_client.post(
        "/sync/form_upload/",
        files=files,
    )
    for i in range(randint(0, 5)):
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid

        local_path = "generated/%s" % file_name
        current_datetime = int(datetime.now().timestamp())
        created_at = datetime.now() - timedelta(days=4)
        created_at_to_datetime = int(datetime.timestamp(created_at + timedelta(days=i)))

        iaso_client.post(
            f"/api/instances/?app_id={account_name}",
            json=[
                {
                    **org_unit_gps_point(orgunit),
                    "id": the_uuid,
                    "created_at": created_at_to_datetime,
                    "updated_at": current_datetime,
                    "orgUnitId": org_unit_id,
                    "formId": followup_form["id"],
                    "entityUuid": entity_uuid,
                    "entityTypeId": entity_type["id"],
                    "accuracy": 0,
                    "imgUrl": "imgUrl",
                    "file": local_path,
                    "name": file_name,
                }
            ],
        )
        instance_json = instance_by_LLIN_campaign_form(followup_form, {"instanceID": "uuid:" + the_uuid}, orgunit)
        iaso_client.post(
            "/sync/form_upload/",
            files={
                "xml_submission_file": (
                    local_path,
                    submission2xml(
                        instance_json,
                        form_version_id=followup_form["latest_form_version"]["version_id"],
                        form_id=followup_form["form_id"],
                    ),
                )
            },
        )


def setup_entities(account_name, iaso_client, entity_type, new_entity_type):
    print("-- Setting up entity")
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    hf_out = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][0]

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": hf_out["id"]})["orgunits"]

    print("-- Submitting %d submissions" % limit)
    count = 0
    for orgunit in orgunits:
        entity_type["reference_form"] = new_entity_type["reference_form"]
        entity_type["followup_form"] = new_entity_type["followup_form"]
        if entity_type["name"] == "Children less than 5":
            create_child_entities(account_name, iaso_client, orgunit, entity_type)
        elif entity_type["name"] in ["Pregnant women", "Household"]:
            create_additional_entities(account_name, iaso_client, orgunit, entity_type)
        count = count + 1
    print(
        iaso_client.get("/api/instances", params={"limit": 1})["count"],
        "instances created",
    )


def create_entity_types(iaso_client):
    current_user = iaso_client.get("/api/profiles/me/")
    account_name = current_user["account"]["name"]
    account = current_user["account"]["id"]
    existing_forms = iaso_client.get("/api/forms/")["forms"]
    entity_types = [
        {
            "name": "Children less than 5",
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
            "account": account,
            "reference_form": "Child/Enfant - Registration/Enregistrement",
            "followup_form": "Child/Enfant - Follow-up/Suivi",
            "condition": True,
        },
        {
            "name": "Household",
            "fields_detail_info_view": [
                "nombre_couchage",
                "a_recu_ses_mildas",
                "milda_recu_",
                "nombre_milda_donne",
            ],
            "fields_list_view": ["nom_prenoms", "code_barre"],
            "fields_duplicate_search": ["code_barre"],
            "account": account,
            "reference_form": "Dénombrement / Enumeration",
            "followup_form": "Dénombrement / Enumeration",
            "condition": {"and": [{"==": [{"var": "a_recu_ses_mildas"}, "0"]}]},
        },
        {
            "name": "Pregnant women",
            "fields_detail_info_view": [
                "first_name",
                "last_name",
                "actual_birthday__date__",
            ],
            "fields_list_view": ["first_name", "last_name", "gender"],
            "fields_duplicate_search": ["first_name", "last_name"],
            "account": account,
            "reference_form": "Registration Vaccination Pregnant Women",
            "followup_form": "Registration Vaccination Pregnant Women",
            "condition": True,
        },
    ]
    print("-- Creating entity types --")
    for entity_type in entity_types:
        form = [form["id"] for form in existing_forms if form["name"] == entity_type["reference_form"]]
        entity_type["reference_form"] = form[0]
        new_entity_type = iaso_client.post("/api/entitytypes/", json=entity_type)
        last_new_entity_type = iaso_client.get("/api/entitytypes/?order=-id")[0]
        entity_type["id"] = last_new_entity_type["id"]
        wfw_version = iaso_client.post(
            "/api/workflowversions/",
            json={
                "name": entity_type["name"],
                "entity_type_id": entity_type["id"],
            },
        )

        followup_form = [form for form in existing_forms if form["name"] == entity_type["followup_form"]]
        new_entity_type["followup_form"] = followup_form[0]
        iaso_client.post(
            "/api/workflowfollowups/?version_id=" + str(wfw_version["version_id"]),
            {
                "condition": entity_type["condition"],
                "form_ids": [new_entity_type["followup_form"]["id"]],
                "order": 0,
            },
        )
        iaso_client.patch(
            f"/api/workflowversions/{wfw_version['version_id']}/",
            json={
                "status": "PUBLISHED",
            },
        )
        setup_entities(account_name, iaso_client, entity_type, new_entity_type)
