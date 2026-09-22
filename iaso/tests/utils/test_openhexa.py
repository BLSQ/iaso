from django.test import SimpleTestCase

from iaso.utils.openhexa import sanitize_openhexa_pipeline_config


class SanitizeOpenhexaPipelineConfigTestCase(SimpleTestCase):
    def test_replaces_all_null_lists(self):
        cleaned = sanitize_openhexa_pipeline_config(
            {
                "planning_id": 261,
                "org_unit_type_exceptions": [None, None, None],
                "connection_token": "token",
                "unused": None,
            }
        )
        self.assertEqual(
            cleaned,
            {
                "planning_id": 261,
                "org_unit_type_exceptions": ["", "", ""],
                "connection_token": "token",
            },
        )

    def test_replaces_mixed_nulls(self):
        cleaned = sanitize_openhexa_pipeline_config({"org_unit_type_exceptions": ["123", None, "456"]})
        self.assertEqual(cleaned, {"org_unit_type_exceptions": ["123", "", "456"]})

    def test_returns_non_dict_config_unchanged(self):
        self.assertIsNone(sanitize_openhexa_pipeline_config(None))
        self.assertEqual(sanitize_openhexa_pipeline_config(["already", "a", "list"]), ["already", "a", "list"])
        self.assertEqual(sanitize_openhexa_pipeline_config("not-a-dict"), "not-a-dict")
