from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, DataSource, Project, SourceVersion, TenantUser
from iaso.permissions.core_permissions import CORE_SOURCE_PERMISSION
from iaso.test import APITestCase


class TestAccountAPISetDefaultVersion(APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="other account")

        self.jane_doe = self.create_user_with_profile(
            username="janedoe", account=self.account, permissions=[CORE_SOURCE_PERMISSION]
        )
        self.john_doe = self.create_user_with_profile(
            username="johndoe", account=self.other_account, permissions=[CORE_SOURCE_PERMISSION]
        )
        self.jim = self.create_user_with_profile(username="jim", account=self.account)

        ghi_project = Project.objects.create(name="ghi_project", account=self.account)
        ghi_datasource = DataSource.objects.create()
        ghi_datasource.projects.set([ghi_project])
        self.ghi_version = SourceVersion.objects.create(data_source=ghi_datasource, number=1)

        wha_project = Project.objects.create(name="wha_project", account=self.other_account)
        wha_datasource = DataSource.objects.create(name="wha datasource")
        wha_datasource.projects.set([wha_project])
        self.wha_version = SourceVersion.objects.create(data_source=wha_datasource, number=1)

        # multi tenant account

        # Create a main user without profile
        main_user = get_user_model().objects.create(username="main_user")

        # And 2 account users with profile
        self.account_user_ghi = self.create_user_with_profile(
            username="User_A", account=self.account, permissions=[CORE_SOURCE_PERMISSION]
        )
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_ghi)
        TenantUser.objects.create(main_user=main_user, account_user=self.jane_doe)
        self.account_user_wha = self.create_user_with_profile(
            username="User_B", account=self.other_account, permissions=[CORE_SOURCE_PERMISSION]
        )
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_wha)

    def test_permissions(self):
        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.jim)
        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.put(reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(self.account_user_ghi)
        self.assertIsNotNone(self.account_user_ghi.tenant_user)
        with self.assertNumQueries(5):
            res = self.client.put(
                reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}),
                {"default_version": self.ghi_version.pk},
            )
            self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_happy_path(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.put(
            reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}),
            {"default_version": self.ghi_version.pk},
        )
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        self.account.refresh_from_db()
        self.assertEqual(self.account.default_version.id, self.ghi_version.id)

    def test_cant_assign_source_version_from_different_account(self):
        self.client.force_authenticate(self.jane_doe)
        res = self.client.put(
            reverse("accounts-set-default-version", kwargs={"pk": self.account.pk}),
            {"default_version": self.wha_version.pk},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "default_version", "Account not allowed to access this default_source.")
