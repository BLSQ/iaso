"""
This task will generate a .zip file containing a collection of .json files
that allows the user to set up the Iaso mobile app in a situation without Internet.

Even though the Iaso mobile app is designed to be used primarily offline, the
initial setup of the application requires an Internet connection. During this
first setup of the app, a number of resources are downloaded such as the org unit pyramid,
forms, plannings, entities etc. Depending on feature flags, certain resources are
skipped.

This task generates a .zip file containing all this data for a given app id an user.
This .zip file can then be parsed by the mobile app, thus simulating a user's
first login on the mobile app.
"""

import json
import logging
import os
import uuid
import zipfile

from beanstalk_worker import task_decorator
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.models import Project
from iaso.utils.iaso_api_client import IasoClient
from iaso.utils.s3_client import upload_file_to_s3

logger = logging.getLogger(__name__)

# TODO:
# - Make only accessible for super admin

# SERVER = "http://localhost:8081"
SERVER = "https://0e11020afdca.ngrok.app"
ADMIN_USER_NAME = ""
ADMIN_PASSWORD = ""


@task_decorator(task_name="export_mobile_app_setup")
def export_mobile_app_setup_for_user(
    user_id,
    project_id,
    task=None,
):
    the_task = task
    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)

    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
    )

    iaso_client = IasoClient(server_url=SERVER)

    logger.info("-- Getting app info (feature flags etc)")
    # Public endpoint, no auth needed
    app_info = iaso_client.get(f"/api/apps/current/?app_id={project.app_id}")

    tmp_folder_name = f"mobile-app-export-{uuid.uuid4()}"
    tmp_dir = os.path.join("/tmp", tmp_folder_name)
    logger.info(f"-- Writing results to {tmp_dir}")
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    file_path = os.path.join(tmp_dir, "app.json")

    with open(file_path, "w") as json_file:
        json.dump(app_info, json_file, indent=4)

    feature_flags = [flag["code"] for flag in app_info["feature_flags"]]

    logger.info("-- App summary:")
    logger.info(f"\tName: {app_info['name']}")
    logger.info(f"\tApp id: {app_info['app_id']}")
    logger.info(f"\tNeeds authentication: {app_info['needs_authentication']}")
    logger.info(f"\tMin version: {app_info['min_version']}")
    logger.info("\tFeature flags:")
    for flag in app_info["feature_flags"]:
        logger.info(f"\t\t{flag['code']}: {flag['name']}")
    logger.info("")

    if app_info["needs_authentication"]:
        logger.info("-- Authentication required,  app info (feature flags etc)")
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        iaso_client.authenticate_with_token(access_token)
        with open(os.path.join(tmp_dir, "access-token.txt"), "w") as f:
            f.write(access_token)

        profile = iaso_client.get("/api/profiles/me/")
        with open(os.path.join(tmp_dir, "profile.json"), "w") as json_file:
            json.dump(profile, json_file, indent=4)

    api_calls = [
        {
            "path": "/api/orgunittypes/",
            "filename": "orgunittypes.json",
        },
        {
            "path": f"/api/mobile/groups/?app_id={project.app_id}",
            "filename": "groups.json",
        },
        {
            "path": "/api/mobile/forms/?fields=id,name,form_id,org_unit_types,period_type,single_per_period,periods_before_allowed,periods_after_allowed,latest_form_version,label_keys,possible_fields,predefined_filters,has_attachments,created_at,updated_at,reference_form_of_org_unit_types",
            "filename": "forms.json",
        },
        {
            "path": "/api/formversions/?fields=id,version_id,form_id,form_name,full_name,file,mapped,start_period,end_period,mapping_versions,descriptor,created_at,updated_at",
            "filename": "formversions.json",
        },
        {
            "path": "/api/mobile/orgunits/changes/",
            "required_feature_flag": "MOBILE_ORG_UNIT_REGISTRY",
            "filename": "orgunitchanges.json",
        },
        {
            "path": "/api/mobile/plannings/",
            "required_feature_flag": "PLANNING",
            "filename": "plannings.json",
        },
        {
            "path": f"/api/mobile/storage/passwords/?app_id={project.app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "storage-passwords.json",
        },
        {
            "path": "/api/mobile/storage/blacklisted/",
            "required_feature_flag": "ENTITY",
            "filename": "storage-blacklisted.json",
        },
        {
            "path": f"/api/mobile/entitytypes/?app_id={project.app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "entitytypes.json",
        },
        {
            "path": f"/api/mobile/workflows/?app_id={project.app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "workflows.json",
        },
    ]

    for call in api_calls:
        if ("required_feature_flag" not in call) or call["required_feature_flag"] in feature_flags:
            logger.info(f"-- {call['filename']}: GET {call['path']}")
            result = iaso_client.get(call["path"])
            with open(os.path.join(tmp_dir, call["filename"]), "w") as json_file:
                json.dump(result, json_file, indent=4)
        else:
            logger.info(f"-- {call['filename']}: not writing, feature flag missing.")

    zipfile_name = f"{tmp_folder_name}.zip"
    logger.info(f"-- Creating zipfile {zipfile_name}")
    with zipfile.ZipFile(zipfile_name, "w", zipfile.ZIP_DEFLATED) as zipf:
        # add all files in /tmp directory to the .zip file
        # the arcname param makes sure we add all files in the root of the .zip
        for file in os.listdir(tmp_dir):
            zipf.write(os.path.join(tmp_dir, file), arcname=file)

    logger.info("-- Uploading zipfile to S3")
    upload_file_to_s3(zipfile_name, object_name=f"export-files/{zipfile_name}")

    the_task.report_success_with_result(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        result_data=f"file:export-files/{zipfile_name}",
    )
    return the_task
