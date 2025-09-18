import unittest

from types import SimpleNamespace

from django.contrib.auth.models import Permission
from rest_framework.exceptions import PermissionDenied

from iaso.permissions.base import ALL_PERMISSIONS
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION
from iaso.permissions.utils import load_permissions_from_module, raise_error_if_user_lacks_admin_permission
from iaso.test import IasoTestCaseMixin, TestCase


class TestLoadPermissions(unittest.TestCase):
    # Nonsense constants to simulate possible values
    core_permissions = {
        "core": "this should be a permission instead, but it doesn't matter",
        "core_2": "same thing",
    }
    core_permission_models = ["SomeModel", "AnotherModel"]

    def setUp(self):
        # Reset globals before each test
        self.mock_module = SimpleNamespace(
            permissions=self.core_permissions,
            permission_models=self.core_permission_models,
        )

    def test_load_initial_permissions(self):
        """
        Test that the initial permissions are correctly loaded.
        This simulates the loading of permissions from the core module.
        """
        # Checking initial state: {}
        permissions = {}
        permission_classes = []

        load_permissions_from_module(self.mock_module, permissions, permission_classes)

        # Checking result
        self.assertEqual(permissions, self.core_permissions)
        self.assertEqual(permission_classes, self.core_permission_models)

    def test_load_more_permissions(self):
        """
        Test that permission data is merged when there are already existing permissions.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        """
        # Preload with some initial permissions
        permissions = {}
        permission_classes = []
        load_permissions_from_module(self.mock_module, permissions, permission_classes)

        plugin_permissions = {"plugin": "a plugin permission"}
        plugin_permission_models = ["PluginModel", "AnotherPluginModel"]

        mock_plugin_permissions = SimpleNamespace(
            permissions=plugin_permissions,
            permission_models=plugin_permission_models,
        )

        load_permissions_from_module(mock_plugin_permissions, permissions, permission_classes)

        # Expecting dicts to be merged
        expected_permissions = self.core_permissions | plugin_permissions
        expected_permission_models = self.core_permission_models + plugin_permission_models

        self.assertEqual(permissions, expected_permissions)
        self.assertEqual(permission_classes, expected_permission_models)

    def test_load_more_permissions_with_conflict(self):
        """
        Test that a ValueError is raised if permissions with the same name are loaded.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        This scenario should not happen in practice, but it's good to test how the system behaves with
        conflicting permissions.
        """
        # Preload with some initial permissions
        permissions = {}
        permission_classes = []
        load_permissions_from_module(self.mock_module, permissions, permission_classes)

        plugin_permissions = {
            "core": "uh oh this is going to fail"  # conflicting key - permissions shouldn't have the same name
        }

        mock_plugin_permissions = SimpleNamespace(
            permissions=plugin_permissions,
            permission_models=[],
        )

        with self.assertRaises(ValueError) as e:
            load_permissions_from_module(mock_plugin_permissions, permissions, permission_classes)
            self.assertEqual(str(e.exception), "Duplicate permission name: core")


class TestRaiseErrorOnAdminPermission(TestCase, IasoTestCaseMixin):
    def setUp(self):
        # Preparing test data
        self.account, _, _, _ = self.create_account_datasource_version_project("source", "account", "project")
        self.user = self.create_user_with_profile(account=self.account, username="user 1")

    def test_no_error_if_not_requesting_admin_permission(self):
        permissions = ALL_PERMISSIONS
        permissions.pop(CORE_USERS_ADMIN_PERMISSION.codename)
        requested_permission_names = list(permissions.keys())

        # Should not raise any error
        raise_error_if_user_lacks_admin_permission(self.user, requested_permission_names)

        self.assertEqual(self.user.user_permissions.count(), 0)

    def test_error_missing_permission(self):
        permissions = ALL_PERMISSIONS
        requested_permission_names = list(permissions.keys())

        self.assertEqual(self.user.user_permissions.count(), 0)

        with self.assertRaises(PermissionDenied) as e:
            raise_error_if_user_lacks_admin_permission(self.user, requested_permission_names)
            self.assertEqual(
                str(e.exception),
                f"Only users with {CORE_USERS_ADMIN_PERMISSION} permission can grant {CORE_USERS_ADMIN_PERMISSION} permission",
            )

    def test_no_error_with_admin_permission(self):
        permissions = ALL_PERMISSIONS
        requested_permission_names = list(permissions.keys())

        django_perm = Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.codename)
        self.user.user_permissions.set([django_perm])

        # Should not raise any error
        raise_error_if_user_lacks_admin_permission(self.user, requested_permission_names)

        self.assertEqual(self.user.user_permissions.count(), 1)
