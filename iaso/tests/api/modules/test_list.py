from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from iaso.models import Account
from iaso.modules import MODULE_FORM_AI, MODULE_STOCK, MODULES
from iaso.permissions.core_permissions import CORE_MODULES_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


@override_settings(PLUGINS=None)
class ModuleDropdownAPITestCase(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account", modules=[MODULE_STOCK.codename, MODULE_FORM_AI.codename])
        self.john_doe = self.create_user_with_profile(username="john.doe", account=self.account)
        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_MODULES_PERMISSION]
        )
        self.related_modules = [m for m in MODULES if m.related_plugin is None]

    def assertValidData(self, data, expected_length):
        self.assertEqual(len(data), expected_length)
        self.assertResponseCompliantToSwagger(data, "ModuleList", as_array=True)

    def test_permissions(self):
        res = self.client.get(reverse("modules-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.john_doe)
        res = self.client.get(reverse("modules-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(2):
            # PERMISSIONS
            res = self.client.get(reverse("modules-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_filter(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, len(self.related_modules))

        res = self.client.get(reverse("modules-list"), data={"search": self.related_modules[0].name.upper()})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual(res_data[0]["name"], self.related_modules[0].name)

        res = self.client.get(reverse("modules-list"), data={"search": self.related_modules[0].name.lower()})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual(res_data[0]["name"], self.related_modules[0].name)

        res = self.client.get(reverse("modules-list"), data={"search": self.related_modules[0].name[:2]})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 3)
        self.assertEqual(res_data[0]["name"], self.related_modules[0].name)

        res = self.client.get(reverse("modules-list"), data={"search": "d" * 22})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

    def test_order(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, len(self.related_modules))

        original_module_response = res_data
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"), {"order": "-name"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, len(self.related_modules))

        self.assertEqual(res_data, sorted(original_module_response, key=lambda x: x["name"], reverse=True))

    def test_list(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, len(self.related_modules))

        for item in res_data:
            if item["codename"] in [MODULE_STOCK.codename, MODULE_FORM_AI.codename]:
                self.assertTrue(item["is_activated_for_user"])
            else:
                self.assertFalse(item["is_activated_for_user"])

    def test_should_see_modules_only_related_to_activated_plugins(self):
        original_modules_len = len(self.related_modules)
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("modules-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, original_modules_len)

        with override_settings(PLUGINS=["polio"]):
            res = self.client.get(reverse("modules-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

            modules_polio_list = [m.codename for m in MODULES if m.related_plugin == "polio"]
            self.assertGreater(len(modules_polio_list), 0)

            self.assertValidData(res_data, original_modules_len + len(modules_polio_list))

            self.assertTrue(any([x["codename"] in modules_polio_list for x in res_data]))
