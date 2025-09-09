from django.contrib import auth

from iaso import models as m
from iaso.test import APITestCase


class AccountAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = ghi = m.Account.objects.create(name="Global Health Initiative")
        cls.wha = wha = m.Account.objects.create(name="Worldwide Health Aid")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_sources"])
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=["iaso_sources"])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=ghi)

        ghi_project = m.Project.objects.create(name="ghi_project", account=ghi)
        ghi_datasource = m.DataSource.objects.create()
        ghi_datasource.projects.set([ghi_project])
        cls.ghi_version = m.SourceVersion.objects.create(data_source=ghi_datasource, number=1)

        wha_project = m.Project.objects.create(name="wha_project", account=wha)
        wha_second_project = m.Project.objects.create(name="wha_second_project", account=wha)
        wha_datasource = m.DataSource.objects.create(name="wha datasource")
        wha_datasource.projects.set([wha_project])
        cls.wha_version = m.SourceVersion.objects.create(data_source=wha_datasource, number=1)

    def test_account_list_without_auth(self):
        """GET /account/ without auth should result in a 403 (before the method not authorized?)"""
        self.client.force_authenticate(self.jim)

        response = self.client.get("/api/accounts/")
        self.assertJSONResponse(response, 403)

    def test_account_list_with_auth(self):
        """GET /account/ with auth should result in a 405 as method is not allowed"""
        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/accounts/")
        self.assertJSONResponse(response, 405)

    def test_account_delete_forbidden(self):
        """DELETE /account/ with auth should result in a 405 as method is not allowed"""
        self.client.force_authenticate(self.jane)

        response = self.client.delete("/api/accounts/")
        self.assertJSONResponse(response, 405)

    def test_account_post_forbidden(self):
        """POST /account/ with auth should result in a 405 as method is not allowed"""
        self.client.force_authenticate(self.jane)

        response = self.client.post("/api/accounts/", {"default_version": self.ghi_version.pk})
        self.assertJSONResponse(response, 405)

    def test_account_detail_forbidden(self):
        """POST /account/ with auth should result in a 405 as method is not allowed"""
        self.client.force_authenticate(self.jane)

        response = self.client.get(f"/api/accounts/{self.ghi.pk}/")
        self.assertJSONResponse(response, 405)

    def test_account_set_default_ok(self):
        """Set a version with a user that has correct perm"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(f"/api/accounts/{self.ghi.pk}/", {"default_version": self.ghi_version.pk})
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(j, {"id": self.ghi.pk, "default_version": self.ghi_version.pk})

        self.ghi.refresh_from_db()
        self.assertEqual(self.ghi.default_version.id, self.ghi_version.id)

    def test_account_set_default_fail_wrong_account(self):
        """User try to set default on an account he doesn't belong too"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(f"/api/accounts/{self.wha.pk}/", {"default_version": self.ghi_version.pk})
        j = self.assertJSONResponse(response, 403)
        self.assertEqual(j, {"detail": "You do not have permission to perform this action."})

        # old default version
        old_version = self.wha.default_version
        self.wha.refresh_from_db()
        self.assertEqual(self.wha.default_version, old_version)

        # invert on the other account/user to be sure
        self.client.force_authenticate(self.john)
        response = self.client.put(f"/api/accounts/{self.ghi.pk}/", {"default_version": self.ghi_version.pk})
        j = self.assertJSONResponse(response, 403)
        self.assertEqual(j, {"detail": "You do not have permission to perform this action."})

        # old default version
        old_version = self.ghi.default_version
        self.ghi.refresh_from_db()
        self.assertEqual(self.ghi.default_version, old_version)

    def test_account_set_default_no_perm(self):
        """User without source perm cannot modify the default version"""
        # invert on the other account/user to be sure
        self.client.force_authenticate(self.jim)
        response = self.client.put(f"/api/accounts/{self.ghi.pk}/", {"default_version": self.ghi_version.pk})
        j = self.assertJSONResponse(response, 403)
        self.assertEqual(j, {"detail": "You do not have permission to perform this action."})

        # old default version
        old_version = self.ghi.default_version
        self.ghi.refresh_from_db()
        self.assertEqual(self.ghi.default_version, old_version)

    def test_cant_assign_source_version_from_different_account(self):
        self.client.force_authenticate(self.jane)
        response = self.client.put(f"/api/accounts/{self.ghi.pk}/", {"default_version": self.wha_version.pk})
        j = self.assertJSONResponse(response, 400)
        self.assertEqual(j, {"Error": "Account not allowed to access this default_source"})

    def test_switch_account(self):
        # Create a main user without profile
        main_user = m.User.objects.create(username="main_user")
        main_user.save()

        # And 2 account users with profile
        account_user_ghi = self.create_user_with_profile(username="User_A", account=self.ghi)
        m.TenantUser.objects.create(main_user=main_user, account_user=account_user_ghi)
        account_user_wha = self.create_user_with_profile(username="User_B", account=self.wha)
        m.TenantUser.objects.create(main_user=main_user, account_user=account_user_wha)

        self.client.force_authenticate(account_user_ghi)
        response = self.client.patch("/api/accounts/switch/", {"account_id": self.wha.pk})

        self.assertJSONResponse(response, 200)
        logged_in_user = auth.get_user(self.client)
        self.assertEqual(logged_in_user.iaso_profile.account.name, "Worldwide Health Aid")
