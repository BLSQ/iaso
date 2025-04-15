from logging import getLogger
from time import time
from typing import List, Optional

from django.contrib.auth.models import User
from django.db import transaction

from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.api.tasks.utils.link_unlink_allowed_actions import is_allowed_action
from iaso.models import Instance, Task
from iaso.models.org_unit import OrgUnitReferenceInstance
from iaso.utils.models.common import check_instance_reference_bulk_link


logger = getLogger(__name__)


def link_single_reference_instance_to_org_unit(user: Optional[User], instance: Instance):
    org_unit = instance.org_unit
    form = instance.form
    if not org_unit.reference_instances.filter(form=form).exists():
        OrgUnitReferenceInstance.objects.create(instance=instance, org_unit=org_unit, form=form)
    logger.info(f"updating {org_unit.name} {org_unit.id} by linking it to the instance  {instance.id}")
    audit_models.log_modification(org_unit, org_unit, source=audit_models.INSTANCE_API_BULK, user=user)

def unlink_single_reference_instance_from_org_unit(user: Optional[User], instance: Instance):
    org_unit = instance.org_unit
    org_unit.reference_instances.remove(instance)
    org_unit.save()
    logger.info(f"updating {org_unit.name} {org_unit.id} by unlink it from the instance {instance.id}")
    audit_models.log_modification(org_unit, org_unit, source=audit_models.INSTANCE_API_BULK, user=user)

@task_decorator(task_name="instance_reference_bulk_link")
def instance_reference_bulk_link(
    actions: List[str],
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    task: Task,
):
    """
    Background task to bulk link or unlink instance reference to/from org units.
    """
    start = time()
    task.report_progress_and_stop_if_killed(progress_message="Searching for Instances for link or unlink to/from Org unit")
    
    user = task.launcher

    queryset = Instance.non_deleted_objects.get_queryset().filter_for_user(user)
    queryset = queryset.select_related("org_unit")

    if not select_all:
        queryset = queryset.filter(pk__in=selected_ids)
    else:
        queryset = queryset.exclude(pk__in=unselected_ids)

    if not queryset:
        raise Exception("No matching instances found")
    
    # Checking if any reference submission link or unlink can be performed with what was requested
    success, infos, errors, _ = check_instance_reference_bulk_link(queryset)
    if not success:
        raise Exception("Cannot proceed with the bulk reference submission link or unlink due to errors: %s" % errors)

    total = queryset.count()
    with transaction.atomic():
        if is_allowed_action("link"):
            instances_to_link = queryset.filter(id__in=infos["not_linked"])
            for index, instance in enumerate(instances_to_link):
                res_string = "%.2f sec, processed %i instances" % (time() - start, index)
                task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
                link_single_reference_instance_to_org_unit(
                        user,
                        instance,
                    )
        if is_allowed_action("unlink"):
            instances_to_unlink = queryset.filter(id__in=infos["linked"])
            for index, instance in enumerate(instances_to_unlink):
                res_string = "%.2f sec, processed %i instances" % (time() - start, index)
                task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
                unlink_single_reference_instance_from_org_unit(user, instance)

        task.report_success(message="%d modified" % total)
