from copy import deepcopy
from time import time
from typing import Optional, List

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import QuerySet
from iaso.models.microplanning import Team, TeamType
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.models import Task, Profile, Project, UserRole, OrgUnit
from iaso.api.profiles import get_filtered_profiles
from hat.menupermissions import models as permission
from hat.menupermissions.models import CustomPermissionSupport


def update_single_profile_from_bulk(
    user: User,
    managed_org_units: Optional[List[int]],
    profile: Profile,
    *,
    projects_ids_added: Optional[List[int]],
    projects_ids_removed: Optional[List[int]],
    roles_id_added: Optional[List[int]],
    roles_id_removed: Optional[List[int]],
    teams_id_added: Optional[List[int]],
    teams_id_removed: Optional[List[int]],
    location_ids_added: Optional[List[int]],
    location_ids_removed: Optional[List[int]],
    language: Optional[str],
):
    """Used within the context of a bulk operation"""
    original_copy = deepcopy(profile)
    account_id = user.iaso_profile.account.id
    if roles_id_added is not None:
        for role_id in roles_id_added:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                if not user.has_perm(permission.USERS_ADMIN):
                    for p in role.group.permissions.all():
                        CustomPermissionSupport.assert_right_to_assign(user, p.codename)
                role.iaso_profile.add(profile)
    if roles_id_removed is not None:
        for role_id in roles_id_removed:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                role.iaso_profile.remove(profile)

    if projects_ids_added is not None:
        if not user.has_perm(permission.USERS_ADMIN):
            raise PermissionDenied(
                f"User with permission {permission.USERS_MANAGED} cannot changed project attributions"
            )
        for project_id in projects_ids_added:
            project = Project.objects.get(pk=project_id)
            if project.account and project.account.id == account_id:
                project.iaso_profile.add(profile)
    if projects_ids_removed is not None:
        if not user.has_perm(permission.USERS_ADMIN):
            raise PermissionDenied(
                f"User with permission {permission.USERS_MANAGED} cannot changed project attributions"
            )
        for project_id in projects_ids_removed:
            project = Project.objects.get(pk=project_id)
            if project.account and project.account.id == account_id:
                project.iaso_profile.remove(profile)

    if teams_id_added is not None:
        if not user.has_perm(permission.TEAMS):
            raise PermissionDenied(f"User without the permission {permission.TEAMS} cannot add users to team")
        for team_id in teams_id_added:
            team = Team.objects.get(pk=team_id)
            if (
                team.manager.iaso_profile.account
                and team.manager.iaso_profile.account.id == account_id
                and team.type == TeamType.TEAM_OF_USERS
            ):
                team.users.add(profile.user)
    if teams_id_removed is not None:
        if not user.has_perm(permission.TEAMS):
            raise PermissionDenied(f"User without the permission {permission.TEAMS} cannot remove users to team")
        for team_id in teams_id_removed:
            team = Team.objects.get(pk=team_id)
            if (
                team.manager.iaso_profile.account
                and team.manager.iaso_profile.account.id == account_id
                and team.type == TeamType.TEAM_OF_USERS
            ):
                team.users.remove(profile.user)

    if language is not None:
        profile.language = language

    if location_ids_added is not None:
        for location_id in location_ids_added:
            if managed_org_units and len(managed_org_units) > 0 and location_id not in managed_org_units:
                raise PermissionDenied(
                    f"User with permission {permission.USERS_MANAGED} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.get(pk=location_id)
            org_unit.iaso_profile.add(profile)
    if location_ids_removed is not None:
        for location_id in location_ids_removed:
            if managed_org_units and len(managed_org_units) > 0 and location_id not in managed_org_units:
                raise PermissionDenied(
                    f"User with permission {permission.USERS_MANAGED} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.get(pk=location_id)
            org_unit.iaso_profile.remove(profile)

    profile.save()

    audit_models.log_modification(original_copy, profile, source=audit_models.PROFILE_API_BULK, user=user)


@task_decorator(task_name="profiles_bulk_update")
def profiles_bulk_update(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    projects_ids_added: Optional[List[int]],
    projects_ids_removed: Optional[List[int]],
    roles_id_added: Optional[List[int]],
    roles_id_removed: Optional[List[int]],
    teams_id_added: Optional[List[int]],
    teams_id_removed: Optional[List[int]],
    location_ids_added: Optional[List[int]],
    location_ids_removed: Optional[List[int]],
    language: Optional[str],
    search: Optional[str],
    perms: Optional[List[str]],
    location: Optional[str],
    org_unit_type: Optional[str],
    parent_ou: Optional[bool],
    children_ou: Optional[bool],
    projects: Optional[List[int]],
    user_roles: Optional[List[int]],
    task: Task,
):
    """Background Task to bulk update profiles."""
    start = time()
    task.report_progress_and_stop_if_killed(progress_message="Searching for Profiles to modify")

    # Restrict qs to profiles accessible to the user
    user = task.launcher
    if not user:
        raise Exception("Task must have a launcher.")

    queryset: QuerySet[Profile] = Profile.objects.filter(account=user.iaso_profile.account)  # type: ignore

    if not select_all:
        queryset = get_filtered_profiles(
            queryset=queryset.filter(pk__in=selected_ids),
            user=user,
            managed_users_only=True,
        )
    else:
        queryset = get_filtered_profiles(
            queryset=queryset.exclude(pk__in=unselected_ids),
            user=user,
            search=search,
            perms=perms,
            location=location,
            org_unit_type=org_unit_type,
            parent_ou=parent_ou,
            children_ou=children_ou,
            projects=projects,
            user_roles=user_roles,
            managed_users_only=True,
        )

    if not queryset:
        raise Exception("No matching profile found")

    total = queryset.count()

    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        managed_org_units = None
        if user and not user.has_perm(permission.USERS_ADMIN):
            managed_org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all()).values_list(
                "id", flat=True
            )
        for index, profile in enumerate(queryset.iterator()):
            res_string = "%.2f sec, processed %i profiles" % (time() - start, index)
            task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
            update_single_profile_from_bulk(
                user=user,
                managed_org_units=managed_org_units,
                profile=profile,
                projects_ids_added=projects_ids_added,
                projects_ids_removed=projects_ids_removed,
                roles_id_added=roles_id_added,
                roles_id_removed=roles_id_removed,
                teams_id_added=teams_id_added,
                teams_id_removed=teams_id_removed,
                location_ids_added=location_ids_added,
                location_ids_removed=location_ids_removed,
                language=language,
            )

        task.report_success(message="%d modified" % total)
