from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from iaso.models import OrgUnit
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.permissions.utils import raise_error_if_user_lacks_admin_permission


class OrgUnitPolicy:
    @staticmethod
    def authorize_create(requester, org_units):
        if not org_units:
            return

        if requester.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        if requester.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            managed_org_units = set(OrgUnit.objects.hierarchy(org_units).values_list("id", flat=True).distinct())

            for org_unit_id in [ou.id for ou in org_units]:
                if org_unit_id not in list(managed_org_units) and not requester.is_superuser:
                    raise PermissionDenied(
                        f"User with {CORE_USERS_MANAGED_PERMISSION} cannot assign an OrgUnit outside of their own health "
                        f"pyramid. Trying to assign {org_unit_id}."
                    )

        return

    @staticmethod
    def authorize_update(requester, profile, new_org_unit_ids):
        # admins can do anything
        if requester.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        # Only managed users are restricted
        if not requester.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            return

        requester_org_units = requester.iaso_profile.org_units.all()

        # No restriction configured => allow
        if not requester_org_units.exists():
            return

        managed_org_unit_ids = set(OrgUnit.objects.hierarchy(requester_org_units).values_list("id", flat=True))

        profile_org_unit_ids = set(profile.org_units.values_list("id", flat=True))

        for org_unit_id in new_org_unit_ids:
            if org_unit_id not in managed_org_unit_ids and org_unit_id not in profile_org_unit_ids:
                raise PermissionDenied(
                    _(
                        "User with {perm} cannot assign an OrgUnit outside of their own health pyramid. Trying to assign {org_unit_id}."
                    ).format(perm=CORE_USERS_MANAGED_PERMISSION, org_unit_id=org_unit_id)
                )


class GroupFromUserRolesPolicy:
    @staticmethod
    def authorize(requester, user_roles):
        for role in user_roles:
            group = role.group
            permissions = group.permissions.values_list("codename", flat=True)
            raise_error_if_user_lacks_admin_permission(requester, permissions)


class ProjectsPolicy:
    @staticmethod
    def authorize_create(requester, projects):
        if requester.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        user_project_ids = set(requester.iaso_profile.projects_ids or [])

        # If user has restricted scope, they must specify projects
        if user_project_ids and not projects:
            raise PermissionDenied("You must specify which projects are authorized for this user.")

        # If user is unrestricted, allow anything
        if not user_project_ids:
            return

        project_ids = {p.id for p in projects}

        if not project_ids.issubset(user_project_ids):
            raise PermissionDenied("Some projects are outside your scope.")

    @staticmethod
    def authorize_update(requester, profile, new_project_ids):
        if requester.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        user_projects_ids = set(requester.iaso_profile.projects_ids or [])

        if not new_project_ids:
            if user_projects_ids:
                raise PermissionDenied(_("You must specify which projects are authorized for this user."))
            return  # No projects restrictions

        if not user_projects_ids:
            return  # unrestricted actor

        profile_restricted_projects_ids = set(profile.projects_ids or [])

        if profile_restricted_projects_ids > user_projects_ids:
            raise PermissionDenied(_("You cannot edit a user who has broader access to projects."))

        new_project_ids = {p.id for p in new_project_ids}

        if not new_project_ids.issubset(user_projects_ids):
            raise PermissionDenied(_("Some projects are outside your scope."))


class UserPermissionsPolicy:
    @staticmethod
    def authorize_create(requester, user_permissions):
        raise_error_if_user_lacks_admin_permission(requester, [perm.codename for perm in user_permissions])

    @staticmethod
    def authorize_update(requester, user_permissions):
        raise_error_if_user_lacks_admin_permission(requester, [perm.codename for perm in user_permissions])


class ManagedUsersPolicy:
    @staticmethod
    def authorize_list(requester, queryset):
        if requester.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return queryset

        if requester.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            managed_org_units = (
                OrgUnit.objects.hierarchy(requester.iaso_profile.org_units.all()).values_list("id", flat=True).distinct()
            )

            if managed_org_units:
                queryset = queryset.filter(user__iaso_profile__org_units__id__in=managed_org_units)
            return queryset.exclude(user=requester).distinct()

        return queryset.none()
