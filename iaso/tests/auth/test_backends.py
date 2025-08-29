from django.contrib.auth import get_user_model
from django.test import RequestFactory

from iaso.auth.backends import MultiTenantAuthBackend
from iaso.models import Account, TenantUser
from iaso.test import TestCase


User = get_user_model()


class MultiTenantAuthBackendTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.backend = MultiTenantAuthBackend()
        cls.request = RequestFactory().get("/")
        cls.account1 = Account.objects.create(name="Account 1")
        cls.account2 = Account.objects.create(name="Account 2")

    def test_authenticate_with_no_user(self):
        result = self.backend.authenticate(self.request, username="nonexistent", password="password")
        self.assertIsNone(result)

    def test_authenticate_with_user_no_tenant_relationships(self):
        user = self.create_user_with_profile(username="single_user", account=self.account1)
        user.set_password("password")
        user.save()

        result = self.backend.authenticate(self.request, username="single_user", password="password")
        self.assertIsNone(result)

    def test_authenticate_with_tenant_users_returns_most_recent(self):
        main_user = User.objects.create(username="main_user")
        main_user.set_password("password")
        main_user.save()

        account_user1 = self.create_user_with_profile(username="account_user1", account=self.account1)
        account_user1.set_unusable_password()
        account_user1.last_login = "2025-09-01 10:00:00"
        account_user1.save()

        account_user2 = self.create_user_with_profile(username="account_user2", account=self.account2)
        account_user2.set_unusable_password()
        account_user2.last_login = "2025-09-01 10:00:01"  # Most recent.
        account_user2.save()

        TenantUser.objects.create(main_user=main_user, account_user=account_user1)
        TenantUser.objects.create(main_user=main_user, account_user=account_user2)
        self.assertEqual(main_user.tenant_users.count(), 2)

        result = self.backend.authenticate(self.request, username="main_user", password="password")
        self.assertEqual(result, account_user2)

    def test_authenticate_with_invalid_password(self):
        main_user = User.objects.create(username="main_user")
        main_user.set_password("password")
        main_user.save()

        result = self.backend.authenticate(self.request, username="main_user", password="wrong_password")
        self.assertIsNone(result)
