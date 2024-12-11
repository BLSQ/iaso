import datetime
import json

import time_machine

from iaso import models as m
from iaso.test import TestCase


class DataSourceSynchronizationModelTestCase(TestCase):
    """
    Test DataSourceSynchronization model.
    """

    DT = datetime.datetime(2024, 12, 4, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        # Data source.
        cls.data_source = m.DataSource.objects.create(name="Data source")

        # Data source versions.
        cls.source_version_to_compare_with = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="Bar"
        )
        cls.source_version_to_update = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="Foo"
        )

        # Groups
        cls.group_a = m.Group.objects.create(
            name="Group A", source_ref="group-id", source_version=cls.source_version_to_compare_with
        )
        cls.group_b = m.Group.objects.create(
            name="Group B", source_ref="group-id", source_version=cls.source_version_to_update
        )
        cls.group_c = m.Group.objects.create(
            name="Group C", source_ref="group-id", source_version=cls.source_version_to_update
        )

        # Org unit type.
        cls.org_unit_type_country = m.OrgUnitType.objects.create(category="COUNTRY")
        cls.org_unit_type_region = m.OrgUnitType.objects.create(category="REGION")
        cls.org_unit_type_district = m.OrgUnitType.objects.create(category="DISTRICT")

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
        )
        cls.angola_country_to_update.groups.set([cls.group_b, cls.group_c])

        cls.angola_region_to_update = m.OrgUnit.objects.create(
            parent=cls.angola_country_to_update,
            version=cls.source_version_to_update,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
        )

        # Angola pyramid to compare with (3 org units).

        cls.angola_country_to_compare_with = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_to_compare_with,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
        )
        cls.angola_country_to_compare_with.groups.set([cls.group_a])

        cls.angola_region_to_compare_with = m.OrgUnit.objects.create(
            parent=cls.angola_country_to_compare_with,
            version=cls.source_version_to_compare_with,
            source_ref="id-2",
            name="Huila",
            org_unit_type=cls.org_unit_type_region,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
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
        )

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    @time_machine.travel(DT, tick=False)
    def test_create(self):
        kwargs = {
            "name": "New synchronization",
            "source_version_to_update": self.source_version_to_update,
            "source_version_to_compare_with": self.source_version_to_compare_with,
            "json_diff": None,
            "sync_task": None,
            "account": self.account,
            "created_by": self.user,
        }
        data_source_sync = m.DataSourceSynchronization(**kwargs)
        data_source_sync.full_clean()
        data_source_sync.save()
        data_source_sync.refresh_from_db()

        self.assertEqual(data_source_sync.name, kwargs["name"])
        self.assertEqual(data_source_sync.source_version_to_update, kwargs["source_version_to_update"])
        self.assertEqual(data_source_sync.source_version_to_compare_with, kwargs["source_version_to_compare_with"])
        self.assertEqual(data_source_sync.json_diff, kwargs["json_diff"])
        self.assertEqual(data_source_sync.sync_task, kwargs["sync_task"])
        self.assertEqual(data_source_sync.account, kwargs["account"])
        self.assertEqual(data_source_sync.created_by, kwargs["created_by"])
        self.assertEqual(data_source_sync.created_at, self.DT)
        self.assertEqual(data_source_sync.updated_at, self.DT)

    def test_create_json_diff(self):
        """
        Test that `create_json_diff()` works as expected.
        """
        # Change the name.
        self.angola_country_to_compare_with.name = "Angola new"
        self.angola_country_to_compare_with.save()

        data_source_sync = m.DataSourceSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=self.source_version_to_update,
            source_version_to_compare_with=self.source_version_to_compare_with,
            json_diff=None,
            sync_task=None,
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
            f"'version': <SourceVersion: {str(self.source_version_to_update)}>, "
            f"'validation_status': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit': None, "
            f"'org_unit_types': [<OrgUnitType: {str(self.org_unit_type_country)}>], "
            f"'version_ref': <SourceVersion: {str(self.source_version_to_compare_with)}>, "
            f"'validation_status_ref': '{m.OrgUnit.VALIDATION_VALID}', "
            "'top_org_unit_ref': None, "
            f"'org_unit_types_ref': [<OrgUnitType: {str(self.org_unit_type_country)}>], "
            "'ignore_groups': True, "
            "'show_deleted_org_units': False, "
            "'field_names': ['name']"
            "}"
        )
        self.assertEqual(data_source_sync.diff_config, expected_diff_config)

        self.assertEqual(data_source_sync.count_create, 0)
        self.assertEqual(data_source_sync.count_update, 1)
        self.assertEqual(data_source_sync.total_change_requests, 1)
