def projects_mapper(account_name):
    projects = [
        {
            "name": "Planning",
            "app_id": f"{account_name}.planning",
            "feature_flags": ["REQUIRE_AUTHENTICATION", "TAKE_GPS_ON_FORM", "", "FORMS_AUTO_UPLOAD", "PLANNING"],
            "linked_forms": ["Equipment/Pop/Social mob./Microplans"],
        },
        {
            "name": "Georegistry/Géoregistre",
            "app_id": f"{account_name}.georegistry",
            "feature_flags": ["REQUIRE_AUTHENTICATION", "TAKE_GPS_ON_FORM"],
            "linked_forms": ["Equipment/Pop/Social mob./Microplans"],
        },
        {
            "name": "Children vaccination/Vaccination des enfants",
            "app_id": f"{account_name}.children",
            "feature_flags": ["REQUIRE_AUTHENTICATION", "ENTITY"],
            "linked_forms": ["Child - Registration", "Child - Follow up"],
        },
    ]
    return projects


def feature_flags_mapper(project, iaso_client):
    existing_feature_flags = iaso_client.get("/api/featureflags/")
    feature_flags = []
    for feature_flag_code in project["feature_flags"]:
        project_feature_flag = [
            feature_flag
            for feature_flag in existing_feature_flags["featureflags"]
            if feature_flag["code"] == feature_flag_code
        ]
        if len(project_feature_flag) > 0:
            feature_flags.append(project_feature_flag[0])
    return feature_flags


def create_projects(account_name, iaso_client):
    print(f"-- Creating 3 additional projects for account :{account_name}")
    projects = projects_mapper(account_name)
    existing_projects = iaso_client.get("/api/projects/")["projects"]

    for project in projects:
        project["linked_forms"] = None
        project["feature_flags"] = feature_flags_mapper(project, iaso_client)
        check_project = [
            current_project for current_project in existing_projects if current_project["app_id"] == project["app_id"]
        ]
        if len(check_project) > 0:
            project["id"] = project["app_id"]
            iaso_client.put(f"/api/apps/current/?app_id={project['app_id']}", json=project)
        else:
            iaso_client.post("/api/apps/", json=project)


def setup_instances(account_name, iaso_client):
    projects = iaso_client.get("/api/projects/")["projects"]
    projects_mapper = projects_mapper(account_name)

    # for project in projects:
