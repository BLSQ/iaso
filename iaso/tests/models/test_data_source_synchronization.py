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
        cls.source_version_dhis2 = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="dhis2"
        )
        cls.source_version_iaso = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="iaso"
        )

        # Groups
        cls.group_dhis2 = m.Group.objects.create(
            name="Group DHIS2", source_ref="group-id", source_version=cls.source_version_dhis2
        )
        cls.group_iaso_a = m.Group.objects.create(
            name="Group IASO A", source_ref="group-id", source_version=cls.source_version_iaso
        )
        cls.group_iaso_b = m.Group.objects.create(
            name="Group IASO B", source_ref="group-id", source_version=cls.source_version_iaso
        )

        # Org unit type.
        cls.org_unit_type_country = m.OrgUnitType.objects.create(category="COUNTRY")

        # Pyramid in DHIS2.
        cls.angola_country_dhis2 = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_dhis2,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
        )
        cls.angola_country_dhis2.groups.set([cls.group_dhis2])

        # Pyramid in IASO.
        cls.angola_country_iaso = m.OrgUnit.objects.create(
            parent=None,
            version=cls.source_version_iaso,
            source_ref="id-1",
            name="Angola",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type_country,
            opening_date=datetime.date(2022, 11, 28),
            closed_date=datetime.date(2025, 11, 28),
        )
        cls.angola_country_iaso.groups.set([cls.group_iaso_a, cls.group_iaso_b])

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    @time_machine.travel(DT, tick=False)
    def test_create(self):
        kwargs = {
            "name": "New synchronization",
            "left_source_version": self.source_version_iaso,
            "right_source_version": self.source_version_dhis2,
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
        self.assertEqual(data_source_sync.left_source_version, kwargs["left_source_version"])
        self.assertEqual(data_source_sync.right_source_version, kwargs["right_source_version"])
        self.assertEqual(data_source_sync.json_diff, kwargs["json_diff"])
        self.assertEqual(data_source_sync.sync_task, kwargs["sync_task"])
        self.assertEqual(data_source_sync.account, kwargs["account"])
        self.assertEqual(data_source_sync.created_by, kwargs["created_by"])
        self.assertEqual(data_source_sync.created_at, self.DT)
        self.assertEqual(data_source_sync.updated_at, self.DT)

    def test_create_json_diff(self):
        # Change the name in DHIS2.
        self.angola_country_dhis2.name = "Angola new"
        self.angola_country_dhis2.save()

        kwargs = {
            "name": "New synchronization",
            "left_source_version": self.source_version_iaso,
            "right_source_version": self.source_version_dhis2,
            "json_diff": None,
            "sync_task": None,
            "account": self.account,
            "created_by": self.user,
        }
        data_source_sync = m.DataSourceSynchronization.objects.create(**kwargs)
        self.assertIsNone(data_source_sync.json_diff)
        self.assertEqual(data_source_sync.json_diff_config, "")

        data_source_sync.create_json_diff(
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

        expected_json_diff_config = (
            "{"
            f"'version': <SourceVersion: Data source  {self.source_version_iaso.number}>, "
            "'validation_status': None, "
            "'top_org_unit': None, "
            "'org_unit_types': None, "
            f"'version_ref': <SourceVersion: Data source  {self.source_version_dhis2.number}>, "
            "'validation_status_ref': None, "
            "'top_org_unit_ref': None, "
            "'org_unit_types_ref': None, "
            "'ignore_groups': True, "
            "'show_deleted_org_units': False, "
            "'field_names': ['name']"
            "}"
        )
        self.assertEqual(data_source_sync.json_diff_config, expected_json_diff_config)
