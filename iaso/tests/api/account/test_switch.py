from unittest import skip

from django.contrib import auth
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, TenantUser
from iaso.test import APITestCase


class TestAccountSwitch(APITestCase):
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

    @skip("skipping for trypelim")
    def test_num_queries(self):
        self.client.force_authenticate(self.jane_doe)
        with self.assertNumQueries(11):
            res = self.client.post(reverse("accounts-switch"), data={"account_id": self.other_account.pk})
            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_permissions(self):
        res = self.client.post(reverse("accounts-switch"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(reverse("accounts-switch"))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_switch_to_another_account_not_linked_to_user(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.post(reverse("accounts-switch"), data={"account_id": self.another_account.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "account_id", f'Invalid pk "{self.another_account.pk}" - object does not exist.')

    def test_switch(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.post(reverse("accounts-switch"), data={"account_id": self.other_account.pk})

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        logged_in_user = auth.get_user(self.client)
        self.assertEqual(logged_in_user.iaso_profile.account.name, self.other_account.name)

    def test_switch_one_user(self):
        TenantUser.objects.create(main_user=self.john_wick, account_user=self.john_wick)
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(reverse("accounts-switch"), data={"account_id": self.another_account.pk})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_switch_no_tenant_user(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(reverse("accounts-switch"), data={"account_id": self.another_account.pk})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
