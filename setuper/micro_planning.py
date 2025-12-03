import json
import random

from datetime import datetime, timedelta

from fake import fake_person


NEW = "new"
REJECTED = "rejected"
APPROVED = "approved"
PENDING = "pending"
SAME = "same"
UNKNOWN = "unknown"


def setup_users_teams_micro_planning(account_name, iaso_client):
    print("-- users, teams and micro planning")

    project_ids = [x["id"] for x in iaso_client.get("/api/projects/")["projects"] if x["name"] == "Planning"]

    permissions_codes = [x["codename"] for x in iaso_client.get("/api/permissions/")["permissions"]]

    for user_index in range(1, 40):
        person = fake_person()

        first_name = person["firstname"]
        last_name = person["lastname"]
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

    print(f"\t{len(users) - 1} users created")

    manager = iaso_client.get("/api/profiles/me/")

    project_id = project_ids[0]

    team_index = 0
    for team_name in ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"]:
        user_ids = [x["user_id"] for x in users[team_index : team_index + 5]]
        iaso_client.post(
            "/api/teams/",
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

    teams = iaso_client.get("/api/teams/?limit=20000")["results"]

    print(f"\t{len(teams) - 1} teams created")

    iaso_client.post(
        "/api/teams/",
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
    planning_form = [form for form in forms if form["form_id"] == "SAMPLE_FORM_new5"][0]

    source_id = manager["account"]["default_version"]["data_source"]["id"]
    country = iaso_client.get(
        "/api/orgunits/",
        params={
            "limit": 2,
            "order": "-id",
            "searches": json.dumps(
                [
                    {
                        "validation_status": "VALID",
                        "color": "f4511e",
                        "source": str(source_id),
                        "depth": 1,
                    }
                ]
            ),
        },
    )["orgunits"][0]

    team = teams[0]
    current_date = datetime.now()
    campaign = iaso_client.post(
        "/api/microplanning/plannings/",
        {
            "name": "Campagne Carte Sanitaire",
            "forms": [planning_form["id"]],
            "project": project_id,
            "team": team["id"],
            "org_unit": country["id"],
            "started_at": current_date.strftime("%Y-%m-%d"),
            "ended_at": (current_date + timedelta(days=365)).strftime("%Y-%m-%d"),
            "published_at": current_date.strftime("%Y-%m-%d"),
        },
    )

    health_facitities = iaso_client.get(
        "/api/orgunits/",
        params={
            "limit": 70,
            "order": "name",
            "page": 1,
            "searches": json.dumps(
                [
                    {
                        "validation_status": "VALID",
                        "geography": "any",
                        "depth": 5,
                    }
                ]
            ),
            "locationLimit": 100,
        },
    )["orgunits"]

    # Get the users from the team
    team_users = team["users"]

    print(f"Found {len(team_users)} users in team {team['name']} but assign only {len(team_users[:3])}")

    for health_facitity in health_facitities:
        # Select an arbitrary user from the team for this assignment
        selected_user_id = random.choice(team_users[:3])

        print(
            "assigning",
            health_facitity["name"],
            "to",
            team["name"],
            "user ID:",
            selected_user_id,
        )

        iaso_client.post(
            "/api/microplanning/assignments/",
            json={
                "planning": campaign["id"],
                "org_unit": health_facitity["id"],
                "user": selected_user_id,
            },
        )

    print(campaign)


# Define the function outside the loop to avoid the loop variable binding issue
def get_conclusion(field_name, old_value, new_value, change_request):
    # If the change request is new, no conclusion is made
    if change_request.status == NEW:
        return PENDING

    # If the change request is rejected, all fields are rejected
    if change_request.status == REJECTED:
        return REJECTED

    # If the change request is approved, check if the field is in approved_fields
    if change_request.status == APPROVED:
        # Map field names to their corresponding field in requested_fields
        field_mapping = {
            "name": "new_name",
            "parent": "new_parent",
            "ref_ext_parent_1": "new_parent",
            "ref_ext_parent_2": "new_parent",
            "ref_ext_parent_3": "new_parent",
            "opening_date": "new_opening_date",
            "closing_date": "new_closed_date",
            "groups": "new_groups",
            "localisation": "new_location",
            "reference_submission": "new_reference_instances",
        }

        # Get the corresponding field name in requested_fields
        requested_field = field_mapping.get(field_name)

        # If the field is not in requested_fields, it means no change was requested
        if requested_field not in change_request.requested_fields:
            return SAME

        # If the field is in approved_fields, it was approved
        if requested_field in change_request.approved_fields:
            return APPROVED

        # If the field is in requested_fields but not in approved_fields, it was rejected
        return REJECTED

    # Default case (should not happen)
    return UNKNOWN
