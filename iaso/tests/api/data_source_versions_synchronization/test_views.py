import datetime

import time_machine

from iaso.test import APITestCase
from iaso import models as m


DT = datetime.datetime(2025, 1, 3, 16, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DataSourceVersionsSynchronizationViewSetTestCase(APITestCase):
    """
    Test DataSourceVersionsSynchronizationViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            username="user", first_name="Foo", last_name="Bar", account=cls.account, permissions=["iaso_write_sources"]
        )

        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)
        cls.source_3 = m.SourceVersion.objects.create(data_source=cls.data_source, number=3)

        cls.data_source_sync_1 = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=cls.source_1,
            source_version_to_compare_with=cls.source_2,
            account=cls.account,
            created_by=cls.user,
        )

        cls.data_source_sync_2 = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=cls.source_2,
            source_version_to_compare_with=cls.source_3,
            account=cls.account,
            created_by=cls.user,
        )

    def test_list_without_auth(self):
        response = self.client.get("/api/datasources/sync/")
        self.assertJSONResponse(response, 401)

    def test_list_without_perms(self):
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        response = self.client.get("/api/datasources/sync/")
        self.assertJSONResponse(response, 403)

    def test_list_ok(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(4):
            response = self.client.get("/api/datasources/sync/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data["results"]))

    def test_retrieve_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/datasources/sync/{self.data_source_sync_1.id}/")
        self.assertJSONResponse(response, 200)

    def test_create_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "name": "Foo synchronization",
            "source_version_to_update": self.source_1.pk,
            "source_version_to_compare_with": self.source_3.pk,
        }
        response = self.client.post("/api/datasources/sync/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        data_source_sync = m.DataSourceVersionsSynchronization.objects.get(id=response.data["id"])
        self.assertEqual(data_source_sync.name, "Foo synchronization")
        self.assertEqual(data_source_sync.source_version_to_update, self.source_1)
        self.assertEqual(data_source_sync.source_version_to_compare_with, self.source_3)
        self.assertEqual(data_source_sync.created_by, self.user)
        self.assertEqual(data_source_sync.account, self.account)

    def test_create_json_diff_without_perms(self):
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        response = self.client.post(f"/api/datasources/sync/{self.data_source_sync_1.id}/create_json_diff/")
        self.assertJSONResponse(response, 403)

    def test_synchronize_source_versions_without_perms(self):
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        response = self.client.post(f"/api/datasources/sync/{self.data_source_sync_1.id}/synchronize_source_versions/")
        self.assertJSONResponse(response, 403)
