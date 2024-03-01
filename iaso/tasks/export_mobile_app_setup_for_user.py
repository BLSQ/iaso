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
import re
import requests
from urllib.parse import urlencode, urlparse, urlunparse
import uuid
import zipfile

from beanstalk_worker import task_decorator
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.models import Project
from iaso.tasks.utils.mobile_app_setup_api_calls import API_CALLS
from iaso.utils.encryption import encrypt_file
from iaso.utils.iaso_api_client import IasoClient
from iaso.utils.s3_client import upload_file_to_s3

logger = logging.getLogger(__name__)

SERVER = f"https://{settings.DNS_DOMAIN}"


@task_decorator(task_name="export_mobile_app_setup")
def export_mobile_app_setup_for_user(
    user_id,
    project_id,
    password,
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

    s3_object_name = _compress_and_upload_to_s3(tmp_dir, export_name, password)
    print("s3_object_name ")
    print(s3_object_name)

    the_task.report_success_with_result(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        result_data="file:" + s3_object_name,
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
        query_params["app_id"] = app_id

        filename = None
        if call.get("paginated", False):
            query_params["page"] = page
            if "page_size" in call:
                query_params["limit"] = call["page_size"]
            filename = f"{call['filename']}-{page}.json"
        else:
            filename = call["filename"] + ".json"

        url = urlunparse(("", "", call["path"], "", urlencode(query_params), ""))
        result = _call_endpoint(iaso_client, url, filename)

        # Before saving, for certain resources we need to:
        # 1. Download the attached files
        # 2. Rewrite the file URLs to make them appear on a local disk, to facilitate
        #    fetching them in the mobile app.
        if call["filename"] == "formversions":
            _download_form_versions(iaso_client, tmp_dir, result["form_versions"])
            for record in result["form_versions"]:
                record["file"] = "forms/" + _extract_filename_from_url(record["file"])
        if call["filename"] == "reports":
            _download_reports(iaso_client, tmp_dir, result)
            for record in result:
                record["url"] = "reports/" + _extract_filename_from_url(record["url"])
        if call["filename"] == "formattachments":
            _download_form_attachments(iaso_client, tmp_dir, result["results"], app_id)
            for record in result["results"]:
                # don't use _extract_filename_from_url to preserve subpath
                record["file"] = "formattachments/" + urlparse(record["file"]).path.split("/form_attachments/")[-1]

        with open(os.path.join(tmp_dir, filename), "w") as json_file:
            json.dump(result, json_file)

        page += 1


# The URL is potentially an S3 signed URL, thus containing query params with
# an AWS key, signature etc.
# For this reason, we use `urlparse` to easily get a clean path without query params.
def _extract_filename_from_url(url):
    return urlparse(url).path.split("/")[-1]


def _call_endpoint(iaso_client, url, filename):
    logger.info(f"{filename}: GET {url}")
    result = iaso_client.get(url)

    if isinstance(result, dict) and "count" in result:
        logger.info(f"\tTotal count: {result['count']}")
    if isinstance(result, dict) and "pages" in result:
        logger.info(f"\tTotal pages: {result['pages']}")

    return result


def _download_form_attachments(iaso_client, tmp_dir, resources, app_id):
    if len(resources) == 0:
        return

    # create subfolder for downloaded files
    os.makedirs(os.path.join(tmp_dir, "formattachments"))
    for resource in resources:
        form_id = resource["form_id"]
        os.makedirs(os.path.join(tmp_dir, "formattachments", str(form_id)))
        url = resource["file"]
        filename = _extract_filename_from_url(url)

        logger.info(f"\tDOWNLOAD {url}")
        attachment_file = requests.get(url, headers=iaso_client.headers)
        logger.info(f"\tDOWNLOAD manifest")
        manifest_file = requests.get(
            SERVER + f"/api/forms/{form_id}/manifest/?app_id={app_id}",
            headers=iaso_client.headers,
        )

        with open(os.path.join(tmp_dir, "formattachments", str(form_id), filename), mode="wb") as f:
            f.write(attachment_file.content)
        # For the manifest.xml, rewrite the `downloadUrl` to the local file path
        with open(os.path.join(tmp_dir, "formattachments", str(form_id), "manifest.xml"), mode="w") as f:
            content = manifest_file.content.decode("utf-8")
            url_regex = r"(?<=<downloadUrl>)(.*?)(?=</downloadUrl>)"
            download_url = re.search(url_regex, content).group()
            new_download_url = "formattachments/" + _extract_filename_from_url(download_url)
            f.write(re.sub(url_regex, new_download_url, content))


def _download_form_versions(iaso_client, tmp_dir, form_versions):
    if len(form_versions) == 0:
        return

    os.makedirs(os.path.join(tmp_dir, "forms"))
    for form_version in form_versions:
        url = form_version["file"]
        filename = _extract_filename_from_url(url)

        logger.info(f"\tDOWNLOAD {url}")
        response = requests.get(url, headers=iaso_client.headers)

        with open(os.path.join(tmp_dir, "forms", filename), mode="wb") as f:
            f.write(response.content)


def _download_reports(iaso_client, tmp_dir, reports):
    if len(reports) == 0:
        return

    os.makedirs(os.path.join(tmp_dir, "reports"))
    for report in reports:
        # path in dev, url in prod
        url_or_path = report["url"]
        url = url_or_path if url_or_path.startswith("https") else SERVER + url_or_path

        logger.info(f"\tDOWNLOAD {url}")
        response = requests.get(url, headers=iaso_client.headers)

        filename = _extract_filename_from_url(url)
        with open(os.path.join(tmp_dir, "reports", filename), mode="wb") as f:
            f.write(response.content)


def _compress_and_upload_to_s3(tmp_dir, export_name, password):
    zipfile_name = f"{export_name}.zip"
    logger.info(f"Creating zipfile {zipfile_name}")

    with zipfile.ZipFile(os.path.join(tmp_dir, zipfile_name), "w", zipfile.ZIP_DEFLATED) as zipf:
        # add all files in /tmp directory to the .zip file
        for root, _dirs, files in os.walk(tmp_dir):
            for file in files:
                if file != zipfile_name:
                    file_path = os.path.join(root, file)
                    archive_name = os.path.relpath(file_path, tmp_dir)
                    zipf.write(file_path, archive_name)

    logger.info("Encrypting zipfile")
    encrypted_file_path = encrypt_file(
        file_path=tmp_dir,
        file_name_in=zipfile_name,
        file_name_out=zipfile_name,
        password=password,
    )

    logger.info("Uploading zipfile to S3")
    s3_object_name = "export-files/" + zipfile_name
    upload_file_to_s3(encrypted_file_path, object_name=s3_object_name)
    return s3_object_name
