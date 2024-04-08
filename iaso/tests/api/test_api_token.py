from iaso import models as m
from iaso.test import APITestCase


class APITokenTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = ghi = m.Account.objects.create(name="Test Account")
        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi)

    def test_api_token_without_auth(self):
        """GET /api/apitoken/ without auth should result in a 401"""

        response = self.client.get("/api/apitoken/")
        self.assertJSONResponse(response, 401)

    def test_api_token_with_auth(self):
        """GET  /api/apitoken/ with auth should result in a 200 and a token"""
        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/apitoken/")
        self.assertJSONResponse(response, 200)
        self.assertIsNotNone(response.json().get("token"))
