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

from django.db import models


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

    class Meta:
        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = ()
