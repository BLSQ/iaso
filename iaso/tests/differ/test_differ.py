import datetime
import json
import logging

import time_machine

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

        # FIELDS = ["name", "parent", "geometry", "groups", "opening_date", "closed_date"]
        # TODO = ["geometry", "groups"]
        # group1 = m.Group.objects.create(name="Group 1")
        # group2 = m.Group.objects.create(name="Group 2")
        # org_unit.groups.set([group1, group2])

        # Angola pyramid in DHIS2.
        cls.angola_country_dhis2 = m.OrgUnit.objects.create(
            name="Angola",
            parent=None,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_dhis2,
            source_ref="id-1",
        )
        cls.angola_region_dhis2 = m.OrgUnit.objects.create(
            name="Huila",
            parent=cls.angola_country_dhis2,
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_dhis2,
            source_ref="id-2",
        )
        cls.angola_district_dhis2 = m.OrgUnit.objects.create(
            name="Cuvango",
            parent=cls.angola_region_dhis2,
            org_unit_type=cls.org_unit_type_district,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_dhis2,
            source_ref="id-3",
        )

        # Angola pyramid in IASO.
        cls.angola_country_iaso = m.OrgUnit.objects.create(
            name="Angola",
            parent=None,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_iaso,
            source_ref="id-1",
        )
        cls.angola_region_iaso = m.OrgUnit.objects.create(
            name="Huila",
            parent=cls.angola_country_dhis2,
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_iaso,
            source_ref="id-2",
        )
        cls.angola_district_iaso = m.OrgUnit.objects.create(
            name="Cuvango",
            parent=cls.angola_region_dhis2,
            org_unit_type=cls.org_unit_type_district,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
            version=cls.source_version_iaso,
            source_ref="id-3",
        )

    def test_diff_and_dump_as_json_for_name(self):
        # Change the name in DHIS2.
        self.angola_country_dhis2.name = "Angola new"
        self.angola_country_dhis2.save()

        diffs, fields = Differ(test_logger).diff(
            # DHIS2.
            version=self.source_version_dhis2,
            validation_status=None,
            top_org_unit=None,
            org_unit_types=[self.org_unit_type_country],
            # IASO.
            version_ref=self.source_version_iaso,
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
                    "name": "Angola",
                    "short_name": "Angola",
                    "id": self.angola_country_iaso.pk,
                    "source": "Data source",
                    "source_id": self.data_source.pk,
                    "source_ref": "id-1",
                    "parent_id": None,
                    "org_unit_type_id": self.org_unit_type_country.pk,
                    "org_unit_type_name": "",
                    "org_unit_type_depth": None,
                    "created_at": 1732813200.0,
                    "updated_at": 1732813200.0,
                    "aliases": None,
                    "validation_status": "VALID",
                    "latitude": None,
                    "longitude": None,
                    "altitude": None,
                    "has_geo_json": False,
                    "version": 2,
                    "opening_date": "28/11/2022",
                    "closed_date": "28/11/2025",
                },
                "orgunit_ref": {
                    "name": "Angola",
                    "short_name": "Angola",
                    "id": self.angola_country_iaso.pk,
                    "source": "Data source",
                    "source_id": self.data_source.pk,
                    "source_ref": "id-1",
                    "parent_id": None,
                    "org_unit_type_id": self.org_unit_type_country.pk,
                    "org_unit_type_name": "",
                    "org_unit_type_depth": None,
                    "created_at": 1732813200.0,
                    "updated_at": 1732813200.0,
                    "aliases": None,
                    "validation_status": "VALID",
                    "latitude": None,
                    "longitude": None,
                    "altitude": None,
                    "has_geo_json": False,
                    "version": 2,
                    "opening_date": "28/11/2022",
                    "closed_date": "28/11/2025",
                },
                "orgunit_dhis2": {
                    "name": "Angola new",
                    "short_name": "Angola new",
                    "id": self.angola_country_dhis2.pk,
                    "source": "Data source",
                    "source_id": self.data_source.pk,
                    "source_ref": "id-1",
                    "parent_id": None,
                    "org_unit_type_id": self.org_unit_type_country.pk,
                    "org_unit_type_name": "",
                    "org_unit_type_depth": None,
                    "created_at": 1732813200.0,
                    "updated_at": 1732813200.0,
                    "aliases": None,
                    "validation_status": "VALID",
                    "latitude": None,
                    "longitude": None,
                    "altitude": None,
                    "has_geo_json": False,
                    "version": 1,
                    "opening_date": "28/11/2022",
                    "closed_date": "28/11/2025",
                },
                "status": "modified",
                "comparisons": [
                    {
                        "field": "name",
                        "before": "Angola new",
                        "after": "Angola",
                        "status": "modified",
                        "distance": None,
                    }
                ],
            }
        ]

        self.assertJSONEqual(json_diffs, expected_json_diffs)
