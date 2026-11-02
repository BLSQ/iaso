from iaso import models as m
from iaso.test import IasoMigratorTestCase, TestCase


MIGRATE_FROM = ("iaso", "0412_team_updated_by_alter_team_created_by")
MIGRATE_TO = ("iaso", "0413_remove_mobile_change_requests_tab_test_schema")

TEST_SCHEMA = {"test": {"type": "string", "default": "Hit me baby one more time", "description": "Whatever you want"}}
REAL_SCHEMA = {"radius": {"type": "int", "default": 50, "description": "Search radius in meters"}}


class Test0413RemovesTheTestSchema(IasoMigratorTestCase):
    migrate_from = MIGRATE_FROM
    migrate_to = MIGRATE_TO

    def prepare(self):
        FeatureFlag = self.old_state.apps.get_model("iaso", "FeatureFlag")
        # Set explicitly: databases older than the squashed migration may have added it by hand
        FeatureFlag.objects.filter(code="MOBILE_CHANGE_REQUESTS_TAB").update(configuration_schema=TEST_SCHEMA)
        FeatureFlag.objects.filter(code="MOBILE_SELECT_CLOSEST_ORG_UNIT").update(configuration_schema=TEST_SCHEMA)

    def test_migration(self):
        FeatureFlag = self.new_state.apps.get_model("iaso", "FeatureFlag")
        self.assertIsNone(FeatureFlag.objects.get(code="MOBILE_CHANGE_REQUESTS_TAB").configuration_schema)
        self.assertEqual(
            TEST_SCHEMA,
            FeatureFlag.objects.get(code="MOBILE_SELECT_CLOSEST_ORG_UNIT").configuration_schema,
            "only MOBILE_CHANGE_REQUESTS_TAB must be changed",
        )


class Test0413KeepsAnotherSchema(IasoMigratorTestCase):
    migrate_from = MIGRATE_FROM
    migrate_to = MIGRATE_TO

    def prepare(self):
        FeatureFlag = self.old_state.apps.get_model("iaso", "FeatureFlag")
        FeatureFlag.objects.filter(code="MOBILE_CHANGE_REQUESTS_TAB").update(configuration_schema=REAL_SCHEMA)

    def test_migration(self):
        FeatureFlag = self.new_state.apps.get_model("iaso", "FeatureFlag")
        self.assertEqual(
            REAL_SCHEMA,
            FeatureFlag.objects.get(code="MOBILE_CHANGE_REQUESTS_TAB").configuration_schema,
            "a schema other than the test one must be kept",
        )


class Test0413WithoutTheFeatureFlag(IasoMigratorTestCase):
    migrate_from = MIGRATE_FROM
    migrate_to = MIGRATE_TO

    def prepare(self):
        FeatureFlag = self.old_state.apps.get_model("iaso", "FeatureFlag")
        FeatureFlag.objects.filter(code="MOBILE_CHANGE_REQUESTS_TAB").delete()

    def test_migration(self):
        # Migrated without error (setUp), and the flag isn't created back
        FeatureFlag = self.new_state.apps.get_model("iaso", "FeatureFlag")
        self.assertFalse(FeatureFlag.objects.filter(code="MOBILE_CHANGE_REQUESTS_TAB").exists())


class FeatureFlagsAfterAllMigrationsTestCase(TestCase):
    def test_mobile_change_requests_tab_has_no_configuration_schema(self):
        """A database created from scratch gets the test schema from 0001_squashed_0343, 0413 removes it."""
        self.assertIsNone(m.FeatureFlag.objects.get(code="MOBILE_CHANGE_REQUESTS_TAB").configuration_schema)
