from copy import deepcopy
from time import time
from typing import Optional, List

from django.db import transaction

from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.models import Task, Profile, Project
from iaso.api.profiles import get_filtered_profiles


def update_single_profile_from_bulk(
    user, profile, *, projects_ids_added, projects_ids_removed, role_id_added, role_id_removed, location_ids, language
):
    """Used within the context of a bulk operation"""
    original_copy = deepcopy(profile)
    if projects_ids_added is not None:
        for project_id in projects_ids_added:
            project = Project.objects.get(pk=project_id)
            project.iaso_profile.add(profile)

    if projects_ids_removed is not None:
        for project_id in projects_ids_removed:
            project = Project.objects.get(pk=project_id)
            project.iaso_profile.remove(profile)

    if language is not None:
        profile.language = language
    profile.save()

    audit_models.log_modification(original_copy, profile, source=audit_models.PROFILE_API_BULK, user=user)


@task_decorator(task_name="profiles_bulk_update")
def profiles_bulk_update(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    projects_ids_added: Optional[List[int]],
    projects_ids_removed: Optional[List[int]],
    role_id_added: Optional[int],
    role_id_removed: Optional[int],
    location_ids: Optional[List[int]],
    language: Optional[str],
    search: Optional[str],
    perms: Optional[List[str]],
    location: Optional[str],
    org_unit_type: Optional[str],
    parent_ou: Optional[str],
    children_ou: Optional[str],
    projects: Optional[List[str]],
    task: Task,
):
    """Background Task to bulk update profiles."""
    start = time()
    task.report_progress_and_stop_if_killed(progress_message="Searching for Profiles to modify")

    # Restrict qs to profiles accessible to the user
    user = task.launcher

    queryset = Profile.objects.filter(account=user.iaso_profile.account)

    if not select_all:
        queryset = queryset.filter(pk__in=selected_ids)
    else:
        queryset = queryset.exclude(pk__in=unselected_ids)
        base_queryset = queryset
        queryset = Profile.objects.none()  # type: ignore
        search_queryset = get_filtered_profiles(
            base_queryset, search, perms, location, org_unit_type, parent_ou, children_ou, projects
        )
        queryset = queryset.union(search_queryset)

    if not queryset:
        raise Exception("No matching profile found")

    total = queryset.count()

    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        for index, profile in enumerate(queryset.iterator()):
            res_string = "%.2f sec, processed %i profiles" % (time() - start, index)
            task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
            update_single_profile_from_bulk(
                user,
                profile,
                projects_ids_added=projects_ids_added,
                projects_ids_removed=projects_ids_removed,
                role_id_added=role_id_added,
                role_id_removed=role_id_removed,
                location_ids=location_ids,
                language=language,
            )

        task.report_success(message="%d modified" % total)
