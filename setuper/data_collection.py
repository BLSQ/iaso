import uuid
from datetime import datetime
from submissions import submission2xml
from fake import fake_person
from random import random


def setup_instances(account_name, iaso_client):
    print("-- Setting up a form")
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]

    hf_out = [out for out in org_unit_types if out["name"] == "Formation sanitaire"][0]

    org_unit_type_ids = [out["id"] for out in org_unit_types]

    # create a form
    data = {
        "id": None,
        "name": "test_form",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": org_unit_type_ids,
        "project_ids": [project_id],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "gps",
        "label_keys": [],
    }

    form_id = iaso_client.post("/api/forms/", json=data)["id"]

    # associate it's form version and upload xlsform

    test_file = "data/sample_form.xlsx"
    data = {"form_id": form_id, "xls_file": test_file}
    form_files = {"xls_file": open(test_file, "rb")}

    form_version = iaso_client.post("/api/formversions/", files=form_files, data=data)

    ######## creating submissions/instances
    print("-- Downloading org units")

    # fetch orgunit ids
    limit = 20
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": hf_out["id"]})["orgunits"]
    org_unit_ids = [ou["id"] for ou in orgunits]

    print("-- Submitting %d submissions" % limit)
    count = 0
    for org_unit_id in org_unit_ids:
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid
        local_path = "generated/%s" % file_name
        current_datetime = int(datetime.now().timestamp())

        instance_body = [
            {
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
        ]

        iaso_client.post(f"/api/instances/?app_id={account_name}", json=instance_body)

        person = fake_person()
        latitude = 40 + random()
        longitude = -99 + random()
        instance_json = {
            "title": None,
            "name": person["lastname"] + " " + person["firstname"],
            "test_submission": "yes",
            "test_group": {"CAN_part_1_note": None, "imgUrl": "imgUrl", "gps": f"{latitude} {longitude} 0 0"},
            "meta": {"instanceID": "uuid:" + the_uuid},
        }

        # see hat/sync/views.py
        image_number = (count % 3) + 1
        with open(f"./data/fosa{image_number}.jpeg", "rb") as fp_image:
            iaso_client.post(
                "/sync/form_upload/",
                files={
                    "xml_submission_file": (
                        local_path,
                        submission2xml(
                            instance_json, form_version_id=form_version["version_id"], form_id="SAMPLE_FORM_new5"
                        ),
                    ),
                    "imgUrl": fp_image,
                },
            )

        count = count + 1

        ## mobile code
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/tasks/InstanceServerUploaderTask.java#L88
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/upload/InstanceServerUploader.java#L70
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/collect_app/src/main/java/com/bluesquare/iaso/usecase/SyncInstances.kt
        if count % 5 == 0:
            print("\t%d submissions done" % count)

    print(iaso_client.get("/api/instances", params={"limit": 1})["count"], "instances created")
