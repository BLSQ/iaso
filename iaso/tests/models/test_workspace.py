from django.db import IntegrityError

from iaso.models import Account, Workspace
from iaso.test import TestCase


class WorkspaceModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")

    def test_workspace_name_is_unique_per_account(self):
        Workspace.objects.create(account=self.account, name="Planning")

        with self.assertRaises(IntegrityError):
            Workspace.objects.create(account=self.account, name="Planning")

    def test_same_workspace_name_allowed_in_another_account(self):
        other_account = Account.objects.create(name="Other account")
        Workspace.objects.create(account=self.account, name="Planning")

        Workspace.objects.create(account=other_account, name="Planning")

        self.assertEqual(Workspace.objects.filter(name="Planning").count(), 2)

    def test_soft_deleted_workspace_frees_its_name_and_is_hidden_by_default(self):
        deleted_workspace = Workspace.objects.create(account=self.account, name="Planning")
        deleted_workspace.delete()

        new_workspace = Workspace.objects.create(account=self.account, name="Planning")

        self.assertEqual(list(self.account.workspaces.all()), [new_workspace])
        self.assertEqual(list(Workspace.objects_only_deleted.all()), [deleted_workspace])
