from django.contrib.auth.models import User

from iaso.models import Account, Workspace
from iaso.test import TestCase


CHANGELIST_URL = "/admin/iaso/workspace/"


class WorkspaceAdminTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser("admin", "admin@example.com", "password")
        cls.account = Account.objects.create(name="Account")
        cls.workspace = Workspace.objects.create(account=cls.account, name="Planning")
        cls.deleted_workspace = Workspace.objects.create(account=cls.account, name="Old planning")
        cls.deleted_workspace.delete()

    def setUp(self):
        self.client.force_login(self.admin_user)

    def test_changelist_lists_soft_deleted_workspaces_too(self):
        response = self.client.get(CHANGELIST_URL)

        self.assertEqual(response.status_code, 200)
        listed = set(response.context["cl"].queryset)
        self.assertEqual(listed, {self.workspace, self.deleted_workspace})

    def test_add_sets_the_current_user_as_creator(self):
        response = self.client.post(
            f"{CHANGELIST_URL}add/", {"account": self.account.id, "name": "Partner", "description": ""}
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Workspace.objects.get(name="Partner").created_by, self.admin_user)

    def test_delete_is_not_offered(self):
        response = self.client.get(f"{CHANGELIST_URL}{self.workspace.id}/delete/")

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Workspace.objects.filter(id=self.workspace.id).exists())
