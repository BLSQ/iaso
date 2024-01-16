import json
from fake import fake_person


def setup_users_teams_micro_planning(account_name, iaso_client):
    print("-- users, teams and micro planning")

    project_ids = [x["id"] for x in iaso_client.get("/api/projects/")["projects"]]

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
