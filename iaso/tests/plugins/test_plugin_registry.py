from django.test import SimpleTestCase, override_settings

from iaso.plugins import extra_org_unit_permissions, plugin_log_access


class PluginRegistryTest(SimpleTestCase):
    @override_settings(PLUGINS=[])
    def test_empty_plugin_list(self):
        self.assertEqual(extra_org_unit_permissions(object()), [])
        self.assertIsNone(plugin_log_access(object(), object()))

    @override_settings(PLUGINS=["not_a_real_plugin"])
    def test_plugin_without_settings_is_skipped(self):
        self.assertEqual(extra_org_unit_permissions(object()), [])
        self.assertIsNone(plugin_log_access(object(), object()))
