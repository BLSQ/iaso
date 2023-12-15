import uuid
from datetime import datetime
import os


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
        "location_field": "",
        "label_keys": [],
    }

    form_id = iaso_client.post("/api/forms/", json=data)["id"]

    # associate it's form version and upload xlsform

    test_file = "data/sample_form.xlsx"
    data = {"form_id": form_id, "xls_file": test_file}
    form_files = {"xls_file": open(test_file, "rb")}

    try:
        iaso_client.post("/api/formversions/", files=form_files, data=data)
    except:
        # TODO mutate the xlsform to have a unique id in the "form_id" based on account_name
        pass

    ######## creating submissions/instances
    with open("data/instance.xml", "r") as f:
        xml = f.read()

    print("-- Downloading org units")

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

        # see hat/sync/views.py
        with open(local_path) as fp_xml:
            image_number = (count % 3) + 1
            with open(f"./data/fosa{image_number}.jpeg", "rb") as fp_image:
                iaso_client.post("/sync/form_upload/", files={"xml_submission_file": fp_xml, "imgUrl": fp_image})

        count = count + 1

        os.remove(local_path)

        ## mobile code
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/tasks/InstanceServerUploaderTask.java#L88
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/upload/InstanceServerUploader.java#L70
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/collect_app/src/main/java/com/bluesquare/iaso/usecase/SyncInstances.kt
        if count % 5 == 0:
            print("\t%d submissions done" % count)

    print(iaso_client.get("/api/instances", params={"limit": 1})["count"], "instances created")
