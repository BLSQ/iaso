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
from urllib.parse import urlencode, urlunparse
import uuid
import zipfile

from beanstalk_worker import task_decorator
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.models import Project
from iaso.tasks.utils.mobile_app_setup_api_calls import API_CALLS
from iaso.utils.iaso_api_client import IasoClient
from iaso.utils.s3_client import upload_file_to_s3

logger = logging.getLogger(__name__)

# TODO:
# - Make only accessible for super admin

SERVER = "https://bram.ngrok.app"


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
    feature_flags = [flag["code"] for flag in app_info["feature_flags"]]

    if app_info["needs_authentication"]:
        _get_access_token_and_user_profile(iaso_client, tmp_dir, user)

    for call in API_CALLS:
        _get_resource(iaso_client, call, tmp_dir, project.app_id, feature_flags)

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
        json.dump(app_info, json_file)

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
        json.dump(profile, json_file)


def _get_resource(iaso_client, call, tmp_dir, app_id, feature_flags):
    if ("required_feature_flag" in call) and call["required_feature_flag"] not in feature_flags:
        logger.info(f"-- {call['filename']}: not writing, feature flag missing.")
        return

    page = 1
    while page == 1 or (isinstance(result, dict) and result.get("has_next", False)):
        query_params = call.get("query_params", {})
        query_params = {**query_params, "app_id": app_id, "page": page}
        if "page_size" in call:
            query_params["limit"] = call["page_size"]
        resource_url = urlunparse(("", "", call["path"], "", urlencode(query_params), ""))

        logger.info(f"-- {call['filename']}: GET {resource_url}")
        result = iaso_client.get(resource_url)

        if isinstance(result, dict) and "count" in result:
            logger.info(f"\tTotal count: {result['count']}")
        if isinstance(result, dict) and "pages" in result:
            logger.info(f"\tTotal pages: {result['pages']}")

        with open(os.path.join(tmp_dir, f"{call['filename']}-{page}.json"), "w") as json_file:
            json.dump(result, json_file)

        page += 1

def _compress_and_upload_to_s3(tmp_dir, export_name):
    zipfile_name = f"{export_name}.zip"
    logger.info(f"-- Creating zipfile {zipfile_name}")
    with zipfile.ZipFile(os.path.join(tmp_dir, zipfile_name), "w") as zipf:
        # add all files in /tmp directory to the .zip file
        # the arcname param makes sure we add all files in the root of the .zip
        for file in os.listdir(tmp_dir):
            if file.endswith(".json") or file.endswith(".txt"):
                zipf.write(os.path.join(tmp_dir, file), arcname=file)

    logger.info("-- Uploading zipfile to S3")
    upload_file_to_s3(
        os.path.join(tmp_dir, zipfile_name),
        object_name=f"export-files/{zipfile_name}",
    )
