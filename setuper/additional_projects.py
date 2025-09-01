from create_llin_campaign_forms_submissions import llin_forms


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
                "Equipment/Pop/Social mob./Microplans",
            ],
        },
        {
            "name": "Vaccination",
            "app_id": f"{account_name}.children",
            "feature_flags": ["REQUIRE_AUTHENTICATION", "ENTITY"],
            "linked_forms": [
                "Registration Vaccination Pregnant Women",
                "Pregnant women follow-up",
                "Child/Enfant - Registration/Enregistrement",
                "Child/Enfant - Follow-up/Suivi",
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
                "Dénombrement / Enumeration",
                "Distribution",
            ],
        },
    ]
    return projects


def get_project_ids(created_or_updated_projects, iaso_client):
    existing_projects = iaso_client.get("/api/projects/")["projects"]
    project_ids = []
    for current_project in created_or_updated_projects:
        project_id = [
            project
            for project in existing_projects
            if project["app_id"] == current_project["id"]
        ]
        project_ids.append(project_id[0]["id"])
    return project_ids


def update_org_unit_types_with_new_projects(iaso_client, project_ids):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    updated_types = []
    for org_unit_type in org_unit_types:
        linked_project_ids = [project["id"] for project in org_unit_type["projects"]]
        org_unit_type["project_ids"] = linked_project_ids
        org_unit_type["project_ids"].extend(project_ids)
        type = iaso_client.patch(
            f"/api/v2/orgunittypes/{org_unit_type['id']}/", json=org_unit_type
        )
        updated_types.append(type)
    return updated_types


def link_created_projects_to_main_data_source(account_name, iaso_client, project_ids):
    data_sources = iaso_client.get("/api/datasources/")["sources"]
    data_source = [
        data_source
        for data_source in data_sources
        if data_source["name"] == account_name
    ]

    if len(data_source) > 0:
        default_project = data_source[0]["projects"][0][0]["id"]
        project_ids.append(default_project)
        data_source[0]["project_ids"] = project_ids
        data_source[0]["default_version_id"] = data_source[0]["default_version"]["id"]
        iaso_client.put(
            f"/api/datasources/{data_source[0]['id']}/", json=data_source[0]
        )


def create_projects(account_name, iaso_client):
    print(f"-- Creating 3 additional projects for account: {account_name}")
    projects = projects_mapper(account_name)
    created_projects = []
    flags = iaso_client.get("/api/featureflags/")

    for project in projects:
        project["linked_forms"] = None
        project["feature_flags"] = [
            flag
            for flag in flags["featureflags"]
            if flag["code"] in project["feature_flags"]
        ]
        new_project = iaso_client.post("/api/apps/", json=project)
        created_projects.append(new_project)

    project_ids = get_project_ids(created_projects, iaso_client)
    update_org_unit_types_with_new_projects(iaso_client, project_ids)
    link_created_projects_to_main_data_source(account_name, iaso_client, project_ids)
    add_new_dhis2_data_source(account_name, iaso_client)


def link_forms_to_new_projects(projects, forms, iaso_client):
    existing_forms = iaso_client.get("/api/forms/")["forms"]
    for form in forms:
        project_ids = [
            project["id"] for project in projects if form in project["linked_forms"]
        ]
        form_to_link_to_project = [
            current_form
            for current_form in existing_forms
            if current_form["name"] == form
        ]

        if len(form_to_link_to_project) > 0:
            current_form = form_to_link_to_project[0]
            form_to_update = {
                "project_ids": project_ids,
                "name": current_form["name"],
                "org_unit_type_ids": current_form["org_unit_type_ids"],
                "derived": current_form["derived"],
                "single_per_period": current_form["single_per_period"],
                "periods_before_allowed": current_form["periods_before_allowed"],
                "periods_after_allowed": current_form["periods_after_allowed"],
            }
            iaso_client.patch(f"/api/forms/{current_form['id']}/", json=form_to_update)


def forms_mapper(projects, iaso_client, account_name):
    forms = [project["linked_forms"] for project in projects]
    all_forms = [sub_form for sub_forms in forms for sub_form in sub_forms]
    uniq_forms = list(set(all_forms))
    llin_forms(iaso_client, account_name)
    link_forms_to_new_projects(projects, uniq_forms, iaso_client)


def link_new_projects_to_main_data_source(account_name, iaso_client):
    projects = iaso_client.get(f"/api/projects/?app_id={account_name}")["projects"]
    projects_mapped = projects_mapper(account_name)
    all_projects = []
    for project in projects_mapped:
        current_project = [
            current_project
            for current_project in projects
            if project["name"] == current_project["name"]
        ]
        if len(current_project) > 0:
            project["id"] = current_project[0]["id"]
        all_projects.append(project)
    forms_mapper(all_projects, iaso_client, account_name)


def add_new_dhis2_data_source(account_name, iaso_client):
    create_data_source = None
    data_source = {
        "name": f"Dhis2 Sierra Leone {account_name}",
        "description": "via setup_account",
        "project_ids": [],
        "credentials": {
            "dhis_name": "Dhis2 Sierra Leone Play",
            "dhis_url": "https://play.im.dhis2.org/stable-2-41-3-1/",
            "dhis_login": "admin",
            "dhis_password": "district",
        },
    }
    projects = iaso_client.get(f"/api/projects/?app_id={account_name}.children")[
        "projects"
    ]
    project = [project for project in projects if project["name"] == "Vaccination"]
    if len(project) > 0:
        data_source["project_ids"] = [project[0]["id"]]
        create_data_source = iaso_client.post("/api/datasources/", json=data_source)
        default_version = iaso_client.post(
            "/api/sourceversions/",
            json={
                "data_source_id": create_data_source["id"],
                "description": data_source["description"],
            },
        )
        default = {
            "name": create_data_source["name"],
            "default_version_id": default_version["id"],
        }
        iaso_client.put(f"/api/datasources/{create_data_source['id']}/", json=default)
    return create_data_source
