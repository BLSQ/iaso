from io import StringIO

from django.contrib import auth
from django.core import management

from iaso import models as m
from iaso.test import APITestCase


class FixUserRoleMismatchTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account1 = m.Account.objects.create(name="Account 1")
        cls.account2 = m.Account.objects.create(name="Account 2")

        cls.group1 = auth.models.Group.objects.create(name="group_1")
        cls.group2 = auth.models.Group.objects.create(name="group_2")
        cls.group3 = auth.models.Group.objects.create(name="group_3")

        cls.user_role1 = m.UserRole.objects.create(group=cls.group1, account=cls.account1)
        cls.user_role2 = m.UserRole.objects.create(group=cls.group2, account=cls.account1)
        cls.user_role3 = m.UserRole.objects.create(group=cls.group3, account=cls.account2)

        # User 1 has user_role1, but is missing group_1
        cls.user1 = cls.create_user_with_profile(
            username="user_1",
            account=cls.account1,
            user_roles=[cls.user_role1],
        )

        # Similar setup on a different account
        cls.user2 = cls.create_user_with_profile(
            username="user_2",
            account=cls.account2,
            user_roles=[cls.user_role3],
        )

    def test_fix_adds_missing_groups(self):
        self.assertEqual(self.user1.groups.count(), 0)
        self.assertEqual(self.user2.groups.count(), 0)

        out = StringIO()
        management.call_command("fix_user_role_mismatch", stdout=out)

        self.user1.refresh_from_db()
        self.user2.refresh_from_db()

        self.assertIn(self.group1, self.user1.groups.all())
        self.assertEqual(self.user1.groups.count(), 1)

        self.assertIn(self.group3, self.user2.groups.all())
        self.assertEqual(self.user2.groups.count(), 1)

    def test_dry_run(self):
        self.assertEqual(self.user1.groups.count(), 0)

        out = StringIO()
        management.call_command("fix_user_role_mismatch", "--dry-run", stdout=out)

        self.user1.refresh_from_db()
        self.assertEqual(self.user1.groups.count(), 0)

    def test_filter_by_account_id(self):
        self.assertEqual(self.user1.groups.count(), 0)
        self.assertEqual(self.user2.groups.count(), 0)

        out = StringIO()
        management.call_command("fix_user_role_mismatch", f"--account-id={self.account1.id}", stdout=out)

        self.user1.refresh_from_db()
        self.user2.refresh_from_db()

        # User 1 is fixed, User 2 still misses group_3
        self.assertIn(self.group1, self.user1.groups.all())
        self.assertEqual(self.user2.groups.count(), 0)

    def test_clean_extra_groups(self):
        """Executing with --clean-up-groups should remove groups associated with roles the user does not have"""
        self.user1.groups.add(self.group1)

        # Add group user1 is not supposed to have
        self.user1.groups.add(self.group2)

        self.assertEqual(self.user1.groups.count(), 2)

        out = StringIO()
        management.call_command("fix_user_role_mismatch", "--clean-up-groups", stdout=out)

        self.user1.refresh_from_db()

        # expecting group1 to be kept, group2 to be removed
        self.assertIn(self.group1, self.user1.groups.all())
        self.assertNotIn(self.group2, self.user1.groups.all())
        self.assertEqual(self.user1.groups.count(), 1)
