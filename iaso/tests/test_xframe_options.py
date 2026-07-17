from iaso import models as m
from iaso.models import Page
from iaso.test import TestCase


class XFrameOptionsTestCase(TestCase):
    """Ensure only embeddable views are exempt from Django's X-Frame-Options: DENY."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="XFrame account")
        cls.user = cls.create_user_with_profile(username="xframe_user", account=account)
        cls.public_page = Page.objects.create(
            type="RAW",
            needs_authentication=False,
            name="Public embed page",
            slug="public-embed-page",
            content="<html><body>ok</body></html>",
            account=account,
        )

    def test_regular_dashboard_home_sets_deny(self):
        response = self.client.get("/dashboard/home/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("X-Frame-Options"), "DENY")

    def test_authenticated_dashboard_sets_deny(self):
        self.client.force_login(self.user)
        response = self.client.get("/dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("X-Frame-Options"), "DENY")

    def test_embeddable_dashboard_is_exempt(self):
        response = self.client.get("/dashboard/polio/embeddedCalendar/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.get("X-Frame-Options"))

    def test_pages_view_is_exempt(self):
        response = self.client.get(f"/pages/{self.public_page.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.get("X-Frame-Options"))
