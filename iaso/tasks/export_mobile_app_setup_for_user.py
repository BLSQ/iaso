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
import tempfile
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files import File
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from beanstalk_worker import task_decorator
from iaso.models import Project
from iaso.tasks.mobile_app_setup.api_calls import API_CALLS
from iaso.tasks.mobile_app_setup.archive import ZipArchive
from iaso.tasks.mobile_app_setup.exporter import export_app_setup
from iaso.tasks.mobile_app_setup.hooks import make_payload_transformers
from iaso.tasks.mobile_app_setup.progress import ExportProgress
from iaso.utils.encryption import StreamingEncryptionWriter
from iaso.utils.iaso_api_client import HttpClient, IasoClient


logger = logging.getLogger(__name__)

MAX_IN_MEMORY_EXPORT_SIZE = 50 * 1024 * 1024


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
    payload_transformers = make_payload_transformers(project, options or {})

    # Can't rely on `settings.SSL_ON` for the scheme as this runs on the worker
    server_url = f"https://{settings.DNS_DOMAIN}"

    logger.info(f"Creating encrypted zip file {export_name}")
    with tempfile.SpooledTemporaryFile(max_size=MAX_IN_MEMORY_EXPORT_SIZE) as encrypted_zip:
        with StreamingEncryptionWriter(encrypted_zip, password) as stream, ZipArchive(stream) as archive:
            export_app_setup(
                client=IasoClient(server_url),
                storage=HttpClient(),
                archive=archive,
                app_id=project.app_id,
                api_calls=API_CALLS,
                progress=progress,
                access_token=str(RefreshToken.for_user(user).access_token),
                payload_transformers=payload_transformers,
            )

        encrypted_zip.seek(0)
        file_name = default_storage.save(f"export-files/{export_name}.zip", File(encrypted_zip))

    task.report_success_with_file(
        message=f"Mobile app setup zipfile was created for user {user.username} and project {project.name}.",
        file_name=file_name,
    )
    return task
