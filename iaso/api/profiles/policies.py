from rest_framework.exceptions import PermissionDenied

from iaso.models import OrgUnit
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.permissions.utils import raise_error_if_user_lacks_admin_permission


class OrgUnitPolicy:
    @staticmethod
    def validate_create(user, org_units):
        if not org_units:
            return

        if user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        if user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            managed_org_units = set(OrgUnit.objects.hierarchy(org_units).values_list("id", flat=True).distinct())

            for org_unit_id in [ou.id for ou in org_units]:
                if org_unit_id not in list(managed_org_units) and not user.is_superuser:
                    raise PermissionDenied(
                        f"User with {CORE_USERS_MANAGED_PERMISSION} cannot assign an OrgUnit outside of their own health "
                        f"pyramid. Trying to assign {org_unit_id}."
                    )

        return

    def validate_update(self, user, org_units):
        pass


class GroupFromUserRolesPolicy:
    @staticmethod
    def authorize(user, user_roles):
        for role in user_roles:
            group = role.group
            permissions = group.permissions.values_list("codename", flat=True)
            raise_error_if_user_lacks_admin_permission(user, permissions)


class ProjectsPolicy:
    @staticmethod
    def create(user, projects):
        if user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return

        user_project_ids = set(user.iaso_profile.projects_ids or [])

        # If actor has restricted scope, they must specify projects
        if user_project_ids and not projects:
            raise PermissionDenied("You must specify which projects are authorized for this user.")

        # If actor is unrestricted, allow anything
        if not user_project_ids:
            return

        project_ids = {p.id for p in projects}

        if not project_ids.issubset(user_project_ids):
            raise PermissionDenied("Some projects are outside your scope.")

    @staticmethod
    def update(user, projects):
        # todo
        pass


class UserPermissionsPolicy:
    @staticmethod
    def create(user, user_permissions):
        raise_error_if_user_lacks_admin_permission(user, [perm.codename for perm in user_permissions])
