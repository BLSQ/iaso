import datetime
import logging

import time_machine

from iaso.diffing import Differ, Dumper
from iaso.tests.diffing.utils import PyramidBaseTest


test_logger = logging.getLogger(__name__)


DT = datetime.datetime(2024, 11, 30, 10, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DumperTestCase(PyramidBaseTest):
    """
    Test Dumper.
    """

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
                    "code": "",
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
                    "code": "",
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
                    "code": "",
                    "reference_instances": [],
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
                    "code": "",
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
                    "code": "",
                    "reference_instances": [],
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
