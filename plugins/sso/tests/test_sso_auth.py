from unittest.mock import patch

from allauth.socialaccount.models import SocialAccount

from iaso import models as m
from iaso.test import APITestCase
from plugins.sso.views import ExtraData


SSO_TEST_CONFIG = {
    "who": {
        "name": "WHO",
        "authorize_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
        "login_path": "polio/login/",
        "callback_path": "polio/login/callback",
        "token_path": "polio/token/",
        "account_name": "test_account",
        "email_recipients_new_account": [],
    },
}


class SSOAuthTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data source", account_name="Account", project_name="Project", app_id="test_app_id"
        )

    @patch("requests.get")
    def test_complete_login_ok(self, mock_get):
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(m.Profile.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        with patch(
            "plugins.sso.views.SSOBaseAdapter.sso_config",
            new_callable=lambda: property(
                lambda self: {
                    "account_name": "foo",
                    "email_recipients_new_account": [],
                    **SSO_TEST_CONFIG["who"],
                }
            ),
        ):
            response = self.client.post(
                f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
                format="json",
                data={"token": "f4k3-t0k3n"},
            )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(m.User.objects.count(), 1)
        new_user = m.User.objects.get(email="jane@who.int")
        self.assertEqual(new_user.username, "jane@who.int")
        self.assertEqual(new_user.first_name, "Jane")
        self.assertEqual(new_user.last_name, "Doe")

        new_profile = m.Profile.objects.get(user=new_user)
        self.assertEqual(new_profile.account, self.account)

        new_social_account = SocialAccount.objects.get(uid="test_app_id_abc-123-def")
        self.assertEqual(new_social_account.provider, "who")
        self.assertEqual(new_social_account.extra_data, extra_data)
        self.assertEqual(new_social_account.user, new_user)

    @patch("requests.get")
    def test_complete_login_existing_user(self, mock_get):
        """When a user with the same email already exists in the account, link to that user."""
        existing_user = self.create_user_with_profile(
            username="jane@who.int", email="jane@who.int", account=self.account
        )

        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        with patch(
            "plugins.sso.views.SSOBaseAdapter.sso_config",
            new_callable=lambda: property(
                lambda self: {
                    "account_name": "foo",
                    "email_recipients_new_account": [],
                    **SSO_TEST_CONFIG["who"],
                }
            ),
        ):
            response = self.client.post(
                f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
                format="json",
                data={"token": "f4k3-t0k3n"},
            )
        self.assertEqual(response.status_code, 200)

        # Should not create a new user, but link the social account to the existing one
        social_account = SocialAccount.objects.get(uid="test_app_id_abc-123-def")
        self.assertEqual(social_account.user, existing_user)

    @patch("requests.get")
    def test_token_missing(self, mock_get):
        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}",
            format="json",
            data={},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "missing token")
