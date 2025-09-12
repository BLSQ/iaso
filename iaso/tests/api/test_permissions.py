from django.contrib.auth.models import Permission

from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_ROLES_PERMISSION,
    PERMISSION_GROUP_ADMIN,
    PERMISSION_GROUP_ORG_UNITS,
)
from iaso.permissions.utils import fetch_django_permissions_from_iaso_permissions, get_permissions_of_group
from iaso.test import APITestCase


class OrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = m.Account.objects.create(name="Account")
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=account, permissions=[CORE_USERS_ADMIN_PERMISSION, CORE_USERS_ROLES_PERMISSION]
        )

        cls.MODULES = [
            {"name": "Default", "codename": "DEFAULT"},
        ]
        cls.account.modules = [module["codename"] for module in cls.MODULES]
        cls.account.save()

    def test_permission_list_without_auth(self):
        """GET /permissions/ without auth should result in a 401"""

        response = self.client.get("/api/permissions/")
        self.assertJSONResponse(response, 401)

        response = self.client.get("/api/permissions/grouped_permissions/")
        self.assertJSONResponse(response, 401)

    def test_get_all_permissions_without_grouping(self):
        """Get /permissions all permissions without grouping them"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/permissions/")
        self.assertJSONResponse(response, 200)
        account = self.yoda.iaso_profile.account

        # Get all permissions linked to the modules
        modules_permissions = account.permissions_from_active_modules
        queryset = Permission.objects
        permissions = fetch_django_permissions_from_iaso_permissions(queryset, modules_permissions)
        self.assertEqual(len(response.json()["permissions"]), len(permissions))

    def test_get_all_grouped_permissions(self):
        """Get /permissions/grouped_permissions all grouped permissions"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/permissions/grouped_permissions/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(list(response.json()["permissions"].keys()), ["org_units", "admin"])

        org_unit_perms = get_permissions_of_group(PERMISSION_GROUP_ORG_UNITS)
        org_unit_perms_categories = set(perm.category for perm in org_unit_perms if perm.category)
        # Categories are regrouped by the endpoint, so size will be different if there are any categories
        expected_org_unit_len = len(org_unit_perms) - len(org_unit_perms_categories)
        admin_perms = get_permissions_of_group(PERMISSION_GROUP_ADMIN)
        admin_perms_categories = set(perm.category for perm in admin_perms if perm.category)
        # Categories are regrouped by the endpoint, so size will be different if there are any categories
        expected_admin_len = len(admin_perms) - len(admin_perms_categories)

        response_org_units = response.json()["permissions"]["org_units"]
        response_admin = response.json()["permissions"]["admin"]
        self.assertEqual(len(response_org_units), expected_org_unit_len)
        self.assertEqual(len(response_admin), expected_admin_len)

        # TODO: checking the result instead of length would be better
