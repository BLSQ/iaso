import requests
from credentials import *
import time
import uuid
from client import IasoClient
import json
from datetime import datetime

iaso_client = IasoClient(SERVER, ADMIN_USER_NAME, ADMIN_PASSWORD)


def wait_task_completion(task_to_wait):
    print(f"\tWaiting for async task '{task_to_wait['task']['name']}'")
    count = 0
    imported = False
    while not imported and count < 120:
        task = iaso_client.get(f"/api/tasks/{task_to_wait['task']['id']}")
        imported = task["status"] == "SUCCESS"

        if task["status"] == "ERRORED":
            raise Exception(f"Task failed {task}")
        time.sleep(2)
        count += 5
        print("\t\tWaiting:", count, "s elapsed", task.get("progress_message"))


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

    # make sure we use that connection afterwards so we are connected as the account admin and not the ADMIN_USER_NAME
    return IasoClient(server_url=SERVER, user_name=account_name, password=account_name)


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
    task = iaso_client.post("/api/tasks/create/importgpkg/", files=geopackage_file, data=data)
    print("-- Importing org units")

    wait_task_completion(task)

    # mark them all as valid
    data = {
        "validation_status": "VALID",
        "select_all": True,
        "searches": [{"validation_status": "all", "color": "f4511e", "source": data_source_id}],
    }
    task = iaso_client.post("/api/tasks/create/orgunitsbulkupdate/", json=data)

    wait_task_completion(task)


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

    print("-- Downloading org units")

    # fetch orgunit ids
    limit = 20
    url = f"?"
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

        ## mobile code
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/tasks/InstanceServerUploaderTask.java#L88
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/odk-collect/src/main/java/org/odk/collect/android/upload/InstanceServerUploader.java#L70
        # https://github.com/BLSQ/iaso-mobile-app/blob/develop/collect_app/src/main/java/com/bluesquare/iaso/usecase/SyncInstances.kt
        if count % 5 == 0:
            print("\t%d submissions done" % count)

    print(iaso_client.get("/api/instances", params={"limit": 1})["count"], "instances created")


def setup_users_teams_micro_planning(account_name):
    print("-- users, teams and micro planning")

    project_ids = [x["id"] for x in iaso_client.get("/api/projects/")["projects"]]

    permissions_codes = [x["codename"] for x in iaso_client.get("/api/permissions/")["permissions"]]
    user_names = open("./data/user_names.txt").read().split("\n")

    for user_index in range(1, 40):
        user_name = user_names[(user_index - 1) % len(user_names)]
        first_name = user_name.split(" ")[0]
        last_name = user_name.replace(first_name, "")
        user_identifier = f"user{user_index:02d}"
        user = {
            "id": None,
            "user_name": f"{account_name}.{user_identifier}",
            "first_name": first_name,
            "last_name": last_name,
            "email": "",
            "password": f"{account_name}.{user_identifier}",
            "permissions": [],
            "org_units": [],
            "language": "",
            "home_page": "",
            "dhis2_id": "",
            "user_roles": [],
            "user_roles_permissions": [],
            "user_permissions": permissions_codes,
            "send_email_invitation": False,
            "projects": project_ids,
        }
        iaso_client.post("/api/profiles/", json=user)

    users = iaso_client.get("/api/profiles?limit=20000")["profiles"]

    print(f"\t{len(users) -1 } users created")

    manager = iaso_client.get("/api/profiles/me/")

    project_id = project_ids[0]

    team_index = 0
    for team_name in ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"]:
        user_ids = [x["user_id"] for x in users[team_index : team_index + 5]]
        iaso_client.post(
            "/api/microplanning/teams/",
            json={
                "manager": manager["user_id"],
                "name": f"TEAM {team_name}",
                "project": project_id,
                "sub_teams": [],
                "type": "TEAM_OF_USERS",
                "users": user_ids,
            },
        )
        team_index = team_index + 1

    teams = iaso_client.get("/api/microplanning/teams/?limit=20000")["results"]
    print(f"\t{len(teams) -1 } teams created")

    team_of_team = iaso_client.post(
        "/api/microplanning/teams/",
        json={
            "name": "Team of Teams",
            "project": project_id,
            "manager": manager["user_id"],
            "type": "TEAM_OF_TEAMS",
            "users": [],
            "sub_teams": [x["id"] for x in teams],
        },
    )
    forms = iaso_client.get("/api/forms")["forms"]

    source_id = manager["account"]["default_version"]["data_source"]["id"]
    country = iaso_client.get(
        "/api/orgunits/",
        params={
            "limit": 3000,
            "order": "id",
            "searches": json.dumps(
                [{"validation_status": "VALID", "color": "f4511e", "source": str(source_id), "depth": 1}]
            ),
        },
    )["orgunits"][0]

    campaign = iaso_client.post(
        "/api/microplanning/plannings/",
        {
            "name": "Campagne Carte Sanitaire",
            "forms": [f["id"] for f in forms],
            "project": project_id,
            "team": team_of_team["id"],
            "org_unit": country["id"],
            "started_at": "2023-12-01",
            "ended_at": "2023-12-31",
            "published_at": None,
        },
    )

    districts = iaso_client.get(
        "/api/orgunits/",
        params={
            "validation_status": "VALID",
            "geography": "any",
            "onlyDirectChildren": "false",
            "page": 1,
            "withParents": "true",
            "order": "name",
            "depth": 4,
        },
    )["orgUnits"]

    district_index = 0
    for district in districts:
        team = teams[district_index]
        print("assigning", district["name"], "to", team["name"])

        iaso_client.post(
            "/api/microplanning/assignments/",
            json={"planning": campaign["id"], "org_unit": district["id"], "team": team["id"]},
        )

        district_index = district_index + 1

    print(campaign)


if __name__ == "__main__":
    import string
    import random

    account_name = "".join(random.choices(string.ascii_lowercase, k=7))
    print("Creating account:", account_name)
    iaso_client = setup_account(account_name)
    setup_orgunits(account_name)
    setup_instances(account_name)
    setup_users_teams_micro_planning(account_name)

    print("-----------------------------------------------")
    print("Account created:", account_name)
    print("Login at %s with\n\tlogin: %s \n\tpassword: %s" % (SERVER, account_name, account_name))
    print("-----------------------------------------------")
