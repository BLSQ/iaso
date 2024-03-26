import json
from iaso.models.base import Account
from iaso.models.data_store import JsonDataStore
from iaso.test import APITestCase
from django.utils.text import slugify

data_store_content1 = json.dumps({"hello": "world"})
data_store_content2 = json.dumps({"wait": "what"})
additional_data_store_content = json.dumps({"more": "data"})
data_store_content3 = json.dumps({"this": "should not appear"})
api_url = "/api/datastore/"


class JsonDataStoreAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account1 = Account.objects.create(name="Account 1")
        cls.account2 = Account.objects.create(name="Account 2")
        cls.authorized_user_read = cls.create_user_with_profile(
            username="authorized_read_only", account=cls.account1, permissions=["iaso_datastore_read"]
        )
        cls.authorized_user_write = cls.create_user_with_profile(
            username="authorized_write_only", account=cls.account1, permissions=["iaso_datastore_write"]
        )
        cls.user_with_perm_but_wrong_account = cls.create_user_with_profile(
            username="other_account", account=cls.account2, permissions=["iaso_datastore_read", "iaso_datastore_write"]
        )
        cls.unauthorized = cls.create_user_with_profile(username="unauthorized", account=cls.account1)

        cls.data_store1 = JsonDataStore.objects.create(slug="test", content=data_store_content1, account=cls.account1)
        cls.data_store2 = JsonDataStore.objects.create(
            slug="waitwhat", content=data_store_content2, account=cls.account1
        )
        cls.data_store_account2 = JsonDataStore.objects.create(
            slug="test", content=data_store_content3, account=cls.account2
        )

    def test_datastore_list_without_auth(self):
        """GET /datastore/ without auth should result in a 401"""

        response = self.client.get(api_url)
        self.assertJSONResponse(response, 401)

    def test_datastore_list_permissions(self):
        """GET /datastore/ with auth but without the proper permission should return a 403"""

        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 403)
        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 403)
        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(api_url)
        self.assertJSONResponse(response, 200)

    def test_datastore_detail_without_auth(self):
        """GET /datastore/{slug} without auth should result in a 401"""

        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 401)

    def test_datastore_detail_permissions(self):
        """GET /datastore/{slug} with auth but without the proper permission should return a 403. Wrong account should return a 404"""

        self.client.force_authenticate(self.unauthorized)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.user_with_perm_but_wrong_account)
        response = self.client.get(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 404)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(f"{api_url}{self.data_store1.slug}/")
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(response_body["data"], data_store_content1)

    def test_list_results_filtered_by_account(self):
        """GET /datastore/ should only show results for the user's account"""

        self.client.force_authenticate(self.authorized_user_read)
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

    def test_create_datastore_permissions(self):
        """POST /api/datastore/ should only be allowed to users with the write permission."""

        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.post(
            api_url, {"data": {"post": "new datastore"}, "key": "new_store", "account": self.account1.pk}, format="json"
        )
        self.assertJSONResponse(response, 201)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.post(
            api_url, {"data": {"post": "new datastore"}, "key": "new_store", "account": self.account1.pk}, format="json"
        )
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.unauthorized)
        response = self.client.post(
            api_url, {"data": {"post": "new datastore"}, "key": "new_store", "account": self.account1.pk}, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_create_datastore(self):
        """POST /api/datastore/ creates correct data."""
        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.post(api_url, {"data": {"post": "new datastore"}, "key": "new_store"}, format="json")
        response_body = self.assertJSONResponse(response, 201)
        self.assertEqual(response_body["key"], "new_store")
        self.assertEqual(response_body["data"]["post"], "new datastore")

    def test_update_datastore(self):
        """PUT /api/datastore/{slug}"""
        new_slug = "new_slug"
        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.put(
            f"{api_url}{self.data_store1.slug}/", {"key": f"{new_slug}", "data": data_store_content2}
        )
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(response_body["key"], new_slug)
        self.assertEqual(response_body["data"], json.loads(data_store_content2))

    def test_update_slug(self):
        """PUT /api/datastore/{slug} should allow to update the slug, but should prevent re-using a slug already in use for the account"""
        self.client.force_authenticate(self.authorized_user_write)
        new_slug = "new_slug"
        response = self.client.put(
            f"{api_url}{self.data_store1.slug}/", {"key": f"{new_slug}", "data": data_store_content2}
        )
        self.assertJSONResponse(response, 200)

        response = self.client.put(
            f"{api_url}{new_slug}/", {"key": f"{self.data_store2.slug}", "data": data_store_content2}
        )
        self.assertJSONResponse(response, 400)

    def test_update_datastore_permissions(self):
        """PUT /api/datastore/{slug} should only be possible with the write permission"""
        new_slug = "new_slug"
        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.put(
            f"{api_url}{self.data_store1.slug}/", {"key": f"{new_slug}", "data": data_store_content2}
        )
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.unauthorized)
        response = self.client.put(
            f"{api_url}{self.data_store1.slug}/", {"key": f"{new_slug}", "data": data_store_content2}
        )
        self.assertJSONResponse(response, 403)

    def test_slugs_unique_per_account(self):
        """POST /api/datastore/ should return a 400 if another datastore with the same slug already exists for the user's account"""

        self.client.force_authenticate(self.authorized_user_write)
        self.client.post(
            api_url, {"data": {"post": "new datastore"}, "key": "new_store", "account": self.account1.pk}, format="json"
        )
        response = self.client.post(
            api_url, {"data": {"post": "new datastore"}, "key": "new_store", "account": self.account1.pk}, format="json"
        )
        self.assertJSONResponse(response, 400)

    def test_delete(self):
        """DELETE /api/datastore/{slug} should return a 204 and delete the datastore"""

        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.delete(f"{api_url}{self.data_store1.slug}/")
        self.assertJSONResponse(response, 204)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(api_url)
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_body["results"]), 1)

    def test_delete_permissions(self):
        """DELETE /api/datastore/{slug} should return a 204 for users with right permission, otherwise a 403"""

        self.client.force_authenticate(self.unauthorized)
        response = self.client.delete(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.delete(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.user_with_perm_but_wrong_account)
        response = self.client.delete(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 404)

        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.delete(f"{api_url}{self.data_store2.slug}/")
        self.assertJSONResponse(response, 204)

    def test_slug_sanitization_post(self):
        """POST request should sanitize the 'key' valeu of the request which will be used as slug"""

        ugly_slug = "<script>console.log('$Moua ha ha?!')</script>"
        slugified = slugify(ugly_slug)
        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.post(api_url, {"data": {"post": "new datastore"}, "key": ugly_slug}, format="json")
        response_body = self.assertJSONResponse(response, 201)
        self.assertEqual(response_body["key"], slugified)

    def test_slug_sanitization_put(self):
        """PUT request should sanitize the 'key' valeu of the request which will be used as slug"""

        ugly_slug = "<script>console.log('$Moua ha ha?!')</script>"
        slugified = slugify(ugly_slug)
        self.client.force_authenticate(self.authorized_user_write)
        response = self.client.put(
            f"{api_url}{self.data_store1.slug}/", {"key": f"{ugly_slug}", "data": data_store_content2}
        )
        response_body = self.assertJSONResponse(response, 200)
        self.assertEqual(response_body["key"], slugified)
