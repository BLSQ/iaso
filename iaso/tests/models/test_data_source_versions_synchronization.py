import datetime
import json
import logging

import time_machine

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.core.exceptions import ValidationError

from iaso import models as m
from iaso.test import TestCase


class DataSourceVersionsSynchronizationModelTestCase(TestCase):
    """
    Test DataSourceVersionsSynchronization model.
    """

    DT = datetime.datetime(2024, 12, 4, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    def setUp(self):
        logging.disable(logging.NOTSET)

    def tearDown(self):
        logging.disable(logging.CRITICAL)

    @classmethod
    def setUpTestData(cls):
        cls.multi_polygon = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)]))

        # Data source.
        cls.data_source = m.DataSource.objects.create(name="Data source")

        # Data source versions.
        cls.source_version_to_compare_with = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="Source version to compare with"
        )
        cls.source_version_to_update = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="Source version to update"
        )

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

        # Org unit type.
        cls.org_unit_type_country = m.OrgUnitType.objects.create(category="COUNTRY")
        cls.org_unit_type_region = m.OrgUnitType.objects.create(category="REGION")
        cls.org_unit_type_district = m.OrgUnitType.objects.create(category="DISTRICT")
        cls.org_unit_type_facility = m.OrgUnitType.objects.create(category="FACILITY")

        # Angola pyramid to update (2 org units).

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
            simplified_geom=cls.multi_polygon,
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
            simplified_geom=cls.multi_polygon,
        )
        cls.angola_region_to_update.calculate_paths()

        # Angola pyramid to compare with (5 org units).

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
            simplified_geom=cls.multi_polygon,
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
            simplified_geom=cls.multi_polygon,
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
            simplified_geom=cls.multi_polygon,
        )
        cls.angola_district_to_compare_with.groups.set([cls.group_a2, cls.group_c])

        cls.angola_facility_to_compare_with = m.OrgUnit.objects.create(
            parent=cls.angola_district_to_compare_with,
            version=cls.source_version_to_compare_with,
            source_ref="id-4",
            name="Facility",
            org_unit_type=cls.org_unit_type_facility,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2024, 11, 28),
            closed_date=datetime.date(2026, 11, 28),
            geom=cls.multi_polygon,
            simplified_geom=cls.multi_polygon,
        )

        cls.angola_facility_without_source_ref_to_compare_with = m.OrgUnit.objects.create(
            parent=cls.angola_district_to_compare_with,
            version=cls.source_version_to_compare_with,
            source_ref="",  # Org units without `source_ref` should be ignored.
            name="Facility without source ref",
            org_unit_type=cls.org_unit_type_facility,
            validation_status=m.OrgUnit.VALIDATION_NEW,
            opening_date=datetime.date(2024, 11, 28),
            closed_date=datetime.date(2026, 11, 28),
            geom=cls.multi_polygon,
            simplified_geom=cls.multi_polygon,
        )

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        # Calculate paths.
        cls.angola_country_to_update.calculate_paths()
        cls.angola_country_to_compare_with.calculate_paths()

    @time_machine.travel(DT, tick=False)
    def test_create(self):
        kwargs = {
            "name": "New synchronization",
            "source_version_to_update": self.source_version_to_update,
            "source_version_to_compare_with": self.source_version_to_compare_with,
            "json_diff": None,
            "account": self.account,
            "created_by": self.user,
        }
        data_source_sync = m.DataSourceVersionsSynchronization(**kwargs)
        data_source_sync.full_clean()
        data_source_sync.save()
        data_source_sync.refresh_from_db()

        self.assertEqual(data_source_sync.name, kwargs["name"])
        self.assertEqual(data_source_sync.source_version_to_update, kwargs["source_version_to_update"])
        self.assertEqual(data_source_sync.source_version_to_compare_with, kwargs["source_version_to_compare_with"])
        self.assertEqual(data_source_sync.json_diff, kwargs["json_diff"])
        self.assertIsNone(data_source_sync.sync_task)
        self.assertEqual(data_source_sync.account, kwargs["account"])
        self.assertEqual(data_source_sync.created_by, kwargs["created_by"])
        self.assertEqual(data_source_sync.created_at, self.DT)
        self.assertEqual(data_source_sync.updated_at, self.DT)

    def test_clean_data_source_versions(self):
        other_data_source = m.DataSource.objects.create(name="Other data source")
        other_source_version = m.SourceVersion.objects.create(
            data_source=other_data_source, number=1, description="Other data source version"
        )
        kwargs = {
            "name": "Foo",
            "source_version_to_update": self.source_version_to_update,
            "source_version_to_compare_with": other_source_version,
            "account": self.account,
            "created_by": self.user,
        }
        data_source_sync = m.DataSourceVersionsSynchronization(**kwargs)

        with self.assertRaises(ValidationError) as error:
            data_source_sync.clean_data_source_versions()
        self.assertIn("The two versions to compare must be linked to the same data source.", error.exception.messages)

        kwargs = {
            "name": "Foo",
            "source_version_to_update": self.source_version_to_update,
            "source_version_to_compare_with": self.source_version_to_update,
            "account": self.account,
            "created_by": self.user,
        }
        data_source_sync = m.DataSourceVersionsSynchronization(**kwargs)

        with self.assertRaises(ValidationError) as error:
            data_source_sync.clean_data_source_versions()
        self.assertIn("The two versions to compare must be different.", error.exception.messages)

    def test_create_json_diff(self):
        """
        Test that `create_json_diff()` works as expected.
        """
        # Change the name.
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()

        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            account=self.account,
            created_by=self.user,
        )
        self.assertIsNone(data_source_sync.json_diff)
        self.assertEqual(data_source_sync.diff_config, "")

        data_source_sync.create_json_diff(
            source_version_to_update_validation_status=m.OrgUnit.VALIDATION_VALID,
            source_version_to_update_org_unit_types=[self.org_unit_type_country],
            source_version_to_compare_with_validation_status=m.OrgUnit.VALIDATION_VALID,
            source_version_to_compare_with_org_unit_types=[self.org_unit_type_country],
            ignore_groups=True,
            field_names=["name"],
        )
        data_source_sync.refresh_from_db()

        json_diff = json.loads(data_source_sync.json_diff)

        comparisons = json_diff[0]["comparisons"]
        expected_comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": "modified",
                "distance": None,
            }
        ]
        self.assertEqual(comparisons, expected_comparisons)

        expected_diff_config = (
            "{"
            f"'version': {self.source_version_to_update.pk}, "
            f"'validation_status': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit': None, "
            f"'org_unit_types': [{self.org_unit_type_country.pk}], "
            "'org_unit_group': None, "
            f"'version_ref': {self.source_version_to_compare_with.pk}, "
            f"'validation_status_ref': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit_ref': None, "
            f"'org_unit_types_ref': [{self.org_unit_type_country.pk}], "
            "'org_unit_group_ref': None, "
            "'ignore_groups': True, "
            "'show_deleted_org_units': False, "
            "'field_names': ['name']"
            "}"
        )
        self.assertEqual(data_source_sync.diff_config, expected_diff_config)

        self.assertEqual(data_source_sync.count_create, 0)
        self.assertEqual(data_source_sync.count_update, 1)

    def test_create_json_diff_with_group_filtering(self):
        """
        Test that `create_json_diff()` works as expected when filtering with group ids.
        """
        # Change the name.
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()

        # Make other changes that will not be picked up by the differ.
        self.angola_region_to_compare_with.name = "new name"
        self.angola_region_to_compare_with.save()
        self.angola_district_to_compare_with.name = "new name"
        self.angola_district_to_compare_with.save()

        # Make sure only the country is using the group_a2.
        self.angola_district_to_compare_with.groups.set([])

        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            account=self.account,
            created_by=self.user,
        )
        self.assertIsNone(data_source_sync.json_diff)
        self.assertEqual(data_source_sync.diff_config, "")

        data_source_sync.create_json_diff(
            source_version_to_update_validation_status=m.OrgUnit.VALIDATION_VALID,
            source_version_to_update_org_unit_group=self.group_a1,
            source_version_to_compare_with_validation_status=m.OrgUnit.VALIDATION_VALID,
            source_version_to_compare_with_org_unit_group=self.group_a2,
            ignore_groups=True,
            field_names=["name"],
        )
        data_source_sync.refresh_from_db()

        json_diff = json.loads(data_source_sync.json_diff)

        comparisons = json_diff[0]["comparisons"]
        expected_comparisons = [
            {
                "field": "name",
                "before": "Angola",
                "after": "Angola new",
                "status": "modified",
                "distance": None,
            }
        ]
        self.assertEqual(comparisons, expected_comparisons)

        expected_diff_config = (
            "{"
            f"'version': {self.source_version_to_update.pk}, "
            f"'validation_status': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit': None, "
            "'org_unit_types': None, "
            f"'org_unit_group': {self.group_a1.pk}, "
            f"'version_ref': {self.source_version_to_compare_with.pk}, "
            f"'validation_status_ref': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit_ref': None, "
            "'org_unit_types_ref': None, "
            f"'org_unit_group_ref': {self.group_a2.pk}, "
            "'ignore_groups': True, "
            "'show_deleted_org_units': False, "
            "'field_names': ['name']"
            "}"
        )
        self.assertEqual(data_source_sync.diff_config, expected_diff_config)

        self.assertEqual(data_source_sync.count_create, 0)
        self.assertEqual(data_source_sync.count_update, 1)

    def test_create_change_requests(self):
        """
        Test that `create_change_requests()` produces the right number of change requests.
        """
        # Changes at the country level.
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.opening_date = datetime.date(2025, 11, 28)
        self.angola_country_to_compare_with.closed_date = datetime.date(2026, 11, 28)
        self.angola_country_to_compare_with.save()
        # Changes at the region level.
        self.angola_region_to_compare_with.parent = None
        self.angola_region_to_compare_with.opening_date = datetime.date(2025, 11, 28)
        self.angola_region_to_compare_with.closed_date = datetime.date(2026, 11, 28)
        self.angola_region_to_compare_with.save()

        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            account=self.account,
            created_by=self.user,
        )

        with self.assertRaises(ValidationError) as error:
            data_source_sync.synchronize_source_versions()
        self.assertIn("`create_json_diff()` must be called before synchronizing.", error.exception.messages)

        data_source_sync.create_json_diff()

        # Synchronize source versions.
        change_requests = m.OrgUnitChangeRequest.objects.filter(data_source_synchronization=data_source_sync)
        self.assertEqual(change_requests.count(), 0)
        self.assertEqual(m.OrgUnit.objects.filter(version=self.source_version_to_update).count(), 2)

        with self.assertNumQueries(12):
            data_source_sync.synchronize_source_versions()

        self.assertEqual(change_requests.count(), 4)
        self.assertEqual(m.OrgUnit.objects.filter(version=self.source_version_to_update).count(), 4)

        # Change request #1 to update an existing OrgUnit.
        angola_country_change_request = m.OrgUnitChangeRequest.objects.get(
            org_unit=self.angola_country_to_update, data_source_synchronization=data_source_sync
        )
        # Data.
        self.assertEqual(angola_country_change_request.kind, m.OrgUnitChangeRequest.Kind.ORG_UNIT_CHANGE)
        self.assertEqual(angola_country_change_request.created_by, data_source_sync.created_by)
        self.assertEqual(
            angola_country_change_request.requested_fields,
            ["new_name", "new_opening_date", "new_closed_date", "new_groups"],
        )
        # New values.
        self.assertEqual(angola_country_change_request.new_parent, None)
        self.assertEqual(angola_country_change_request.new_name, "Angola new")
        self.assertEqual(angola_country_change_request.new_org_unit_type, None)
        self.assertEqual(angola_country_change_request.new_groups.count(), 2)
        self.assertIn(self.group_a2, angola_country_change_request.new_groups.all())
        self.assertIn(self.group_c, angola_country_change_request.new_groups.all())
        self.assertEqual(angola_country_change_request.new_location, None)
        self.assertEqual(angola_country_change_request.new_location_accuracy, None)
        self.assertEqual(angola_country_change_request.new_opening_date, datetime.date(2025, 11, 28))
        self.assertEqual(angola_country_change_request.new_closed_date, datetime.date(2026, 11, 28))
        self.assertEqual(angola_country_change_request.new_reference_instances.count(), 0)
        # Old values.
        self.assertEqual(angola_country_change_request.old_parent, None)
        self.assertEqual(angola_country_change_request.old_name, "Angola")
        self.assertEqual(angola_country_change_request.old_org_unit_type, self.org_unit_type_country)
        self.assertEqual(angola_country_change_request.old_groups.count(), 2)
        self.assertIn(self.group_a1, angola_country_change_request.old_groups.all())
        self.assertIn(self.group_b, angola_country_change_request.old_groups.all())
        self.assertEqual(angola_country_change_request.old_location, None)
        self.assertEqual(angola_country_change_request.old_opening_date, datetime.date(2022, 11, 28))
        self.assertEqual(angola_country_change_request.old_closed_date, datetime.date(2025, 11, 28))
        self.assertEqual(angola_country_change_request.old_reference_instances.count(), 0)

        # Change request #2 to update an existing OrgUnit.
        angola_region_change_request = m.OrgUnitChangeRequest.objects.get(
            org_unit=self.angola_region_to_update, data_source_synchronization=data_source_sync
        )
        # Data.
        self.assertEqual(angola_region_change_request.kind, m.OrgUnitChangeRequest.Kind.ORG_UNIT_CHANGE)
        self.assertEqual(angola_region_change_request.created_by, data_source_sync.created_by)
        self.assertEqual(angola_region_change_request.requested_fields, ["new_opening_date", "new_closed_date"])
        # New values.
        self.assertEqual(angola_region_change_request.new_parent, None)
        self.assertEqual(angola_region_change_request.new_name, "")
        self.assertEqual(angola_region_change_request.new_org_unit_type, None)
        self.assertEqual(angola_region_change_request.new_groups.count(), 0)
        self.assertEqual(angola_region_change_request.new_location, None)
        self.assertEqual(angola_region_change_request.new_location_accuracy, None)
        self.assertEqual(angola_region_change_request.new_opening_date, datetime.date(2025, 11, 28))
        self.assertEqual(angola_region_change_request.new_closed_date, datetime.date(2026, 11, 28))
        self.assertEqual(angola_region_change_request.new_reference_instances.count(), 0)
        # Old values.
        self.assertEqual(angola_region_change_request.old_parent, self.angola_country_to_update)
        self.assertEqual(angola_region_change_request.old_name, "Huila")
        self.assertEqual(angola_region_change_request.old_org_unit_type, self.org_unit_type_region)
        self.assertEqual(angola_region_change_request.old_groups.count(), 0)
        self.assertEqual(angola_region_change_request.old_location, None)
        self.assertEqual(angola_region_change_request.old_opening_date, datetime.date(2022, 11, 28))
        self.assertEqual(angola_region_change_request.old_closed_date, datetime.date(2025, 11, 28))
        self.assertEqual(angola_region_change_request.old_reference_instances.count(), 0)

        # Change request #3 to create a new OrgUnit whose corresponding parent DID exist.
        new_group_c = m.Group.objects.get(name="Group C", source_version=data_source_sync.source_version_to_update)
        new_group_a2 = m.Group.objects.get(name="Group A", source_version=data_source_sync.source_version_to_update)
        angola_district_change_request = m.OrgUnitChangeRequest.objects.get(
            org_unit__source_ref="id-3", data_source_synchronization=data_source_sync
        )
        # Data.
        self.assertEqual(angola_district_change_request.kind, m.OrgUnitChangeRequest.Kind.ORG_UNIT_CREATION)
        self.assertEqual(angola_district_change_request.created_by, data_source_sync.created_by)
        self.assertEqual(
            angola_district_change_request.requested_fields,
            ["new_name", "new_parent", "new_opening_date", "new_closed_date", "new_groups"],
        )
        # New values.
        self.assertEqual(angola_district_change_request.new_parent, self.angola_region_to_update)
        self.assertEqual(angola_district_change_request.new_name, "Cuvango")
        self.assertEqual(angola_district_change_request.new_org_unit_type, None)
        self.assertEqual(angola_district_change_request.new_groups.count(), 2)
        self.assertIn(new_group_c, angola_district_change_request.new_groups.all())
        self.assertIn(new_group_a2, angola_district_change_request.new_groups.all())
        self.assertEqual(angola_district_change_request.new_location, None)
        self.assertEqual(angola_district_change_request.new_location_accuracy, None)
        self.assertEqual(angola_district_change_request.new_opening_date, datetime.date(2022, 11, 28))
        self.assertEqual(angola_district_change_request.new_closed_date, datetime.date(2025, 11, 28))
        self.assertEqual(angola_district_change_request.new_reference_instances.count(), 0)
        # Old values.
        self.assertEqual(angola_district_change_request.old_parent, None)
        self.assertEqual(angola_district_change_request.old_name, "")
        self.assertEqual(angola_district_change_request.old_org_unit_type, None)
        self.assertEqual(angola_district_change_request.old_groups.count(), 0)
        self.assertEqual(angola_district_change_request.old_location, None)
        self.assertEqual(angola_district_change_request.old_opening_date, None)
        self.assertEqual(angola_district_change_request.old_closed_date, None)
        self.assertEqual(angola_district_change_request.old_reference_instances.count(), 0)

        new_angola_district_org_unit = m.OrgUnit.objects.get(pk=angola_district_change_request.org_unit.pk)
        self.assertEqual(new_angola_district_org_unit.version, data_source_sync.source_version_to_update)
        self.assertEqual(new_angola_district_org_unit.parent.version, data_source_sync.source_version_to_update)
        self.assertEqual(new_angola_district_org_unit.creator, data_source_sync.created_by)
        self.assertEqual(new_angola_district_org_unit.validation_status, new_angola_district_org_unit.VALIDATION_NEW)
        self.assertEqual(new_angola_district_org_unit.org_unit_type, self.org_unit_type_district)
        self.assertEqual(new_angola_district_org_unit.source_ref, "id-3")
        self.assertEqual(new_angola_district_org_unit.geom, self.multi_polygon)
        self.assertEqual(new_angola_district_org_unit.simplified_geom, self.multi_polygon)

        # Change request #4 to create a new OrgUnit whose corresponding parent DID NOT exist.
        angola_facility_change_request = m.OrgUnitChangeRequest.objects.get(
            org_unit__source_ref="id-4", data_source_synchronization=data_source_sync
        )
        # Data.
        self.assertEqual(angola_facility_change_request.kind, m.OrgUnitChangeRequest.Kind.ORG_UNIT_CREATION)
        self.assertEqual(angola_facility_change_request.created_by, data_source_sync.created_by)
        self.assertEqual(
            angola_facility_change_request.requested_fields,
            ["new_name", "new_parent", "new_opening_date", "new_closed_date"],
        )
        # New values.
        self.assertEqual(angola_facility_change_request.new_parent, new_angola_district_org_unit)
        self.assertEqual(angola_facility_change_request.new_name, "Facility")
        self.assertEqual(angola_facility_change_request.new_org_unit_type, None)
        self.assertEqual(angola_facility_change_request.new_groups.count(), 0)
        self.assertEqual(angola_facility_change_request.new_location, None)
        self.assertEqual(angola_facility_change_request.new_location_accuracy, None)
        self.assertEqual(angola_facility_change_request.new_opening_date, datetime.date(2024, 11, 28))
        self.assertEqual(angola_facility_change_request.new_closed_date, datetime.date(2026, 11, 28))
        self.assertEqual(angola_facility_change_request.new_reference_instances.count(), 0)
        # Old values.
        self.assertEqual(angola_facility_change_request.old_parent, None)
        self.assertEqual(angola_facility_change_request.old_name, "")
        self.assertEqual(angola_facility_change_request.old_org_unit_type, None)
        self.assertEqual(angola_facility_change_request.old_groups.count(), 0)
        self.assertEqual(angola_facility_change_request.old_location, None)
        self.assertEqual(angola_facility_change_request.old_opening_date, None)
        self.assertEqual(angola_facility_change_request.old_closed_date, None)
        self.assertEqual(angola_facility_change_request.old_reference_instances.count(), 0)

        new_angola_facility_org_unit = m.OrgUnit.objects.get(pk=angola_facility_change_request.org_unit.pk)
        self.assertEqual(new_angola_facility_org_unit.version, data_source_sync.source_version_to_update)
        self.assertEqual(new_angola_facility_org_unit.parent.version, data_source_sync.source_version_to_update)
        self.assertEqual(new_angola_facility_org_unit.creator, data_source_sync.created_by)
        self.assertEqual(new_angola_facility_org_unit.validation_status, new_angola_facility_org_unit.VALIDATION_NEW)
        self.assertEqual(new_angola_facility_org_unit.org_unit_type, self.org_unit_type_facility)
        self.assertEqual(new_angola_facility_org_unit.source_ref, "id-4")
        self.assertEqual(new_angola_facility_org_unit.geom, self.multi_polygon)
        self.assertEqual(new_angola_facility_org_unit.simplified_geom, self.multi_polygon)

        # No change request should have been generated for org units without `source_ref`.
        self.assertEqual(
            0,
            m.OrgUnitChangeRequest.objects.filter(
                org_unit=self.angola_facility_without_source_ref_to_compare_with
            ).count(),
        )

    def test_parent_modification(self):
        # Simulate a parent modification.
        self.angola_facility_to_compare_with.parent = self.angola_country_to_compare_with
        self.angola_facility_to_compare_with.save()

        data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="Parent modification test",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            account=self.account,
            created_by=self.user,
        )

        data_source_sync.create_json_diff()
        data_source_sync.synchronize_source_versions()

        angola_facility_change_request = m.OrgUnitChangeRequest.objects.get(
            org_unit__source_ref="id-4", data_source_synchronization=data_source_sync
        )
        self.assertEqual(angola_facility_change_request.new_parent, self.angola_country_to_update)
