import uuid

from datetime import datetime

from submissions import (
    instance_by_LLIN_campaign_form,
    org_unit_gps_point,
    submission2xml,
)


def create_form_submissions(account_name, iaso_client, form, orgunit):
    the_uuid = str(uuid.uuid4())
    file_name = "example_%s.xml" % the_uuid
    local_path = "generated/%s" % file_name
    current_datetime = int(datetime.now().timestamp())

    instance_body = [
        {
            **org_unit_gps_point(orgunit),
            "id": the_uuid,
            "created_at": current_datetime,
            "updated_at": current_datetime,
            "orgUnitId": orgunit["id"],
            "formId": form["id"],
            "accuracy": 0,
            "imgUrl": "imgUrl",
            "file": local_path,
            "name": file_name,
        }
    ]
    iaso_client.post(
        f"/api/instances/?app_id={account_name}.campaign", json=instance_body
    )

    instance_id = {"instanceID": "uuid:" + the_uuid}
    instance_json = instance_by_LLIN_campaign_form(form, instance_id)

    iaso_client.post(
        "/sync/form_upload/",
        files={
            "xml_submission_file": (
                local_path,
                submission2xml(
                    instance_json,
                    form_version_id=form["version"]["version_id"],
                    form_id=form["form_id"],
                ),
            )
        },
    )


def create_org_units_submissions(account_name, iaso_client, facility_type_id, form):
    limit = 20
    orgUnits = iaso_client.get(
        "/api/orgunits/", params={"limit": limit, "orgUnitTypeId": facility_type_id}
    )["orgunits"]

    for orgUnit in orgUnits:
        create_form_submissions(account_name, iaso_client, form, orgUnit)


def new_llin_forms():
    forms = [
        {
            "name": "Registration Vaccination Pregnant Women",
            "xls_file": "registration_vaccination_pregnant_women.xlsx",
            "form_id": "entity-child_registration_vaccination",
        },
        {
            "name": "Pregnant women follow-up",
            "xls_file": "pregnant_women_follow_up.xlsx",
            "form_id": "pregnant_women_followup",
        },
        {
            "name": "Distribution",
            "xls_file": "distribution.xlsx",
            "form_id": "cahier_de_distribution_v1.1",
        },
        {
            "name": "Dénombrement / Enumeration",
            "xls_file": "denombrement_enumeration.xlsx",
            "form_id": "cahier_de_denombrement_v1.1",
        },
    ]
    return forms


def llin_forms(iaso_client, account_name):
    forms = new_llin_forms()
    project_id = iaso_client.get("/api/projects/")["projects"][0]["id"]
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    org_unit_type_id = [
        out["id"]
        for out in org_unit_types
        if out["name"] == "Health facility/Formation sanitaire - HF"
    ]

    print(f"--- Creating LLIN campaign forms ---")
    for form in forms:
        form_params = {
            "id": None,
            "name": form["name"],
            "short_name": form["name"],
            "depth": None,
            "org_unit_type_ids": org_unit_type_id,
            "project_ids": [project_id],
            "single_per_period": False,
            "periods_before_allowed": 0,
            "periods_after_allowed": 0,
            "device_field": "deviceid",
            "location_field": "coordonnees_gps_fosa",
            "label_keys": [],
        }
        form_id = iaso_client.post("/api/forms/", json=form_params)["id"]
        xlsx_file = f"data/{form['xls_file']}"
        data = {"form_id": form_id, "xls_file": xlsx_file}
        form_files = {"xls_file": open(xlsx_file, "rb")}
        form["id"] = form_id
        form["version"] = iaso_client.post(
            "/api/formversions/", files=form_files, data=data
        )

        create_org_units_submissions(account_name, iaso_client, org_unit_type_id, form)
