from iaso.test import APITestCase
from iaso import models as m
from django.contrib.auth.models import Permission


class ModuleAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars

        account_with_modules = m.Account.objects.create(name="account with modules")
        default_module = m.Module.objects.filter(codename="DEFAULT")
        account_with_modules.modules.set(default_module)
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

        cls.module = m.Module.objects.create(name="module", codename="MODULE")

        cls.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )

        cls.permission1 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission1"
        )

        cls.permission2 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission2"
        )

        cls.module_permission = m.Permission.objects.create(permission=cls.permission, module=cls.module)
        cls.module_permission1 = m.Permission.objects.create(permission=cls.permission1, module=cls.module)
        cls.module_permission2 = m.Permission.objects.create(permission=cls.permission2, module=cls.module)

    def test_list_all_modules_without_authentication(self):
        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 403)
        self.assertEqual(r["detail"], "Authentication credentials were not provided.")

    def test_list_all_modules_user_without_iaso_modules(self):
        self.client.force_authenticate(self.user_with_no_permissions)
        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 403)
        self.assertEqual(r["detail"], "You do not have permission to perform this action.")

    def test_list_all_modules_without_search(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/modules/")

        r = self.assertJSONResponse(response, 200)
        module = list(filter(lambda module: module["name"] == "module", r["results"]))[0]
        self.assertEqual(len(r["results"]), 10)
        self.assertEqual(len(module["permissions"]), 3)

    def test_list_all_modules_with_search_on_module_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"search": "data"}
        response = self.client.get("/api/modules/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)

        self.assertEqual(len(r["results"]), 1)
