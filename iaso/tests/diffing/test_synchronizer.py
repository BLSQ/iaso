import datetime
import logging

import time_machine

from django.test import TestCase

from iaso.diffing import DataSourceVersionsSynchronizer, Differ, diffs_to_json
from iaso.tests.diffing.utils import PyramidBaseTest


test_logger = logging.getLogger(__name__)


DT = datetime.datetime(2024, 11, 30, 10, 0, 0, 0, tzinfo=datetime.timezone.utc)


class DataSourceVersionsSynchronizerTestCase(TestCase):
    """
    Test DataSourceVersionsSynchronizer.

    See also `DataSourceVersionsSynchronizationModelTestCase`.
    """

    def test_sort_by_path(self):
        level1 = {
            "org_unit": {
                "id": 1,
                "path": "99280",
            },
        }
        level2 = {
            "org_unit": {
                "id": 2,
                "path": "99280.99931",
            },
        }
        level3 = {
            "org_unit": {
                "id": 3,
                "path": "99280.99931.104415",
            },
        }
        levelNone = {
            "org_unit": {
                "id": 3,
                "path": None,
            },
        }
        diffs = [level1, level3, levelNone, level2]
        sorted_diffs = DataSourceVersionsSynchronizer.sort_by_path(diffs)
        expected_sorted_diffs = [level1, level2, level3, levelNone]
        self.assertEqual(sorted_diffs, expected_sorted_diffs)

    def test_parse_date_str(self):
        parsed_date = DataSourceVersionsSynchronizer.parse_date_str("2025-11-28")
        expected_parsed_date = datetime.date(2025, 11, 28)
        self.assertEqual(parsed_date, expected_parsed_date)

    def test_has_group_changes(self):
        # No group change: `has_group_changes()` should be False.
        comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        ]
        has_group_changes = DataSourceVersionsSynchronizer.has_group_changes(comparisons)
        self.assertFalse(has_group_changes)

        # Group is the same: `has_group_changes()` should be False.
        comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
            {
                "field": "group:group-a:Group A",
                "before": [{"id": "group-a", "name": "Group A", "iaso_id": 1260}],
                "after": [{"id": "group-a", "name": "Group A", "iaso_id": 1262}],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        ]
        has_group_changes = DataSourceVersionsSynchronizer.has_group_changes(comparisons)
        self.assertFalse(has_group_changes)

        # A group is deleted: `has_group_changes()` should be True.
        comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
            {
                "field": "group:group-b:Group B",
                "before": [{"id": "group-b", "name": "Group B", "iaso_id": 1261}],
                "after": [],
                "status": Differ.STATUS_NOT_IN_ORIGIN,
                "distance": None,
            },
        ]
        has_group_changes = DataSourceVersionsSynchronizer.has_group_changes(comparisons)
        self.assertTrue(has_group_changes)

        # A group is created: `has_group_changes()` should be True.
        comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [{"id": "group-c", "name": "Group C", "iaso_id": 1263}],
                "status": Differ.STATUS_NEW,
                "distance": None,
            },
        ]
        has_group_changes = DataSourceVersionsSynchronizer.has_group_changes(comparisons)
        self.assertTrue(has_group_changes)


@time_machine.travel(DT, tick=False)
class DiffsToJsonTestCase(PyramidBaseTest):
    """
    Test `diffs_to_json()`.
    """

    def test_dump_as_json_for_org_unit_update(self):
        """
        Test the format of `Dumper.as_json()` for a modified org unit.
        """
        # Change the name.
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()

        # Limit the diff size with restrictions on `field_names` and `org_unit_types_ref`.
        diffs, fields = Differ(test_logger).diff(
            # Version to update.
            version=self.source_version_to_update,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=[self.org_unit_type_country],
            org_unit_group=None,
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=[self.org_unit_type_country],
            org_unit_group_ref=None,
            # Options.
            ignore_groups=True,
            show_deleted_org_units=False,
            field_names=["name"],
        )

        json_diffs = diffs_to_json(diffs)

        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "location": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "path": str(self.angola_country_to_compare_with.path),
                    "name": "Angola new",
                    "parent": None,
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "groups": [self.group_a2.pk, self.group_c.pk],
                },
                "orgunit_ref": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "location": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "path": str(self.angola_country_to_compare_with.path),
                    "name": "Angola new",
                    "parent": None,
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "groups": [self.group_a2.pk, self.group_c.pk],
                },
                "orgunit_dhis2": {
                    "id": self.angola_country_to_update.pk,
                    "version": self.source_version_to_update.pk,
                    "source_ref": "id-1",
                    "location": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "path": str(self.angola_country_to_update.path),
                    "name": "Angola",
                    "parent": None,
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "groups": [self.group_a1.pk, self.group_b.pk],
                },
                "status": Differ.STATUS_MODIFIED,
                "comparisons": [
                    {
                        "field": "name",
                        "before": "Angola",
                        "after": "Angola new",
                        "status": Differ.STATUS_MODIFIED,
                        "distance": None,
                    }
                ],
            }
        ]

        self.assertJSONEqual(json_diffs, expected_json_diffs)

    def test_dump_as_json_for_org_unit_creation(self):
        """
        Test the format of `Dumper.as_json()` for a new org unit.
        """

        # Simulate an org unit existing only in one pyramid.
        self.angola_country_to_update.delete()

        # Limit the diff size with restrictions on `field_names` and `org_unit_types_ref`.
        diffs, fields = Differ(test_logger).diff(
            # Version to update.
            version=self.source_version_to_update,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=[self.org_unit_type_country],
            org_unit_group=None,
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=[self.org_unit_type_country],
            org_unit_group_ref=None,
            # Options.
            ignore_groups=True,
            show_deleted_org_units=False,
            field_names=["name"],
        )

        json_diffs = diffs_to_json(diffs)

        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "path": str(self.angola_country_to_compare_with.path),
                    "location": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "name": "Angola",
                    "parent": None,
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "groups": [self.group_a2.pk, self.group_c.pk],
                },
                "orgunit_ref": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "path": str(self.angola_country_to_compare_with.path),
                    "location": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "name": "Angola",
                    "parent": None,
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "groups": [self.group_a2.pk, self.group_c.pk],
                },
                "orgunit_dhis2": None,
                "status": Differ.STATUS_NEW,
                "comparisons": [
                    {
                        "field": "name",
                        "before": None,
                        "after": "Angola",
                        "status": Differ.STATUS_NEW,
                        "distance": None,
                    }
                ],
            }
        ]

        self.assertJSONEqual(json_diffs, expected_json_diffs)
