from iaso.models.json_config import Config
from iaso.test import APITestCase
from plugins.polio.permissions import POLIO_PERMISSION


BASE_URL = "/api/polio/vaccine/doses_per_vial/"


class DosesPerVaccineEndpointTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Minimal account/project setup
        cls.account, cls.datasource, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Default account", "Default project"
        )
        # Users: one with required permission, one without, and an anonymous user
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [POLIO_PERMISSION])

        # Relevant config for the endpoint
        cls.content = {"mOPV2": [50], "nOPV2": [20, 50], "bOPV": [10, 20]}
        Config.objects.create(slug="vaccine_doses_per_vial", content=cls.content)

        # Irrelevant config should be ignored by the queryset filter
        Config.objects.create(slug="unrelated_config", content={"foo": "bar"})

    def test_anonymous_user_cannot_list(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_perms_cannot_list(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_perm_can_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL)
        data = self.assertJSONResponse(response, 200)

        self.assertEqual(len(data), 1)

        item = data[0]
        # ConfigSerializer fields: created_at, updated_at, key (slug), data (content)
        self.assertIn("created_at", item)
        self.assertIn("updated_at", item)
        self.assertEqual(item["key"], "vaccine_doses_per_vial")
        self.assertEqual(item["data"], self.content)
