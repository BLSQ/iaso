import json

from iaso.models import Project
from iaso.models.base import Account
from iaso.models.data_store import JsonDataStore
from iaso.test import APITestCase
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION


data_store_content1 = json.dumps({"hello": "world"})
data_store_content2 = json.dumps({"wait": "what"})
additional_data_store_content = json.dumps({"more": "data"})
data_store_content3 = json.dumps({"this": "should not appear"})
data_store_content4 = json.dumps({"this": "is not lqas data"})
api_url = "/api/polio/lqasimmap/country/"


class LQASCountryAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account1 = Account.objects.create(name="Account 1")
        cls.account2 = Account.objects.create(name="Account 2")
        cls.account1_project = Project.objects.create(name="Project1", app_id="com.app_id.app", account=cls.account1)
        cls.authorized_user_regular = cls.create_user_with_profile(
            username="authorized_polio", account=cls.account1, permissions=[POLIO_PERMISSION]
        )
        cls.authorized_user_admin = cls.create_user_with_profile(
            username="authorized_polio_admin", account=cls.account1, permissions=[POLIO_CONFIG_PERMISSION]
        )
        cls.user_with_perm_but_wrong_account = cls.create_user_with_profile(
            username="other_account", account=cls.account2, permissions=[POLIO_PERMISSION, POLIO_CONFIG_PERMISSION]
        )
        cls.unauthorized = cls.create_user_with_profile(username="unauthorized", account=cls.account1)

        cls.data_store1 = JsonDataStore.objects.create(slug="lqas_1", content=data_store_content1, account=cls.account1)
        cls.data_store2 = JsonDataStore.objects.create(slug="lqas_2", content=data_store_content2, account=cls.account1)
        cls.data_store_im = JsonDataStore.objects.create(slug="im_1", content=data_store_content4, account=cls.account1)
        cls.data_store_account2 = JsonDataStore.objects.create(
            slug="lqas_3", content=data_store_content3, account=cls.account2
        )

    def test_datastore_list_without_auth(self):
        """GET /polio/lqasimmap/country/ Read-only API publicly available for embedding page"""

        response = self.client.get(f"{api_url}{self.data_store1.slug}/?app_id={self.account1_project.app_id}")
        self.assertJSONResponse(response, 200)

    def test_no_slug_returns_400(self):
        """GET /polio/lqasimmap/country/ - Returns 400. Slug is mandatory for this endppoint"""

        response = self.client.get(f"{api_url}")
        self.assertJSONResponse(response, 400)

        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 400)
        self.client.force_authenticate(self.authorized_user_admin)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 400)
        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 400)

    def test_datastore_detail_permissions(self):
        """GET /polio/lqasimmap/country/<slug> Read-only API publicly available for embedding page"""

        # Anon user can see data if app_id is provided
        response = self.client.get(f"{api_url}{self.data_store1.slug}/?app_id={self.account1_project.app_id}")
        self.assertJSONResponse(response, 200)
        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 200)
        self.client.force_authenticate(self.authorized_user_admin)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 200)
        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(response_body["data"], data_store_content1)

        self.client.force_authenticate(self.user_with_perm_but_wrong_account)
        response = self.client.get(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 404)

    def test_datastore_detail_without_auth(self):
        """GET /polio/lqasimmap/country/{slug} without auth and app_id should result in a 404.
        Anon user with app_id should result in 200 if Project is correctly configured
        """

        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 404)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/?app_id={self.account1_project.app_id}")
        self.assertJSONResponse(response, 200)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/?app_id=unknown_app_id")
        self.assertJSONResponse(response, 404)
