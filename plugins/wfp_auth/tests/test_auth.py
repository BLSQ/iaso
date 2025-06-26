from unittest.mock import patch

from allauth.socialaccount.models import SocialAccount

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp_auth.views import ExtraData


class WFPAuthTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.version)
        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="test_app_id")

    @patch("requests.get")
    def test_complete_login_ok(self, mock_get):
        self.assertEqual(m.User.objects.count(), 0)
        self.assertEqual(m.Profile.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

        # Mock `requests.get()` response.
        extra_data: ExtraData = {
            "email": "john@doe.com",
            "sub": "john@doe.com",
            "given_name": "John",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        with patch("plugins.wfp_auth.views.WFP2Adapter.settings", new={"IASO_ACCOUNT_NAME": "foo"}):
            response = self.client.post(
                f"/wfp_auth/wfp/token/?app_id={self.project.app_id}&app_version=2501",
                format="json",
                data={
                    "token": "f4k3-t0k3n",
                },
            )

        self.assertEqual(response.status_code, 200)

        new_user = m.User.objects.get(email="john@doe.com")
        self.assertEqual(new_user.username, "test_app_id_john@doe.com")
        self.assertEqual(new_user.first_name, "John")
        self.assertEqual(new_user.last_name, "Doe")

        new_profile = m.Profile.objects.get(user=new_user)
        self.assertEqual(new_profile.account, self.account)

        new_social_account = SocialAccount.objects.get(uid="test_app_id_john@doe.com")
        self.assertEqual(new_social_account.provider, "wfp")
        self.assertEqual(new_social_account.extra_data, extra_data)
        self.assertEqual(new_social_account.user, new_user)

    @patch("requests.get")
    def test_complete_login_ok_with_existing_username(self, mock_get):
        """
        Avoid an IntegrityError when another user already has the same username.
        """
        self.create_user_with_profile(username="john@doe.com", email="foo@bar.com", account=self.account)

        # Mock `requests.get()` response.
        extra_data: ExtraData = {
            "email": "john@doe.com",
            "sub": "john@doe.com",
            "given_name": "John",
            "family_name": "Doe",
        }
        mock_response = mock_get.return_value
        mock_response.json.return_value = extra_data

        with patch("plugins.wfp_auth.views.WFP2Adapter.settings", new={"IASO_ACCOUNT_NAME": "foo"}):
            response = self.client.post(
                f"/wfp_auth/wfp/token/?app_id={self.project.app_id}&app_version=2501",
                format="json",
                data={
                    "token": "f4k3-t0k3n",
                },
            )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(m.User.objects.count(), 2)
        new_user = m.User.objects.get(email="john@doe.com")
        self.assertEqual(new_user.username, "test_app_id_john@doe.com")
