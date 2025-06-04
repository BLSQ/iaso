from django.contrib.auth.models import Permission

from hat import settings
from hat.menupermissions.constants import PERMISSIONS_PRESENTATION
from hat.menupermissions.models import CustomPermissionSupport
from iaso import models as m
from iaso.test import APITestCase
from iaso.utils.module_permissions import account_module_permissions


class OrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = m.Account.objects.create(name="Account")
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=account, permissions=["iaso_users", "iaso_user_roles"]
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
        account_modules = account.modules

        # Get all permissions linked to the modules
        modules_permissions = account_module_permissions(account_modules)
        permissions = Permission.objects
        permissions = CustomPermissionSupport.filter_permissions(permissions, modules_permissions, settings)
        self.assertEqual(len(response.json()["permissions"]), len(permissions))

    def test_get_all_grouped_permissions(self):
        """Get /permissions/grouped_permissions all grouped permissions"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/permissions/grouped_permissions/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(list(response.json()["permissions"].keys()), ["org_units", "admin"])
        self.assertTrue(
            [permission["codename"] for permission in response.json()["permissions"]["org_units"]]
            <= PERMISSIONS_PRESENTATION["org_units"],
        )
