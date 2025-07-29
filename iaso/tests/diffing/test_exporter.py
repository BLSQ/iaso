import logging

from iaso.diffing import Differ
from iaso.diffing.exporter import assign_dhis2_ids
from iaso.tests.diffing.utils import PyramidBaseTest


test_logger = logging.getLogger(__name__)


class ExporterTestCase(PyramidBaseTest):
    """
    Test Exporter.
    """

    def test_assign_dhis2_ids(self):
        """
        Test `assign_dhis2_ids()`.
        """

        # Simulate an org unit existing only in one pyramid.
        self.angola_country_to_update.delete()

        # Set `source_ref` to None or empty string (this is possible because of `blank=True` on the model field).
        self.angola_country_to_compare_with.source_ref = None
        self.angola_country_to_compare_with.save()
        self.angola_region_to_compare_with.source_ref = ""
        self.angola_region_to_compare_with.save()
        self.angola_district_to_compare_with.source_ref = ""
        self.angola_district_to_compare_with.save()

        diffs, fields = Differ(test_logger).diff(
            version=self.source_version_to_update,
            version_ref=self.source_version_to_compare_with,
        )

        to_create_diffs = list(filter(lambda x: x.status == Differ.STATUS_NEW, diffs))
        assign_dhis2_ids(to_create_diffs)

        self.angola_country_to_compare_with.refresh_from_db()
        self.angola_region_to_compare_with.refresh_from_db()
        self.angola_district_to_compare_with.refresh_from_db()

        # Ensure a `source_ref` has been generated (e.g. `KdPqb52qj79`).
        self.assertEqual(11, len(self.angola_country_to_compare_with.source_ref))
        self.assertEqual(11, len(self.angola_region_to_compare_with.source_ref))
        self.assertEqual(11, len(self.angola_district_to_compare_with.source_ref))
