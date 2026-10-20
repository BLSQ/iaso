from unittest import mock
from urllib.parse import quote

from django.http import HttpResponse
from rest_framework import status

from iaso import models as m
from iaso.test import TestCase


ENTITIES_URL = "/dashboard/entities/list/accountId/1/search/01211%2Fsh%2F20%2F0008e/page/1"


class DashboardLoginRedirectTestCase(TestCase):
    """The "next" url of the login redirect must keep the param values encoded as the browser sent them."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Belgium")
        cls.user = cls.create_user_with_profile(username="belgium_user", account=account)

    def assertRedirectsToLoginWithNext(self, response, expected_next):
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response["Location"], f"/login/?next={quote(expected_next, safe='/')}")

    def test_anonymous_keeps_encoded_slash_in_next(self):
        # Gunicorn passes the url as received in RAW_URI
        response = self.client.get(ENTITIES_URL, RAW_URI=ENTITIES_URL)

        self.assertRedirectsToLoginWithNext(response, ENTITIES_URL)

    def test_anonymous_without_raw_uri_falls_back_to_decoded_path(self):
        # Servers without RAW_URI (e.g. runserver) keep the previous login_required behaviour
        response = self.client.get(ENTITIES_URL)

        self.assertRedirectsToLoginWithNext(response, ENTITIES_URL.replace("%2F", "/"))

    def test_authenticated_user_gets_the_page(self):
        self.client.force_login(self.user)
        # Avoid rendering iaso/index.html (needs webpack-stats.json in CI).
        with mock.patch("hat.dashboard.views._base_iaso", return_value=HttpResponse("ok")) as base_iaso:
            response = self.client.get(ENTITIES_URL, RAW_URI=ENTITIES_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        base_iaso.assert_called_once()
