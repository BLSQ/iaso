"""
Generate a large number of entities (with 1 registration submission and a random
number of followup submissions each) using the mobile "bulk upload" zip-import
endpoint (/api/mobile/bulkupload/) instead of the setuper's normal per-instance
HTTP flow (POST /api/instances/ + POST /sync/form_upload/ for every submission).

Building the zip locally and uploading it in batches turns ~N*2 HTTP round trips
into a handful of requests, which is what makes generating 300 000+ entities
practical.

Prerequisites:
- An account created by setuper.py with --additional_projects, so the
  "Children less than 5" entity type, its Registration/Follow-up forms and its
  workflow already exist.
- A tasks worker running (the zip is processed asynchronously):
      docker compose run iaso manage tasks_worker

Usage:
    python3 bulk_entities.py -s <server_url> -n <account_name> --count 300000

    By default, the script authenticates as the account itself (setuper.py creates
    accounts with username == password == account name). Pass -u/-p to use different
    credentials (e.g. if the account's password was changed).

    The script is fire-and-forget by default: it uploads all the zips and exits
    without waiting for the worker(s) to process them - handy against staging,
    where the imports just land in the existing task queue. Pass --wait to block
    until every uploaded batch has been processed.
"""

import argparse
import io
import json
import sys
import time
import zipfile

from datetime import datetime, timedelta
from random import randint
from uuid import uuid4

import requests

from iaso_api_client import IasoClient
from submissions import APP_VERSION, instance_by_LLIN_campaign_form, org_unit_gps_point, submission2xml


BULK_UPLOAD_TASK_NAME = "process_mobile_bulk_upload"


def fetch_all_org_units(iaso_client, org_unit_type_name):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/?fields=id,name")["orgUnitTypes"]
    org_unit_type = next(out for out in org_unit_types if out["name"] == org_unit_type_name)

    org_units = []
    page = 1
    page_size = 1000
    while True:
        page_data = iaso_client.get(
            "/api/orgunits/",
            params={
                "limit": page_size,
                "page": page,
                "orgUnitTypeId": org_unit_type["id"],
                "fields": "id,longitude,latitude,altitude",
            },
        )
        org_units += page_data["orgunits"]
        if len(page_data["orgunits"]) < page_size:
            break
        page += 1

    if not org_units:
        raise Exception(f"No org units found with type '{org_unit_type_name}'")
    return org_units


def fetch_form(iaso_client, form_name):
    forms = iaso_client.get("/api/forms/")["forms"]
    form = next(f for f in forms if f["name"] == form_name)
    form_detail = iaso_client.get(f"/api/forms/{form['id']}/?fields=id,form_id,latest_form_version")
    return {
        "id": form_detail["id"],
        "form_id": form_detail["form_id"],
        "latest_form_version": form_detail["latest_form_version"],
    }


def fetch_entity_type(iaso_client, entity_type_name):
    entity_types = iaso_client.get("/api/entitytypes/")
    return next(et for et in entity_types if et["name"] == entity_type_name)


def build_instance_data(the_uuid, org_unit, form, entity_uuid, entity_type_id, created_at, file_name):
    return {
        **org_unit_gps_point(org_unit),
        "id": the_uuid,
        "created_at": created_at,
        "updated_at": created_at,
        "orgUnitId": org_unit["id"],
        "formId": form["id"],
        "entityUuid": entity_uuid,
        "entityTypeId": entity_type_id,
        "accuracy": 0,
        "file": file_name,
        "name": file_name,
    }


def add_instance_to_zip(zip_file, instances_json, org_unit, form, entity_uuid, entity_type_id, created_at):
    the_uuid = str(uuid4())
    file_name = f"{the_uuid}.xml"
    created_at_ts = int(created_at.timestamp())

    instances_json.append(
        build_instance_data(the_uuid, org_unit, form, entity_uuid, entity_type_id, created_at_ts, file_name)
    )

    instance_json = instance_by_LLIN_campaign_form(form, {"instanceID": "uuid:" + the_uuid}, org_unit)
    xml = submission2xml(
        instance_json,
        form_id=form["form_id"],
        form_version_id=form["latest_form_version"]["version_id"],
    )
    zip_file.writestr(f"{the_uuid}/{file_name}", xml)


def build_batch_zip(
    org_units,
    entity_type_id,
    reference_form,
    followup_form,
    batch_size,
    max_followups,
    followup_window_days,
    registration_window_days,
):
    buffer = io.BytesIO()
    instances_json = []
    now = datetime.now()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for i in range(batch_size):
            entity_uuid = str(uuid4())
            org_unit = org_units[randint(0, len(org_units) - 1)]

            # Spread registration dates over the past, instead of dating every entity "now".
            registration_date = now - timedelta(days=randint(0, registration_window_days))
            add_instance_to_zip(
                zip_file, instances_json, org_unit, reference_form, entity_uuid, entity_type_id, registration_date
            )

            # Followups happen at random, increasing gaps after the registration, capped at "now".
            followup_date = registration_date
            for _ in range(randint(0, max_followups)):
                followup_date += timedelta(days=randint(1, followup_window_days))
                if followup_date > now:
                    break
                add_instance_to_zip(
                    zip_file, instances_json, org_unit, followup_form, entity_uuid, entity_type_id, followup_date
                )

        zip_file.writestr("instances.json", json.dumps(instances_json))

    buffer.seek(0)
    return buffer, len(instances_json)


def upload_batch_zip(iaso_client, account_name, zip_buffer, batch_index):
    url = iaso_client.server_url.rstrip("/") + "/api/mobile/bulkupload/"
    files = {"zip_file": (f"bulk_entities_{batch_index}.zip", zip_buffer, "application/zip")}
    response = requests.post(
        url, params={"app_id": account_name, "app_version": APP_VERSION}, headers=iaso_client.headers, files=files
    )
    if response.status_code != 204:
        raise Exception(f"Bulk upload of batch {batch_index} failed: {response.status_code} {response.text}")


def wait_for_bulk_uploads(iaso_client, expected_count, poll_interval=5, timeout=3600):
    print(f"-- Waiting for {expected_count} bulk upload task(s) to be processed by a worker")
    start = time.time()
    while time.time() - start < timeout:
        try:
            tasks = iaso_client.get(
                "/api/tasks/",
                params={"task_type": BULK_UPLOAD_TASK_NAME, "order": "-created_at", "limit": expected_count},
            )["tasks"]
        except Exception as e:
            print(f"\tCouldn't poll /api/tasks/ ({e}), giving up on waiting - check task status manually")
            return
        errored = [t for t in tasks if t["status"] == "ERRORED"]
        if errored:
            raise Exception(f"{len(errored)} bulk upload task(s) failed, check /api/tasks/ for details")
        done = [t for t in tasks if t["status"] == "SUCCESS"]
        print(f"\t{len(done)}/{expected_count} done")
        if len(done) >= expected_count:
            return
        time.sleep(poll_interval)
    raise Exception("Timed out waiting for bulk uploads to complete. Is a tasks worker running?")


def create_bulk_entities(
    iaso_client,
    account_name,
    count,
    batch_size,
    max_followups,
    followup_window_days,
    registration_window_days,
    org_unit_type_name,
    entity_type_name,
    reference_form_name,
    followup_form_name,
    wait_for_completion,
):
    print(f"-- Fetching '{entity_type_name}' entity type, forms and '{org_unit_type_name}' org units")
    entity_type = fetch_entity_type(iaso_client, entity_type_name)
    reference_form = fetch_form(iaso_client, reference_form_name)
    followup_form = fetch_form(iaso_client, followup_form_name)
    org_units = fetch_all_org_units(iaso_client, org_unit_type_name)
    print(f"\tFound {len(org_units)} org units to spread {count} entities across")

    remaining = count
    batch_index = 0
    start_time = time.time()

    while remaining > 0:
        current_batch_size = min(batch_size, remaining)
        zip_buffer, instance_count = build_batch_zip(
            org_units,
            entity_type["id"],
            reference_form,
            followup_form,
            current_batch_size,
            max_followups,
            followup_window_days,
            registration_window_days,
        )
        upload_batch_zip(iaso_client, account_name, zip_buffer, batch_index)

        remaining -= current_batch_size
        batch_index += 1
        done = count - remaining
        elapsed = time.time() - start_time
        print(
            f"-- Uploaded batch {batch_index} ({current_batch_size} entities, {instance_count} submissions). "
            f"{done}/{count} entities queued, {elapsed:.1f}s elapsed"
        )

    print(f"-- Done, queued {count} entities across {batch_index} batch(es) in {time.time() - start_time:.1f}s")

    if wait_for_completion:
        wait_for_bulk_uploads(iaso_client, batch_index)
    else:
        print(
            "-- Not waiting for processing (fire-and-forget). "
            "Check /api/tasks/?task_type=process_mobile_bulk_upload for status."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk-generate entities via the mobile bulk upload zip import")
    parser.add_argument("-u", "--username", type=str, help="User name")
    parser.add_argument("-p", "--password", type=str, help="Password")
    parser.add_argument("-s", "--server_url", type=str, help="Server URL")
    parser.add_argument("-n", "--account", type=str, required=True, help="Existing account name")
    parser.add_argument("-c", "--count", type=int, default=1000, help="Number of entities to create")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=570,
        help="Entities per uploaded zip (with default followup settings, averages ~2000 submissions/instances "
        "per batch, matching the mobile app's INSTANCES_PER_ZIP)",
    )
    parser.add_argument("--max-followups", type=int, default=5, help="Max number of followup submissions per entity")
    parser.add_argument(
        "--followup-window-days",
        type=int,
        default=4,
        help="Max number of days between the registration (or previous followup) and the next followup",
    )
    parser.add_argument(
        "--registration-window-days",
        type=int,
        default=180,
        help="Registration dates are randomized between now and this many days in the past",
    )
    parser.add_argument("--org-unit-type-name", type=str, default="Health facility/Formation sanitaire - HF")
    parser.add_argument("--entity-type-name", type=str, default="Children less than 5")
    parser.add_argument("--reference-form-name", type=str, default="Child/Enfant - Registration/Enregistrement")
    parser.add_argument("--followup-form-name", type=str, default="Child/Enfant - Follow-up/Suivi")
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Wait for the bulk upload tasks to finish processing (default: fire-and-forget)",
    )

    args = parser.parse_args()
    server_url = args.server_url
    # The account itself is used as the default login, matching the credentials
    # setuper.py's setup_account() creates (username == password == account name).
    username = args.username or args.account
    password = args.password or args.account

    if server_url is None:
        from credentials import *

        try:
            server_url = SERVER
        except ModuleNotFoundError:
            pass

    if not server_url:
        sys.exit("ERROR: Value for server url is required (pass -s or set it in credentials.py)")

    iaso_client = IasoClient(server_url=server_url)
    iaso_client.authenticate_with_username_and_password(username=username, password=password)

    create_bulk_entities(
        iaso_client,
        args.account,
        args.count,
        args.batch_size,
        args.max_followups,
        args.followup_window_days,
        args.registration_window_days,
        args.org_unit_type_name,
        args.entity_type_name,
        args.reference_form_name,
        args.followup_form_name,
        args.wait,
    )
