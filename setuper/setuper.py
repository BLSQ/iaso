import requests
from credentials import *
import time


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
    data = {"project": project_id, "data_source": data_source_id, "version": "1", "description": "Sample geopackage"}

    test_file = "data/sample.gpkg"

    # data=form_data

    geopackage_file = {"file": (test_file, open(test_file, "rb"), "application/octet-stream")}
    r = requests.post(launch_geopackage_import_url, files=geopackage_file, data=data, headers=headers)
    print("importing org units")

    count = 0
    imported = False
    while not imported and count < 120:
        r = requests.get(API_URL + "tasks/", headers=headers)
        print("retrying")
        task = r.json()["tasks"][0]
        imported = task["status"] == "SUCCESS"
        time.sleep(3)
        count += 3

    print("importing done")


def setup_instances(account_name):
    {
        "id": None,
        "name": "test_form",
        "short_name": "",
        "depth": None,
        "org_unit_type_ids": [
            3
        ],
        "project_ids": [
            3
        ],
        "single_per_period": False,
        "periods_before_allowed": 0,
        "periods_after_allowed": 0,
        "device_field": "deviceid",
        "location_field": "",
        "label_keys": []
    }


if __name__ == "__main__":
    import string
    import random

    account_name = "".join(random.choices(string.ascii_lowercase, k=7))

    setup_account(account_name)
    setup_orgunits(account_name)
    print("account created:", account_name)
