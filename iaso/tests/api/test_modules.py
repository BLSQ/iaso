from hat.menupermissions.constants import MODULE_PERMISSIONS, MODULES
from iaso.test import APITestCase
from iaso import models as m


class ModuleAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars
        cls.MODULES = [
            {"name": "Default", "codename": "DEFAULT"},
        ]

        account_with_modules = m.Account.objects.create(name="account with modules")
        account_with_modules.modules = [module["codename"] for module in MODULES]
        account_with_modules.save()

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.account_with_modules = account_with_modules
        account_with_modules.default_version = sw_version
        account_with_modules.save()

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_modules"])
        cls.user_with_no_permissions = cls.create_user_with_profile(username="userNoPermission", account=star_wars)

        cls.user_with_account_with_modules = cls.create_user_with_profile(
            username="user with modules", account=account_with_modules, permissions=["iaso_modules"]
        )

    def test_list_all_modules_without_authentication(self):
        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 403)
        self.assertEqual(r["detail"], "Authentication credentials were not provided.")

    def test_list_all_modules_user_without_iaso_modules(self):
        self.client.force_authenticate(self.user_with_no_permissions)
        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 200)

    def test_list_all_modules_without_search(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 200)

        modules = r["results"]
        default_return_module = list(filter(lambda module: module["codename"] == "DEFAULT", modules))[0]
        default_module_permissions = MODULE_PERMISSIONS["DEFAULT"]

        self.assertEqual(len(modules), len(MODULE_PERMISSIONS))
        self.assertEqual(len(default_return_module["permissions"]), len(default_module_permissions))

    def test_list_all_modules_with_search_on_module_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"search": "data"}
        response = self.client.get("/api/modules/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)

        self.assertEqual(len(r["results"]), 1)
