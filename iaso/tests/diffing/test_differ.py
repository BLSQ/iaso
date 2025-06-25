import datetime
import logging

import time_machine

from django.contrib.gis.geos import MultiPolygon, Polygon

from iaso.diffing import Differ
from iaso.tests.diffing.utils import PyramidBaseTest


test_logger = logging.getLogger(__name__)


DT = datetime.datetime(2024, 11, 28, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DifferTestCase(PyramidBaseTest):
    """
    Test Differ.
    """

    def test_full_diff(self):
        """
        Test that the full diff works as expected.
        """

        new_multi_polygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.geom = new_multi_polygon
        self.angola_country_to_compare_with.opening_date = datetime.date(2022, 12, 28)
        self.angola_country_to_compare_with.closed_date = datetime.date(2025, 12, 28)
        self.angola_country_to_compare_with.save()

        self.angola_region_to_compare_with.name = "Huila new"
        self.angola_region_to_compare_with.geom = new_multi_polygon
        self.angola_region_to_compare_with.opening_date = datetime.date(2022, 12, 28)
        self.angola_region_to_compare_with.closed_date = datetime.date(2025, 12, 28)
        self.angola_region_to_compare_with.save()

        self.angola_district_to_compare_with.name = "Cuvango new"
        self.angola_district_to_compare_with.parent = self.angola_country_to_compare_with
        self.angola_district_to_compare_with.geom = new_multi_polygon
        self.angola_district_to_compare_with.opening_date = datetime.date(2022, 12, 28)
        self.angola_district_to_compare_with.closed_date = datetime.date(2025, 12, 28)
        self.angola_district_to_compare_with.save()

        diffs, fields = Differ(test_logger).diff(
            # Version to update.
            version=self.source_version_to_update,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=None,
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=None,
            # Options.
            ignore_groups=False,
            show_deleted_org_units=False,
            field_names=["name", "parent", "geometry", "opening_date", "closed_date"],
        )

        self.assertEqual(len(diffs), 3)

        country_diff = next((diff for diff in diffs if diff.org_unit.org_unit_type == self.org_unit_type_country), None)
        self.assertEqual(country_diff.status, Differ.STATUS_MODIFIED)
        country_diff_comparisons = [comparison.as_dict() for comparison in country_diff.comparisons]
        self.assertEqual(8, len(country_diff_comparisons))
        self.assertDictEqual(
            country_diff_comparisons[0],
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[1],
            {
                "field": "parent",
                "before": None,
                "after": None,
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [{"id": "group-a", "name": "Group A", "iaso_id": self.group_a1.pk}],
                "after": [{"id": "group-a", "name": "Group A", "iaso_id": self.group_a2.pk}],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [{"id": "group-b", "name": "Group B", "iaso_id": self.group_b.pk}],
                "after": [],
                "status": Differ.STATUS_NOT_IN_ORIGIN,
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [{"id": "group-c", "name": "Group C", "iaso_id": self.group_c.pk}],
                "status": Differ.STATUS_NEW,
                "distance": None,
            },
        )

        region_diff = next((diff for diff in diffs if diff.org_unit.org_unit_type == self.org_unit_type_region), None)
        self.assertEqual(region_diff.status, Differ.STATUS_MODIFIED)
        region_diff_comparisons = [comparison.as_dict() for comparison in region_diff.comparisons]
        self.assertEqual(8, len(region_diff_comparisons))
        self.assertDictEqual(
            region_diff_comparisons[0],
            {
                "field": "name",
                "before": "Huila",
                "after": "Huila new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[1],
            {
                "field": "parent",
                "before": "id-1",
                "after": "id-1",
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )

        district_diff = next(
            (diff for diff in diffs if diff.org_unit.org_unit_type == self.org_unit_type_district), None
        )
        self.assertEqual(district_diff.status, Differ.STATUS_MODIFIED)
        district_diff_comparisons = [comparison.as_dict() for comparison in district_diff.comparisons]
        self.assertEqual(8, len(district_diff_comparisons))
        self.assertDictEqual(
            district_diff_comparisons[0],
            {
                "field": "name",
                "before": "Cuvango",
                "after": "Cuvango new",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[1],
            {
                "field": "parent",
                "before": "id-2",
                "after": "id-1",
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": Differ.STATUS_MODIFIED,
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [],
                "status": Differ.STATUS_SAME,
                "distance": 0,
            },
        )

    def test_diff_for_groups_only(self):
        """
        Test that we can compare `groups` and `groupsets` only.
        """
        diffs, fields = Differ(test_logger).diff(
            version=self.source_version_to_update,
            version_ref=self.source_version_to_compare_with,
            ignore_groups=False,
            field_names=(),
        )
        self.assertTrue(len(diffs) > 0)
        for diff in diffs:
            for comparison in diff.comparisons:
                self.assertTrue(comparison.field.startswith("group"))

    def test_diff_with_group_filtering(self):
        """
        Test that we can filter out OrgUnits from the differ based on their Groups.
        """
        # First, let's make some changes that will not be detected by the differ - these orgunits will be filtered out
        self.angola_region_to_compare_with.name = "new name"
        self.angola_region_to_compare_with.save()
        self.angola_district_to_compare_with.name = "new name"
        self.angola_district_to_compare_with.save()

        # Then, let's update the country name so have some changes to detect
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()

        diffs, fields = Differ(test_logger).diff(
            # Version to update.
            version=self.source_version_to_update,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=None,
            org_unit_group=self.group_a1,  # Select only orgunits that are in Group a1.
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=None,
            org_unit_group_ref=self.group_a2,  # Select only orgunits that are in Group a2.
            # Options.
            ignore_groups=True,
            show_deleted_org_units=False,
            field_names=["name"],
        )

        self.assertEqual(len(diffs), 1)  # only the country should be returned
        country_diff = diffs[0]

        self.assertEqual(country_diff.status, Differ.STATUS_MODIFIED)
        self.assertEqual(country_diff.orgunit_ref.id, self.angola_country_to_compare_with.id)
        self.assertEqual(country_diff.orgunit_dhis2.id, self.angola_country_to_update.id)
