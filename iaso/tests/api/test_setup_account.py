from django.contrib.auth.models import User, Permission

from hat.menupermissions.models import CustomPermissionSupport
from iaso import models as m
from iaso.test import APITestCase


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

        user = m.User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = m.Profile(user=user, account=account)
        p.save()
        cls.user = user

        admin = m.User.objects.create_superuser(username="zelda", password="tiredofplayingthesameagain")
        cls.admin = admin

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
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        user = User.objects.get(username="unittest_username")

        has_all_perms = True

        for perm in Permission.objects.filter(
            codename__in=CustomPermissionSupport.DEFAULT_PERMISSIONS_FOR_NEW_ACCOUNT_USER
        ):
            if perm not in user.user_permissions.all():
                has_all_perms = False

        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)
        self.assertEqual(has_all_perms, True)
