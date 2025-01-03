import datetime

import time_machine

from iaso import models as m
from iaso.api.data_source_versions_synchronization.serializers import DataSourceVersionsSynchronizationSerializer
from iaso.test import TestCase


DT = datetime.datetime(2025, 1, 3, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DataSourceVersionsSynchronizationSerializerTestCase(TestCase):
    """
    Test DataSourceVersionsSynchronizationSerializer.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", first_name="Foo", last_name="Bar", account=cls.account)

        cls.data_source = m.DataSource.objects.create(name="Data source")

        cls.source_version_to_update = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=2, description="Source A"
        )
        cls.source_version_to_compare_with = m.SourceVersion.objects.create(
            data_source=cls.data_source, number=1, description="Source B"
        )

        cls.data_source_sync = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=cls.source_version_to_update,
            source_version_to_compare_with=cls.source_version_to_compare_with,
            json_diff=None,
            sync_task=None,
            account=cls.account,
            created_by=cls.user,
        )

    def test_serialize(self):
        serializer = DataSourceVersionsSynchronizationSerializer(self.data_source_sync)

        self.assertEqual(
            serializer.data,
            {
                "id": self.data_source_sync.pk,
                "name": "New synchronization",
                "source_version_to_update": {
                    "id": self.source_version_to_update.pk,
                    "number": 2,
                    "description": "Source A",
                    "data_source": self.data_source.pk,
                    "data_source_name": "Data source",
                },
                "source_version_to_compare_with": {
                    "id": self.source_version_to_compare_with.pk,
                    "number": 1,
                    "description": "Source B",
                    "data_source": self.data_source.pk,
                    "data_source_name": "Data source",
                },
                "count_create": 0,
                "count_update": 0,
                "account": {
                    "id": self.account.pk,
                    "name": "Account",
                    "default_version": None,
                },
                "created_by": {
                    "id": self.user.pk,
                    "username": "user",
                    "first_name": "Foo",
                    "last_name": "Bar",
                    "full_name": "Foo Bar",
                },
                "created_at": "2025-01-03T14:00:00Z",
                "updated_at": "2025-01-03T14:00:00Z",
            },
        )

    def test_deserialize(self):
        data = {
            "name": "Another synchronization",
            "source_version_to_update": self.source_version_to_update.pk,
            "source_version_to_compare_with": self.source_version_to_compare_with.pk,
        }
        serializer = DataSourceVersionsSynchronizationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        data_source_versions_sync = serializer.save(created_by=self.user, account=self.account)
        self.assertEqual(data_source_versions_sync.name, "Another synchronization")
        self.assertEqual(data_source_versions_sync.source_version_to_update, self.source_version_to_update)
        self.assertEqual(data_source_versions_sync.source_version_to_compare_with, self.source_version_to_compare_with)
        self.assertIsNone(data_source_versions_sync.json_diff)
        self.assertIsNone(data_source_versions_sync.sync_task)
        self.assertEqual(data_source_versions_sync.account, self.account)
        self.assertEqual(data_source_versions_sync.created_by, self.user)

    def test_validate_that_data_source_is_the_same_for_both_versions(self):
        other_data_source = m.DataSource.objects.create(name="Other data source")
        other_source_version = m.SourceVersion.objects.create(
            data_source=other_data_source, number=3, description="Source X"
        )
        data = {
            "name": "Another synchronization",
            "source_version_to_update": self.source_version_to_update.pk,
            "source_version_to_compare_with": other_source_version.pk,
        }
        serializer = DataSourceVersionsSynchronizationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "The two versions to compare must be linked to the same data source.",
            serializer.errors["non_field_errors"][0],
        )

    def test_validate_that_versions_to_compare_are_different(self):
        data = {
            "name": "Another synchronization",
            "source_version_to_update": self.source_version_to_update.pk,
            "source_version_to_compare_with": self.source_version_to_update.pk,
        }
        serializer = DataSourceVersionsSynchronizationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "The two versions to compare must be different.",
            serializer.errors["non_field_errors"][0],
        )
