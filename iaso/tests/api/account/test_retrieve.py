from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, TenantUser
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountRetrieve(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="other account", modules=[MODULE_VALIDATION_WORKFLOW.codename])
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
        self.assertResponseCompliantToSwagger(data, "AccountRetrieve")

    def test_permissions(self):
        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.another_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertEqual(res_data["id"], self.account.id)
        self.assertEqual(res_data["name"], self.account.name)
        self.assertIsNotNone(res_data["created_at"])
        self.assertEqual(res_data["user_manual_path"], self.account.user_manual_path)
        self.assertEqual(res_data["forum_path"], self.account.forum_path)
        self.assertEqual(res_data["modules"], self.account.modules)
        self.assertEqual(res_data["enforce_password_validation"], self.account.enforce_password_validation)
        self.assertEqual(res_data["anthropic_api_key"], self.account.anthropic_api_key)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.other_account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertEqual(res_data["id"], self.other_account.id)
        self.assertEqual(res_data["name"], self.other_account.name)
        self.assertIsNotNone(res_data["created_at"])
        self.assertEqual(res_data["user_manual_path"], self.other_account.user_manual_path)
        self.assertEqual(res_data["forum_path"], self.other_account.forum_path)
        self.assertEqual(res_data["modules"], self.other_account.modules)
        self.assertEqual(res_data["enforce_password_validation"], self.other_account.enforce_password_validation)
        self.assertEqual(res_data["anthropic_api_key"], self.other_account.anthropic_api_key)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane_doe)
        with self.assertNumQueries(1):
            res = self.client.get(reverse("accounts-detail", kwargs={"pk": self.other_account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)
