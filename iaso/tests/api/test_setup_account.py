from django.contrib.auth.models import User, Permission

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

    def test_setupaccount_create_with_first_last_name(self):
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

    def test_setupaccount_has_all_perms(self):
        DEFAULT_PERMISSIONS_FOR_NEW_SETUP_ACCOUNT_USER = [
            "iaso_forms",
            "iaso_submissions",
            "iaso_mappings",
            "iaso_completeness",
            "iaso_org_units",
            "iaso_links",
            "iaso_users",
            "iaso_projects",
            "iaso_sources",
            "iaso_data_tasks",
            "iaso_reports",
            "x_modifications",
            "x_management_teams",
            "x_management_users",
            "iaso_forms",
            "iaso_mappings",
            "iaso_completeness",
            "iaso_org_units",
            "iaso_registry",
            "iaso_links",
            "iaso_users",
            "iaso_pages",
            "iaso_projects",
            "iaso_sources",
            "iaso_data_tasks",
            "iaso_polio",
            "iaso_polio_config",
            "iaso_submissions",
            "iaso_update_submission",
            "iaso_planning",
            "iaso_reports",
            "iaso_teams",
            "iaso_assignments",
            "iaso_polio_budget",
            "iaso_entities",
            "iaso_storages",
            "iaso_completeness_stats",
            "iaso_workflows",
            "iaso_polio_budget_admin",
            "iaso_entity_duplicates_read",
            "iaso_entity_duplicates_write",
            "iaso_user_roles",
            "iaso_datastore_read",
            "iaso_datastore_write",
            "iaso_org_unit_types",
            "iaso_org_unit_groups",
        ]
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        user = User.objects.get(username="unittest_username")

        has_all_perms = True

        for perm in Permission.objects.filter(codename__in=DEFAULT_PERMISSIONS_FOR_NEW_SETUP_ACCOUNT_USER):
            if perm not in user.user_permissions.all():
                has_all_perms = False

        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)
        self.assertEqual(has_all_perms, True)
