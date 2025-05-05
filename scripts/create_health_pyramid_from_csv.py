import csv

from collections import defaultdict

import requests


"""
Disclaimer: This script is a work in progress. There are many ways to improve and
make this script more generic. For the time being, you can set it up as follows:

1. Put all data in a CSV with column names:
    - "partner" this will become the OU groups
    - For each OrgUnitType: short_name
2. Make sure SERVER_BASE_URL and AUTH_TOKEN are correctly configured to your
   desired server.
"""

SERVER_BASE_URL = "https://qa.coda.go.wfp.org"

orgunits_url = SERVER_BASE_URL + "/api/orgunits/"
groups_url = SERVER_BASE_URL + "/api/groups/"
create_org_unit_url = SERVER_BASE_URL + "/api/orgunits/create_org_unit/"
org_unit_types_url = SERVER_BASE_URL + "/api/v2/orgunittypes/"

AUTH_TOKEN = "XXX"
headers = {"Authorization": "Bearer %s" % AUTH_TOKEN}

SOURCE_VERSION_ID = 1  # ID of the default source
COUNTRY_ID = 1  # ID of the main node of the org unit tree
CSV_NAME = "ethiopia.csv"


def csv_to_dict(filename):
    with open(filename, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        return [{k: v.strip() for k, v in row.items()} for row in reader]


def get_group_id_by_name(groups, name):
    for group in groups:
        if group["name"] == name:
            return group["id"]
    return None


def find_or_create_org_unit(name, org_unit_type_id, parent_id, group_id=None):
    search_url = (
        orgunits_url
        + f'?limit=20&order=id&page=1&searches=[{{"validation_status":"VALID","search":"{name}","version":{SOURCE_VERSION_ID},"orgUnitTypeId":"{org_unit_type_id}","orgUnitParentId":"{parent_id}"}}]'
    )
    response = requests.get(search_url, headers=headers)
    result_count = response.json()["count"]
    if result_count == 0:
        print("CREATING")
        payload = {
            "id": None,
            "name": name,
            "org_unit_type_id": org_unit_type_id,
            "groups": [group_id] if group_id else [],
            "sub_source": None,
            "aliases": [],
            "validation_status": "VALID",
            "parent_id": parent_id,
        }
        resp = requests.post(create_org_unit_url, headers=headers, json=payload)
        return resp.json()["id"]
    if result_count > 1:
        print(f"WARNING: Found multiple results for {name}")
    print("FOUND")
    return response.json()["orgunits"][0]["id"]


# Call the function with your csv file path
rows = csv_to_dict(CSV_NAME)


# Groups
groups = {}
print("Fetching group ids, create groups if needed")
groups_in_csv = set([row["partner"] for row in rows])
existing_groups = requests.get(groups_url, headers=headers).json()["groups"]
existing_group_names = set([g["name"] for g in existing_groups])

for group_name in groups_in_csv:
    if group_name in existing_group_names:
        groups[group_name] = get_group_id_by_name(existing_groups, group_name)
    else:
        print(f"\tcreating group: {group_name}")
        payload = {"name": group_name, "source_ref": ""}
        response = requests.post(groups_url, headers=headers, json=payload)
        groups[group_name] = response.json()["id"]
print("Groups", groups)

# OU Types
print("Existing OU types:")
ou_types = {}
response = requests.get(org_unit_types_url, headers=headers).json()["orgUnitTypes"]
for out in response:
    ou_types[out["short_name"]] = out

for key, out in ou_types.items():
    print(f"Depth {out['depth']}: {out['name']} - {key} (ID: {out['id']})")


# Function to create an recursively (endlessly) nested dictionary
# https://howchoo.com/python/nested-defaultdict-python/
def nested_dict():
    return defaultdict(nested_dict)


hierarchy = nested_dict()

# Initialize the nested dictionary
for row in rows:
    current_level = hierarchy
    for org_unit_type_name, name in row.items():
        tuple = (name, org_unit_type_name)
        current_level = current_level[tuple]


# Convert the dict with recursively nested defaultdicts to a regular dict
def dictify(d):
    if isinstance(d, defaultdict):
        d = {k: dictify(v) for k, v in d.items()}
    return d


final_hierarchy = dictify(hierarchy)


# Process the pyramid, create OUs and print out results
def process_hierarchy(d, level=1, parent_id=COUNTRY_ID):
    for tuple, value in d.items():
        ou_name, ou_type = tuple  # Unpack the tuple
        if not ou_name:
            continue

        print("\t" * (level - 1) + f"{ou_name} ({ou_type})")
        org_unit_id = find_or_create_org_unit(
            name=ou_name,
            org_unit_type_id=ou_types[ou_type]["id"],
            parent_id=parent_id,
        )
        if isinstance(value, dict):
            process_hierarchy(value, level + 1, org_unit_id)


process_hierarchy(final_hierarchy)
