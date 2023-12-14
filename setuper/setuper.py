import requests
from credentials import *
import time
import uuid
from client import IasoClient


iaso_client = IasoClient(SERVER, ADMIN_USER_NAME, ADMIN_PASSWORD)


def setup_account(account_name):
    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name,
        "modules": ["DEFAULT", "REGISTRY", "POLIO_PROJECT", "PLANNING", "ENTITIES", "DATA_COLLECTION_FORMS"],
    }

    iaso_client.post("/api/setupaccount/", json=data)


def setup_orgunits(account_name):
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    sources = iaso_client.get("/api/datasources/")["sources"]
    source = sources[0]
    data_source_id = source["id"]

    # import a geopackage

    data = {
        "project": project_id,
        "data_source": data_source_id,
        "version_number": "1",
        "description": "Sample geopackage",
    }

    test_file = "data/small_sample.gpkg"

    geopackage_file = {"file": (test_file, open(test_file, "rb"), "application/octet-stream")}
    iaso_client.post("/api/tasks/create/importgpkg/", files=geopackage_file, data=data)
    print("-- Importing org units")

    count = 0
    imported = False
    while not imported and count < 120:
        time.sleep(5)
        task = iaso_client.get("/api/tasks/")["tasks"][0]
        imported = task["status"] == "SUCCESS"
        time.sleep(5)
        count += 5
        print("\tWaiting:", count, "s elapsed", task.get("progress_message"))

    # mark them all as valid
    data = {
        "validation_status": "VALID",
        "select_all": True,
        "searches": [{"validation_status": "all", "color": "f4511e", "source": data_source_id}],
    }
    r = iaso_client.post("/api/tasks/create/orgunitsbulkupdate/", json=data)


def setup_instances(account_name):
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

    # fetch orgunit ids
    limit = 20
    url = f"/api/orgunits/?limit={limit}&orgUnitTypeId={hf_out['id']}"

    org_unit_ids = []

    print("-- Downloading org units")
    seconds = 0
    # we need to wait for org units to appear in the API before continuing
    while len(org_unit_ids) == 0 and seconds <= 30:
        time.sleep(2)
        seconds += 2
        re = iaso_client.get(url)
        org_unit_ids = [ou["id"] for ou in re["orgunits"]]

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
        instance_body = [
            {
                "id": the_uuid,
                "latitude": None,
                "created_at": 1676147677909,
                "updated_at": 1676147677909,
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
        #
        iaso_client.post(f"/api/instances/?app_id={account_name}", json=instance_body)

        # see hat/sync/views.py
        with open(local_path) as fp_xml:
            image_number = (count % 3) + 1
            with open(f"./data/fosa{image_number}.jpeg", "rb") as fp_image:
                iaso_client.post("/sync/form_upload/", files={"xml_submission_file": fp_xml, "imgUrl": fp_image})

        count = count + 1

        ## mobile code
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/tasks/InstanceServerUploaderTask.java#L88
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/upload/InstanceServerUploader.java#L70
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/collect_app/src/main/java/com/bluesquare/iaso/usecase/SyncInstances.kt
        if count % 5 == 0:
            print("\t%d submissions done" % count)


if __name__ == "__main__":
    import string
    import random

    account_name = "".join(random.choices(string.ascii_lowercase, k=7))
    print("Creating account:", account_name)
    setup_account(account_name)
    setup_orgunits(account_name)
    setup_instances(account_name)
    print("-----------------------------------------------")
    print("Account created:", account_name)
    print("Login at %s with\n\tlogin: %s \n\tpassword: %s" % (SERVER, account_name, account_name))
    print("-----------------------------------------------")
