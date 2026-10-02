from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, AccountFeatureFlag, DataSource, ExternalCredentials, SourceVersion, TenantUser
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountRetrieveCurrent(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()

        # create aff
        self.aff = AccountFeatureFlag.objects.create(name="bla", code="bla")

        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(
            name="other account",
            modules=[MODULE_VALIDATION_WORKFLOW.codename],
            user_manual_path="user_manual_path",
            forum_path="forum_path",
        )
        self.other_account.feature_flags.add(self.aff)
        self.data_source = DataSource.objects.create(
            name="source",
            credentials=ExternalCredentials.objects.create(
                account=self.account, name="test", password="test", login="test", url="test"
            ),
        )
        self.source_version = SourceVersion.objects.create(number=1, data_source=self.data_source)
        self.other_account.default_version = self.source_version
        self.other_account.save()

        self.another_account = Account.objects.create(name="another account")
        self.john_wick = self.create_user_with_profile(username="johnwick", account=self.another_account)

        self.jane_doe = self.create_user_with_profile(username="janedoe", account=self.account)
        self.john_doe = self.create_user_with_profile(username="johndoe", account=self.other_account)
        # multi tenant account

        # Create a main user without profile
        main_user = get_user_model().objects.create(username="main_user")

        # And 2 account users with profile
        self.account_user_ghi = self.create_user_with_profile(username="User_A", account=self.account)
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_ghi)
        TenantUser.objects.create(main_user=main_user, account_user=self.jane_doe)
        self.account_user_wha = self.create_user_with_profile(username="User_B", account=self.other_account)
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_wha)
        TenantUser.objects.create(main_user=main_user, account_user=self.john_doe)

    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "AccountRetrieveCurrent")

    def test_permissions(self):
        res = self.client.get(reverse("accounts-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-me"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_retrieve(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-me"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("accounts-me"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertEqual(res_data["id"], self.other_account.pk)
        self.assertEqual(res_data["name"], self.other_account.name)
        self.assertEqual(
            res_data["default_version"],
            {
                "id": self.source_version.pk,
                "number": self.source_version.number,
                "data_source": {
                    "id": self.data_source.pk,
                    "url": self.data_source.credentials.url,
                    "name": "source",
                    "tree_config_status_fields": [],
                },
            },
        )
        self.assertEqual(res_data["other_accounts"], [{"id": self.account.pk, "name": self.account.name}])
        self.assertEqual(res_data["modules"], [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(res_data["feature_flags"], [{"name": self.aff.name, "code": self.aff.code}])
        self.assertEqual(res_data["user_manual_path"], "user_manual_path")
        self.assertEqual(res_data["forum_path"], "forum_path")

    @override_settings(
        USER_MANUAL_PATH="https://www.openiaso.com/user-manual/",
        FORUM_PATH="https://forum.example.com/",
    )
    def test_account_paths_fallback_to_settings_when_empty(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-me"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertEqual(
            res_data["user_manual_path"],
            settings.USER_MANUAL_PATH,
        )
        self.assertEqual(res_data["forum_path"], settings.FORUM_PATH)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_doe)
        with self.assertNumQueries(2):
            res = self.client.get(reverse("accounts-me"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidData(res_data)
