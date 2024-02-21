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
import requests
from urllib.parse import urlencode, urlunparse
import uuid
import zipfile

from beanstalk_worker import task_decorator
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.models import Project
from iaso.tasks.utils.mobile_app_setup_api_calls import API_CALLS
from iaso.utils.iaso_api_client import IasoClient
from iaso.utils.s3_client import upload_file_to_s3

logger = logging.getLogger(__name__)

SERVER = f"https://{settings.DNS_DOMAIN}"


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
        end_value=len(API_CALLS) + 3,
    )
    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)

    # setup
    export_name = f"mobile-app-export-{uuid.uuid4()}"
    tmp_dir = os.path.join("/tmp", export_name)
    iaso_client = IasoClient(server_url=SERVER)

    app_info = _get_project_app_details(iaso_client, tmp_dir, project.app_id)
    feature_flags = [flag["code"] for flag in app_info["feature_flags"]]

    the_task.report_progress_and_stop_if_killed(progress_value=1)

    if app_info["needs_authentication"]:
        logger.info("Authentication required, authenticating iaso_client")
        refresh = RefreshToken.for_user(user)
        iaso_client.authenticate_with_token(str(refresh.access_token))

    the_task.report_progress_and_stop_if_killed(progress_value=2)

    for call in API_CALLS:
        _get_resource(iaso_client, call, tmp_dir, project.app_id, feature_flags)
        the_task.report_progress_and_stop_if_killed(progress_value=the_task.progress_value + 1)

    _compress_and_upload_to_s3(tmp_dir, export_name)

    the_task.report_success_with_result(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        result_data=f"file:export-files/{export_name}.zip",
    )
    return the_task


def _get_project_app_details(iaso_client, tmp_dir, app_id):
    logger.info("Getting app info (feature flags etc)")
    # Public endpoint, no auth needed
    app_info = iaso_client.get(f"/api/apps/current/?app_id={app_id}")

    logger.info("App summary:")
    logger.info(f"\tName: {app_info['name']}")
    logger.info(f"\tApp id: {app_info['app_id']}")
    logger.info(f"\tNeeds authentication: {app_info['needs_authentication']}")
    logger.info(f"\tMin version: {app_info.get('min_version', None)}")
    logger.info("\tFeature flags:")
    for flag in app_info["feature_flags"]:
        logger.info(f"\t\t{flag['code']}: {flag['name']}")
    logger.info("")

    logger.info(f"Writing results to {tmp_dir}")
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    with open(os.path.join(tmp_dir, "app.json"), "w") as json_file:
        json.dump(app_info, json_file)

    return app_info


def _get_resource(iaso_client, call, tmp_dir, app_id, feature_flags):
    if ("required_feature_flag" in call) and call["required_feature_flag"] not in feature_flags:
        logger.info(f"{call['filename']}: not writing, feature flag missing.")
        return

    page = 1
    while page == 1 or (isinstance(result, dict) and result.get("has_next", False)):
        query_params = call.get("query_params", {})
        query_params = {**query_params, "app_id": app_id, "page": page}
        if "page_size" in call:
            query_params["limit"] = call["page_size"]
        resource_url = urlunparse(("", "", call["path"], "", urlencode(query_params), ""))

        logger.info(f"{call['filename']}: GET {resource_url}")
        result = iaso_client.get(resource_url)

        if call["filename"] == "formversions":
            _download_form_versions(iaso_client, tmp_dir, result["form_versions"])
        if call["filename"] == "reports":
            _download_reports(iaso_client, tmp_dir, result)
        if call["filename"] == "formattachments":
            _download_form_attachments(iaso_client, tmp_dir, call, result["results"])

        if isinstance(result, dict) and "count" in result:
            logger.info(f"\tTotal count: {result['count']}")
        if isinstance(result, dict) and "pages" in result:
            logger.info(f"\tTotal pages: {result['pages']}")

        with open(os.path.join(tmp_dir, f"{call['filename']}-{page}.json"), "w") as json_file:
            json.dump(result, json_file)

        page += 1


def _download_form_attachments(iaso_client, tmp_dir, call, resources):
    if len(resources) == 0:
        return

    # create subfolder for downloaded files
    os.makedirs(os.path.join(tmp_dir, "formattachments"))
    for resource in resources:
        form_id = resource["form_id"]
        os.makedirs(os.path.join(tmp_dir, "formattachments", str(form_id)))
        path = resource["file"]
        filename = path.split("/")[-1]

        logger.info(f"\tDOWNLOAD {path}")
        attachment_file = requests.get(path, headers=iaso_client.headers)
        logger.info(f"\tDOWNLOAD manifest")
        manifest_file = requests.get(
            SERVER + f"/api/forms/{form_id}/manifest/",
            headers=iaso_client.headers,
        )

        with open(os.path.join(tmp_dir, "formattachments", str(form_id), filename), mode="wb") as f:
            f.write(attachment_file.content)
        with open(os.path.join(tmp_dir, "formattachments", str(form_id), "manifest.xml"), mode="wb") as f:
            f.write(manifest_file.content)


def _download_form_versions(iaso_client, tmp_dir, form_versions):
    if len(form_versions) == 0:
        return

    os.makedirs(os.path.join(tmp_dir, "forms"))
    for form_version in form_versions:
        path = form_version["file"]
        filename = path.split("/")[-1]

        logger.info(f"\tDOWNLOAD {path}")
        response = requests.get(path, headers=iaso_client.headers)

        with open(os.path.join(tmp_dir, "forms", filename), mode="wb") as f:
            f.write(response.content)


def _download_reports(iaso_client, tmp_dir, reports):
    if len(reports) == 0:
        return

    os.makedirs(os.path.join(tmp_dir, "reports"))
    for report in reports:
        path = report["url"]
        filename = path.split("/")[-1]

        logger.info(f"\tDOWNLOAD {path}")
        response = requests.get(SERVER + path, headers=iaso_client.headers)

        with open(os.path.join(tmp_dir, "reports", filename), mode="wb") as f:
            f.write(response.content)


def _compress_and_upload_to_s3(tmp_dir, export_name):
    zipfile_name = f"{export_name}.zip"
    logger.info(f"Creating zipfile {zipfile_name}")

    with zipfile.ZipFile(os.path.join(tmp_dir, zipfile_name), "w") as zipf:
        # add all files in /tmp directory to the .zip file
        for root, _dirs, files in os.walk(tmp_dir):
            for file in files:
                if file != zipfile_name:
                    file_path = os.path.join(root, file)
                    archive_name = os.path.relpath(file_path, tmp_dir)
                    zipf.write(file_path, archive_name)

    logger.info("Uploading zipfile to S3")
    upload_file_to_s3(
        os.path.join(tmp_dir, zipfile_name),
        object_name=f"export-files/{zipfile_name}",
    )
