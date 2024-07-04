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
import ntpath
import os
import time
import zipfile


from beanstalk_worker import task_decorator
from django.core.files import File
from django.db import transaction
from django.utils.translation import gettext as _
from traceback import format_exc

from hat.api.export_utils import timestamp_to_utc_datetime
from hat.api_import.models import APIImport
from hat.sync.views import create_instance_file, process_instance_file
from iaso.api.instances import import_data as import_instances
from iaso.api.mobile.org_units import import_data as import_org_units
from iaso.models import Project, Instance
from iaso.utils.s3_client import download_file

INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"

logger = logging.getLogger(__name__)


@task_decorator(task_name="process_mobile_bulk_upload")
def process_mobile_bulk_upload(api_import_id, project_id, task=None):
    start_date = datetime.now()
    start_time = time.time()
    the_task = task
    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
        end_value=100,
    )
    api_import = APIImport.objects.get(id=api_import_id)
    user = api_import.user
    zip_file_object_name = api_import.json_body["file"]
    project = Project.objects.get(id=project_id)

    try:
        logger.info(f"Downloading {zip_file_object_name} from S3...")
        zip_file_path = download_file(zip_file_object_name)
        logger.info("DONE.")

        stats = {"new_org_units": 0, "new_instances": 0, "new_instance_files": 0}

        with transaction.atomic():
            with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
                if ORG_UNITS_JSON in zip_ref.namelist():
                    org_units_data = read_json_file_from_zip(zip_ref, ORG_UNITS_JSON)
                    new_org_units = import_org_units(org_units_data, user, project.app_id)
                    stats["new_org_units"] = len(new_org_units)
                else:
                    logger.info(f"The file {ORG_UNITS_JSON} does not exist in the zip file.")

                if not INSTANCES_JSON in zip_ref.namelist():
                    raise ValueError(f"{zip_file_path}: The file {INSTANCES_JSON} does not exist in the zip file.")

                logger.info("Processing forms and files")
                instances_data = read_json_file_from_zip(zip_ref, INSTANCES_JSON)
                import_instances(instances_data, user, project.app_id)
                new_instance_files = []
                dirs = get_directory_handlers(zip_ref)

                for instance_data in instances_data:
                    uuid = instance_data.get("id", None)
                    instance = process_instance_xml(uuid, instance_data, zip_ref, user)
                    stats["new_instances"] += 1
                    new_instance_files += process_instance_attachments(dirs[uuid], instance)

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


def read_json_file_from_zip(zip_ref, filename):
    with zip_ref.open(filename) as file:
        return json.load(file)


def get_directory_handlers(zip_ref):
    result = {}
    for directory in zipfile.Path(zip_ref).iterdir():
        if directory.is_dir():
            result[directory.name] = directory
    return result


def process_instance_xml(uuid, instance_data, zip_ref, user):
    instance = Instance.objects.get(uuid=uuid)
    filename = ntpath.basename(instance_data.get("file", None))
    logger.info(f"Processing instance {instance.uuid}")
    with zip_ref.open(os.path.join(uuid, filename), "r") as f:
        if not instance.file or not instance.json:  # new instance
            instance = process_instance_file(instance, File(f), user)
        else:
            instance = update_instance_file_if_needed(
                instance,
                instance_data.get("updated_at", None),
                File(f),
                user,
            )

    return instance


def update_instance_file_if_needed(instance, incoming_updated_at, file, user):
    incoming_updated_at = incoming_updated_at and timestamp_to_utc_datetime(int(incoming_updated_at))
    if incoming_updated_at and incoming_updated_at > instance.source_updated_at:
        logger.info(
            "\tUpdating form %s (from timestamp %s to %s)",
            instance.uuid,
            str(instance.source_updated_at),
            str(incoming_updated_at),
        )
        instance.file = file
        instance.last_modified_by = user
        instance.source_updated_at = incoming_updated_at
        instance.save()
        instance.get_and_save_json_of_xml(force=True)
    else:
        logger.info(
            "\tSkipping form %s (current timestamp %s, incoming %s)",
            instance.uuid,
            str(instance.source_updated_at),
            str(incoming_updated_at),
        )

    return instance


# Create form attachments for all non-XML files in the form's directory
def process_instance_attachments(directory, instance):
    instance_files = []
    for instance_file in directory.iterdir():
        if not instance_file.name.endswith(".xml"):
            with instance_file.open("rb") as f:
                logger.info(f"\tProcessing attachment {instance_file.name}")
                fi = create_instance_file(instance, instance_file.name, File(f))
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
