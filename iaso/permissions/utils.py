from types import ModuleType

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet
from rest_framework.exceptions import PermissionDenied


def load_permissions_from_module(
    module: ModuleType, permissions_dict: dict[str, "IasoPermission"], permission_classes: list
):
    """
    Load all permissions from a permission module.
    """
    # Taking all permission classes defined in the module and adding them to the global permission classes list
    module_permission_models = module.permission_models
    permission_classes.extend(module_permission_models)

    # Taking all permissions defined in the module and adding them to the global permissions dict
    module_permissions = module.permissions
    for perm_name, perm in module_permissions.items():
        if perm_name in permissions_dict:
            raise ValueError(f"Duplicate permission name: {perm_name}")
        permissions_dict[perm_name] = perm


def fetch_django_permissions_from_iaso_permissions(queryset: QuerySet, iaso_permissions: list["IasoPermission"]):
    """
    Fetch Django permissions from a list of IasoPermission objects.
    """
    from iaso.permissions.base import PERMISSION_CLASSES  # Imported here to avoid circular import

    perm_names = [perm.name for perm in iaso_permissions]

    content_types = []
    for model in PERMISSION_CLASSES:
        content_type = ContentType.objects.get_for_model(model)
        content_types.append(content_type)

    permissions = (
        queryset.filter(content_type__in=content_types)
        .filter(codename__startswith="iaso_")
        .filter(codename__in=perm_names)
        .order_by("id")
    )

    return permissions


def raise_error_if_user_lacks_admin_permission(user: User, requested_permission_names: list[str]):
    """
    Raises a PermissionDefined error if CORE_USERS_ADMIN_PERMISSION is in the requested permission list,
    but the user doesn't have it.
    This function is to be used in API calls to make sure that any user creation/update can be done
    by someone who has the permission to do that.
    """
    from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION  # Imported here to avoid circular import

    if CORE_USERS_ADMIN_PERMISSION.name in requested_permission_names:
        if not user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            raise PermissionDenied(
                f"Only users with {CORE_USERS_ADMIN_PERMISSION.name} permission can grant {CORE_USERS_ADMIN_PERMISSION.name} permission"
            )


def get_permissions_of_group(group_name: str) -> list["IasoPermission"]:
    """
    Returns all IasoPermission objects that belong to a given group.
    """
    from iaso.permissions.base import ALL_PERMISSIONS  # Imported here to avoid circular import

    return [perm for perm in ALL_PERMISSIONS.values() if perm.group == group_name]
