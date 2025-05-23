from copy import deepcopy
from logging import getLogger
from time import time
from typing import List, Optional

from django.contrib.auth.models import User
from django.db import transaction
from django.http import QueryDict

from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.api.instances.instance_filters import parse_instance_filters
from iaso.models import Instance, Task
from iaso.utils.gis import convert_2d_point_to_3d
from iaso.utils.models.common import check_instance_bulk_gps_push


logger = getLogger(__name__)


def push_single_instance_gps_to_org_unit(user: Optional[User], instance: Instance):
    org_unit = instance.org_unit
    original_copy = deepcopy(org_unit)
    org_unit.location = convert_2d_point_to_3d(instance.location) if instance.location else None
    org_unit.save()
    if not original_copy.location:
        logger.info(f"updating {org_unit.name} {org_unit.id} with {org_unit.location}")
    else:
        logger.info(
            f"updating {org_unit.name} {org_unit.id} - overwriting {original_copy.location} with {org_unit.location}"
        )
    audit_models.log_modification(original_copy, org_unit, source=audit_models.INSTANCE_API_BULK, user=user)


@task_decorator(task_name="instance_bulk_gps_push")
def instance_bulk_gps_push(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    filters: dict,
    task: Task,
):
    """
    Background task to bulk push instance gps to org units.
    """
    start = time()
    task.report_progress_and_stop_if_killed(progress_message="Searching for Instances for pushing gps data")

    user = task.launcher

    # The QueryDict had to be serialized to be passed to this task, so let's rebuild it
    query_dict = QueryDict("", mutable=True)
    query_dict.update(filters)
    parsed_filters = parse_instance_filters(query_dict)

    # Doing the same operations as in InstancesViewSet.list() because results should be identical
    queryset = Instance.objects.get_queryset().filter_for_user(user).filter_on_user_projects(user=user)
    queryset = queryset.exclude(file="").exclude(device__test_device=True)
    queryset = queryset.select_related("org_unit")
    queryset = queryset.for_filters(**parsed_filters)

    if not select_all:
        queryset = queryset.filter(pk__in=selected_ids)
    else:
        queryset = queryset.exclude(pk__in=unselected_ids)

    if not queryset:
        raise Exception("No matching instances found")

    # Checking if any gps push can be performed with what was requested
    success, errors, _ = check_instance_bulk_gps_push(queryset)
    if not success:
        raise Exception("Cannot proceed with the gps push due to errors: %s" % errors)

    total = queryset.count()

    with transaction.atomic():
        for index, instance in enumerate(queryset.iterator()):
            res_string = "%.2f sec, processed %i instances" % (time() - start, index)
            task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
            push_single_instance_gps_to_org_unit(
                user,
                instance,
            )

        task.report_success(message="%d modified" % total)
