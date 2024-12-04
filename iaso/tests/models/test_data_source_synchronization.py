import datetime

import time_machine

from django.core.exceptions import ValidationError

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
            "fields_to_sync": [
                "parent",
                "name",
                "opening_date",
                "closed_date",
                "groups",
            ],
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
        self.assertEqual(data_source_sync.fields_to_sync, kwargs["fields_to_sync"])
        self.assertEqual(data_source_sync.json_diff, kwargs["json_diff"])
        self.assertEqual(data_source_sync.sync_task, kwargs["sync_task"])
        self.assertEqual(data_source_sync.account, kwargs["account"])
        self.assertEqual(data_source_sync.created_by, kwargs["created_by"])
        self.assertEqual(data_source_sync.created_at, self.DT)
        self.assertEqual(data_source_sync.updated_at, self.DT)

    def test_clean_fields_to_sync(self):
        data_source_sync = m.DataSourceSynchronization(
            name="Foo",
            account=self.account,
            created_by=self.user,
            left_source_version=self.source_version_iaso,
            right_source_version=self.source_version_dhis2,
        )

        data_source_sync.fields_to_sync = ["name", "name"]
        with self.assertRaises(ValidationError) as error:
            data_source_sync.clean_fields_to_sync()
        self.assertIn("Fields to synchronize must be unique.", error.exception.messages)

        data_source_sync.fields_to_sync = ["name", "parent", "opening_date", "closed_date", "groups", "foo"]
        with self.assertRaises(ValidationError) as error:
            data_source_sync.clean_fields_to_sync()
        self.assertIn(
            f"You can only select up to {len(data_source_sync.SynchronizableFields)} fields to synchronize.",
            error.exception.messages,
        )
