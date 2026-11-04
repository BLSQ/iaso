from iaso import models as m
from iaso.test import TestCase


class FeatureFlagsAfterAllMigrationsTestCase(TestCase):
    def test_mobile_change_requests_tab_has_no_configuration_schema(self):
        """A database created from scratch gets the test schema from 0001_squashed_0343, 0413 removes it."""
        self.assertIsNone(m.FeatureFlag.objects.get(code="MOBILE_CHANGE_REQUESTS_TAB").configuration_schema)
