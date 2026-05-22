def create_user_role(iaso_client):
    print("-- Setting up a user role")

    payload = {"name": "Data Manager", "permissions": ["iaso_submissions", "iaso_update_submission", "iaso_org_units"]}
    user_role = iaso_client.post("/api/userroles/", json=payload)

    return user_role
