from typing import Optional

from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from iaso.models import OrgUnit, Profile
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION


class HasProfilePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        pk = view.kwargs.get("pk")
        if pk:
            pk = int(pk)

        iaso_profile_id: Optional[int] = getattr(getattr(request.user, "iaso_profile", None), "id", None)

        if view.action in ["retrieve_current", "partial_update_current", "update_current"]:
            return True

        if view.action in ["retrieve", "partial_update", "update"] and pk == iaso_profile_id:
            return True

        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return True

        if request.user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            return self.has_permission_over_user(request, pk, view.action, iaso_profile_id)

        return view.action == "dropdown"

    # We could `return False` instead of raising exceptions,
    # but it's better to be explicit about why the permission was denied.
    @staticmethod
    def has_permission_over_user(request, pk, view_action, request_user_profile_id):
        if view_action in ["retrieve", "list", "export_csv", "export_xlsx"]:
            return True

        if not pk:
            new_user_org_units = request.data.get("org_units", [])
            if len(new_user_org_units) == 0:
                raise PermissionDenied(
                    f"User with '{CORE_USERS_MANAGED_PERMISSION}' can not create a new user without a location."
                )

        if pk == request_user_profile_id:
            raise PermissionDenied(f"User with '{CORE_USERS_MANAGED_PERMISSION}' cannot edit their own permissions.")

        requester_org_units = OrgUnit.objects.hierarchy(request.user.iaso_profile.org_units.all()).values_list(
            "id", flat=True
        )

        if requester_org_units and pk and len(requester_org_units) > 0:
            profile = get_object_or_404(
                Profile.objects.filter(account=request.user.iaso_profile.account).prefetch_related("org_units"), pk=pk
            )
            user_managed_org_units = profile.org_units.filter(id__in=requester_org_units).only("id").all()
            if not user_managed_org_units or user_managed_org_units.count() == 0:
                raise PermissionDenied(
                    "The user we are trying to modify is not part of any OrgUnit managed by the current user"
                )
        return True
