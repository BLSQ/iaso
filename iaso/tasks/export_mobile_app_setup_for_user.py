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
SERVER = "https://512459b08c7f.ngrok.app"
ADMIN_USER_NAME = ""
ADMIN_PASSWORD = ""


@task_decorator(task_name="export_mobile_app_setup")
def export_mobile_app_setup_for_user(
    user_id,
    project_id,
    task=None,
):
    the_task = task
    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
    )
    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)

    # setup
    export_name = f"mobile-app-export-{uuid.uuid4()}"
    tmp_dir = os.path.join("/tmp", export_name)
    iaso_client = IasoClient(server_url=SERVER)

    app_info = _get_project_app_details(iaso_client, tmp_dir, project.app_id)

    if app_info["needs_authentication"]:
        _get_access_token_and_user_profile(iaso_client, tmp_dir, user)

    _get_all_resources(iaso_client, tmp_dir, project.app_id, app_info)
    _compress_and_upload_to_s3(tmp_dir, export_name)

    the_task.report_success_with_result(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        result_data=f"file:export-files/{export_name}.zip",
    )
    return the_task


def _get_project_app_details(iaso_client, tmp_dir, app_id):
    logger.info("-- Getting app info (feature flags etc)")
    # Public endpoint, no auth needed
    app_info = iaso_client.get(f"/api/apps/current/?app_id={app_id}")

    if "app_id" not in app_info:
        # TODO: handle error
        breakpoint()

    logger.info("-- App summary:")
    logger.info(f"\tName: {app_info['name']}")
    logger.info(f"\tApp id: {app_info['app_id']}")
    logger.info(f"\tNeeds authentication: {app_info['needs_authentication']}")
    logger.info(f"\tMin version: {app_info.get('min_version', None)}")
    logger.info("\tFeature flags:")
    for flag in app_info["feature_flags"]:
        logger.info(f"\t\t{flag['code']}: {flag['name']}")
    logger.info("")

    logger.info(f"-- Writing results to {tmp_dir}")
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    with open(os.path.join(tmp_dir, "app.json"), "w") as json_file:
        json.dump(app_info, json_file, indent=4)

    return app_info


def _get_access_token_and_user_profile(iaso_client, tmp_dir, user):
    logger.info("-- Authentication required, getting token and profile settings")
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    iaso_client.authenticate_with_token(access_token)
    with open(os.path.join(tmp_dir, "access-token.txt"), "w") as f:
        f.write(access_token)

    profile = iaso_client.get("/api/profiles/me/")
    with open(os.path.join(tmp_dir, "profile.json"), "w") as json_file:
        json.dump(profile, json_file, indent=4)


def _get_all_resources(iaso_client, tmp_dir, app_id, app_info):
    api_calls = [
        {
            "path": "/api/orgunittypes/",
            "filename": "orgunittypes.json",
        },
        {
            "path": f"/api/mobile/groups/?app_id={app_id}",
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
            "path": f"/api/mobile/storage/passwords/?app_id={app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "storage-passwords.json",
        },
        {
            "path": "/api/mobile/storage/blacklisted/",
            "required_feature_flag": "ENTITY",
            "filename": "storage-blacklisted.json",
        },
        {
            "path": f"/api/mobile/entitytypes/?app_id={app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "entitytypes.json",
        },
        {
            "path": f"/api/mobile/workflows/?app_id={app_id}",
            "required_feature_flag": "ENTITY",
            "filename": "workflows.json",
        },
    ]
    feature_flags = [flag["code"] for flag in app_info["feature_flags"]]

    for call in api_calls:
        if ("required_feature_flag" not in call) or call["required_feature_flag"] in feature_flags:
            logger.info(f"-- {call['filename']}: GET {call['path']}")
            result = iaso_client.get(call["path"])
            with open(os.path.join(tmp_dir, call["filename"]), "w") as json_file:
                json.dump(result, json_file, indent=4)
        else:
            logger.info(f"-- {call['filename']}: not writing, feature flag missing.")


def _compress_and_upload_to_s3(tmp_dir, export_name):
    zipfile_name = f"{export_name}.zip"
    logger.info(f"-- Creating zipfile {zipfile_name}")
    with zipfile.ZipFile(os.path.join(tmp_dir, zipfile_name), "w", zipfile.ZIP_DEFLATED) as zipf:
        # add all files in /tmp directory to the .zip file
        # the arcname param makes sure we add all files in the root of the .zip
        for file in os.listdir(tmp_dir):
            zipf.write(os.path.join(tmp_dir, file), arcname=file)

    logger.info("-- Uploading zipfile to S3")
    upload_file_to_s3(
        os.path.join(tmp_dir, zipfile_name),
        object_name=f"export-files/{zipfile_name}",
    )
