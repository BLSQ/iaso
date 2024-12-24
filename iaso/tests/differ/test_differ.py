import datetime
import logging

import time_machine

from django.contrib.gis.geos import MultiPolygon, Polygon

from iaso import models as m
from iaso.diffing import Differ, Dumper
from iaso.test import TestCase


test_logger = logging.getLogger(__name__)


DT = datetime.datetime(2024, 11, 28, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DifferTestCase(TestCase):
    """
    Test Differ.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")

        cls.source_version_to_update = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="Bar"
        )
        cls.source_version_to_compare_with = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="Foo"
        )

        cls.org_unit_type_country = m.OrgUnitType.objects.create(category="COUNTRY")
        cls.org_unit_type_region = m.OrgUnitType.objects.create(category="REGION")
        cls.org_unit_type_district = m.OrgUnitType.objects.create(category="DISTRICT")

        # Groups in the pyramid to update.

        cls.group_a1 = m.Group.objects.create(
            name="Group A", source_ref="group-a", source_version=cls.source_version_to_update
        )
        cls.group_b = m.Group.objects.create(
            name="Group B", source_ref="group-b", source_version=cls.source_version_to_update
        )

        # Groups in the pyramid to compare with.

        cls.group_a2 = m.Group.objects.create(
            name="Group A", source_ref="group-a", source_version=cls.source_version_to_compare_with
        )
        cls.group_c = m.Group.objects.create(
            name="Group C", source_ref="group-c", source_version=cls.source_version_to_compare_with
        )

        cls.multi_polygon = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)]))

        # Angola pyramid to update.

        cls.angola_country_to_update = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_to_update,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )
        cls.angola_country_to_update.groups.set([cls.group_a1, cls.group_b])

        cls.angola_region_to_update = m.OrgUnit.objects.create(
            parent=cls.angola_country_to_update,
            version=cls.source_version_to_update,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        cls.angola_district_to_update = m.OrgUnit.objects.create(
            parent=cls.angola_region_to_update,
            version=cls.source_version_to_update,
            source_ref="id-3",
            name="Cuvango",
            org_unit_type=cls.org_unit_type_district,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        # Angola pyramid to compare with.

        cls.angola_country_to_compare_with = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_to_compare_with,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )
        cls.angola_country_to_compare_with.groups.set([cls.group_a2, cls.group_c])

        cls.angola_region_to_compare_with = m.OrgUnit.objects.create(
            parent=cls.angola_country_to_compare_with,
            version=cls.source_version_to_compare_with,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        cls.angola_district_to_compare_with = m.OrgUnit.objects.create(
            parent=cls.angola_region_to_compare_with,
            version=cls.source_version_to_compare_with,
            source_ref="id-3",
            name="Cuvango",
            org_unit_type=cls.org_unit_type_district,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

    def test_diff_and_dump_as_json_for_name(self):
        """
        Test `Dumper.as_json()` for a field update.
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
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=[self.org_unit_type_country],
            # Options.
            ignore_groups=True,
            show_deleted_org_units=False,
            field_names=["name"],
        )

        dumper = Dumper(test_logger)
        json_diffs = dumper.as_json(diffs)

        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "name": "Angola new",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_to_compare_with.pk,
                    "parent": None,
                    "path": str(self.angola_country_to_compare_with.path),
                    "aliases": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "sub_source": None,
                    "source_ref": "id-1",
                    "geom": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "simplified_geom": None,
                    "catchment": None,
                    "geom_ref": None,
                    "gps_source": None,
                    "location": None,
                    "source_created_at": None,
                    "creator": None,
                    "extra_fields": {},
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "default_image": None,
                    "reference_instances": [],
                },
                "orgunit_ref": {
                    "id": self.angola_country_to_compare_with.pk,
                    "name": "Angola new",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_to_compare_with.pk,
                    "parent": None,
                    "path": str(self.angola_country_to_compare_with.path),
                    "aliases": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "sub_source": None,
                    "source_ref": "id-1",
                    "geom": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "simplified_geom": None,
                    "catchment": None,
                    "geom_ref": None,
                    "gps_source": None,
                    "location": None,
                    "source_created_at": None,
                    "creator": None,
                    "extra_fields": {},
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "default_image": None,
                    "reference_instances": [],
                },
                "orgunit_dhis2": {
                    "id": self.angola_country_to_update.pk,
                    "name": "Angola",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_to_update.pk,
                    "parent": None,
                    "path": str(self.angola_country_to_update.path),
                    "aliases": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "sub_source": None,
                    "source_ref": "id-1",
                    "geom": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "simplified_geom": None,
                    "catchment": None,
                    "geom_ref": None,
                    "gps_source": None,
                    "location": None,
                    "source_created_at": None,
                    "creator": None,
                    "extra_fields": {},
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "default_image": None,
                    "reference_instances": [],
                },
                "status": "modified",
                "comparisons": [
                    {
                        "field": "name",
                        "before": "Angola",
                        "after": "Angola new",
                        "status": "modified",
                        "distance": None,
                    }
                ],
            }
        ]

        self.assertJSONEqual(json_diffs, expected_json_diffs)

    def test_diff_and_dump_as_json_for_a_new_org_unit(self):
        """
        Test `Dumper.as_json()` for a new org unit.
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
            # Version to compare with.
            version_ref=self.source_version_to_compare_with,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=[self.org_unit_type_country],
            # Options.
            ignore_groups=True,
            show_deleted_org_units=False,
            field_names=["name"],
        )

        dumper = Dumper(test_logger)
        json_diffs = dumper.as_json(diffs)

        expected_json_diffs = [
            {
                "org_unit": {
                    "id": self.angola_country_to_compare_with.pk,
                    "name": "Angola",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_to_compare_with.pk,
                    "parent": None,
                    "path": str(self.angola_country_to_compare_with.path),
                    "aliases": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "sub_source": None,
                    "source_ref": "id-1",
                    "geom": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "simplified_geom": None,
                    "catchment": None,
                    "geom_ref": None,
                    "gps_source": None,
                    "location": None,
                    "source_created_at": None,
                    "creator": None,
                    "extra_fields": {},
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "default_image": None,
                    "reference_instances": [],
                },
                "orgunit_ref": {
                    "id": self.angola_country_to_compare_with.pk,
                    "name": "Angola",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_to_compare_with.pk,
                    "parent": None,
                    "path": str(self.angola_country_to_compare_with.path),
                    "aliases": None,
                    "org_unit_type": self.org_unit_type_country.pk,
                    "sub_source": None,
                    "source_ref": "id-1",
                    "geom": "MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))",
                    "simplified_geom": None,
                    "catchment": None,
                    "geom_ref": None,
                    "gps_source": None,
                    "location": None,
                    "source_created_at": None,
                    "creator": None,
                    "extra_fields": {},
                    "opening_date": "2022-11-28",
                    "closed_date": "2025-11-28",
                    "default_image": None,
                    "reference_instances": [],
                },
                "orgunit_dhis2": None,
                "status": "new",
                "comparisons": [
                    {
                        "field": "name",
                        "before": None,
                        "after": "Angola",
                        "status": "new",
                        "distance": None,
                    }
                ],
            }
        ]

        self.assertJSONEqual(json_diffs, expected_json_diffs)

    def test_full_python_diff(self):
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
        self.assertEqual(country_diff.status, "modified")
        country_diff_comparisons = [comparison.as_dict() for comparison in country_diff.comparisons]
        self.assertEqual(8, len(country_diff_comparisons))
        self.assertDictEqual(
            country_diff_comparisons[0],
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[1],
            {
                "field": "parent",
                "before": None,
                "after": None,
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [{"id": "group-a", "name": "Group A", "iaso_id": self.group_a1.pk}],
                "after": [{"id": "group-a", "name": "Group A", "iaso_id": self.group_a2.pk}],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [{"id": "group-b", "name": "Group B", "iaso_id": self.group_b.pk}],
                "after": [],
                "status": "deleted",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [{"id": "group-c", "name": "Group C", "iaso_id": self.group_c.pk}],
                "status": "new",
                "distance": None,
            },
        )

        region_diff = next((diff for diff in diffs if diff.org_unit.org_unit_type == self.org_unit_type_region), None)
        self.assertEqual(region_diff.status, "modified")
        region_diff_comparisons = [comparison.as_dict() for comparison in region_diff.comparisons]
        self.assertEqual(8, len(region_diff_comparisons))
        self.assertDictEqual(
            region_diff_comparisons[0],
            {
                "field": "name",
                "before": "Huila",
                "after": "Huila new",
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[1],
            {
                "field": "parent",
                "before": "id-1",
                "after": "id-1",
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )

        district_diff = next(
            (diff for diff in diffs if diff.org_unit.org_unit_type == self.org_unit_type_district), None
        )
        self.assertEqual(district_diff.status, "modified")
        district_diff_comparisons = [comparison.as_dict() for comparison in district_diff.comparisons]
        self.assertEqual(8, len(district_diff_comparisons))
        self.assertDictEqual(
            district_diff_comparisons[0],
            {
                "field": "name",
                "before": "Cuvango",
                "after": "Cuvango new",
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[1],
            {
                "field": "parent",
                "before": "id-2",
                "after": "id-1",
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[2],
            {
                "field": "geometry",
                "before": self.multi_polygon,
                "after": new_multi_polygon,
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[3],
            {
                "field": "opening_date",
                "before": datetime.date(2022, 11, 28),
                "after": datetime.date(2022, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[4],
            {
                "field": "closed_date",
                "before": datetime.date(2025, 11, 28),
                "after": datetime.date(2025, 12, 28),
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[5],
            {
                "field": "group:group-a:Group A",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[6],
            {
                "field": "group:group-b:Group B",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[7],
            {
                "field": "group:group-c:Group C",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
