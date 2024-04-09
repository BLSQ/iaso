"""
This task will process a .zip file containing a "bulk upload" from the mobile app.
Instead of uploading the new org units, instances and form submissions individually,
this .zip file contains all of these resources, hereby reducing the number of
API calls that need to be done by the mobile app.
"""

import json
import logging
import zipfile

from beanstalk_worker import task_decorator
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils.translation import gettext as _

from iaso.api.instances import import_data as import_instances
from iaso.api.mobile.org_units import import_data as import_org_units
from iaso.models import Project, Instance, InstanceFile
from iaso.utils.s3_client import download_file

INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"

logger = logging.getLogger(__name__)


@task_decorator(task_name="process_mobile_bulk_upload")
def process_mobile_bulk_upload(
    project_id,
    zip_file_object_name,
    task=None,
    user=None,
):
    print("user", user)
    the_task = task
    the_task.report_progress_and_stop_if_killed(
        progress_value=0,
        progress_message=_("Starting"),
        end_value=100,
    )
    # check if user is None?
    project = Project.objects.get(id=project_id)

    zip_file_path = download_file(zip_file_object_name)
    # continue here

    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
        if ORG_UNITS_JSON in zip_ref.namelist():
            with zip_ref.open(ORG_UNITS_JSON) as file:
                import_org_units(json.load(file), user, project.app_id)
        else:
            logger.info(f"The file {ORG_UNITS_JSON} does not exist in the zip file.")

        with zip_ref.open(INSTANCES_JSON) as file:
            import_instances(json.load(file), user, project.app_id)

        for file in zipfile.Path(zip_ref).iterdir():
            if file.is_dir():
                for instance_file in file.iterdir():
                    extracted_file = default_storage.save(
                        f"{file.name}/{instance_file.name}",
                        ContentFile(file.read()),
                    )
                    if instance_file.name.endswith(".xml"):
                        i = Instance.objects.get(uuid=file.name)
                        i.created_by = user
                        i.last_modified_by = user
                        i.file = extracted_file
                        i.save()
                        i.get_and_save_json_of_xml()
                        try:
                            i.convert_location_from_field()
                            i.convert_device()
                            i.convert_correlation()
                        except ValueError as error:
                            print(error)
                    else:
                        fi = InstanceFile()
                        fi.file = extracted_file
                        fi.instance_id = file.name
                        fi.name = instance_file.name
                        fi.save()
