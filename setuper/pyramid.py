def setup_orgunits(account_name, iaso_client):
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    sources = iaso_client.get("/api/datasources/")["sources"]
    data_source_id = sources[0]["id"]

    # import a geopackage

    data = {
        "project": project_id,
        "data_source": data_source_id,
        "version_number": "1",
        "description": "Sample geopackage",
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

    iaso_client.wait_task_completion(task)
