"""Permissions list

These permissions are used and not the django built in one on each model.
They are used for API access but also to see which page a user has access
in the frontend.

To add a new permission:
1. Add a constant to hold its label
2. Add it to the CustomPermissionSupport.Meta.permissions tuple bellow
3. Generate a migration via makemigrations (and run the migration locally)
4. Add it in hat/assets/js/apps/Iaso/domains/users/permissionsMessages.ts
5. Add it to en.json and fr.json

If you don't follow these steps you will break the frontend!

The frontend is getting the list of existing permission from the
`/api/permissions/` endpoint
"""

from importlib import import_module

from django.conf import LazySettings
from django.contrib.contenttypes.models import ContentType
from django.db import models
from rest_framework.exceptions import PermissionDenied

import iaso.permissions as core_permissions


class CustomPermissionSupport(models.Model):
    """
    Model used to hold our custom permission.

    The standard way to create custom permissions in Django is to use
    the `Meta.permissions` attribute for a given model.
    https://docs.djangoproject.com/en/4.2/topics/auth/customizing/#custom-permissions

    Instead of adding permissions to each and every model, we use this single
    model with `managed = False` to regroup all permissions.
    https://docs.djangoproject.com/en/4.2/ref/models/options/#managed

    After adding a permission here, you need to generate a migration (`makemigrations`)
    and run it (`migrate`). Django will then detect the change in `Meta.permissions`
    and insert the new permission in the `auth_permission` model.

    You'll then be able to use the permission as any other Django permission.
    https://docs.djangoproject.com/en/4.2/topics/auth/default/#topic-authorization
    """

    @staticmethod
    def get_full_permission_list():
        return [couple[0] for couple in CustomPermissionSupport._meta.permissions]

    # Used in setup_account api
    DEFAULT_PERMISSIONS_FOR_NEW_ACCOUNT_USER = [
        core_permissions._FORMS,
        core_permissions._SUBMISSIONS,
        core_permissions._MAPPINGS,
        core_permissions._COMPLETENESS,
        core_permissions._ORG_UNITS,
        core_permissions._LINKS,
        core_permissions._USERS_ADMIN,
        core_permissions._PROJECTS,
        core_permissions._SOURCES,
        core_permissions._DATA_TASKS,
        core_permissions._REPORTS,
    ]

    class Meta:
        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = ()

    @staticmethod
    def filter_permissions(permissions, modules_permissions, settings: LazySettings):
        content_types = [ContentType.objects.get_for_model(CustomPermissionSupport)]
        core_permission_models = core_permissions.permission_models
        for model in core_permission_models:
            content_types.append(ContentType.objects.get_for_model(model))

        for plugin in settings.PLUGINS:
            try:
                plugin_permission_models = import_module(f"plugins.{plugin}.permissions").permission_models
                for model in plugin_permission_models:
                    content_types.append(ContentType.objects.get_for_model(model))
            except ImportError:
                print(f"{plugin} plugin has no permission support")

        permissions = (
            permissions.filter(content_type__in=content_types)
            .filter(codename__startswith="iaso_")
            .filter(codename__in=modules_permissions)
            .exclude(codename__contains="datastore")
            .exclude(codename__contains="iaso_beneficiaries")
            .order_by("id")
        )

        return permissions

    @staticmethod
    def assert_right_to_assign(user, permission_codename: str):
        if not user.has_perm(core_permissions.USERS_ADMIN) and permission_codename == core_permissions._USERS_ADMIN:
            raise PermissionDenied(
                f"Only users with {core_permissions.USERS_ADMIN} permission can grant {core_permissions.USERS_ADMIN} permission"
            )
