from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse

from iaso.test import TestCase


User = get_user_model()


@override_settings(LOGOUT_NEXT_ALLOWED_PATHS=["/example/allowed-target"])
class IasoLogoutViewTestCase(TestCase):
    """Tests for IasoLogoutView's allow-listed ``next`` behaviour."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="logout_user", password="hunter2")

    def setUp(self):
        self.client.force_login(self.user)
        self.logout_url = reverse("logout-iaso")

    def test_default_redirect_when_no_next(self):
        response = self.client.get(self.logout_url)
        self.assertRedirects(response, "/login/", fetch_redirect_response=False)

    def test_redirects_to_allowed_next(self):
        response = self.client.get(self.logout_url, {"next": "/example/allowed-target"})
        self.assertRedirects(response, "/example/allowed-target", fetch_redirect_response=False)

    def test_falls_back_when_next_not_in_allowlist(self):
        response = self.client.get(self.logout_url, {"next": "/dashboard/"})
        self.assertRedirects(response, "/login/", fetch_redirect_response=False)

    def test_falls_back_when_next_is_absolute_url(self):
        response = self.client.get(self.logout_url, {"next": "https://evil.example.com/example/allowed-target"})
        self.assertRedirects(response, "/login/", fetch_redirect_response=False)

    def test_falls_back_when_next_has_protocol_relative_host(self):
        response = self.client.get(self.logout_url, {"next": "//evil.example.com/"})
        self.assertRedirects(response, "/login/", fetch_redirect_response=False)

    def test_post_with_allowed_next(self):
        response = self.client.post(self.logout_url, data={"next": "/example/allowed-target"})
        self.assertRedirects(response, "/example/allowed-target", fetch_redirect_response=False)

    def test_user_is_logged_out(self):
        self.client.get(self.logout_url, {"next": "/example/allowed-target"})
        # Subsequent request to a login-required endpoint should not show the user as authenticated.
        response = self.client.get("/api/profiles/me/")
        self.assertIn(response.status_code, (401, 403))


@override_settings(LOGOUT_NEXT_ALLOWED_PATHS=[])
class IasoLogoutViewWithoutAllowlistTestCase(TestCase):
    """When the allow-list is empty, every ``next`` value falls back to ``next_page``."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="logout_user_no_allowlist", password="hunter2")

    def setUp(self):
        self.client.force_login(self.user)
        self.logout_url = reverse("logout-iaso")

    def test_any_next_falls_back(self):
        response = self.client.get(self.logout_url, {"next": "/example/allowed-target"})
        self.assertRedirects(response, "/login/", fetch_redirect_response=False)
