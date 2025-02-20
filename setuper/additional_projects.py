def projects_mapper(account_name):
    projects = [
        {
            "name": "Planning",
            "app_id": f"{account_name}.planning",
            "feature_flags": [
                "REQUIRE_AUTHENTICATION",
                "FORMS_AUTO_UPLOAD",
                "TAKE_GPS_ON_FORM",
                "GPS_TRACKING",
                "SHOW_DETAIL_MAP_ON_MOBILE",
                "PLANNING",
            ],
            "linked_forms": ["Equipment/Pop/Social mob./Microplans"],
        },
        {
            "name": "Georegistry/Géoregistre",
            "app_id": f"{account_name}.georegistry",
            "feature_flags": [
                "REQUIRE_AUTHENTICATION",
                "TAKE_GPS_ON_FORM",
                "MOBILE_ORG_UNIT_REGISTRY",
                "DATA_COLLECTION",
            ],
            "linked_forms": [
                "Registry - Population Health area",
                "Data for Health facility/Données Formation sanitaire",
            ],
        },
        {
            "name": "Vaccination",
            "app_id": f"{account_name}.children",
            "feature_flags": ["REQUIRE_AUTHENTICATION", "ENTITY"],
            "linked_forms": [
                "Child/Enfant - Registration/Enregistrement",
                "Child/Enfant - Follow-up/Suivi",
                "Dénombrement / Enumeration",
                "Pregnant women follow-up",
                "Registration Vaccination Pregnant Women",
            ],
        },
        {
            "name": "LLIN campaign",
            "app_id": f"{account_name}.campaign",
            "feature_flags": [
                "REQUIRE_AUTHENTICATION",
                "TAKE_GPS_ON_FORM",
                "MOBILE_ENTITY_WARN_WHEN_FOUND",
                "DATA_COLLECTION",
                "ENTITY",
            ],
            "linked_forms": [
                "Child/Enfant - Registration/Enregistrement",
                "Child/Enfant - Follow-up/Suivi",
                "Dénombrement / Enumeration",
                "Distribution",
                "Pregnant women follow-up",
                "Registration Vaccination Pregnant Women",
                "Registry - Population Health area",
            ],
        },
    ]
    return projects


def get_project_ids(created_or_updated_projects, iaso_client):
    existing_projects = iaso_client.get("/api/projects/")["projects"]
    project_ids = []
    for current_project in created_or_updated_projects:
        project_id = [project for project in existing_projects if project["app_id"] == current_project["id"]]
        project_ids.append(project_id[0]["id"])
    return project_ids


def update_org_unit_types_with_new_projects(iaso_client, project_ids):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    updated_types = []
    for org_unit_type in org_unit_types:
        linked_project_ids = [project["id"] for project in org_unit_type["projects"]]
        org_unit_type["project_ids"] = linked_project_ids
        org_unit_type["project_ids"].extend(project_ids)
        type = iaso_client.patch(f"/api/v2/orgunittypes/{org_unit_type['id']}/", json=org_unit_type)
        updated_types.append(type)
    return updated_types


def link_created_projects_to_main_data_source(account_name, iaso_client, project_ids):
    data_sources = iaso_client.get("/api/datasources/")["sources"]
    data_source = [data_source for data_source in data_sources if data_source["name"] == account_name]

    if len(data_source) > 0:
        default_project = data_source[0]["projects"][0][0]["id"]
        project_ids.append(default_project)
        data_source[0]["project_ids"] = project_ids
        data_source[0]["default_version_id"] = data_source[0]["default_version"]["id"]
        iaso_client.put(f"/api/datasources/{data_source[0]['id']}/", json=data_source[0])


def create_projects(account_name, iaso_client):
    print(f"-- Creating 3 additional projects for account: {account_name}")
    projects = projects_mapper(account_name)
    created_projects = []
    flags = iaso_client.get("/api/featureflags/")

    for project in projects:
        project["linked_forms"] = None
        project["feature_flags"] = [flag for flag in flags["featureflags"] if flag["code"] in project["feature_flags"]]
        new_project = iaso_client.post("/api/apps/", json=project)
        created_projects.append(new_project)

    project_ids = get_project_ids(created_projects, iaso_client)
    update_org_unit_types_with_new_projects(iaso_client, project_ids)
    link_created_projects_to_main_data_source(account_name, iaso_client, project_ids)


def link_forms_to_new_projects(projects, forms, iaso_client):
    existing_forms = iaso_client.get(f"/api/forms/")["forms"]
    for form in forms:
        project_ids = [project["id"] for project in projects if form in project["linked_forms"]]
        form_to_link_to_project = [current_form for current_form in existing_forms if current_form["name"] == form]

        if len(form_to_link_to_project) > 0:
            current_form = form_to_link_to_project[0]
            current_form["project_ids"] = project_ids
            iaso_client.patch(f"/api/forms/{current_form['id']}/", json=current_form)


def forms_mapper(projects, iaso_client):
    forms = [project["linked_forms"] for project in projects]
    all_forms = [sub_form for sub_forms in forms for sub_form in sub_forms]
    uniq_forms = list(set(all_forms))
    link_forms_to_new_projects(projects, uniq_forms, iaso_client)


def link_new_projects_to_main_data_source(account_name, iaso_client):
    projects = iaso_client.get(f"/api/projects/?app_id={account_name}")["projects"]
    projects_mapped = projects_mapper(account_name)
    all_projects = []
    for project in projects_mapped:
        current_project = [
            current_project for current_project in projects if project["name"] == current_project["name"]
        ]
        if len(current_project) > 0:
            project["id"] = current_project[0]["id"]
        all_projects.append(project)
    forms_mapper(all_projects, iaso_client)
