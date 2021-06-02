from time import time
from typing import Optional, List

from django.db import transaction

from beanstalk_worker import task as task_decorator
from iaso.models.org_unit_search import build_org_units_queryset
from iaso.models import Task, OrgUnit, DataSource


@task_decorator(task_name="org_unit_bulk_update")
def org_units_bulk_update(
    app_id: Optional[int],
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    searches: List,
    org_unit_type_id: Optional[List[int]],
    groups_ids_added: Optional[List[int]],
    groups_ids_removed: Optional[List[int]],
    validation_status: Optional[str],
    task: Task,
):
    """Background Task to bulk update org units."""
    start = time()
    task.report_progress_and_stop_if_killed(progress_message="Searching for Org Units to modify")

    # Restrict qs to org units accessible to the user
    user = task.launcher
    queryset = OrgUnit.objects.filter_for_user_and_app_id(user, app_id)

    if not select_all:
        queryset = queryset.filter(pk__in=selected_ids)
    else:
        queryset = queryset.exclude(pk__in=unselected_ids)
        if searches:
            profile = user.iaso_profile
            base_queryset = queryset
            queryset = OrgUnit.objects.none()
            for search in searches:
                search_queryset = build_org_units_queryset(base_queryset, search, profile, is_export=False, forms=[])
                queryset = queryset.union(search_queryset)

    if not queryset:
        raise Exception("No matching org unit found")

    # Assure that none of the OrgUnit we are modifying is in a read only data source
    # ? Should not this be done in the save() or in a constraint?
    read_only_data_sources = DataSource.objects.filter(
        id__in=queryset.values_list("version__data_source", flat=True).distinct(), read_only=True
    )
    if read_only_data_sources.count() > 0:
        raise Exception("Modification on read only source are not allowed")

    total = queryset.count()

    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        for index, org_unit in enumerate(queryset.iterator()):
            res_string = "%.2f sec, processed %i org units" % (time() - start, index)
            task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
            OrgUnit.objects.update_single_unit_from_bulk(
                user,
                org_unit,
                validation_status=validation_status,
                org_unit_type_id=org_unit_type_id,
                groups_ids_added=groups_ids_added,
                groups_ids_removed=groups_ids_removed,
            )

        task.report_success(message="%d modified" % total)
