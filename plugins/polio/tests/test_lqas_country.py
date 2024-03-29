import json

from hat.menupermissions import models as permission
from iaso.models.base import Account
from iaso.models.data_store import JsonDataStore
from iaso.test import APITestCase

data_store_content1 = json.dumps({"hello": "world"})
data_store_content2 = json.dumps({"wait": "what"})
additional_data_store_content = json.dumps({"more": "data"})
data_store_content3 = json.dumps({"this": "should not appear"})
data_store_content4 = json.dumps({"this": "is not lqas data"})
api_url = "/api/polio/lqasmap/country/"


class LQASCountryAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account1 = Account.objects.create(name="Account 1")
        cls.account2 = Account.objects.create(name="Account 2")
        cls.authorized_user_regular = cls.create_user_with_profile(
            username="authorized_polio", account=cls.account1, permissions=["iaso_polio"]
        )
        cls.authorized_user_admin = cls.create_user_with_profile(
            username="authorized_polio_admin", account=cls.account1, permissions=["iaso_polio_config"]
        )
        cls.user_with_perm_but_wrong_account = cls.create_user_with_profile(
            username="other_account", account=cls.account2, permissions=["iaso_polio", "iaso_polio_config"]
        )
        cls.unauthorized = cls.create_user_with_profile(username="unauthorized", account=cls.account1)

        cls.data_store1 = JsonDataStore.objects.create(slug="lqas_1", content=data_store_content1, account=cls.account1)
        cls.data_store2 = JsonDataStore.objects.create(slug="lqas_2", content=data_store_content2, account=cls.account1)
        cls.data_store_im = JsonDataStore.objects.create(slug="im_1", content=data_store_content4, account=cls.account1)
        cls.data_store_account2 = JsonDataStore.objects.create(
            slug="lqas_3", content=data_store_content3, account=cls.account2
        )

    def test_datastore_list_without_auth(self):
        """GET /polio/lqasmap/country/ without auth should result in a 401"""

        response = self.client.get(api_url)
        self.assertJSONResponse(response, 401)

    def test_datastore_list_permissions(self):
        """GET /polio/lqasmap/country/ with auth but without the proper permission should return a 403"""

        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 403)
        self.client.force_authenticate(self.authorized_user_admin)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 200)
        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 200)

    def test_datastore_detail_without_auth(self):
        """GET /polio/lqasmap/country/{slug} without auth should result in a 401"""

        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 401)

    def test_datastore_detail_permissions(self):
        """GET /polio/lqasmap/country/{slug} with auth but without the proper permission should return a 403. Wrong account should return a 404"""

        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_admin)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 200)

        self.client.force_authenticate(self.user_with_perm_but_wrong_account)
        response = self.client.get(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 404)

        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(response_body["data"], data_store_content1)

    def test_list_results_filtered_by_account(self):
        """GET /polio/lqasmap/country/ should only show results for the user's account"""

        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(api_url)
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_body["results"]), 2)
        self.assertEqual(response_body["results"][0]["data"], data_store_content1)
        self.assertEqual(response_body["results"][1]["data"], data_store_content2)

        self.client.force_authenticate(self.user_with_perm_but_wrong_account)
        response = self.client.get(api_url)
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_body["results"]), 1)
        self.assertEqual(response_body["results"][0]["data"], data_store_content3)

    def test_list_results_filtered_by_slug(self):
        """GET /polio/lqasmap/country/ should only show results for lqas"""

        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(api_url)
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_body["results"]), 2)
        self.assertEqual(response_body["results"][0]["data"], data_store_content1)
        self.assertEqual(response_body["results"][1]["data"], data_store_content2)

        self.client.force_authenticate(self.authorized_user_regular)
        response = self.client.get(f"{api_url}{self.data_store_im.slug}/")
        response_body = self.assertJSONResponse(response, 404)
