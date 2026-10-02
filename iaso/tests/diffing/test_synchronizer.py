import datetime
import json

from unittest.mock import patch

import time_machine

from django.test import TestCase

from iaso import models as m
from iaso.diffing import DataSourceVersionsSynchronizer, Differ, diffs_to_json
from iaso.diffing.synchronizer import OrgUnitMatching
from iaso.tasks.data_source_versions_synchronization import synchronize_source_versions_async
from iaso.test import TestCase as IasoTestCase
from iaso.tests.diffing.utils import PyramidBaseTest


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
        diffs, fields = Differ().diff(
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

        _geom_wkt = "SRID=4326;MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))"
        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "location": None,
                    "geom": _geom_wkt,
                    "code": self.code_angola_to_compare_with,
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
                    "geom": _geom_wkt,
                    "code": self.code_angola_to_compare_with,
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
                    "geom": _geom_wkt,
                    "code": self.code_angola_to_update,
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


class PrepareModifiedChangeRequestsTestCase(PyramidBaseTest):
    def _make_synchronizer(self):
        account = m.Account.objects.create(name="Account")
        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="sync",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff="[]",
            account=account,
        )
        return DataSourceVersionsSynchronizer(data_source_sync=data_source_sync)

    def test_prepare_modified_change_request_handles_status_new(self):
        synchronizer = self._make_synchronizer()
        diff = {
            "status": Differ.STATUS_MODIFIED,
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": None,
                "opening_date": None,
                "closed_date": "2025-11-28",
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
            },
            "comparisons": [
                {
                    "field": "opening_date",
                    "before": None,
                    "after": "2024-01-01",
                    "status": Differ.STATUS_NEW,
                    "distance": None,
                }
            ],
        }

        change_request, group_changes = synchronizer._prepare_modified_change_requests(diff)

        self.assertIsNotNone(change_request)
        self.assertIn("new_opening_date", change_request.requested_fields)
        self.assertEqual(change_request.new_opening_date, datetime.date(2024, 1, 1))
        self.assertEqual(group_changes, [])

    def test_prepare_modified_change_request_handles_status_not_in_origin(self):
        synchronizer = self._make_synchronizer()
        diff = {
            "status": Differ.STATUS_MODIFIED,
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": None,
                "opening_date": "2024-01-01",
                "closed_date": "2025-11-28",
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
            },
            "comparisons": [
                {
                    "field": "opening_date",
                    "before": "2024-01-01",
                    "after": None,
                    "status": Differ.STATUS_NOT_IN_ORIGIN,
                    "distance": None,
                }
            ],
        }

        change_request, group_changes = synchronizer._prepare_modified_change_requests(diff)

        self.assertIsNotNone(change_request)
        self.assertIn("new_opening_date", change_request.requested_fields)
        self.assertIsNone(change_request.new_opening_date)
        self.assertEqual(group_changes, [])

    def test_prepare_modified_change_request_ignores_empty_name(self):
        synchronizer = self._make_synchronizer()
        diff = {
            "status": Differ.STATUS_MODIFIED,
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": None,
                "opening_date": "2024-01-01",
                "closed_date": "2025-11-28",
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
            },
            "comparisons": [
                {
                    "field": "name",
                    "before": "Angola",
                    "after": "",
                    "status": Differ.STATUS_MODIFIED,
                    "distance": None,
                }
            ],
        }

        change_request, group_changes = synchronizer._prepare_modified_change_requests(diff)

        self.assertIsNotNone(change_request)
        self.assertNotIn("new_name", change_request.requested_fields)
        self.assertEqual(change_request.new_name, "")

    def test_prepare_modified_change_request_removes_parent(self):
        synchronizer = self._make_synchronizer()
        diff = {
            "status": Differ.STATUS_MODIFIED,
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": self.angola_region_to_update.pk,
                "opening_date": "2024-01-01",
                "closed_date": "2025-11-28",
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
            },
            "comparisons": [
                {
                    "field": "parent",
                    "before": "parent-ref",
                    "after": None,
                    "status": Differ.STATUS_MODIFIED,
                    "distance": None,
                }
            ],
        }

        change_request, group_changes = synchronizer._prepare_modified_change_requests(diff)

        self.assertIsNotNone(change_request)
        self.assertIn("new_parent", change_request.requested_fields)
        self.assertIsNone(change_request.new_parent_id)

    def test_dump_as_json_for_org_unit_creation(self):
        """
        Test the format of `Dumper.as_json()` for a new org unit.
        """

        # Simulate an org unit existing only in one pyramid.
        self.angola_country_to_update.delete()

        # Limit the diff size with restrictions on `field_names` and `org_unit_types_ref`.
        diffs, fields = Differ().diff(
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

        _geom_wkt = "SRID=4326;MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))"
        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "version": self.source_version_to_compare_with.pk,
                    "source_ref": "id-1",
                    "path": str(self.angola_country_to_compare_with.path),
                    "location": None,
                    "geom": _geom_wkt,
                    "code": self.code_angola_to_compare_with,
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
                    "geom": _geom_wkt,
                    "code": self.code_angola_to_compare_with,
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

    def _make_base_diff(self, extra_comparisons=None):
        """Return a minimal modified diff dict for angola_country_to_update."""
        return {
            "status": "modified",
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": None,
                "opening_date": None,
                "closed_date": None,
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
                "geom": None,
                "code": self.code_angola_to_update,
            },
            "comparisons": extra_comparisons or [],
        }

    def test_prepare_modified_change_request_point_geometry(self):
        """A Point geometry change creates a new_location change request."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "geometry",
                    "before": None,
                    "after": "POINT Z (9.6412 13.5784 0)",
                    "status": "new",
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_location", change_request.requested_fields)
        self.assertNotIn("new_geom", change_request.requested_fields)
        self.assertIsNotNone(change_request.new_location)
        self.assertAlmostEqual(change_request.new_location.x, 9.6412, places=4)
        self.assertAlmostEqual(change_request.new_location.y, 13.5784, places=4)
        self.assertTrue(change_request.new_location.hasz)

    def test_prepare_modified_change_request_2d_point_gets_altitude(self):
        """A 2D Point is promoted to 3D with altitude=0."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "geometry",
                    "before": None,
                    "after": "POINT (9.6412 13.5784)",
                    "status": "new",
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_location", change_request.requested_fields)
        self.assertTrue(change_request.new_location.hasz)
        self.assertEqual(change_request.new_location.z, 0)

    def test_prepare_modified_change_request_polygon_geometry(self):
        """A Polygon geometry change creates a new_geom change request."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "geometry",
                    "before": None,
                    "after": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "status": "new",
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_geom", change_request.requested_fields)
        self.assertNotIn("new_location", change_request.requested_fields)
        self.assertIsNotNone(change_request.new_geom)
        self.assertEqual(change_request.new_geom.geom_type, "MultiPolygon")

    def test_prepare_modified_change_request_plain_polygon_becomes_multipolygon(self):
        """A plain Polygon WKT is promoted to MultiPolygon on the change request."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "geometry",
                    "before": None,
                    "after": "POLYGON ((0 0, 0 1, 1 1, 0 0))",
                    "status": "new",
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_geom", change_request.requested_fields)
        self.assertEqual(change_request.new_geom.geom_type, "MultiPolygon")

    def test_prepare_modified_change_request_geom_cleared(self):
        """Clearing a polygon geometry (after=None) adds new_geom=None to the request."""
        synchronizer = self._make_synchronizer()
        diff = {
            "status": "modified",
            "orgunit_dhis2": {
                "id": self.angola_country_to_update.pk,
                "name": "Angola",
                "parent": None,
                "opening_date": None,
                "closed_date": None,
                "org_unit_type": self.org_unit_type_country.pk,
                "location": None,
                "geom": "SRID=4326;MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                "code": "",
            },
            "comparisons": [
                {
                    "field": "geometry",
                    "before": "SRID=4326;MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "after": None,
                    "status": Differ.STATUS_NOT_IN_ORIGIN,
                    "distance": None,
                }
            ],
        }

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_geom", change_request.requested_fields)
        self.assertIsNone(change_request.new_geom)

    def test_prepare_modified_change_request_code_change(self):
        """A code change is captured in new_code and requested_fields."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "code",
                    "before": self.code_angola_to_update,
                    "after": "new-code-123",
                    "status": "modified",
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_code", change_request.requested_fields)
        self.assertEqual(change_request.new_code, "new-code-123")
        self.assertEqual(change_request.old_code, self.code_angola_to_update)

    def test_prepare_modified_change_request_code_cleared(self):
        """Clearing a code sets new_code to empty string."""
        synchronizer = self._make_synchronizer()
        diff = self._make_base_diff(
            extra_comparisons=[
                {
                    "field": "code",
                    "before": self.code_angola_to_update,
                    "after": None,
                    "status": Differ.STATUS_NOT_IN_ORIGIN,
                    "distance": None,
                }
            ]
        )

        change_request, _ = synchronizer._prepare_modified_change_requests(diff)

        self.assertIn("new_code", change_request.requested_fields)
        self.assertEqual(change_request.new_code, "")


class ReportWarningSkipPathsTestCase(PyramidBaseTest):
    """Skip paths must warn and continue; they must not fail the synchronization."""

    def _make_synchronizer(self, json_diff="[]"):
        account = m.Account.objects.create(name="Account")
        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="sync",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=json_diff,
            account=account,
        )
        return DataSourceVersionsSynchronizer(data_source_sync=data_source_sync)

    def _warning_messages(self, mock_warning):
        return [call.args[0] for call in mock_warning.call_args_list]

    def test_prepare_groups_matching_ignores_groups_without_source_ref(self):
        group_empty_ref = m.Group.objects.create(
            name="Group without source_ref",
            source_ref="",
            source_version=self.source_version_to_update,
        )
        group_none_ref = m.Group.objects.create(
            name="Group with null source_ref",
            source_ref=None,
            source_version=self.source_version_to_update,
        )
        synchronizer = self._make_synchronizer()

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            synchronizer._prepare_groups_matching()

        self.assertEqual(synchronizer.groups_matching["group-a"], self.group_a1.pk)
        self.assertEqual(synchronizer.groups_matching["group-b"], self.group_b.pk)
        self.assertNotIn("", synchronizer.groups_matching)
        self.assertNotIn(None, synchronizer.groups_matching)
        self.assertNotIn(group_empty_ref.pk, synchronizer.groups_matching.values())
        self.assertNotIn(group_none_ref.pk, synchronizer.groups_matching.values())
        messages = self._warning_messages(mock_warning)
        self.assertTrue(any(f"Ignoring Group ID #{group_empty_ref.pk}" in msg for msg in messages))
        self.assertTrue(any(f"Ignoring Group ID #{group_none_ref.pk}" in msg for msg in messages))
        self.assertTrue(all("extra" in call.kwargs for call in mock_warning.call_args_list))

    def test_create_missing_org_units_ignores_org_units_without_source_ref(self):
        org_unit = m.OrgUnit.objects.create(
            parent=None,
            version=self.source_version_to_compare_with,
            source_ref="",
            name="Facility without source ref",
            org_unit_type=self.org_unit_type_district,
        )
        json_diff = json.dumps(
            [
                {
                    "status": Differ.STATUS_NEW,
                    "org_unit": {"id": org_unit.pk, "path": "no-source-ref"},
                    "orgunit_ref": {"id": org_unit.pk},
                }
            ]
        )
        synchronizer = self._make_synchronizer(json_diff=json_diff)

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            synchronizer._create_missing_org_units_and_prepare_missing_groups()

        self.assertEqual(synchronizer.org_units_created_count, 0)
        self.assertEqual(synchronizer.org_units_matching, {})
        messages = self._warning_messages(mock_warning)
        self.assertTrue(any(f"Ignoring OrgUnit ID #{org_unit.pk}" in msg for msg in messages))

    def test_prepare_new_change_requests_ignores_empty_requested_fields(self):
        synchronizer = self._make_synchronizer()
        diff = {
            "orgunit_ref": {
                "id": 123,
                "source_ref": "id-missing-fields",
                "name": "",
                "parent": None,
                "opening_date": None,
                "closed_date": None,
            },
            "comparisons": [],
        }

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            change_request, group_changes = synchronizer._prepare_new_change_requests(diff)

        self.assertIsNone(change_request)
        self.assertIsNone(group_changes)
        self.assertTrue(
            any(
                "Ignoring OrgUnit ID #123 because `requested_fields` is empty." in msg
                for msg in self._warning_messages(mock_warning)
            )
        )

    def test_prepare_new_change_requests_warns_on_unmatched_group(self):
        synchronizer = self._make_synchronizer()
        synchronizer.org_units_matching["id-1"] = OrgUnitMatching(
            corresponding_id=self.angola_country_to_update.pk,
            corresponding_parent_id=None,
        )
        unmatched_group = {"id": "missing-group", "name": "Unknown group"}
        diff = {
            "orgunit_ref": {
                "id": self.angola_country_to_compare_with.pk,
                "source_ref": "id-1",
                "name": "Angola",
                "parent": None,
                "opening_date": "2022-11-28",
                "closed_date": None,
            },
            "comparisons": [
                {
                    "field": "group:missing-group:Unknown group",
                    "before": [],
                    "after": [unmatched_group],
                    "status": Differ.STATUS_NEW,
                    "distance": None,
                }
            ],
        }

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            change_request, group_changes = synchronizer._prepare_new_change_requests(diff)

        self.assertIsNotNone(change_request)
        self.assertEqual(group_changes[0]["after"][0], unmatched_group)
        self.assertNotIn("iaso_id", unmatched_group)
        self.assertTrue(
            any(
                "Unable to find a corresponding `Group` with `source_ref=missing-group`" in msg
                for msg in self._warning_messages(mock_warning)
            )
        )

    def test_synchronize_continues_when_group_has_no_source_ref(self):
        m.Group.objects.create(
            name="Group without source_ref",
            source_ref="",
            source_version=self.source_version_to_update,
        )
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()
        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="sync",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            account=m.Account.objects.create(name="Account"),
        )
        data_source_sync.create_json_diff(
            source_version_to_update_org_unit_types=[self.org_unit_type_country],
            source_version_to_compare_with_org_unit_types=[self.org_unit_type_country],
            ignore_groups=True,
            field_names=["name"],
        )

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            data_source_sync.synchronize_source_versions()

        self.assertTrue(any("Ignoring Group ID #" in msg for msg in self._warning_messages(mock_warning)))
        self.assertEqual(
            m.OrgUnitChangeRequest.objects.filter(data_source_synchronization=data_source_sync).count(),
            1,
        )


class SynchronizeSourceVersionsAsyncTaskTestCase(IasoTestCase, PyramidBaseTest):
    def setUp(self):
        self.account = m.Account.objects.create(name="Account")
        self.user = self.create_user_with_profile(username="sync-user", account=self.account)
        self.task = m.Task.objects.create(
            name="synchronize_source_versions_task",
            launcher=self.user,
            account=self.account,
        )

    def _run_async(self, data_source_sync):
        return synchronize_source_versions_async(
            data_source_versions_synchronization_id=data_source_sync.id,
            task=self.task,
            _immediate=True,  # type: ignore[call-arg]
        )

    def test_async_task_succeeds_when_group_has_no_source_ref(self):
        m.Group.objects.create(
            name="Group without source_ref",
            source_ref="",
            source_version=self.source_version_to_update,
        )
        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="sync",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff="[]",
            account=self.account,
            created_by=self.user,
        )

        with patch("iaso.diffing.synchronizer.logger.warning") as mock_warning:
            self._run_async(data_source_sync)

        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.assertTrue(any("Ignoring Group ID #" in call.args[0] for call in mock_warning.call_args_list))

    def test_async_task_reports_failure_on_invalid_date(self):
        json_diff = json.dumps(
            [
                {
                    "status": Differ.STATUS_MODIFIED,
                    "org_unit": {
                        "id": self.angola_country_to_update.pk,
                        "path": str(self.angola_country_to_update.path),
                    },
                    "orgunit_dhis2": {
                        "id": self.angola_country_to_update.pk,
                        "name": "Angola",
                        "parent": None,
                        "opening_date": "2022-11-28",
                        "closed_date": "2025-11-28",
                        "org_unit_type": self.org_unit_type_country.pk,
                        "location": None,
                    },
                    "comparisons": [
                        {
                            "field": "opening_date",
                            "before": "2022-11-28",
                            "after": "not-a-date",
                            "status": Differ.STATUS_MODIFIED,
                            "distance": None,
                        }
                    ],
                }
            ]
        )
        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="sync",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=json_diff,
            account=self.account,
            created_by=self.user,
        )

        self._run_async(data_source_sync)

        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.ERRORED)
        self.assertIn("not-a-date", self.task.result["message"])
        self.assertIn("stack_trace", self.task.result)
        self.assertEqual(
            m.OrgUnitChangeRequest.objects.filter(data_source_synchronization=data_source_sync).count(),
            0,
        )
