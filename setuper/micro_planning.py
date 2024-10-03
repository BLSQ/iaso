import json
from fake import fake_person
from datetime import datetime, timedelta


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

    iaso_client.post(
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

    team = [team for team in teams if team["name"] == "TEAM alpha"][0]

    current_date = datetime.now()
    campaign = iaso_client.post(
        "/api/microplanning/plannings/",
        {
            "name": "Campagne Carte Sanitaire",
            "forms": [f["id"] for f in forms if f["form_id"] == "SAMPLE_FORM_new5"],
            "project": project_id,
            "team": team["id"],
            "org_unit": country["id"],
            "started_at": current_date.strftime("%Y-%m-%d"),
            "ended_at": (current_date + timedelta(days=365)).strftime("%Y-%m-%d"),
            "published_at": current_date.strftime("%Y-%m-%d"),
        },
    )
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]

    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]
    health_facitities = iaso_client.get(
        "/api/orgunits/",
        params={
            "validation_status": "VALID",
            "asLocation": "true",
            "limit": 3000,
            "geography": "any",
            "onlyDirectChildren": "false",
            "page": 1,
            "withParents": "true",
            "order": "name",
            "orgUnitParentIds": country["id"],
            "orgUnitTypeId": health_facility_type["id"],
        },
    )

    for health_facitity in health_facitities:
        print("assigning", health_facitity["name"], "to", team["name"])

        iaso_client.post(
            "/api/microplanning/assignments/",
            json={"planning": campaign["id"], "org_unit": health_facitity["id"], "team": team["id"]},
        )

    print(campaign)
