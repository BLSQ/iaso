import unittest

from types import SimpleNamespace

from hat.menupermissions import constants


class TestLoadPermissions(unittest.TestCase):
    # Nonsense constants to simulate possible values
    CORE_READ_EDIT_PERMISSIONS = {
        "core": {
            "read": "core_read",
            "write": "core_write",
        }
    }
    CORE_PERMISSIONS_PRESENTATION = {
        "core_group": ["core_perm1", "core_perm2"],
        "core_module": ["core_perm3"],
    }
    CORE_MODULE_PERMISSIONS = {
        "CORE_MOD": ["core_perm4", "core_perm5"],
        "CORE_MOD2": ["core_perm6"],
    }

    def setUp(self):
        # Reset globals before each test
        constants.READ_EDIT_PERMISSIONS.clear()
        constants.PERMISSIONS_PRESENTATION.clear()
        constants.MODULE_PERMISSIONS.clear()
        self.mock_module = SimpleNamespace(
            read_edit_permissions=self.CORE_READ_EDIT_PERMISSIONS,
            permissions_presentation=self.CORE_PERMISSIONS_PRESENTATION,
            module_permissions=self.CORE_MODULE_PERMISSIONS,
        )

    def test_load_initial_permissions(self):
        """
        Test that the initial permissions are correctly loaded.
        This simulates the loading of permissions from the core module.
        """
        # Checking initial state: {}
        self.assertEqual(constants.READ_EDIT_PERMISSIONS, {})
        self.assertEqual(constants.PERMISSIONS_PRESENTATION, {})
        self.assertEqual(constants.MODULE_PERMISSIONS, {})

        constants.load_permissions_from_permissions_module(self.mock_module)

        # Checking result
        self.assertEqual(constants.READ_EDIT_PERMISSIONS, self.CORE_READ_EDIT_PERMISSIONS)
        self.assertEqual(constants.PERMISSIONS_PRESENTATION, self.CORE_PERMISSIONS_PRESENTATION)
        self.assertEqual(constants.MODULE_PERMISSIONS, self.CORE_MODULE_PERMISSIONS)

    def test_load_more_permissions(self):
        """
        Test that the permission dicts are merged when there are already existing permissions.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        """
        # Preload with some initial permissions
        constants.load_permissions_from_permissions_module(self.mock_module)

        plugin_read_edit_permissions = {
            "plugin": {
                "read": "plugin_read",
                "write": "plugin_write",
            }
        }
        plugin_permissions_presentation = {
            "plugin_group": ["plugin_perm1", "plugin_perm2"],
            "plugin_module": ["plugin_perm3"],
        }
        plugin_module_permissions = {
            "PLUGIN_MOD": ["plugin_perm4", "plugin_perm5"],
            "PLUGIN_MOD2": ["plugin_perm6"],
        }

        mock_plugin_permissions = SimpleNamespace(
            read_edit_permissions=plugin_read_edit_permissions,
            permissions_presentation=plugin_permissions_presentation,
            module_permissions=plugin_module_permissions,
        )

        constants.load_permissions_from_permissions_module(mock_plugin_permissions)

        # Expecting dicts to be merged
        expected_read_edit_permissions = self.CORE_READ_EDIT_PERMISSIONS | plugin_read_edit_permissions
        expected_permissions_presentation = self.CORE_PERMISSIONS_PRESENTATION | plugin_permissions_presentation
        expected_module_permissions = self.CORE_MODULE_PERMISSIONS | plugin_module_permissions

        self.assertEqual(constants.READ_EDIT_PERMISSIONS, expected_read_edit_permissions)
        self.assertEqual(constants.PERMISSIONS_PRESENTATION, expected_permissions_presentation)
        self.assertEqual(constants.MODULE_PERMISSIONS, expected_module_permissions)

    def test_load_more_permissions_with_conflict(self):
        """
        Test that the permission dicts are merged when there are already existing permissions, even with conflicts.
        This simulates the loading of permissions from a plugin once the core permissions are loaded.
        This scenario should not happen in practice, but it's good to test how the system behaves with
        conflicting permissions.
        """
        # Preload with some initial permissions
        constants.load_permissions_from_permissions_module(self.mock_module)

        plugin_read_edit_permissions = {
            "core": {  # conflicting key - it should be the name of the plugin instead
                "read": "plugin_read",
                "write": "plugin_write",
            }
        }

        mock_plugin_permissions = SimpleNamespace(
            read_edit_permissions=plugin_read_edit_permissions,
            permissions_presentation={},
            module_permissions={},
        )

        constants.load_permissions_from_permissions_module(mock_plugin_permissions)

        self.assertEqual(
            constants.READ_EDIT_PERMISSIONS, plugin_read_edit_permissions
        )  # The plugin overwrites the core permissions
        self.assertEqual(constants.PERMISSIONS_PRESENTATION, self.CORE_PERMISSIONS_PRESENTATION)
        self.assertEqual(constants.MODULE_PERMISSIONS, self.CORE_MODULE_PERMISSIONS)
