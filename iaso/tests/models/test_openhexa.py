from django.db import IntegrityError
from django.test import TestCase

from iaso.models import Account, OpenHEXAInstance, OpenHEXAWorkspace


class OpenHEXAInstanceTestCase(TestCase):
    def test_create_openhexa_instance(self):
        instance = OpenHEXAInstance.objects.create(
            name="OpenHEXA Prod",
            url="https://app.openhexa.org",
            token="a-valid-api-token",
            description="Production instance",
        )

        self.assertEqual(instance.name, "OpenHEXA Prod")
        self.assertEqual(instance.url, "https://app.openhexa.org")
        self.assertEqual(instance.token, "a-valid-api-token")
        self.assertEqual(instance.description, "Production instance")
        self.assertIsNotNone(instance.created_at)
        self.assertIsNotNone(instance.updated_at)

    def test_openhexa_instance_unique_name_constraint(self):
        OpenHEXAInstance.objects.create(
            name="Duplicate Name",
            url="https://first.openhexa.org",
            token="token1",
        )

        with self.assertRaises(IntegrityError) as err:
            OpenHEXAInstance.objects.create(
                name="Duplicate Name",
                url="https://second.openhexa.org",
                token="token2",
            )
        self.assertIn("duplicate key value violates unique constraint", str(err.exception))

    def test_openhexa_instance_encrypted_token_field(self):
        instance = OpenHEXAInstance.objects.create(
            name="Token Test",
            url="https://tokentest.openhexa.org",
            token="secret-token-value",
        )
        self.assertEqual(instance.token, "secret-token-value")


class OpenHEXAWorkspaceTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="Test Account")
        self.openhexa_instance = OpenHEXAInstance.objects.create(
            name="Test Instance",
            url="https://test.openhexa.org",
            token="test-token",
        )

    def test_create_openhexa_workspace(self):
        workspace = OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="test-workspace",
            description="Test workspace description",
            config={"key": "value", "nested": {"param": 123}},
        )

        self.assertEqual(workspace.openhexa_instance, self.openhexa_instance)
        self.assertEqual(workspace.account, self.account)
        self.assertEqual(workspace.slug, "test-workspace")
        self.assertEqual(workspace.description, "Test workspace description")
        self.assertEqual(workspace.config, {"key": "value", "nested": {"param": 123}})
        self.assertIsNotNone(workspace.created_at)
        self.assertIsNotNone(workspace.updated_at)
        self.assertIsNone(workspace.deleted_at)

    def test_openhexa_workspace_unique_together_constraint(self):
        OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="duplicate-slug",
        )

        with self.assertRaises(IntegrityError) as err:
            OpenHEXAWorkspace.objects.create(
                openhexa_instance=self.openhexa_instance,
                account=self.account,
                slug="duplicate-slug",
            )
        self.assertIn("duplicate key value violates unique constraint", str(err.exception))

    def test_openhexa_workspace_default_config_empty_dict(self):
        workspace = OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="default-config",
        )
        self.assertEqual(workspace.config, {})

    def test_openhexa_workspace_related_name(self):
        workspace1 = OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="workspace1",
        )
        workspace2 = OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="workspace2",
        )

        related_workspaces = self.openhexa_instance.openhexa_workspaces.all()
        self.assertEqual(related_workspaces.count(), 2)
        self.assertIn(workspace1, related_workspaces)
        self.assertIn(workspace2, related_workspaces)

    def test_openhexa_workspace_soft_deletion(self):
        workspace = OpenHEXAWorkspace.objects.create(
            openhexa_instance=self.openhexa_instance,
            account=self.account,
            slug="soft-delete-test",
        )
        self.assertIsNone(workspace.deleted_at)
        workspace.delete()

        workspace.refresh_from_db()
        self.assertIsNotNone(workspace.deleted_at)
        self.assertFalse(OpenHEXAWorkspace.objects.filter(id=workspace.id).exists())
        self.assertTrue(OpenHEXAWorkspace.objects_include_deleted.filter(id=workspace.id).exists())
