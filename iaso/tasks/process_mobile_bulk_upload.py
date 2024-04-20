"""
This task will process a .zip file containing a "bulk upload" from the mobile app.
Instead of uploading the new org units, instances and form submissions individually,
this .zip file contains all of these resources, hereby reducing the number of
API calls that need to be done by the mobile app.

This processing creates a record in the `APIImport` table for future reference,
and it's executed in a database transaction to avoid data loss.
"""

import json
import logging
import zipfile

from beanstalk_worker import task_decorator
from django.contrib.auth.models import User
from django.core.files import File
from django.db import transaction
from django.utils.translation import gettext as _
from traceback import format_exc

from hat.api_import.models import APIImport
from iaso.api.instances import import_data as import_instances
from iaso.api.mobile.org_units import import_data as import_org_units
from iaso.models import Project, Instance, InstanceFile
from iaso.utils.s3_client import download_file

INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"

logger = logging.getLogger(__name__)


@task_decorator(task_name="process_mobile_bulk_upload")
def process_mobile_bulk_upload(user_id, project_id, zip_file_object_name, task=None):
    the_task = task
    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
        end_value=100,
    )
    user = User.objects.get(id=user_id)
    project = Project.objects.get(id=project_id)

    api_import = APIImport.objects.create(
        user=user,
        import_type="bulk",
        json_body={"file": zip_file_object_name},
    )

    try:
        logger.info(f"Downloading {zip_file_object_name} from S3...")
        zip_file_path = download_file(zip_file_object_name)
        logger.info("DONE.")

        with transaction.atomic():
            with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
                if ORG_UNITS_JSON in zip_ref.namelist():
                    with zip_ref.open(ORG_UNITS_JSON) as file:
                        import_org_units(json.load(file), user, project.app_id)
                else:
                    logger.info(f"The file {ORG_UNITS_JSON} does not exist in the zip file.")

                with zip_ref.open(INSTANCES_JSON) as file:
                    import_instances(json.load(file), user, project.app_id)

                logger.info("Processing forms and files")
                for item in zipfile.Path(zip_ref).iterdir():
                    if item.is_dir():
                        directory = item
                        i = None
                        for instance_file in directory.iterdir():
                            if instance_file.name.endswith(".xml"):
                                with instance_file.open("rb") as f:
                                    logger.info(f"Processing {instance_file}")
                                    i = Instance.objects.get(uuid=directory.name)
                                    i.created_by = user
                                    i.last_modified_by = user
                                    i.file = File(f)
                                    i.save()
                                    i.get_and_save_json_of_xml()
                                    try:
                                        i.convert_location_from_field()
                                        i.convert_device()
                                        i.convert_correlation()
                                    except ValueError as error:
                                        logger.exception(error)

                        for instance_file in directory.iterdir():
                            if not instance_file.name.endswith(".xml"):
                                with instance_file.open("rb") as f:
                                    logger.info(f"Processing {instance_file}")
                                    fi = InstanceFile()
                                    fi.file = File(f)
                                    fi.instance_id = i.id
                                    fi.name = instance_file.name
                                    fi.save()
    except Exception as e:
        logger.error("Exception: " + str(e))
        api_import.has_problem = True
        api_import.exception = format_exc()
        api_import.save()
        raise e
