import datetime

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import TestCase

from iaso import models as m


class PyramidBaseTest(TestCase):
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
