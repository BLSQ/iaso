from django.contrib.auth.models import Permission, User

from hat.menupermissions.constants import (
    DEFAULT_ACCOUNT_FEATURE_FLAGS,
    MODULES,
)
from iaso import models as m
from iaso.test import APITestCase
from iaso.utils.module_permissions import account_module_permissions


class SetupAccountApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account(name="Zelda")
        source = m.DataSource.objects.create(name="Korogu")
        cls.source = source
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()
        cls.account = account
        cls.MODULES = [module["codename"] for module in MODULES]
        user = m.User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = m.Profile(user=user, account=account)
        p.save()
        cls.user = user

        admin = m.User.objects.create_superuser(username="zelda", password="tiredofplayingthesameagain")
        cls.admin = admin

        user1 = m.User.objects.create_superuser(username="user1", password="tiredofplayingthesameagain")
        cls.user1 = user1

    def test_setupaccount_unauthorized(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/setupaccount/", data={}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_setupaccount_duplicate_account(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Zelda",
            "user_username": "unittest_username",
            "password": "unittest_password",
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("account_name", j)

    def test_setupaccount_duplicate_datasource(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Korogu",
            "user_username": "unittest_username",
            "password": "unittest_password",
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("account_name", j)

    def test_setupaccount_duplicate_user(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "link",
            "password": "unittest_password",
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_username", j)

    def test_setupaccount_create(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)

    def test_setup_account_create_with_first_last_name(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_first_name": "unittest_first_name",
            "user_last_name": "unittest_last_name",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)

    def test_setup_account_has_all_perms(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        user = User.objects.get(username="unittest_username")

        has_all_perms = True

        account = m.Account.objects.filter(name="unittest_account")
        modules_permissions = account_module_permissions(account.first().modules)

        for perm in Permission.objects.filter(codename__in=modules_permissions):
            if perm not in user.user_permissions.all():
                has_all_perms = False

        self.assertEqual(response.status_code, 201)
        self.assertEqual(account.count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)
        self.assertEqual(has_all_perms, True)

    def test_setup_account_project_creation(self):
        self.client.force_authenticate(self.admin)

        data = {
            "account_name": "initial_project_account test-appid",
            "user_username": "username",
            "password": "password",
            "modules": self.MODULES,
        }

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        created_account = m.Account.objects.filter(name="initial_project_account test-appid")
        created_project = m.Project.objects.filter(name="Main Project")
        created_data_source = m.DataSource.objects.filter(name="initial_project_account test-appid")
        self.assertEqual(len(created_project), 1)

        project = created_project.first()
        # Check if the project has the correct app_id
        self.assertEqual(project.app_id, "initial_project_account.test.appid")
        # Check if the project is linked to the correct account
        self.assertEqual(project.account, created_account.first())
        # Check if the project is linked to the correct data source
        data_source = created_data_source.first()
        project_data_sources = project.data_sources.filter(pk=data_source.id)
        self.assertEqual(project_data_sources.first(), data_source)

    def test_setup_account_with_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": self.MODULES,
            "feature_flags": [
                "ALLOW_CATCHMENT_EDITION",
                "SHOW_PAGES",
                "SHOW_LINK_INSTANCE_REFERENCE",
                "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
                "SHOW_HOME_ONLINE",
            ],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        account = response.json()
        self.assertEqual(account["feature_flags"], data["feature_flags"])

    def test_setup_account_without_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        created_account = m.Account.objects.filter(name="account with no feature test-featureappid")
        feature_flags = created_account.first().feature_flags.values_list("code", flat=True)
        self.assertEqual(sorted(feature_flags), sorted(DEFAULT_ACCOUNT_FEATURE_FLAGS))

    def test_setup_account_with_at_leat_an_invalid_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": ["Unknown", "Test", "SHOW_HOME_ONLINE"],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["invalid_account_feature_flag"])

    def test_setup_account_with_None_value_as_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with None feature flag test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": None,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["This field may not be null."])

    def test_setup_account_with_empty_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account empty feature flag test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": [],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["feature_flags_empty"])

    def test_create_new_account_with_user_multi_account(self):
        new_user = m.User.objects.create(username=self.account, is_superuser=True)
        m.TenantUser.objects.create(main_user=self.user1, account_user=new_user)

        self.client.force_authenticate(new_user)

        data = {
            "account_name": "account_multi_account",
            "user_username": "username",
            "password": "password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["account_name"], data["account_name"])

    def test_create_new_account_via_no_super_user_multi_account(self):
        new_user = m.User.objects.create(
            username=self.account,
        )
        m.TenantUser.objects.create(main_user=self.user1, account_user=new_user)
        self.client.force_authenticate(new_user)
        data = {
            "account_name": "account_multi_account",
            "user_username": "username",
            "password": "password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["detail"],
            "You do not have permission to perform this action.",
        )
