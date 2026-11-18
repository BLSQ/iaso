from datetime import datetime, timedelta, timezone

from fake import fake_person
from planning_assignments import (
    Assignee,
    assign,
    distinct_colors,
    fetch_palette,
    load_pyramid,
    round_robin,
)


NEW = "new"
REJECTED = "rejected"
APPROVED = "approved"
PENDING = "pending"
SAME = "same"
UNKNOWN = "unknown"

USER_COUNT = 39
TEAM_NAMES = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"]
TEAM_SIZE = 5


def create_planning(iaso_client, *, name, project_id, form_id, team_id, org_unit_id, level_type_ids, days, published):
    """`level_type_ids` holds the org unit types of each assignable level below `org_unit_id`."""
    now = datetime.now(timezone.utc)
    planning = iaso_client.post(
        "/api/microplanning/plannings/",
        json={
            "name": name,
            "forms": [form_id],
            "project": project_id,
            "team": team_id,
            "org_unit": org_unit_id,
            "target_org_unit_types": level_type_ids[-1],
            "started_at": now.strftime("%Y-%m-%d"),
            "ended_at": (now + timedelta(days=days)).strftime("%Y-%m-%d"),
            "published_at": now.strftime("%Y-%m-%d") if published else None,
        },
    )
    iaso_client.put(
        f"/api/microplanning/plannings/{planning['id']}/configs/bulk/",
        json=[
            {"level": level, "org_unit_types": type_ids, "org_unit_groups": []}
            for level, type_ids in enumerate(level_type_ids, start=1)
        ],
    )
    return planning["id"]


def setup_users_teams_micro_planning(account_name, iaso_client):
    print("-- users, teams and micro planning")

    project_ids = [x["id"] for x in iaso_client.get("/api/projects/")["projects"] if x["name"] == "Planning"]
    project_id = project_ids[0]
    permissions_codes = [x["codename"] for x in iaso_client.get("/api/permissions/")["permissions"]]
    palette = fetch_palette(iaso_client)

    user_ids = []
    for user_index, color in enumerate(distinct_colors(palette, USER_COUNT), start=1):
        person = fake_person()
        user_identifier = f"user{user_index:02d}"
        profile = iaso_client.post(
            "/api/profiles/",
            json={
                "id": None,
                "user_name": f"{account_name}.{user_identifier}",
                "first_name": person["firstname"],
                "last_name": person["lastname"],
                "email": "",
                "password": f"{account_name}.{user_identifier}",
                "permissions": [],
                "org_units": [],
                "language": "",
                "home_page": "",
                "dhis2_id": "",
                "color": color,
                "user_roles": [],
                "user_roles_permissions": [],
                "user_permissions": permissions_codes,
                "send_email_invitation": False,
                "projects": project_ids,
            },
        )
        user_ids.append(iaso_client.get(f"/api/profiles/{profile['id']}/")["user_id"])

    print(f"\t{len(user_ids)} users created")

    # Country > region > districts > health areas > health facilities.
    pyramid = load_pyramid(iaso_client, levels=3)
    country = pyramid.root
    region = pyramid.first_level[0]
    districts = region.children
    region_type_ids, district_type_ids, health_area_type_ids = pyramid.level_type_ids

    # The team tree mirrors the pyramid: country team > region team > district teams > users.
    manager = iaso_client.get("/api/profiles/me/")
    team_colors = distinct_colors(palette, len(TEAM_NAMES) + 2)

    country_team_id = iaso_client.post(
        "/api/teams/",
        json={
            "name": f"TEAM {country.name}",
            "project": project_id,
            "manager": manager["user_id"],
            "type": "TEAM_OF_TEAMS",
            "color": team_colors[0],
            "users": [],
        },
    )["id"]

    region_team_id = iaso_client.post(
        "/api/teams/",
        json={
            "name": f"TEAM {region.name}",
            "project": project_id,
            "manager": manager["user_id"],
            "type": "TEAM_OF_TEAMS",
            "color": team_colors[1],
            "parent": country_team_id,
            "users": [],
        },
    )["id"]

    members_by_team_id = {}
    for team_index, (team_name, color) in enumerate(zip(TEAM_NAMES, team_colors[2:])):
        members = user_ids[team_index * TEAM_SIZE : (team_index + 1) * TEAM_SIZE]
        team_id = iaso_client.post(
            "/api/teams/",
            json={
                "name": f"TEAM {team_name}",
                "project": project_id,
                "manager": manager["user_id"],
                "type": "TEAM_OF_USERS",
                "color": color,
                "parent": region_team_id,
                "users": members,
            },
        )["id"]
        members_by_team_id[team_id] = members
    team_ids = list(members_by_team_id)

    print(f"\t{len(team_ids) + 2} teams created: TEAM {country.name} > TEAM {region.name} > {len(team_ids)} teams")

    forms = iaso_client.get("/api/forms")["forms"]
    planning_form = [form for form in forms if form["form_id"] == "SAMPLE_FORM_new5"][0]

    # A team of users plans a single level: users can't hand their org units down to anyone.
    alpha_id = team_ids[0]
    alpha_district = districts[0]
    health_map_id = create_planning(
        iaso_client,
        name="Campagne Carte Sanitaire",
        project_id=project_id,
        form_id=planning_form["id"],
        team_id=alpha_id,
        org_unit_id=alpha_district.id,
        level_type_ids=[health_area_type_ids],
        days=365,
        published=True,
    )
    surveyors = [Assignee(user_id=user_id) for user_id in members_by_team_id[alpha_id][:3]]
    health_map_count = assign(iaso_client, health_map_id, round_robin(alpha_district.children, surveyors))

    print(
        f"\tCampagne Carte Sanitaire: {health_map_count} health areas of {alpha_district.name} "
        f"assigned to {len(surveyors)} users of TEAM alpha"
    )

    # Each team hands its org units down: the country team gives the region to the region team,
    # which gives the districts to its teams, which give the health areas to their users.
    polio_id = create_planning(
        iaso_client,
        name="Campaign Polio",
        project_id=project_id,
        form_id=planning_form["id"],
        team_id=country_team_id,
        org_unit_id=country.id,
        level_type_ids=[region_type_ids, district_type_ids, health_area_type_ids],
        days=30,
        published=False,
    )
    region_assignments = [(region, Assignee(team_id=region_team_id))]
    active_team_ids = team_ids[:4]
    district_assignments = round_robin(districts, [Assignee(team_id=team_id) for team_id in active_team_ids])
    health_area_assignments = [
        pair
        for district, district_team in district_assignments
        for pair in round_robin(
            district.children,
            [Assignee(user_id=user_id) for user_id in members_by_team_id[district_team.team_id]],
        )
    ]
    polio_count = assign(iaso_client, polio_id, region_assignments)
    polio_count += assign(iaso_client, polio_id, district_assignments)
    polio_count += assign(iaso_client, polio_id, health_area_assignments)

    print(
        f"\tCampaign Polio: {polio_count} assignments across {len(active_team_ids)} sub-teams "
        f"(TEAM epsilon and TEAM zeta left without assignments)"
    )

    print("-- Micro-planning setup complete.")


def create_form_filling_mission(iaso_client, name, form):
    """Create a FORM_FILLING mission dedicated to a planning. The response only contains the mission id."""
    mission = iaso_client.post(
        "/api/microplanning/missions/",
        json={
            "mission_type": "FORM_FILLING",
            "name": name,
            "description": f"Fill the form '{form['name']}'",
            "forms": [{"form": form["id"], "min_cardinality": 1, "max_cardinality": None}],
        },
    )
    print(f"\tMission '{name}' created (id {mission['id']}) with form '{form['name']}'")
    return mission


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
