from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse

from iaso.models import Account
from iaso.test import TestCase


class TestDRFSpectacular(TestCase):
    def setUp(self):
        account = Account.objects.create(name="account")
        self.user = get_user_model().objects.create(username="random user", password="random", email="random@test.com")
        self.superuser_with_profile = self.create_user_with_profile(account=account, username="user 1")
        self.superuser_with_profile.is_superuser = True
        self.superuser_with_profile.is_staff = True
        self.superuser_with_profile.save()

        self.user_with_profile = self.create_user_with_profile(account=account, username="user 3")

    def test_permissions(self):
        for url in ["swagger-ui", "redoc", "swagger-schema"]:
            for user in [self.user]:
                with self.subTest(f"Accessing url {url} with user {user} should raise 403"):
                    self.client.force_login(user)
                    res = self.client.get(reverse(url))
                    self.assertEqual(res.status_code, 403)

            with self.subTest(f"Accessing url {url} with anonymous user should raise 401"):
                self.client.logout()
                res = self.client.get(reverse(url))
                self.assertEqual(res.status_code, 401)

            for user in [self.superuser_with_profile, self.user_with_profile]:
                with self.subTest(f"Accessing url {url} with user {user} should work"):
                    self.client.force_login(user)
                    res = self.client.get(reverse(url))
                    self.assertEqual(res.status_code, 200)

    def test_swagger_schema_view_is_working(self):
        self.client.force_login(self.user_with_profile)
        response = self.client.get(reverse("swagger-schema"))
        self.assertEqual(response.status_code, 200)

        self.assertIn(settings.SPECTACULAR_SETTINGS["TITLE"], response.content.decode())
        self.assertIn("openapi", response.content.decode())
        self.assertIn("paths", response.content.decode())
