from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, TenantUser
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountList(SwaggerTestCaseMixin, APITestCase):
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

    def assertValidData(self, data, expected_length):
        self.assertValidListData(list_data=data, results_key="results", expected_length=expected_length, paginated=True)
        self.assertResponseCompliantToSwagger(data, "PaginatedAccountListList")

    def test_list(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

    def test_permissions(self):
        res = self.client.get(reverse("accounts-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_should_not_see_other_accounts(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("accounts-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        self.assertNotIn(self.another_account.pk, [x["id"] for x in res_data["results"]])

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("accounts-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)

        self.assertNotIn(self.account.pk, [x["id"] for x in res_data["results"]])
        self.assertNotIn(self.other_account.pk, [x["id"] for x in res_data["results"]])

    def test_num_queries(self):
        self.client.force_authenticate(self.jane_doe)
        with self.assertNumQueries(2):
            res = self.client.get(reverse("accounts-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)
