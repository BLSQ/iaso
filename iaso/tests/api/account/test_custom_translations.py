from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, TenantUser
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountCustomTranslations(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(
            name="account",
            custom_translations={"en": {"custom.key": "Custom value"}},
        )
        self.other_account = Account.objects.create(name="other account")
        self.another_account = Account.objects.create(name="another account")
        self.john_wick = self.create_user_with_profile(
            username="johnwick", account=self.another_account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )

        self.jane_doe = self.create_user_with_profile(
            username="janedoe", account=self.account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )
        self.john_doe = self.create_user_with_profile(
            username="johndoe", account=self.other_account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )
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
        self.assertResponseCompliantToSwagger(data, "AccountCustomTranslations")

    def test_permissions(self):
        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.another_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.jane_doe)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.another_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane_doe)

        with self.assertNumQueries(3):
            # 1-2: PERMISSION
            # 3: SELECT OBJECT
            res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.account.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_custom_translations(self):
        self.client.force_authenticate(self.jane_doe)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)
        self.assertEqual(res_data["custom_translations"], {"en": {"custom.key": "Custom value"}})

        self.client.force_authenticate(self.john_doe)

        res = self.client.get(reverse("accounts-custom-translations", kwargs={"pk": self.other_account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.assertIsNone(res_data["custom_translations"])
