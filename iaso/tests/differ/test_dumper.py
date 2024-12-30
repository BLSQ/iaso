import datetime
import logging

import time_machine

from django.contrib.gis.geos import MultiPolygon, Polygon

from iaso import models as m
from iaso.diffing import Differ, Dumper
from iaso.test import TestCase


test_logger = logging.getLogger(__name__)


DT = datetime.datetime(2024, 11, 30, 10, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DumperTestCase(TestCase):
    """
    Test Dumper.
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

    def test_dump_as_json_for_partial_update(self):
        """
        Test `Dumper.as_json()` for a partial update.
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

    def test_dump_as_json_for_a_new_org_unit(self):
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
