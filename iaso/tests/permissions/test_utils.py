import unittest

from types import SimpleNamespace

from iaso.permissions import base
from iaso.permissions.utils import load_permissions_from_module


class TestLoadPermissions(unittest.TestCase):
    # Nonsense constants to simulate possible values
    core_permissions = {
        "core": "this should be a permission instead, but it doesn't matter",
        "core_2": "same thing",
    }
    core_permission_models = ["SomeModel", "AnotherModel"]

    def setUp(self):
        # Reset globals before each test
        base.ALL_PERMISSIONS.clear()
        base.PERMISSION_CLASSES.clear()
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
        self.assertEqual(base.ALL_PERMISSIONS, {})
        self.assertEqual(base.PERMISSION_CLASSES, [])

        load_permissions_from_module(self.mock_module, base.ALL_PERMISSIONS, base.PERMISSION_CLASSES)

        # Checking result
        self.assertEqual(base.ALL_PERMISSIONS, self.core_permissions)
        self.assertEqual(base.PERMISSION_CLASSES, self.core_permission_models)

    def test_load_more_permissions(self):
        """
        Test that permission data is merged when there are already existing permissions.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        """
        # Preload with some initial permissions
        load_permissions_from_module(self.mock_module, base.ALL_PERMISSIONS, base.PERMISSION_CLASSES)

        plugin_permissions = {"plugin": "a plugin permission"}
        plugin_permission_models = ["PluginModel", "AnotherPluginModel"]

        mock_plugin_permissions = SimpleNamespace(
            permissions=plugin_permissions,
            permission_models=plugin_permission_models,
        )

        load_permissions_from_module(mock_plugin_permissions, base.ALL_PERMISSIONS, base.PERMISSION_CLASSES)

        # Expecting dicts to be merged
        expected_permissions = self.core_permissions | plugin_permissions
        expected_permission_models = self.core_permission_models + plugin_permission_models

        self.assertEqual(base.ALL_PERMISSIONS, expected_permissions)
        self.assertEqual(base.PERMISSION_CLASSES, expected_permission_models)

    def test_load_more_permissions_with_conflict(self):
        """
        Test that a ValueError is raised if permissions with the same name are loaded.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        This scenario should not happen in practice, but it's good to test how the system behaves with
        conflicting permissions.
        """
        # Preload with some initial permissions
        load_permissions_from_module(self.mock_module, base.ALL_PERMISSIONS, base.PERMISSION_CLASSES)

        plugin_permissions = {
            "core": "uh oh this is going to fail"  # conflicting key - permissions shouldn't have the same name
        }

        mock_plugin_permissions = SimpleNamespace(
            permissions=plugin_permissions,
            permission_models=[],
        )

        with self.assertRaises(ValueError) as e:
            load_permissions_from_module(mock_plugin_permissions, base.ALL_PERMISSIONS, base.PERMISSION_CLASSES)
            self.assertEqual(str(e.exception), "Duplicate permission name: core")
