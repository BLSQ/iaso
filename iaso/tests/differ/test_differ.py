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

        cls.source_version_dhis2 = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="dhis2"
        )
        cls.source_version_iaso = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="iaso"
        )

        cls.org_unit_type_country = m.OrgUnitType.objects.create(category="COUNTRY")
        cls.org_unit_type_region = m.OrgUnitType.objects.create(category="REGION")
        cls.org_unit_type_district = m.OrgUnitType.objects.create(category="DISTRICT")

        cls.group_dhis2 = m.Group.objects.create(
            name="Group DHIS2", source_ref="group-id", source_version=cls.source_version_dhis2
        )
        cls.group_iaso_a = m.Group.objects.create(
            name="Group IASO A", source_ref="group-id", source_version=cls.source_version_iaso
        )
        cls.group_iaso_b = m.Group.objects.create(
            name="Group IASO B", source_ref="group-id", source_version=cls.source_version_iaso
        )

        cls.multi_polygon = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)]))

        # Angola pyramid in DHIS2.

        cls.angola_country_dhis2 = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_dhis2,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )
        cls.angola_country_dhis2.groups.set([cls.group_dhis2])

        cls.angola_region_dhis2 = m.OrgUnit.objects.create(
            parent=cls.angola_country_dhis2,
            version=cls.source_version_dhis2,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        cls.angola_district_dhis2 = m.OrgUnit.objects.create(
            parent=cls.angola_region_dhis2,
            version=cls.source_version_dhis2,
            source_ref="id-3",
            name="Cuvango",
            org_unit_type=cls.org_unit_type_district,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        # Angola pyramid in IASO.

        cls.angola_country_iaso = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_iaso,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )
        cls.angola_country_iaso.groups.set([cls.group_iaso_a, cls.group_iaso_b])

        cls.angola_region_iaso = m.OrgUnit.objects.create(
            parent=cls.angola_country_iaso,
            version=cls.source_version_iaso,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            geom=cls.multi_polygon,
        )

        cls.angola_district_iaso = m.OrgUnit.objects.create(
            parent=cls.angola_region_iaso,
            version=cls.source_version_iaso,
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
        Test that the dump as json method works as expected.

        The diff is limited to the `name` field and to the `country`
        org unit type to limit its size.
        """
        # Change the name in DHIS2.
        self.angola_country_dhis2.name = "Angola new"
        self.angola_country_dhis2.save()

        diffs, fields = Differ(test_logger).diff(
            # Actual version.
            version=self.source_version_iaso,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=[self.org_unit_type_country],
            # New version.
            version_ref=self.source_version_dhis2,
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
                    "id": self.angola_country_dhis2.pk,
                    "name": "Angola new",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_dhis2.pk,
                    "parent": None,
                    "path": str(self.angola_country_dhis2.path),
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
                    "id": self.angola_country_dhis2.pk,
                    "name": "Angola new",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_dhis2.pk,
                    "parent": None,
                    "path": str(self.angola_country_dhis2.path),
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
                    "id": self.angola_country_iaso.pk,
                    "name": "Angola",
                    "uuid": None,
                    "custom": False,
                    "validated": True,
                    "validation_status": "VALID",
                    "version": self.source_version_iaso.pk,
                    "parent": None,
                    "path": str(self.angola_country_iaso.path),
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

    def test_full_diff(self):
        """
        Test that the full diff works as expected.
        """

        multi_polygon_dhis2 = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        # Changes in DHIS2.
        self.angola_country_dhis2.name = "Angola new"
        self.angola_country_dhis2.geom = multi_polygon_dhis2
        self.angola_country_dhis2.opening_date = datetime.date(2022, 12, 28)
        self.angola_country_dhis2.closed_date = datetime.date(2025, 12, 28)
        self.angola_country_dhis2.save()

        self.angola_region_dhis2.name = "Huila new"
        self.angola_region_dhis2.geom = multi_polygon_dhis2
        self.angola_region_dhis2.opening_date = datetime.date(2022, 12, 28)
        self.angola_region_dhis2.closed_date = datetime.date(2025, 12, 28)
        self.angola_region_dhis2.save()

        self.angola_district_dhis2.name = "Cuvango new"
        self.angola_district_dhis2.parent = self.angola_country_dhis2
        self.angola_district_dhis2.geom = multi_polygon_dhis2
        self.angola_district_dhis2.opening_date = datetime.date(2022, 12, 28)
        self.angola_district_dhis2.closed_date = datetime.date(2025, 12, 28)
        self.angola_district_dhis2.save()

        diffs, fields = Differ(test_logger).diff(
            # Actual version.
            version=self.source_version_iaso,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=None,
            # New version.
            version_ref=self.source_version_dhis2,
            validation_status_ref=None,
            top_org_unit_ref=None,
            org_unit_types_ref=None,
            # Options.
            ignore_groups=False,
            show_deleted_org_units=False,
            field_names=["name", "parent", "geometry", "opening_date", "closed_date"],
        )

        self.assertEqual(len(diffs), 3)

        country_diff = diffs[0]
        self.assertEqual(country_diff.status, "modified")
        country_diff_comparisons = [comparison.as_dict() for comparison in country_diff.comparisons]
        self.assertEqual(7, len(country_diff_comparisons))
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
                "after": multi_polygon_dhis2,
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
                "field": "group:group-id:Group IASO A",
                "before": [{"id": "group-id", "name": "Group IASO A"}, {"id": "group-id", "name": "Group IASO B"}],
                "after": [{"id": "group-id", "name": "Group DHIS2"}],
                "status": "modified",
                "distance": None,
            },
        )
        self.assertDictEqual(
            country_diff_comparisons[6],
            {
                "field": "group:group-id:Group IASO B",
                "before": [{"id": "group-id", "name": "Group IASO A"}, {"id": "group-id", "name": "Group IASO B"}],
                "after": [{"id": "group-id", "name": "Group DHIS2"}],
                "status": "modified",
                "distance": None,
            },
        )

        region_diff = diffs[1]
        self.assertEqual(region_diff.status, "modified")
        region_diff_comparisons = [comparison.as_dict() for comparison in region_diff.comparisons]
        self.assertEqual(7, len(region_diff_comparisons))
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
                "after": multi_polygon_dhis2,
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
                "field": "group:group-id:Group IASO A",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            region_diff_comparisons[6],
            {
                "field": "group:group-id:Group IASO B",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )

        district_diff = diffs[2]
        self.assertEqual(district_diff.status, "modified")
        district_diff_comparisons = [comparison.as_dict() for comparison in district_diff.comparisons]
        self.assertEqual(7, len(district_diff_comparisons))
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
                "after": multi_polygon_dhis2,
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
                "field": "group:group-id:Group IASO A",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
        self.assertDictEqual(
            district_diff_comparisons[6],
            {
                "field": "group:group-id:Group IASO B",
                "before": [],
                "after": [],
                "status": "same",
                "distance": 0,
            },
        )
