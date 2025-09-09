def setup_orgunits(iaso_client):
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    sources = iaso_client.get("/api/datasources/")["sources"]
    data_source_id = sources[0]["id"]

    # import a geopackage

    data = {
        "project": project_id,
        "data_source": data_source_id,
        "version_number": "1",
        "description": "Sample geopackage",
        "default_valid": True,
    }

    test_file = "data/small_sample.gpkg"
    geopackage_file = {"file": (test_file, open(test_file, "rb"), "application/octet-stream")}
    task = iaso_client.post("/api/tasks/create/importgpkg/", files=geopackage_file, data=data)

    print("-- Importing org units")

    iaso_client.wait_task_completion(task)

    # mark them all as valid
    data = {
        "validation_status": "VALID",
        "select_all": True,
        "searches": [{"validation_status": "all", "color": "f4511e", "source": data_source_id}],
    }
    task = iaso_client.post("/api/tasks/create/orgunitsbulkupdate/", json=data)
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    update_org_unit_sub_type(iaso_client, project_id, org_unit_types)
    iaso_client.wait_task_completion(task)


def update_org_unit_sub_type(iaso_client, project_id, org_unit_types, verbose: bool = True):
    if verbose:
        print("-- Updating org unit sub type")
    updated_with_sub_types = []
    for org_unit_type in org_unit_types:
        org_unit_type_level = org_unit_type["depth"]
        org_unit_type_id = org_unit_type["id"]
        sub_unit_type_ids = [
            org_unit_type["id"]
            for org_unit_type in org_unit_types
            if org_unit_type["depth"] == (org_unit_type_level + 1)
        ]
        if len(sub_unit_type_ids) > 0:
            current_type = {
                "name": org_unit_type["name"],
                "short_name": org_unit_type["short_name"],
                "project_ids": [project_id],
                "sub_unit_type_ids": sub_unit_type_ids,
            }
            # Updating default sub type
            updated_with_sub_types.append(
                iaso_client.patch(f"/api/v2/orgunittypes/{org_unit_type_id}/", json=current_type)
            )
    return updated_with_sub_types
