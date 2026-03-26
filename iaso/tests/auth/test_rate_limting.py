from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient


@override_settings(
    AXES_HANDLER="axes.handlers.cache.AxesCacheHandler",
    AXES_FAILURE_LIMIT=3,
    AXES_LOCKOUT_PARAMETERS=["username"],
)
class AxesRateLimitTests(TestCase):
    api_url = "/api/token/"
    admin_login_url = "/admin/login/"
    login_url = "/login/"
    login_payload = {
        "username": "testuser",
        "password": "azerty1234",
    }

    def setUp(self):
        self.client = APIClient()

        cache.clear()

    def test_api_token_rate_limit(self):
        """Test that /api/token/ locks out the user after AXES_FAILURE_LIMIT attempts."""
        resp1 = self.client.post(self.api_url, self.login_payload)
        self.assertEqual(resp1.status_code, status.HTTP_401_UNAUTHORIZED)

        resp2 = self.client.post(self.api_url, self.login_payload)
        self.assertEqual(resp2.status_code, status.HTTP_401_UNAUTHORIZED)

        resp3 = self.client.post(self.api_url, self.login_payload)
        self.assertEqual(resp3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(resp3.data["detail"], "Too many login attempts. Please try again later.")

    def test_rate_limit_by_username(self):
        """Test that the lockout applies to the username regardless of IP."""
        self.client.post(self.api_url, self.login_payload, REMOTE_ADDR="192.168.1.100")
        self.client.post(self.api_url, self.login_payload, REMOTE_ADDR="192.168.1.100")

        # different IP but still locked out
        resp_diff_ip = self.client.post(self.api_url, self.login_payload, REMOTE_ADDR="10.0.0.50")
        self.assertEqual(resp_diff_ip.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # different username should not be locked out
        payload_other_user = {"username": "innocent_user", "password": "azerty1234"}
        resp_diff_user = self.client.post(self.api_url, payload_other_user, REMOTE_ADDR="192.168.1.100")
        self.assertEqual(resp_diff_user.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_rate_limit(self):
        """Test that /login/ has rate limiting."""
        self.client.post(self.login_url, self.login_payload, format="multipart")
        self.client.post(self.login_url, self.login_payload, format="multipart")

        resp3 = self.client.post(self.login_url, self.login_payload, format="multipart")
        self.assertEqual(resp3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_admin_login_rate_limit(self):
        """Test that /admin/login/ has rate limiting"""
        resp1 = self.client.post(self.admin_login_url, self.login_payload, format="multipart")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        resp2 = self.client.post(self.admin_login_url, self.login_payload, format="multipart")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

        resp3 = self.client.post(self.admin_login_url, self.login_payload, format="multipart")
        self.assertEqual(resp3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
