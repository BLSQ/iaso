import json
from iaso.models.base import Account
from iaso.test import APITestCase
from plugins.polio.models import Config
from django.contrib.auth.models import User
from rest_framework.test import APIClient

content = {"beurk": "lol"}


class PolioConfigTestCase(APITestCase):
    config: Config
    authorized_user: User
    unauthorized_user: User
    account: Account

    def setUp(cls) -> None:
        cls.account = Account.objects.create(name="Polio account")
        cls.authorized_user = cls.create_user_with_profile(username="authorized", account=cls.account)
        cls.unauthorized_user = cls.create_user_with_profile(username="unAuthorized", account=cls.account)
        cls.config = Config.objects.create(slug="test", content=json.dumps(content))
        cls.config.users.set([cls.authorized_user])

    def test_anonymous_user(self):
        c = APIClient()
        response = c.get("/api/polio/configs/", accept="application/json")
        self.assertEqual(response.status_code, 403)
        response = c.get("/api/polio/configs/test/", accept="application/json")
        self.assertEqual(response.status_code, 403)

    def test_unauthorized_user(self):
        c = APIClient()
        c.force_authenticate(self.unauthorized_user)
        response = c.get("/api/polio/configs/", accept="application/json")
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.content)
        self.assertEqual(len(json_response["results"]), 0)
        response = c.get("/api/polio/configs/test/", accept="application/json")
        self.assertEqual(response.status_code, 404)

    def test_authorized_user(self):
        c = APIClient()
        c.force_authenticate(user=self.authorized_user)
        response = c.get("/api/polio/configs/", accept="application/json")
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.content)
        print("RESPONSE", json_response)
        # self.assertEqual(json_response["results"][0]["data"]["beurk"],"lol")
        self.assertEqual(json_response["results"][0]["key"], "test")
        response = c.get("/api/polio/configs/test/", accept="application/json")
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.content)
        print("RESPONSE", json_response)
        self.assertEqual(json_response["key"], "test")
