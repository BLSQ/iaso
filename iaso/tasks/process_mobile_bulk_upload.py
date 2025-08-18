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
import ntpath
import os
import time
import uuid
import zipfile

from collections import defaultdict
from copy import copy
from datetime import datetime
from traceback import format_exc

from django.core.files import File
from django.db import transaction
from django.utils.translation import gettext as _

from beanstalk_worker import task_decorator
from hat.api.export_utils import timestamp_to_utc_datetime
from hat.api_import.models import APIImport
from hat.audit.models import BULK_UPLOAD, BULK_UPLOAD_MERGED_ENTITY, log_modification
from hat.sync.views import create_instance_file, process_instance_file
from iaso.api.instances.instances import import_data as import_instances
from iaso.api.mobile.org_units import import_data as import_org_units
from iaso.api.org_unit_change_requests.serializers import OrgUnitChangeRequestWriteSerializer
from iaso.api.storage import import_storage_logs
from iaso.models import Instance, OrgUnit, Project
from plugins.trypelim.common.form_utils import (
    get_population_form,
    get_population_instances,
)
from plugins.trypelim.common.utils import sns_notify
from plugins.trypelim.import_export.bulk_upload import notify_coordinations, positive_instance_qs


INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"
STORAGE_LOGS_JSON = "storageLogs.json"
CHANGE_REQUESTS_JSON = "changeRequests.json"

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
    project = Project.objects.get(id=project_id)

    try:
        stats = {"new_org_units": 0, "new_instances": 0, "new_instance_files": 0, "new_change_requests": 0}
        created_objects_ids = defaultdict(list)

        with transaction.atomic():
            with zipfile.ZipFile(api_import.file, "r") as zip_ref:
                if ORG_UNITS_JSON in zip_ref.namelist():
                    org_units_data = read_json_file_from_zip(zip_ref, ORG_UNITS_JSON)
                    new_org_units = import_org_units(org_units_data, user, project.app_id)
                    # Trypelim-specific
                    for ou in new_org_units:
                        if ou.location:
                            ou.validation_status = OrgUnit.VALIDATION_VALID
                            ou.save()
                    stats["new_org_units"] = len(new_org_units)
                else:
                    logger.info(f"The file {ORG_UNITS_JSON} does not exist in the zip file.")

                if INSTANCES_JSON in zip_ref.namelist():
                    logger.info("Processing forms and files")
                    instances_data = read_json_file_from_zip(zip_ref, INSTANCES_JSON)
                    import_instances(instances_data, user, project.app_id)
                    new_instance_files = []
                    dirs = get_directory_handlers(zip_ref)

                    for instance_data in instances_data:
                        uuid = instance_data["id"]
                        instance = process_instance_xml(uuid, instance_data, zip_ref, user)
                        stats["new_instances"] += 1
                        new_instance_files += process_instance_attachments(dirs[uuid], instance)
                        created_objects_ids["instance"].append(instance.id)

                    # Trypelim-specifics
                    duplicated_count = duplicate_instance_files(new_instance_files)
                    stats["new_instance_files"] = len(new_instance_files) + duplicated_count
                    process_population_instances(instances_data)
                else:
                    logger.info(f"The file {INSTANCES_JSON} does not exist in the zip file.")

                if STORAGE_LOGS_JSON in zip_ref.namelist():
                    logger.info("Processing storage logs")
                    storage_logs_data = read_json_file_from_zip(zip_ref, STORAGE_LOGS_JSON)
                    import_storage_logs(storage_logs_data, user)

                if CHANGE_REQUESTS_JSON in zip_ref.namelist():
                    logger.info("Processing change requests")
                    change_requests_data = read_json_file_from_zip(zip_ref, CHANGE_REQUESTS_JSON)
                    for change_request in change_requests_data:
                        serializer = OrgUnitChangeRequestWriteSerializer(data=change_request)
                        serializer.is_valid()
                        # TODO: Figure out how to handle permissions in bulk upload
                        # org_unit_to_change = serializer.validated_data["org_unit"]
                        # self.has_org_unit_permission(org_unit_to_change)
                        serializer.validated_data["created_by"] = user
                        serializer.save()
                        stats["new_change_requests"] += 1

    except Exception as e:
        logger.exception("Exception! Rolling back import: " + str(e))
        api_import.has_problem = True
        api_import.exception = format_exc()
        api_import.save()
        raise e

    api_import.has_problem = False
    api_import.exception = ""
    api_import.save()
    message = result_message(user, project, start_date, start_time, stats)

    # Trypelim-specific
    # Trigger a task to notify relevant coordinations of confirmed cases
    if instance_ids := created_objects_ids["instance"]:
        confirmation_ids = (
            positive_instance_qs(Instance.objects).filter(id__in=instance_ids).values_list("id", flat=True)
        )

        logger.info(f"Bulk upload id={api_import_id} imported {len(confirmation_ids)} confirmations.")
        if confirmation_ids and user:
            notify_coordinations(user, confirmation_ids)

        # Add confirmation stats to the task message
        message += f"Number of new positive confirmations: {len(confirmation_ids)}\n"

    # Trypelim-specific
    # Notify a SNS topic with basic import stats
    try:
        logger.info("Notifying SNS topic of new bulk upload.")
        sns_notify(message)
    except Exception as e:
        logger.exception("Failed to publish to SNS" + str(e))

    the_task.report_success_with_result(message=message)


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
            "\tUpdating instance %s (from timestamp %s to %s)",
            instance.uuid,
            str(instance.source_updated_at),
            str(incoming_updated_at),
        )
        original = copy(instance)
        instance.file = file
        instance.last_modified_by = user
        instance.source_updated_at = incoming_updated_at
        instance.save()
        instance.get_and_save_json_of_xml(force=True, tries=8)
        log_modification(original, instance, BULK_UPLOAD, user=user)
        update_merged_entity_ref_form_if_needed(instance, incoming_updated_at, file, user)
    else:
        logger.info(
            "\tSkipping instance %s (current timestamp %s, incoming %s)",
            instance.uuid,
            str(instance.source_updated_at),
            str(incoming_updated_at),
        )

    return instance


def update_merged_entity_ref_form_if_needed(instance, incoming_updated_at, file, user):
    """
    If the form being updated is attached to an entity that's soft deleted because
    of a merge, then we also update the ref form on the "final" merged entity
    IF the incoming timestamp is more recent.
    """
    entity = instance.entity

    if entity is None:
        return

    is_soft_deleted_merged_entity = entity.deleted_at and entity.merged_to
    if not is_soft_deleted_merged_entity:
        return

    active_entity = entity.merged_to
    while active_entity.deleted_at and active_entity.merged_to:
        active_entity = active_entity.merged_to

    if entity.attributes == instance and incoming_updated_at > active_entity.attributes.source_updated_at:
        instance_to_update = active_entity.attributes
        logger.info(
            "\tUpdating instance %s (from timestamp %s to %s) (merged entity)",
            instance_to_update.uuid,
            str(instance_to_update.source_updated_at),
            str(incoming_updated_at),
        )
        original = copy(instance_to_update)
        instance_to_update.file = file
        instance_to_update.last_modified_by = user
        instance_to_update.source_updated_at = incoming_updated_at
        instance_to_update.save()
        instance_to_update.get_and_save_json_of_xml(force=True, tries=8)
        log_modification(original, instance_to_update, BULK_UPLOAD_MERGED_ENTITY, user=user)


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
        if "serie_id" in instance_file.instance.json and instance_file.instance.json["serie_id"]:
            for i in Instance.objects.filter(json__serie_id=instance_file.instance.json["serie_id"]).exclude(
                id=instance_file.instance_id,
            ):
                instance_file.pk = None  # trick to duplicate model
                instance_file.instance = i
                instance_file.save()
                logger.info(f"\tDuplicated attachment {instance_file.name}")
                count += 1

    return count


# Trypelim-specific
# For all the new "Population" form instances: update the extra_fields on the
# org unit for the **newest** population form instance.
def process_population_instances(instances_data):
    pop_form = get_population_form()
    for instance_metadata in instances_data:
        if instance_metadata["formId"] == str(pop_form.id):
            org_unit_id = instance_metadata["orgUnitId"]
            if is_uuid(org_unit_id):
                org_unit = OrgUnit.objects.get(uuid=org_unit_id)
            else:
                org_unit = OrgUnit.objects.get(pk=org_unit_id)

            newest_population_instance = (
                get_population_instances().filter(org_unit=org_unit).order_by("-source_created_at").first()
            )
            new_pop = int(newest_population_instance.json["population"])
            org_unit.set_extra_fields({"population": new_pop})
            logger.info(f"\tSet population on {org_unit.name} ({org_unit.id}) to {new_pop}")


def is_uuid(string):
    try:
        uuid.UUID(string)
    except ValueError:
        return False
    return True


def result_message(user, project, start_date, start_time, stats):
    if user:
        msg = f"Mobile bulk import successful for user {user.username} and project {project.name}."
    else:
        msg = f"Mobile bulk import successful for project {project.name}."

    msg += f"""
Started: {start_date!s}, time spent: {time.time() - start_time} sec

Number of imported org units: {stats["new_org_units"]}
Number of imported form submissions: {stats["new_instances"]}
Number of imported submission attachments: {stats["new_instance_files"]}
Number of imported org unit change requests: {stats["new_change_requests"]}
"""

    return msg
