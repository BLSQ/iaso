from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, AccountFeatureFlag, TenantUser
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountUpdate(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="other account")
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

        # create account ff
        self.aff = AccountFeatureFlag.objects.create(name="bla", code="bla")

    def assertValidPutBody(self, data):
        self.assertResponseCompliantToSwagger(data, "AccountUpdateRequest")

    def assertValidPatchBody(self, data):
        self.assertResponseCompliantToSwagger(data, "PatchedAccountUpdateRequest")

    def test_num_queries(self):
        self.client.force_authenticate(self.jane_doe)
        with self.assertNumQueries(3):
            res = self.client.put(
                reverse("accounts-detail", kwargs={"pk": self.account.pk}),
                data={
                    "name": "new account name",
                    "user_manual_path": "user_manual_path",
                    "forum_path": "forum_path",
                    "modules": [MODULE_VALIDATION_WORKFLOW.codename],
                    "enforce_password_validation": True,
                    "anthropic_api_key": "1234",
                    "custom_translations": {"en": "oops"},
                },
            )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_permissions(self):
        res = self.client.put(reverse("accounts-detail", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.john_doe)
        res = self.client.put(reverse("accounts-detail", kwargs={"pk": self.another_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(user=self.jane_doe)
        res = self.client.put(reverse("accounts-detail", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.put(reverse("accounts-detail", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        self.client.force_authenticate(self.jane_doe)
        self.account.feature_flags.add(self.aff)
        self.account.save()

        data = {
            "name": "new account name",
            "user_manual_path": "user_manual_path",
            "forum_path": "forum_path",
            "modules": [MODULE_VALIDATION_WORKFLOW.codename],
            "enforce_password_validation": False,
            "anthropic_api_key": "1234",
            "custom_translations": {"en": "oops"},
        }
        self.assertValidPutBody(data)

        res = self.client.put(reverse("accounts-detail", kwargs={"pk": self.account.pk}), data=data)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.account.refresh_from_db()

        self.assertEqual(self.account.name, "new account name")
        self.assertEqual(self.account.user_manual_path, "user_manual_path")
        self.assertEqual(self.account.forum_path, "forum_path")
        self.assertEqual(self.account.modules, [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(self.account.anthropic_api_key, "1234")
        self.assertEqual(self.account.custom_translations, {"en": "oops"})
        self.assertFalse(self.account.enforce_password_validation)
        self.assertTrue(self.account.feature_flags.count())

    def test_partial_update(self):
        self.client.force_authenticate(self.jane_doe)
        self.account.feature_flags.add(self.aff)
        self.account.save()

        data = {
            "user_manual_path": "user_manual_path",
            "anthropic_api_key": "1234",
            "custom_translations": {"en": "oops"},
        }
        self.assertValidPatchBody(data)

        res = self.client.patch(reverse("accounts-detail", kwargs={"pk": self.account.pk}), data=data)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.account.refresh_from_db()

        self.assertEqual(self.account.name, "account")
        self.assertEqual(self.account.user_manual_path, "user_manual_path")
        self.assertIsNone(self.account.forum_path)
        self.assertEqual(self.account.modules, [])
        self.assertEqual(self.account.anthropic_api_key, "1234")
        self.assertEqual(self.account.custom_translations, {"en": "oops"})
        self.assertTrue(self.account.enforce_password_validation)
        self.assertTrue(self.account.feature_flags.count())
