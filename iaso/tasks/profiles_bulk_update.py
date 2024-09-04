from time import time
from typing import Optional, List

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import QuerySet
from hat.audit.audit_logger import AuditLogger
from iaso.api.microplanning import AuditTeamSerializer
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.models.microplanning import Team, TeamType
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.models import Task, Profile, Project, UserRole, OrgUnit
from iaso.api.profiles.profiles import get_filtered_profiles
from hat.menupermissions import models as permission
from hat.menupermissions.models import CustomPermissionSupport


class TeamAuditLogger(AuditLogger):
    serializer = AuditTeamSerializer
    default_source = f"{audit_models.PROFILE_API_BULK}_update"


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
    # original_copy = deepcopy(profile)
    audit_logger = ProfileAuditLogger()
    old_data = audit_logger.serialize_instance(profile)
    account_id = user.iaso_profile.account.id
    roles_to_be_added = []
    roles_to_be_removed = []
    projects_to_be_added = []
    projects_to_be_removed = []
    org_units_to_be_added = []
    org_units_to_be_removed = []
    # Raise if necessary and prepare values to be updated
    if teams_id_added is not None:
        if not user.has_perm(permission.TEAMS):
            raise PermissionDenied(f"User without the permission {permission.TEAMS} cannot add users to team")
    if teams_id_removed is not None:
        if not user.has_perm(permission.TEAMS):
            raise PermissionDenied(f"User without the permission {permission.TEAMS} cannot remove users to team")
    if roles_id_added is not None:
        for role_id in roles_id_added:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                if not user.has_perm(permission.USERS_ADMIN):
                    for p in role.group.permissions.all():
                        CustomPermissionSupport.assert_right_to_assign(user, p.codename)
                # role.iaso_profile.add(profile)
                roles_to_be_added.append(role)
    if roles_id_removed is not None:
        for role_id in roles_id_removed:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                if not user.has_perm(permission.USERS_ADMIN):
                    for p in role.group.permissions.all():
                        CustomPermissionSupport.assert_right_to_assign(user, p.codename)
                # role.iaso_profile.remove(profile)
                roles_to_be_removed.append(role)

    if projects_ids_added is not None:
        if not user.has_perm(permission.USERS_ADMIN):
            raise PermissionDenied(
                f"User with permission {permission.USERS_MANAGED} cannot changed project attributions"
            )
        for project_id in projects_ids_added:
            project = Project.objects.get(pk=project_id)
            if project.account and project.account.id == account_id:
                # project.iaso_profile.add(profile)
                projects_to_be_added.append(project)
    if projects_ids_removed is not None:
        if not user.has_perm(permission.USERS_ADMIN):
            raise PermissionDenied(
                f"User with permission {permission.USERS_MANAGED} cannot changed project attributions"
            )
        for project_id in projects_ids_removed:
            project = Project.objects.get(pk=project_id)
            if project.account and project.account.id == account_id:
                # project.iaso_profile.remove(profile)
                projects_to_be_removed.append(project)

    if location_ids_added is not None:
        for location_id in location_ids_added:
            if managed_org_units and len(managed_org_units) > 0 and location_id not in managed_org_units:
                raise PermissionDenied(
                    f"User with permission {permission.USERS_MANAGED} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.get(pk=location_id)
            # org_unit.iaso_profile.add(profile)
            org_units_to_be_added.append(org_unit)
    if location_ids_removed is not None:
        for location_id in location_ids_removed:
            if managed_org_units and len(managed_org_units) > 0 and location_id not in managed_org_units:
                raise PermissionDenied(
                    f"User with permission {permission.USERS_MANAGED} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.get(pk=location_id)
            # org_unit.iaso_profile.remove(profile)
            org_units_to_be_removed.append(org_unit)
    # Update
    if teams_id_added is not None:
        team_audit_logger = TeamAuditLogger()
        for team_id in teams_id_added:
            team = Team.objects.get(pk=team_id)
            old_team = team_audit_logger.serialize_instance(team)
            if (
                team.manager.iaso_profile.account
                and team.manager.iaso_profile.account.id == account_id
                and team.type == TeamType.TEAM_OF_USERS
            ):
                team.users.add(profile.user)
                team_audit_logger.log_modification(instance=team, old_data_dump=old_team, request_user=user)
    if teams_id_removed is not None:
        team_audit_logger = TeamAuditLogger()
        for team_id in teams_id_removed:
            team = Team.objects.get(pk=team_id)
            old_team = team_audit_logger.serialize_instance(team)
            if (
                team.manager.iaso_profile.account
                and team.manager.iaso_profile.account.id == account_id
                and team.type == TeamType.TEAM_OF_USERS
            ):
                team.users.remove(profile.user)
                team_audit_logger.log_modification(instance=team, old_data_dump=old_team, request_user=user)
    if language is not None:
        profile.language = language
    if len(roles_to_be_added) > 0:
        for role in roles_to_be_added:
            role.iaso_profile.add(profile)
    if len(roles_to_be_removed) > 0:
        for role in roles_to_be_removed:
            role.iaso_profile.remove(profile)
    if len(projects_to_be_added) > 0:
        for project in projects_to_be_added:
            project.iaso_profile.add(profile)
    if len(projects_to_be_removed) > 0:
        for project in projects_to_be_removed:
            project.iaso_profile.remove(profile)
    if len(org_units_to_be_added) > 0:
        for org_unit in org_units_to_be_added:
            org_unit.iaso_profile.add(profile)
    if len(org_units_to_be_removed) > 0:
        for org_unit in org_units_to_be_removed:
            org_unit.iaso_profile.remove(profile)

    profile.save()

    audit_logger.log_modification(
        instance=profile, old_data_dump=old_data, source=f"{audit_models.PROFILE_API_BULK}_update", request_user=user
    )


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
