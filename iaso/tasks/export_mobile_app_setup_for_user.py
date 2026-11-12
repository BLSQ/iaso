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

import logging
import os
import tempfile
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from beanstalk_worker import task_decorator
from iaso.models import Project
from iaso.tasks.mobile_app_setup.api_calls import API_CALLS
from iaso.tasks.mobile_app_setup.archive import ZipArchive
from iaso.tasks.mobile_app_setup.exporter import export_app_setup
from iaso.tasks.mobile_app_setup.hooks import payload_transformers
from iaso.tasks.mobile_app_setup.progress import ExportProgress
from iaso.utils.encryption import encrypt_file
from iaso.utils.iaso_api_client import HttpClient, IasoClient
from iaso.utils.s3_client import upload_file_to_s3


logger = logging.getLogger(__name__)

SERVER = f"https://{settings.DNS_DOMAIN}"


@task_decorator(task_name="export_mobile_app_setup")
def export_mobile_app_setup_for_user(
    user_id,
    project_id,
    password,
    # Export options, used by plugins (trypelim)
    options=None,
    task=None,
):
    progress = ExportProgress(task, API_CALLS)
    progress.start()

    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)
    export_name = f"mobile-app-export-{uuid.uuid4()}"

    with tempfile.TemporaryDirectory() as tmp_dir:
        zip_path = os.path.join(tmp_dir, export_name)
        logger.info(f"Creating zip file {zip_path}")

        with ZipArchive(zip_path) as archive:
            export_app_setup(
                client=IasoClient(SERVER),
                storage=HttpClient(),
                archive=archive,
                app_id=project.app_id,
                api_calls=API_CALLS,
                progress=progress,
                access_token=str(RefreshToken.for_user(user).access_token),
                payload_transformers=payload_transformers,
                options=options or {},
            )

        s3_object_name = _encrypt_and_upload_to_s3(tmp_dir, export_name, password)

    task.report_success_with_file(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        file_name=s3_object_name,
    )
    return task


def _encrypt_and_upload_to_s3(tmp_dir, source_name, password):
    # TODO: to be refactored with the upcoming storage changes
    # where we get rid of the the bespoke S3 client and upload through Django's default storage
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
