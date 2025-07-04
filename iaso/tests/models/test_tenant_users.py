from iaso import models as m
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError, get_unique_username
from iaso.test import TestCase


class TenantUserModelTestCase(TestCase):
    """
    Test `TenantUser` model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user_creation_data = UserCreationData(
            username="john_doe",
            email="john@doe.com",
            first_name="John",
            last_name="Doe",
            account=cls.account,
        )

    def test_get_unique_username(self):
        username = "user"
        account_name = "account foo"
        unique_username = get_unique_username(username, account_name)
        self.assertEqual(unique_username, "user_account_foo")

        username = "x" * m.User._meta.get_field("username").max_length
        account_name = "too_long"
        unique_username = get_unique_username(username, account_name)
        self.assertEqual(len(unique_username), 150)

    def test_create_user_or_tenant_user_with_no_preexisting_user(self):
        """
        No preexisting user.
        """
        m.TenantUser.objects.create_user_or_tenant_user(data=self.user_creation_data)

        # Users.
        self.assertEqual(m.User.objects.count(), 1)
        user = m.User.objects.get(username=self.user_creation_data.username)
        self.assertEqual(user.email, self.user_creation_data.email)
        self.assertEqual(user.first_name, self.user_creation_data.first_name)
        self.assertEqual(user.last_name, self.user_creation_data.last_name)

        # Tenant Users.
        self.assertEqual(m.TenantUser.objects.count(), 0)

        # Iaso Profiles.
        self.assertFalse(hasattr(user, "iaso_profile"))

    def test_create_user_or_tenant_user_with_preexisting_user_for_same_account(self):
        self.create_user_with_profile(
            username=self.user_creation_data.username, email=self.user_creation_data.email, account=self.account
        )
        with self.assertRaises(UsernameAlreadyExistsError):
            m.TenantUser.objects.create_user_or_tenant_user(data=self.user_creation_data)

    def test_create_user_or_tenant_user_for_preexisting_user_with_multiple_account(self):
        """
        The user already exists and has multiple accounts: add an account.
        """
        main_user = m.User.objects.create(username=self.user_creation_data.username, email="john@doe.com")
        main_user.set_password("p4ssword")
        main_user.save()

        account_1 = m.Account.objects.create(name="Account 1")
        account_user_1 = self.create_user_with_profile(
            username="john_doe_account_1", email="john@doe.com", account=account_1
        )
        m.TenantUser.objects.create(main_user=main_user, account_user=account_user_1)

        account_2 = m.Account.objects.create(name="Account 2")
        account_user_2 = self.create_user_with_profile(
            username="john_doe_account_2", email="john@doe.com", account=account_2
        )
        m.TenantUser.objects.create(main_user=main_user, account_user=account_user_2)

        self.assertEqual(m.User.objects.count(), 3)
        self.assertEqual(m.TenantUser.objects.count(), 2)

        m.TenantUser.objects.create_user_or_tenant_user(data=self.user_creation_data)

        # Users.
        self.assertEqual(m.User.objects.count(), 4)
        main_user = m.User.objects.get(username="john_doe")
        account_user_1 = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, account_1.name)
        )
        account_user_2 = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, account_2.name)
        )
        account_user_3 = new_user = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, self.user_creation_data.account.name)
        )

        self.assertEqual(new_user.email, self.user_creation_data.email)
        self.assertEqual(new_user.first_name, self.user_creation_data.first_name)
        self.assertEqual(new_user.last_name, self.user_creation_data.last_name)

        self.assertEqual(main_user.check_password("p4ssword"), True)
        self.assertFalse(new_user.has_usable_password())

        # Tenant Users.
        self.assertEqual(m.TenantUser.objects.count(), 3)
        self.assertCountEqual(
            main_user.tenant_users.values_list("account_user", flat=True),
            [account_user_1.pk, account_user_2.pk, account_user_3.pk],
        )

        self.assertEqual(new_user.tenant_user.main_user, main_user)

        # Iaso Profiles.
        self.assertFalse(hasattr(new_user, "iaso_profile"))

    def test_create_user_or_tenant_user_for_preexisting_user_without_multiple_account(self):
        """
        The user already a single account: we switch him into multiple accounts mode.
        """
        other_account = m.Account.objects.create(name="Other Account")
        other_account_user = self.create_user_with_profile(
            username=self.user_creation_data.username, email="john@doe.com", account=other_account
        )
        other_account_user.set_password("p4ssword")
        other_account_user.save()

        self.assertEqual(m.User.objects.count(), 1)
        self.assertEqual(m.TenantUser.objects.count(), 0)

        m.TenantUser.objects.create_user_or_tenant_user(data=self.user_creation_data)

        # Users.
        self.assertEqual(m.User.objects.count(), 3)
        main_user = m.User.objects.get(username="john_doe")
        account_user_1 = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, other_account.name)
        )
        account_user_2 = new_user = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, self.user_creation_data.account.name)
        )

        self.assertEqual(new_user.email, self.user_creation_data.email)
        self.assertEqual(new_user.first_name, self.user_creation_data.first_name)
        self.assertEqual(new_user.last_name, self.user_creation_data.last_name)

        self.assertEqual(main_user.check_password("p4ssword"), True)
        self.assertFalse(account_user_1.has_usable_password())
        self.assertFalse(account_user_2.has_usable_password())

        # Tenant Users.
        self.assertEqual(m.TenantUser.objects.count(), 2)
        self.assertCountEqual(
            main_user.tenant_users.values_list("account_user", flat=True), [account_user_1.pk, account_user_2.pk]
        )

        # Iaso Profiles.
        self.assertFalse(hasattr(main_user, "iaso_profile"))
        self.assertTrue(hasattr(account_user_1, "iaso_profile"))

    def test_create_user_or_tenant_user_for_preexisting_user_without_profile(self):
        """
        The user already exists and doesn't have a profile.
        """
        user = m.User.objects.create(username=self.user_creation_data.username, email="john@doe.com")
        user.set_password("p4ssword")
        user.save()

        m.TenantUser.objects.create_user_or_tenant_user(data=self.user_creation_data)

        # Users.
        self.assertEqual(m.User.objects.count(), 2)
        main_user = m.User.objects.get(id=user.pk)
        account_user = m.User.objects.get(
            username=get_unique_username(self.user_creation_data.username, self.user_creation_data.account.name)
        )

        self.assertEqual(account_user.email, self.user_creation_data.email)
        self.assertEqual(account_user.first_name, self.user_creation_data.first_name)
        self.assertEqual(account_user.last_name, self.user_creation_data.last_name)

        self.assertEqual(main_user.check_password("p4ssword"), True)
        self.assertFalse(account_user.has_usable_password())

        # Tenant Users.
        self.assertEqual(m.TenantUser.objects.count(), 1)
        self.assertCountEqual(main_user.tenant_users.values_list("account_user", flat=True), [account_user.pk])

        # Iaso Profiles.
        self.assertFalse(hasattr(main_user, "iaso_profile"))
