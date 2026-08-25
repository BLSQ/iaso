import base64
import copy
import json

from unittest.mock import patch

from allauth.socialaccount.models import SocialAccount
from django.test import override_settings

from hat.sso_views import ExtraData
from iaso import models as m
from iaso.models.tenant_users import UserCreationData
from iaso.test import APITestCase


def make_test_token(app_id="test-client-id", tenant_id="test-tenant"):
    """Build a fake (unsigned) JWT whose payload carries the given ``appid`` and ``tid``.

    ``complete_login`` only decodes the payload to check the ``appid`` and ``tid`` claims;
    it does not verify the signature (the Graph userinfo call, which is mocked in these
    tests, is what proves authenticity), so an unsigned token is enough for testing.
    """

    def _b64(obj):
        return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()

    header = _b64({"alg": "none", "typ": "JWT"})
    payload = _b64({"appid": app_id, "tid": tenant_id})
    return f"{header}.{payload}.sig"


# Self-contained SSO config for the tests. It is injected via ``override_settings``
# together with a dedicated ``ROOT_URLCONF`` (see ``plugins/sso/tests/urls.py``) so the
# provider URLs are registered even when SSO is not configured in the environment (e.g. CI).
# ``account_id`` is set dynamically in ``setUp`` from the account created in
# ``setUpTestData``, since its real pk isn't stable across ``--keepdb`` runs.
SSO_TEST_CONFIG = {
    "who": {
        "name": "WHO",
        "client_id": "test-client-id",
        "tenant_id": "test-tenant",
        "client_secret": "test-secret",
        "authorize_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
        "login_path": "polio/login/",
        "callback_path": "polio/login/callback/",
        "token_path": "polio/token/",
    },
}


@override_settings(ROOT_URLCONF="hat.tests.urls")
class SSOAuthTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data source", account_name="Account", project_name="Project", app_id="test_app_id"
        )

    def setUp(self):
        super().setUp()
        config = copy.deepcopy(SSO_TEST_CONFIG)
        config["who"]["account_id"] = self.account.id
        override = override_settings(SSO_PROVIDERS=config)
        override.enable()
        self.addCleanup(override.disable)

    @patch("requests.get")
    def test_complete_login_unknown_user_fails(self, mock_get):
        """SSO never provisions accounts: an email with no matching user must be rejected."""
        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["message"],
            "No account found for this email address. Accounts must be created by an "
            "administrator before you can sign in.",
        )

        # Nothing should be provisioned for an unknown email.
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(m.Profile.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

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

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 200)

        # Should not create a new user, but link the social account to the existing one
        social_account = SocialAccount.objects.get(uid="abc-123-def")
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

    @patch("requests.get")
    def test_complete_login_wrong_app_id(self, mock_get):
        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            "/polio/token/?app_id=wrong_app_id&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"details": "Invalid app id", "message": "Invalid app id", "result": "error"},
        )
        # Nothing should be provisioned for an invalid app id.
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(m.Profile.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

    @override_settings(
        SSO_PROVIDERS={
            "who": {
                "name": "WHO",
                "client_id": "test-client-id",
                "tenant_id": "test-tenant",
                "client_secret": "test-secret",
                "authorize_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token",
                "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
                "login_path": "polio/login/",
                "callback_path": "polio/login/callback/",
                "token_path": "polio/token/",
                "account_id": 100000,
            },
        }
    )
    @patch("requests.get")
    def test_complete_login_wrong_account_in_settings(self, mock_get):
        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            "/polio/token/",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "details": "Invalid configuration. Please contact the administrator",
                "message": "Invalid configuration. Please contact the administrator",
                "result": "error",
            },
        )
        # Nothing should be provisioned when the account is misconfigured.
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(m.Profile.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_wrong_token_app_id(self, mock_get):
        """A token issued for a different Azure app registration is rejected with 401."""
        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token(app_id="some-other-app")},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Token was not issued for this application")
        # Nothing is provisioned for a token that was not issued for our app.
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_wrong_token_tenant(self, mock_get):
        """A token with the right appid but from a different tenant is rejected with 401.

        This is the nOAuth guard: even a token carrying our own appid must originate from
        our configured tenant, otherwise an attacker could forge an email in their own tenant.
        """
        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token(app_id="test-client-id", tenant_id="attacker-tenant")},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Token was not issued for this application")
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_malformed_token(self, mock_get):
        """A token that is not a decodable JWT is rejected with 401."""
        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": "not-a-jwt"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Token was not issued for this application")
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_multiple_users_same_email(self, mock_get):
        """When several users share the email in the account, login fails instead of picking one."""
        self.create_user_with_profile(username="jane1", email="jane@who.int", account=self.account)
        self.create_user_with_profile(username="jane2", email="jane@who.int", account=self.account)

        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["message"], "Could not log you in. Please contact the administrator")
        # Ambiguous match must not create a social account or log anyone in.
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_multiple_unlinked_users_across_accounts(self, mock_get):
        """Fail when the email maps to unlinked users in more than one account."""
        other_account, _, _, _ = self.create_account_datasource_version_project(
            source_name="Other source", account_name="Other account", project_name="Other project", app_id="other_app"
        )
        self.create_user_with_profile(username="jane_who", email="jane@who.int", account=self.account)
        self.create_user_with_profile(username="jane_other", email="jane@who.int", account=other_account)

        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["message"], "Could not log you in. Please contact the administrator")
        self.assertEqual(SocialAccount.objects.count(), 0)

    @patch("requests.get")
    def test_complete_login_tenant_user_resolves_to_main_user(self, mock_get):
        """A tenant user (same email across accounts) resolves to their main_user, not a failure."""
        other_account, _, _, _ = self.create_account_datasource_version_project(
            source_name="Other source", account_name="Other account", project_name="Other project", app_id="other_app"
        )
        # jane starts in self.account...
        self.create_user_with_profile(username="jane@who.int", email="jane@who.int", account=self.account)
        # ...and is added to a second account, turning her into a tenant user (main_user + account_users).
        _, main_user, account_user_other = m.TenantUser.objects.create_user_or_tenant_user(
            data=UserCreationData(
                username="jane@who.int",
                email="jane@who.int",
                first_name="Jane",
                last_name="Doe",
                account=other_account,
            )
        )
        m.Profile.objects.create(account=other_account, user=account_user_other)

        extra_data: ExtraData = {
            "email": "jane@who.int",
            "sub": "abc-123-def",
            "given_name": "Jane",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        response = self.client.post(
            f"/polio/token/?app_id={self.project.app_id}&app_version=2501",
            format="json",
            data={"token": make_test_token()},
        )
        self.assertEqual(response.status_code, 200)
        # The social account links to the tenant main_user, not one of the account users.
        social_account = SocialAccount.objects.get(uid="abc-123-def")
        self.assertEqual(social_account.user, main_user)
