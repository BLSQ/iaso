from collections import OrderedDict
from operator import itemgetter

from django.contrib.auth.models import Permission
from django.utils.translation import gettext as _
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.permissions.base import ALL_PERMISSIONS
from iaso.permissions.core_permissions import (
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
    PERMISSION_GROUPS_DISPLAY_ORDER,
)
from iaso.permissions.utils import fetch_django_permissions_from_iaso_permissions


class PermissionsViewSet(viewsets.ViewSet):
    f"""Permissions API

    This API is restricted to authenticated users. Note that only users with the "{CORE_USERS_ADMIN_PERMISSION}" or
    "{CORE_USERS_MANAGED_PERMISSION}" permission will be able to list all permissions - other users can only list their permissions.

    GET /api/permissions/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        perms = self.queryset(request)

        result = []
        for permission in perms:
            result.append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return Response({"permissions": sorted(result, key=itemgetter("name"))})

    @action(methods=["GET"], detail=False)
    def grouped_permissions(self, request):
        """
        Groups permissions by their group and category.
        The result is an ordered dict where the keys are the group names and the values are lists of permissions.
        Each permission is represented as a dict with the following keys:
        - id: the id of the permission (from django's auth_permission table)
        - name: the translated name of the permission
        - codename: the general codename of the permission
        - read_edit (optional): a dict with the read/edit/admin/... permissions if the permission is part of a category
        """
        permissions_queryset = self.queryset(request)

        grouped_permissions = {}
        categories_dict = {}
        for django_perm in permissions_queryset:
            perm_codename = django_perm.codename
            iaso_perm = ALL_PERMISSIONS[perm_codename]

            group = iaso_perm.group
            if not group:
                continue  # Some permissions are filtered out and can't be exposed to the frontend
            if group not in grouped_permissions:
                grouped_permissions[group] = []

            category = iaso_perm.category
            if not category:  # This is a simple permission
                current_group = grouped_permissions[group]
                current_group.append(
                    {
                        "id": django_perm.id,
                        "name": iaso_perm.label,
                        "codename": iaso_perm.name,
                    }
                )
                continue

            if category not in categories_dict:  # This is the first time we see this category
                categories_dict[category] = {
                    "id": django_perm.id,  # We don't really care about which ID we put here, but it has to be provided
                    "name": category,
                    "codename": category,
                    "read_edit": {iaso_perm.type_in_category: iaso_perm.name},
                    "group": group,
                }
                continue

            # This category already exists, we need to add this permission to it
            categories_dict[category]["read_edit"][iaso_perm.type_in_category] = iaso_perm.name

        # Now that all permissions have been processed, we add back all the categories to their groups
        for category, perm in categories_dict.items():
            group = perm.pop("group")
            group_list = grouped_permissions[group]
            group_list.append(perm)
            group_list.sort(key=lambda x: x["id"])

        # Now we sort the result based on a specific order
        ordered_grouped_permissions = OrderedDict()
        for group in PERMISSION_GROUPS_DISPLAY_ORDER:
            if group in grouped_permissions:
                ordered_grouped_permissions[group] = grouped_permissions[group]

        return Response({"permissions": ordered_grouped_permissions})

    def queryset(self, request):
        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) or request.user.has_perm(
            CORE_USERS_MANAGED_PERMISSION.full_name()
        ):
            perms = Permission.objects
        else:
            perms = request.user.user_permissions

        # Checking which modules are active in the user's account & fetching their permissions
        account = request.user.iaso_profile.account
        modules_permissions = account.permissions_from_active_modules
        queryset = fetch_django_permissions_from_iaso_permissions(perms, modules_permissions)
        return queryset
