from rest_framework import permissions

from iaso.api.permission_checks import IsAuthenticatedWhenAuthenticationRequired
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
)


class HasCreateOrgUnitPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if not request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name()):
            return False

        return True


class HasOrgUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.version.data_source.public and request.method == "GET":
            return True

        required_perms = [
            request.user.has_perm(CORE_FORMS_PERMISSION.full_name()),
            request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name()),
            request.user.has_perm(CORE_ORG_UNITS_READ_PERMISSION.full_name()),
            request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name()),
            request.user.has_perm(CORE_REGISTRY_WRITE_PERMISSION.full_name()),
            request.user.has_perm(CORE_REGISTRY_READ_PERMISSION.full_name()),
        ]
        required_perms.extend(extra_org_unit_permissions(request.user))

        if not (request.user.is_authenticated and any(required_perms)):
            return False

        read_only = request.user.has_perm(CORE_ORG_UNITS_READ_PERMISSION.full_name()) and not request.user.has_perm(
            CORE_ORG_UNITS_PERMISSION.full_name()
        )
        if (read_only or obj.version.data_source.read_only) and request.method != "GET":
            return False

        # TODO: can be handled with get_queryset()
        user_account = request.user.iaso_profile.account
        projects = obj.version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class HasMobileOrgUnitPermission(IsAuthenticatedWhenAuthenticationRequired):
    def has_object_permission(self, request, view, obj):
        if not (
            request.user.is_authenticated
            and (
                request.user.has_perm(CORE_FORMS_PERMISSION.full_name())
                or request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name())
                or request.user.has_perm(CORE_ORG_UNITS_READ_PERMISSION.full_name())
                or request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name())
            )
        ):
            return False

        # TODO: can be handled with get_queryset()
        user_account = request.user.iaso_profile.account
        projects = obj.version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids
