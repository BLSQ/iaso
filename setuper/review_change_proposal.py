import random

from submissions import org_unit_gps_point


def instance_details_by_id(instanceId, iaso_client):
    return iaso_client.get(f"/api/instances/{instanceId}")["files"]


def setup_review_change_proposal(account_name, iaso_client):
    print("-- Setting up review change proposals")
    org_unit_groups = iaso_client.get("/api/groups/")["groups"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]
    forms = iaso_client.get("/api/forms/")["forms"]
    reference_form = [form for form in forms if form["name"] == "Data for Health facility/Données Formation sanitaire"][
        0
    ]

    # fetch orgunit ids
    limit = 12
    orgunits = iaso_client.get("/api/orgunits/", params={"limit": limit, "orgUnitTypeId": health_facility_type["id"]})[
        "orgunits"
    ]
    org_unit_group_ids = [org_unit_group["id"] for org_unit_group in org_unit_groups]
    for org_unit in orgunits:
        location = [None, {**org_unit_gps_point(org_unit)}]
        new_location = random.choice(location)
        groups = random.sample(org_unit_group_ids, random.randint(0, len(org_unit_group_ids)))
        name_extension = random.choice(["", "1"])
        status = random.choice(["new", "approved", "rejected"])
        approved_fields = []

        reference_instances_linked_to_org_unit = iaso_client.get(
            f"/api/instances/?app_id={account_name}",
            params={"orgUnitId": org_unit["id"], "form_ids": reference_form["id"]},
        )["instances"]

        # Get instances with picture
        reference_instances = [
            reference_instance
            for reference_instance in reference_instances_linked_to_org_unit
            if len(instance_details_by_id(reference_instance["id"], iaso_client)) > 0
        ]
        reference_instance_ids = [reference_instance["id"] for reference_instance in reference_instances]
        new_reference_instances = [random.choice(reference_instance_ids)] if len(reference_instance_ids) > 0 else []

        data = {
            "org_unit_id": org_unit["id"],
            "status": status,
        }
        validation = None
        proposal_review = None
        if len(groups) > 0:
            data["new_groups"] = groups
            approved_fields.append("new_groups")
        if name_extension != "":
            data["new_name"] = f"{org_unit['name']} {name_extension}"
            approved_fields.append("new_name")

        if new_location is not None:
            data["new_location"] = new_location
            approved_fields.append("new_location")

        if len(new_reference_instances) > 0:
            data["new_reference_instances"] = new_reference_instances
            approved_fields.append("new_reference_instances")
        if len(approved_fields) > 0:
            proposal_review = iaso_client.post("/api/orgunits/changes/", json=data)
            if status == "approved" or status == "rejected":
                validation = {
                    "approved_fields": approved_fields,
                    "status": status,
                    "rejection_comment": status,
                }
                iaso_client.patch(f"/api/orgunits/changes/{proposal_review['id']}/", json=validation)
