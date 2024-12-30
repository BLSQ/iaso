import datetime

from django.test import TestCase

from iaso.diffing import DataSourceVersionsSynchronizer


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
        diffs = [level1, level3, level2]
        sorted_diffs = DataSourceVersionsSynchronizer.sort_by_path(diffs)
        expected_sorted_diffs = [level1, level2, level3]
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
                "status": "modified",
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
                "status": "modified",
                "distance": None,
            },
            {
                "field": "group:group-a:Group A",
                "before": [{"id": "group-a", "name": "Group A", "iaso_id": 1260}],
                "after": [{"id": "group-a", "name": "Group A", "iaso_id": 1262}],
                "status": "same",
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
                "status": "modified",
                "distance": None,
            },
            {
                "field": "group:group-b:Group B",
                "before": [{"id": "group-b", "name": "Group B", "iaso_id": 1261}],
                "after": [],
                "status": "deleted",
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
                "status": "modified",
                "distance": None,
            },
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [{"id": "group-c", "name": "Group C", "iaso_id": 1263}],
                "status": "new",
                "distance": None,
            },
        ]
        has_group_changes = DataSourceVersionsSynchronizer.has_group_changes(comparisons)
        self.assertTrue(has_group_changes)
