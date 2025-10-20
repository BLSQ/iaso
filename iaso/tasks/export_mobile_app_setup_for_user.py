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
import uuid
import zipfile

from dataclasses import dataclass
from typing import BinaryIO, Optional, TextIO
from urllib.parse import urlencode, urlparse, urlunparse

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

            the_task.report_progress_and_stop_if_killed(progress_value=2)

            for call in API_CALLS:
                the_task.report_progress_and_stop_if_killed(
                    progress_value=the_task.progress_value + 1,
                    progress_message=f"Fetching {call['filename']}",
                )
                _get_resource(iaso_client, call, zipf, project.app_id, feature_flags)

        s3_object_name = _encrypt_and_upload_to_s3(tmp_dir, export_name, password)

    the_task.report_success_with_result(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        result_data="file:" + s3_object_name,
    )
    return the_task


class ZipFileWriter:
    """
    A helper class for writing string content to files within a ZIP archive.

    The user is responsible for calling the close() method on the class instance
    when finished to finalize the ZIP file.
    """

    def __init__(self, filename: str):
        self._zip_file = zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED)
        self.filename = filename

    def open(self, zip_path: str) -> TextIO:
        """Opens a write-only file-like object inside the ZIP archive.

        Similar to Python's open(path, mode="w").
        """

        binary_stream = self._zip_file.open(zip_path, mode="w")

        # This converts string writes (.write(str)) into binary writes (.write(bytes))
        text_io = io.TextIOWrapper(binary_stream, encoding="utf-8")

        return text_io

    def openb(self, zip_path: str) -> BinaryIO:
        """Opens a binary write-only file-like object inside the ZIP archive.

        Similar to Python's open(path, mode="wb").
        """
        return self._zip_file.open(zip_path, mode="w")

    def close(self):
        """Closes the  handle and finalizes the archive.

        This method must be called after all files have been written.
        """
        self._zip_file.close()

    def __enter__(self) -> "ZipFileWriter":
        """Provides a context manager."""
        return self

    def __exit__(self, *exc_info):
        """Ensures the close() method is called for cleanup."""
        self.close()
        # Return False to propagate any exceptions raised within the 'with' block
        return False


def _get_project_app_details(iaso_client, zipf, app_id):
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
    logger.info(f"Writing results to {zipf.filename}")

    with zipf.open("app.json") as json_file:
        json.dump(app_info, json_file)

    return app_info


@dataclass
class CursorState:
    """Holds the necessary state and metadata for cursor pagination shimming."""

    total_count: int
    total_pages: int
    page_size: int
    next_url: Optional[str] = None


def _get_cursor_pagination_metadata(iaso_client, call, app_id):
    """Retrieves total count for cursor pagination and calculates total pages."""
    page_size = call.get("page_size", 1000)

    # Retrieve total count from the legacy url
    count_path = call["cursor_pagination"]["legacy_url"]
    count_query_params = {k: v for k, v in call.get("query_params", {}).items() if k not in ["limit", "page", "cursor"]}
    count_query_params["app_id"] = app_id

    count_url = urlunparse(("", "", count_path, "", urlencode(count_query_params), ""))
    count_result = _call_endpoint(iaso_client, count_url, None)
    total_count = count_result.get("count", 0)

    total_pages = (total_count + page_size - 1) // page_size

    logger.info(f"Total count: {total_count}, Total pages: {total_pages} (Page size: {page_size})")

    return CursorState(total_count, total_pages, page_size)


def _call_cursor_pagination_page(iaso_client, call, app_id, page, cursor_state):
    """Handles a single page call for cursor pagination."""
    query_params = call.get("query_params", {}).copy()
    query_params["app_id"] = app_id

    if page == 1:
        query_params["limit"] = cursor_state.page_size
        url = urlunparse(("", "", call["path"], "", urlencode(query_params), ""))
    else:
        url = cursor_state.next_url

    filename = f"{call['filename']}-{page}.json"
    result = _call_endpoint(iaso_client, url, filename)

    cursor_state.next_url = result.pop("next", None)
    result.pop("previous", None)

    # Transform the cursor response into the old offset format
    if result:
        result["count"] = cursor_state.total_count
        result["has_next"] = cursor_state.next_url is not None
        result["has_previous"] = page > 1
        result["page"] = page
        result["pages"] = cursor_state.total_pages
        result["limit"] = cursor_state.page_size

    return result, filename


def _get_resource(iaso_client, call, zipf, app_id, feature_flags):
    if ("required_feature_flag" in call) and call["required_feature_flag"] not in feature_flags:
        logger.info(f"{call['filename']}: not writing, feature flag missing.")
        return

    paginated = call.get("paginated", False)

    # Determine if we're using cursor pagination and need to maintain
    # compatibility with the api responses from offset pagination
    cursor_shim = call.get("cursor_pagination", {}).get("shim", False)
    cursor_state = None

    if cursor_shim:
        logger.info(f"{call['filename']}: using cursor pagination with pagination shim.")
        cursor_state = _get_cursor_pagination_metadata(iaso_client, call, app_id)

    page = 1
    has_more_data = True
    result = None

    while page == 1 or has_more_data:
        url = None
        filename = None

        if paginated and cursor_shim:
            # Cursor pagination
            result, filename = _call_cursor_pagination_page(iaso_client, call, app_id, page, cursor_state)
        elif paginated:
            # Offset-based pagination
            query_params = call.get("query_params", {})
            query_params["app_id"] = app_id
            query_params["page"] = page
            if "page_size" in call:
                query_params["limit"] = call["page_size"]
            url = urlunparse(("", "", call["path"], "", urlencode(query_params), ""))
            filename = f"{call['filename']}-{page}.json"
            result = _call_endpoint(iaso_client, url, filename)
        else:  # Not paginated
            query_params = call.get("query_params", {})
            query_params["app_id"] = app_id
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
                # don't use _extract_filename_from_url to preserve subpath
                record["file"] = "formattachments/" + urlparse(record["file"]).path.split("/form_attachments/")[-1]

        with zipf.open(filename) as json_file:
            json.dump(result, json_file)

        page += 1
        if cursor_shim:
            has_more_data = cursor_state and cursor_state.next_url is not None
        else:
            has_more_data = isinstance(result, dict) and result.get("has_next", False)


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


def _download_form_attachments(iaso_client, zipf, resources, app_id):
    if len(resources) == 0:
        return

    for resource in resources:
        form_id = resource["form_id"]
        url = resource["file"]
        filename = _extract_filename_from_url(url)

        logger.info(f"\tDOWNLOAD {url}")
        attachment_file = None
        # S3 urls contain a signature and don't work with additional auth headers
        if "s3.amazonaws" in url:
            attachment_file = requests.get(url)
        else:
            attachment_file = requests.get(url, headers=iaso_client.headers)

        logger.info("\tDOWNLOAD manifest")
        manifest_file = requests.get(
            SERVER + f"/api/forms/{form_id}/manifest/?app_id={app_id}",
            headers=iaso_client.headers,
        )

        with zipf.openb(os.path.join("formattachments", str(form_id), filename)) as f:
            f.write(attachment_file.content)
        # For the manifest.xml, rewrite the `downloadUrl` to the local file path
        with zipf.open(os.path.join("formattachments", str(form_id), "manifest.xml")) as f:
            content = manifest_file.content.decode("utf-8")
            url_regex = r"(?<=<downloadUrl>)(.*?)(?=</downloadUrl>)"
            download_url = re.search(url_regex, content).group()
            # don't use _extract_filename_from_url to preserve subpath
            new_download_url = "formattachments/" + urlparse(download_url).path.split("/form_attachments/")[-1]
            f.write(re.sub(url_regex, new_download_url, content))


def _download_form_versions(iaso_client, zipf, form_versions):
    if len(form_versions) == 0:
        return

    for form_version in form_versions:
        _download_and_save_file(
            iaso_client,
            zipf,
            url=form_version["file"],
            non_s3_url=form_version["file"],
            folder_name="forms",
        )


def _download_reports(iaso_client, zipf, reports):
    if len(reports) == 0:
        return

    for report in reports:
        _download_and_save_file(
            iaso_client,
            zipf,
            url=report["url"],
            non_s3_url=SERVER + report["url"],
            folder_name="reports",
        )


def _download_and_save_file(iaso_client, zipf, folder_name, url, non_s3_url):
    filename = _extract_filename_from_url(url)
    response = None
    # S3 urls contain a signature and don't work with additional auth headers
    if "s3.amazonaws" in url:
        logger.info(f"\tDOWNLOAD {url}")
        response = requests.get(url)
    else:
        logger.info(f"\tDOWNLOAD {non_s3_url}")
        response = requests.get(non_s3_url, headers=iaso_client.headers)

    with zipf.openb(os.path.join(folder_name, filename)) as f:
        f.write(response.content)


def _encrypt_and_upload_to_s3(tmp_dir, source_name, password):
    dest_name = f"{source_name}.zip"

    logger.info("Encrypting zipfile")

    encrypted_file_path = encrypt_file(
        file_path=tmp_dir,
        file_name_in=source_name,
        file_name_out=dest_name,
        password=password,
    )

    logger.info("Uploading zipfile to S3")
    s3_object_name = "export-files/" + dest_name
    upload_file_to_s3(encrypted_file_path, object_name=s3_object_name)
    return s3_object_name
