from datetime import datetime
from fake import fake_person
from submissions import submission2xml
from random import randint
import random


def setup_review_change_proposal(account_name, iaso_client):
    print("-- Setting up review change proposals")

    org_unit_groups = iaso_client.get("/api/groups/")["groups"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]
    # fetch orgunit ids
    limit = 10
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": health_facility_type["id"]})[
        "orgunits"
    ]
    org_unit_group_ids = [org_unit_group["id"] for org_unit_group in org_unit_groups]
    for org_unit in orgunits:
        new_location = {"latitude": org_unit["latitude"], "longitude": org_unit["longitude"], "altitude": 0.0}

        groups = random.sample(org_unit_group_ids, random.randint(0, len(org_unit_group_ids)))
        data = {
            "org_unit_id": org_unit["id"],
            "new_name": f'{org_unit["name"]} 1',
            "new_location": new_location,
            "new_groups": groups,
            "status": random.choice(["new", "approved", "rejected"]),
        }
        print("EACH OURG UNIT ", data)

        iaso_client.post("/api/orgunits/changes/", json=data)
