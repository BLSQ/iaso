"""
This task will process a .zip file containing a "bulk upload" from the mobile app.
Instead of uploading the new org units, instances and form submissions individually,
this .zip file contains all of these resources, hereby reducing the number of
API calls that need to be done by the mobile app.

This processing creates a record in the `APIImport` table for future reference,
and it's executed in a database transaction to avoid data loss.
"""

from datetime import datetime
import json
import logging
import os
import time
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
    start_date = datetime.now()
    start_time = time.time()
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

        stats = {"new_org_units": 0, "new_instances": 0, "new_instance_files": 0}

        with transaction.atomic():
            with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
                if ORG_UNITS_JSON in zip_ref.namelist():
                    with zip_ref.open(ORG_UNITS_JSON) as file:
                        new_org_units = import_org_units(json.load(file), user, project.app_id)
                        stats["new_org_units"] = len(new_org_units)
                else:
                    logger.info(f"The file {ORG_UNITS_JSON} does not exist in the zip file.")

                if INSTANCES_JSON in zip_ref.namelist():
                    with zip_ref.open(INSTANCES_JSON) as file:
                        import_instances(json.load(file), user, project.app_id)
                else:
                    logger.info(f"The file {INSTANCES_JSON} does not exist in the zip file.")

                logger.info("Processing forms and files")
                new_instance_files = []
                for directory in zipfile.Path(zip_ref).iterdir():
                    if not directory.is_dir():
                        continue

                    instance = process_instance_xml(directory, zip_ref, user)
                    stats["new_instances"] += 1
                    new_instance_files += process_instance_files(directory, instance)

                duplicated_count = duplicate_instance_files(new_instance_files)
                stats["new_instance_files"] = len(new_instance_files) + duplicated_count

    except Exception as e:
        logger.error("Exception! Rolling back import: " + str(e))
        api_import.has_problem = True
        api_import.exception = format_exc()
        api_import.save()
        raise e

    the_task.report_success_with_result(
        message=result_message(user, project, start_date, start_time, stats),
    )


def process_instance_xml(directory, zip_ref, user):
    instance = Instance.objects.get(uuid=directory.name)
    logger.info(f"Processing instance {instance.uuid}")
    with zip_ref.open(os.path.join(directory.name, instance.file_name), "r") as f:
        instance.file = File(f)
        instance.created_by = user
        instance.last_modified_by = user
        instance.save()
        instance.get_and_save_json_of_xml()
        try:
            instance.convert_location_from_field()
            instance.convert_device()
            instance.convert_correlation()
        except ValueError as error:
            logger.exception(error)

    return instance


def process_instance_files(directory, instance):
    instance_files = []
    for instance_file in directory.iterdir():
        if instance_file.name != instance.file_name:
            with instance_file.open("rb") as f:
                logger.info(f"\tProcessing attachment {instance_file.name}")
                fi = InstanceFile()
                fi.file = File(f)
                fi.instance_id = instance.id
                fi.name = instance_file.name
                fi.save()
                instance_files.append(fi)

    return instance_files


# Trypelim-specific
def duplicate_instance_files(new_instance_files):
    count = 0
    for instance_file in new_instance_files:
        if "serie_id" in instance_file.instance.json:
            for i in Instance.objects.filter(json__serie_id=instance_file.instance.json["serie_id"]).exclude(
                id=instance_file.instance_id,
            ):
                instance_file.pk = None  # trick to duplicate model
                instance_file.instance = i
                instance_file.save()
                logger.info(f"\tDuplicated attachment {instance_file.name}")
                count += 1

    return count


def result_message(user, project, start_date, start_time, stats):
    return f"""
Mobile bulk import successful for user {user.username} and project {project.name}.
Started: {str(start_date)}, time spent: {time.time()-start_time} sec
Number of imported org units: {stats["new_org_units"]}
Number of imported form submissions: {stats["new_instances"]}
Number of imported submission attachments: {stats["new_instance_files"]}
    """
