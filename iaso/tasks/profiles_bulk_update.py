from time import time
from typing import List, Optional

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from hat.audit.audit_logger import AuditLogger
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.api.teams.serializers import AuditTeamSerializer
from iaso.models import OrgUnit, Profile, Project, Task, UserRole
from iaso.models.team import Team, TeamType
from iaso.permissions.core_permissions import (
    CORE_TEAMS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.permissions.utils import raise_error_if_user_lacks_admin_permission
from iaso.utils import search_by_ids_refs


def get_filtered_profiles(
    queryset: QuerySet[Profile],
    user: Optional[User],
    search: Optional[str] = None,
    perms: Optional[List[str]] = None,
    location: Optional[str] = None,
    org_unit_type: Optional[str] = None,
    parent_ou: Optional[bool] = False,
    children_ou: Optional[bool] = False,
    projects: Optional[List[int]] = None,
    user_roles: Optional[List[int]] = None,
    teams: Optional[List[int]] = None,
    managed_users_only: Optional[bool] = False,
    ids: Optional[str] = None,
) -> QuerySet[Profile]:
    if search:
        if search.startswith("ids:"):
            queryset = queryset.filter(id__in=search_by_ids_refs.parse_ids("ids:", search))
        elif search.startswith("refs:"):
            queryset = queryset.filter(dhis2_id__in=search_by_ids_refs.parse_ids("refs:", search))
        else:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__tenant_user__main_user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            ).distinct()

    if perms:
        queryset = queryset.filter(user__user_permissions__codename__in=perms).distinct()

    if location and not (parent_ou or children_ou):
        queryset = queryset.filter(
            user__iaso_profile__org_units__pk=location,
        ).distinct()

    parent: Optional[OrgUnit] = None
    if (parent_ou and location) or (children_ou and location):
        ou = get_object_or_404(OrgUnit, pk=location)
        if parent_ou and ou.parent is not None:
            parent = ou.parent

        org_unit_filter = Q(user__iaso_profile__org_units__pk=location)

        if parent_ou and not children_ou:
            if parent:
                org_unit_filter |= Q(user__iaso_profile__org_units__pk=parent.pk)
            queryset = queryset.filter(org_unit_filter).distinct()

        elif children_ou and not parent_ou:
            descendant_ous = OrgUnit.objects.hierarchy(ou)
            org_unit_filter |= Q(user__iaso_profile__org_units__in=descendant_ous)
            queryset = queryset.filter(org_unit_filter).distinct()

        elif parent_ou and children_ou:
            descendant_ous = OrgUnit.objects.hierarchy(ou)
            org_unit_filter |= Q(user__iaso_profile__org_units__in=descendant_ous)
            if parent:
                org_unit_filter |= Q(user__iaso_profile__org_units__pk=parent.pk)
            queryset = queryset.filter(org_unit_filter).distinct()

    if org_unit_type:
        if org_unit_type == "unassigned":
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=None).distinct()
        else:
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=org_unit_type).distinct()

    if projects:
        queryset = queryset.filter(user__iaso_profile__projects__pk__in=projects).distinct()

    if user_roles:
        queryset = queryset.filter(user__iaso_profile__user_roles__pk__in=user_roles).distinct()

    if teams:
        queryset = queryset.filter(user__teams__id__in=teams).distinct()

    if ids:
        queryset = queryset.filter(user__id__in=ids.split(","))
    if managed_users_only:
        if not user:
            raise Exception("User cannot be 'None' when filtering on managed users only")
        if user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            queryset = queryset  # no filter needed
        elif user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            managed_org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all()).values_list(
                "id", flat=True
            )
            if managed_org_units and len(managed_org_units) > 0:
                queryset = queryset.filter(user__iaso_profile__org_units__id__in=managed_org_units)
            queryset = queryset.exclude(user=user)
        else:
            queryset = Profile.objects.none()
    return queryset


class TeamAuditLogger(AuditLogger):
    serializer = AuditTeamSerializer
    default_source = f"{audit_models.PROFILE_API_BULK}_update"


def update_single_profile_from_bulk(
    user: User,
    managed_org_units: Optional[List[int]],
    profile: Profile,
    *,
    projects_ids_added: List[int],
    projects_ids_removed: List[int],
    roles_id_added: List[int],
    roles_id_removed: List[int],
    teams_id_added: List[int],
    teams_id_removed: List[int],
    location_ids_added: List[int],
    location_ids_removed: List[int],
    language: Optional[str],
    organization: Optional[str],
):
    """Used within the context of a bulk operation"""
    audit_logger = ProfileAuditLogger()
    old_data = audit_logger.serialize_instance(profile)
    account_id = user.iaso_profile.account.id
    roles_to_be_added = []
    roles_to_be_removed = []
    projects_to_be_added = []
    projects_to_be_removed = []
    org_units_to_be_added = []
    org_units_to_be_removed = []

    user_has_project_restrictions = hasattr(user, "iaso_profile") and bool(user.iaso_profile.projects_ids)
    user_has_perm_users_admin = user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name())

    if teams_id_added and not user.has_perm(CORE_TEAMS_PERMISSION.full_name()):
        raise PermissionDenied(f"User without the permission {CORE_TEAMS_PERMISSION} cannot add users to team")

    if teams_id_removed and not user.has_perm(CORE_TEAMS_PERMISSION.full_name()):
        raise PermissionDenied(f"User without the permission {CORE_TEAMS_PERMISSION} cannot remove users to team")

    if roles_id_added:
        for role_id in roles_id_added:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                role_permission_names = role.group.permissions.values_list("codename", flat=True)
                raise_error_if_user_lacks_admin_permission(user, role_permission_names)
                roles_to_be_added.append(role)

    if roles_id_removed:
        for role_id in roles_id_removed:
            role = get_object_or_404(UserRole, id=role_id, account_id=account_id)
            if role.account.id == account_id:
                roles_to_be_removed.append(role)

    if projects_ids_added:
        if not user_has_perm_users_admin:
            raise PermissionDenied(
                f"User with permission {CORE_USERS_ADMIN_PERMISSION} cannot changed project attributions"
            )
        projects_to_be_added = Project.objects.filter(pk__in=projects_ids_added, account_id=account_id)

    if projects_ids_removed:
        if not user_has_perm_users_admin:
            raise PermissionDenied(
                f"User with permission {CORE_USERS_ADMIN_PERMISSION} cannot changed project attributions"
            )
        projects_to_be_removed = Project.objects.filter(pk__in=projects_ids_removed, account_id=account_id)

    if location_ids_added:
        for location_id in location_ids_added:
            if managed_org_units and (not user_has_perm_users_admin) and (location_id not in managed_org_units):
                raise PermissionDenied(
                    f"User with permission {CORE_USERS_ADMIN_PERMISSION} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.select_related("org_unit_type").get(pk=location_id)
            org_units_to_be_added.append(org_unit)

    if location_ids_removed:
        for location_id in location_ids_removed:
            if managed_org_units and (not user_has_perm_users_admin) and (location_id not in managed_org_units):
                raise PermissionDenied(
                    f"User with permission {CORE_USERS_ADMIN_PERMISSION} cannot change OrgUnits outside of their own "
                    f"health pyramid"
                )
            org_unit = OrgUnit.objects.select_related("org_unit_type").get(pk=location_id)
            org_units_to_be_removed.append(org_unit)

    # Update
    if teams_id_added:
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

    if teams_id_removed:
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

    if language:
        profile.language = language

    if organization:
        profile.organization = organization

    if len(roles_to_be_added) > 0:
        profile.user_roles.add(*roles_to_be_added)
    if len(roles_to_be_removed) > 0:
        profile.user_roles.remove(*roles_to_be_removed)
    if len(projects_to_be_added) > 0:
        profile.projects.add(*projects_to_be_added)
    if len(projects_to_be_removed) > 0:
        profile.projects.remove(*projects_to_be_removed)
    if len(org_units_to_be_added) > 0:
        profile.org_units.add(*org_units_to_be_added)
    if len(org_units_to_be_removed) > 0:
        profile.org_units.remove(*org_units_to_be_removed)

    profile.save()

    audit_logger.log_modification(
        instance=profile, old_data_dump=old_data, source=f"{audit_models.PROFILE_API_BULK}_update", request_user=user
    )


@task_decorator(task_name="profiles_bulk_update")
def profiles_bulk_update(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    projects_ids_added: List[int],
    projects_ids_removed: List[int],
    roles_id_added: List[int],
    roles_id_removed: List[int],
    teams_id_added: List[int],
    teams_id_removed: List[int],
    location_ids_added: List[int],
    location_ids_removed: List[int],
    language: Optional[str],
    organization: Optional[str],
    search: Optional[str],
    perms: Optional[List[str]],
    location: Optional[str],
    org_unit_type: Optional[str],
    parent_ou: Optional[bool],
    children_ou: Optional[bool],
    projects: Optional[List[int]],
    user_roles: Optional[List[int]],
    teams: Optional[List[int]],
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
            teams=teams,
            managed_users_only=True,
        )

    if not queryset:
        raise Exception("No matching profile found")
    total = queryset.count()

    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        managed_org_units = None
        if user and not user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
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
                organization=organization,
            )

        task.report_success(message="%d modified" % total)
