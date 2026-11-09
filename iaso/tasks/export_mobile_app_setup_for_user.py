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

import io
import json
import logging
import os
import re
import tempfile
import time
import uuid
import zipfile

from typing import BinaryIO, TextIO
from urllib.parse import urlencode, urljoin, urlparse, urlunparse

import requests

from django.conf import settings
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from beanstalk_worker import task_decorator
from iaso.models import Project
from iaso.tasks.utils.mobile_app_setup_api_calls import API_CALLS
from iaso.utils.encryption import encrypt_file
from iaso.utils.iaso_api_client import IasoClient
from iaso.utils.s3_client import upload_file_to_s3


logger = logging.getLogger(__name__)

SERVER = f"https://{settings.DNS_DOMAIN}"

# Retries of the API calls
API_MAX_RETRIES = 3
API_RETRY_DELAY = 10
# Retries of the file downloads (form versions, attachments, reports)
MAX_RETRIES = 5
RETRY_DELAY = 30


@task_decorator(task_name="export_mobile_app_setup")
def export_mobile_app_setup_for_user(
    user_id,
    project_id,
    password,
    task=None,
):
    the_task = task

    setup_steps = 2  # app info, authentication
    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
        end_value=setup_steps + sum(call.get("sub_steps", 1) for call in API_CALLS),
    )
    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)

    export_name = f"mobile-app-export-{uuid.uuid4()}"
    iaso_client = IasoClient(server_url=SERVER)

    with tempfile.TemporaryDirectory() as tmp_dir:
        zip_path = os.path.join(tmp_dir, export_name)
        logger.info(f"Creating zip file {zip_path}")

        with ZipFileWriter(zip_path) as zipf:
            app_info = _get_project_app_details(iaso_client, zipf, project.app_id)
            feature_flags = [flag["code"] for flag in app_info["feature_flags"]]

            the_task.report_progress_and_stop_if_killed(progress_value=1)

            if app_info["needs_authentication"]:
                logger.info("Authentication required, authenticating iaso_client")
                refresh = RefreshToken.for_user(user)
                iaso_client.authenticate_with_token(str(refresh.access_token))

            the_task.report_progress_and_stop_if_killed(progress_value=setup_steps)

            progress = setup_steps
            for call in API_CALLS:
                sub_steps = call.get("sub_steps", 1)
                _get_resource(iaso_client, call, zipf, project.app_id, feature_flags, the_task, progress, sub_steps)
                progress += sub_steps

        s3_object_name = _encrypt_and_upload_to_s3(tmp_dir, export_name, password)

    the_task.report_success_with_file(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        file_name=s3_object_name,
    )
    return the_task


class ZipFileWriter:
    """Writes files directly into a compressed ZIP archive, without intermediate files on disk."""

    def __init__(self, filename: str):
        self._zip_file = zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED)
        self.filename = filename

    def open(self, zip_path: str) -> TextIO:
        """Opens a text file for writing inside the archive, like open(path, mode="w")."""
        return io.TextIOWrapper(self._zip_file.open(zip_path, mode="w"), encoding="utf-8")

    def openb(self, zip_path: str) -> BinaryIO:
        """Opens a binary file for writing inside the archive, like open(path, mode="wb")."""
        return self._zip_file.open(zip_path, mode="w")

    def close(self):
        self._zip_file.close()

    def __enter__(self) -> "ZipFileWriter":
        return self

    def __exit__(self, *exc_info):
        self.close()
        return False


def _get_project_app_details(iaso_client, zipf, app_id):
    logger.info("Getting app info (feature flags etc)")
    # Public endpoint, no auth needed
    app_info = _call_endpoint(iaso_client, f"/api/apps/current/?app_id={app_id}", "app.json")

    logger.info("App summary:")
    logger.info(f"\tName: {app_info['name']}")
    logger.info(f"\tApp id: {app_info['app_id']}")
    logger.info(f"\tNeeds authentication: {app_info['needs_authentication']}")
    logger.info(f"\tMin version: {app_info.get('min_version', None)}")
    logger.info("\tFeature flags:")
    for flag in app_info["feature_flags"]:
        logger.info(f"\t\t{flag['code']}: {flag['name']}")
    logger.info("")
    logger.info(f"Writing results to {zipf.filename}")

    with zipf.open("app.json") as json_file:
        json.dump(app_info, json_file)

    return app_info


def _get_resource(iaso_client, call, zipf, app_id, feature_flags, task, base_progress, sub_steps):
    if ("required_feature_flag" in call) and call["required_feature_flag"] not in feature_flags:
        logger.info(f"{call['filename']}: not writing, feature flag missing.")
        task.report_progress_and_stop_if_killed(progress_value=base_progress + sub_steps)
        return

    task.report_progress_and_stop_if_killed(progress_message=f"Fetching {call['filename']}")

    paginated = call.get("paginated", False)
    page = 1
    has_next = True

    while has_next:
        # Copy: the query params of API_CALLS are shared between task runs.
        query_params = {**call.get("query_params", {}), "app_id": app_id}
        if paginated:
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
            _download_form_versions(iaso_client, zipf, result["form_versions"])
            for record in result["form_versions"]:
                record["file"] = "forms/" + _extract_filename_from_url(record["file"])
        if call["filename"] == "reports":
            _download_reports(iaso_client, zipf, result)
            for record in result:
                record["url"] = "reports/" + _extract_filename_from_url(record["url"])
        if call["filename"] == "formattachments":
            _download_form_attachments(iaso_client, zipf, result["results"], app_id)
            for record in result["results"]:
                record["file"] = _form_attachment_path(record["form_id"], record["file"])

        with zipf.open(filename) as json_file:
            json.dump(result, json_file)

        has_next = paginated and isinstance(result, dict) and result.get("has_next", False)

        if paginated:
            total_pages = (isinstance(result, dict) and result.get("pages")) or 1
            # Capped, in case there are more pages than announced on the first one.
            progress = min(base_progress + (page * sub_steps) // total_pages, base_progress + sub_steps)
            task.report_progress_and_stop_if_killed(
                progress_value=progress,
                progress_message=f"Fetching {call['filename']} (page {page}/{total_pages})",
            )
        page += 1

    task.report_progress_and_stop_if_killed(progress_value=base_progress + sub_steps)


def _call_endpoint(iaso_client, url, filename, max_retries=API_MAX_RETRIES, delay=API_RETRY_DELAY):
    logger.info(f"{filename}: GET {url}")
    for attempt in range(1, max_retries + 1):
        try:
            result = iaso_client.get(url)
            break
        except Exception as e:
            logger.warning(f"Request failed ({attempt}/{max_retries}) for {url}: {e}")
            if attempt == max_retries:
                raise
            time.sleep(delay)

    if isinstance(result, dict) and "count" in result:
        logger.info(f"\tTotal count: {result['count']}")
    if isinstance(result, dict) and "pages" in result:
        logger.info(f"\tTotal pages: {result['pages']}")

    return result


def _download(iaso_client, url, max_retries=MAX_RETRIES, delay=RETRY_DELAY) -> bytes:
    """Downloads a file, from our own server or from a storage (e.g. S3), with retries.

    The URL can be relative to our own server. The auth headers are only sent to our own server:
    storage URLs are signed and don't accept additional auth headers.
    """
    url = urljoin(SERVER + "/", url)
    headers = iaso_client.headers if urlparse(url).netloc == urlparse(SERVER).netloc else None

    logger.info(f"\tDOWNLOAD {url}")
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            logger.warning(f"Download failed ({attempt}/{max_retries}) for {url}: {e}")
            if attempt == max_retries:
                raise
            time.sleep(delay)


# The URL is potentially an S3 signed URL, thus containing query params with
# an AWS key, signature etc.
# For this reason, we use `urlparse` to easily get a clean path without query params.
def _extract_filename_from_url(url):
    return urlparse(url).path.split("/")[-1]


def _form_attachment_path(form_id, url):
    """Path of a form attachment in the zip file."""
    return f"formattachments/{form_id}/{_extract_filename_from_url(url)}"


def _update_manifest_download_urls(content: str, form_id) -> str:
    """Points each `downloadUrl` of a form manifest to its attachment in the zip file."""
    url_regex = r"(?<=<downloadUrl>)(.*?)(?=</downloadUrl>)"
    return re.sub(url_regex, lambda match: _form_attachment_path(form_id, match.group()), content)


def _download_form_attachments(iaso_client, zipf, resources, app_id):
    downloaded_manifests = set()
    for resource in resources:
        form_id = resource["form_id"]

        with zipf.openb(_form_attachment_path(form_id, resource["file"])) as f:
            f.write(_download(iaso_client, resource["file"]))

        if form_id not in downloaded_manifests:
            logger.info("\tDOWNLOAD manifest")
            manifest = _download(iaso_client, f"/api/forms/{form_id}/manifest/?app_id={app_id}")
            with zipf.open(f"formattachments/{form_id}/manifest.xml") as f:
                f.write(_update_manifest_download_urls(manifest.decode("utf-8"), form_id))
            downloaded_manifests.add(form_id)


def _download_form_versions(iaso_client, zipf, form_versions):
    for form_version in form_versions:
        _download_and_save_file(iaso_client, zipf, url=form_version["file"], folder_name="forms")


def _download_reports(iaso_client, zipf, reports):
    for report in reports:
        _download_and_save_file(iaso_client, zipf, url=report["url"], folder_name="reports")


def _download_and_save_file(iaso_client, zipf, folder_name, url):
    with zipf.openb(f"{folder_name}/{_extract_filename_from_url(url)}") as f:
        f.write(_download(iaso_client, url))


def _encrypt_and_upload_to_s3(tmp_dir, source_name, password):
    dest_name = f"{source_name}.zip"

    logger.info("Encrypting zipfile")
    encrypted_file_path = encrypt_file(
        file_path=tmp_dir,
        file_name_in=source_name,
        file_name_out=dest_name,
        password=password,
    )

    logger.info(f"Uploading zipfile to S3 {dest_name}")
    s3_object_name = "export-files/" + dest_name
    upload_file_to_s3(encrypted_file_path, object_name=s3_object_name)
    return s3_object_name
