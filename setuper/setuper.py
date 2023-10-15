import requests
from credentials import *
import time
import uuid


def get_auth_headers(user_name, password):
    creds = {"username": user_name, "password": password}

    # get API token
    r = requests.post(API_URL + "token/", json=creds)

    token = r.json().get("access")
    headers = {"Authorization": "Bearer %s" % token}
    return headers


def setup_account(account_name):
    headers = get_auth_headers(ADMIN_USER_NAME, ADMIN_PASSWORD)

    setup_account_url = f"{API_URL}setupaccount/"

    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name,
    }

    r = requests.post(setup_account_url, json=data, headers=headers)


def setup_orgunits(account_name):
    headers = get_auth_headers(account_name, account_name)

    r = requests.get(API_URL + "projects/", headers=headers)

    project_id = r.json()["projects"][0]["id"]

    r = requests.get(API_URL + "datasources/", headers=headers)

    sources = r.json()["sources"]
    source = sources[0]
    data_source_id = source["id"]

    launch_geopackage_import_url = f"{API_URL}tasks/create/importgpkg/"
    data = {
        "project": project_id,
        "data_source": data_source_id,
        "version_number": "1",
        "description": "Sample geopackage",
    }

    test_file = "data/small_sample.gpkg"

    geopackage_file = {"file": (test_file, open(test_file, "rb"), "application/octet-stream")}
    r = requests.post(launch_geopackage_import_url, files=geopackage_file, data=data, headers=headers)
    print("-- Importing org units")

    count = 0
    imported = False
    while not imported and count < 120:
        r = requests.get(API_URL + "tasks/", headers=headers)

        task = r.json()["tasks"][0]
        imported = task["status"] == "SUCCESS"
        time.sleep(5)
        count += 5
        print("\tWaiting:", count, "s elapsed")

    r = requests.get(API_URL + "datasources/", headers=headers)

    source = r.json()["sources"][0]
    source_id = source["id"]

    data = {
        "validation_status": "VALID",
        "select_all": True,
        "searches": [{"validation_status": "all", "color": "f4511e", "source": source_id}],
    }
    bulkupdate_url = f"{API_URL}tasks/create/orgunitsbulkupdate/"
    r = requests.post(bulkupdate_url, json=data, headers=headers)


def setup_instances(account_name):
    print("-- Setting up a form")
    headers = get_auth_headers(account_name, account_name)

    r = requests.get(API_URL + "projects/", headers=headers)

    project_id = r.json()["projects"][0]["id"]

    r = requests.get(API_URL + "v2/orgunittypes/", headers=headers)

    org_unit_types = r.json()["orgUnitTypes"]

    hf_out = None
    for out in org_unit_types:
        if out["name"] == "Formation sanitaire":
            hf_out = out

    org_unit_type_ids = [out["id"] for out in org_unit_types]

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

    r = requests.post(API_URL + "forms/", json=data, headers=headers)
    form_id = r.json()["id"]

    test_file = "data/sample_form.xlsx"
    data = {"form_id": form_id, "xls_file": test_file}
    form_files = {"xls_file": open(test_file, "rb")}

    r = requests.post(API_URL + "formversions/", files=form_files, data=data, headers=headers)
    ######## creating submissions/instances
    f = open("data/instance.xml", "r")
    xml = f.read()
    f.close()
    limit = 20
    url = API_URL + "orgunits/?limit=%d&orgUnitTypeId=%d" % (limit, hf_out["id"])

    org_unit_ids = []

    print("-- Downloading org units")
    seconds = 0
    # we need to wait for org units to appear in the API before continuing
    while len(org_unit_ids) == 0 and seconds <= 30:
        time.sleep(2)
        seconds += 2
        re = requests.get(url, headers=headers)
        org_unit_ids = [ou["id"] for ou in re.json()["orgunits"]]

    print("-- Submitting %d form instances" % limit)
    count = 0
    for org_unit_id in org_unit_ids:
        the_uuid = str(uuid.uuid4())
        file_name = "example_%s.xml" % the_uuid
        variables = {"uuid": the_uuid}

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
                "file": local_path,
                "name": file_name,
            }
        ]
        #
        response = requests.post(
            API_URL + "instances/" + "?app_id=%s" % account_name, json=instance_body, headers=headers
        )

        with open(local_path) as fp:
            r = requests.post(UPLOAD_URL, files={"xml_submission_file": fp})
        count = count + 1
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
