from django.contrib.auth import get_user_model

from iaso.test import APITestCase


KNOWN_PASSWORD = "bar123"


class ModelDataViewTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user = User.objects.create_user("foo", "foo@example.com", KNOWN_PASSWORD)

    def test_should_require_authentification(self):
        resp = self.client.get("/models/")
        self.assertEqual(resp.content.decode(), "authentication required")
        self.assertEqual(resp.status_code, 403)

    def test_should_work_when_authenticated(self):
        # force auth doesn't work it's a simple view
        self.client.login(username=self.user.username, password=KNOWN_PASSWORD)

        resp = self.client.get("/models/")

        html = resp.content.decode()
        self.assertContains(resp, "<!DOCTYPE html>", status_code=200)
        self.assertContains(resp, "d3", status_code=200)
        self.assertContains(resp, "Instance", status_code=200)
