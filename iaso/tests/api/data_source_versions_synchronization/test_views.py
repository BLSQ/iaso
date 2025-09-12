import datetime

import time_machine

from django.contrib.auth.models import Permission
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_SOURCE_WRITE_PERMISSION,
)
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


DT = datetime.datetime(2025, 1, 3, 16, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class DataSourceVersionsSynchronizationViewSetTestCase(TaskAPITestCase):
    """
    Test DataSourceVersionsSynchronizationViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            username="user",
            first_name="Foo",
            last_name="Bar",
            account=cls.account,
            permissions=[
                CORE_SOURCE_WRITE_PERMISSION,
                CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION,
                CORE_ORG_UNITS_PERMISSION,
            ],
        )

        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)
        cls.source_3 = m.SourceVersion.objects.create(data_source=cls.data_source, number=3)

        cls.data_source_sync_1 = m.DataSourceVersionsSynchronization.objects.create(
            name="Synchronization Foo",
            source_version_to_update=cls.source_1,
            source_version_to_compare_with=cls.source_2,
            account=cls.account,
            created_by=cls.user,
        )

        cls.data_source_sync_2 = m.DataSourceVersionsSynchronization.objects.create(
            name="Synchronization Bar",
            source_version_to_update=cls.source_2,
            source_version_to_compare_with=cls.source_3,
            account=cls.account,
            created_by=cls.user,
        )

        cls.group_1 = m.Group.objects.create(
            name="Group 1",
            source_ref="group-1",
            source_version=cls.source_1,
        )
        cls.group_2 = m.Group.objects.create(
            name="Group 2",
            source_ref="group-2",
            source_version=cls.source_2,
        )

    def test_list_without_auth(self):
        response = self.client.get("/api/datasources/sync/")
        self.assertJSONResponse(response, 401)

    def test_list_without_perms(self):
        # No perms.
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        response = self.client.get("/api/datasources/sync/")
        self.assertJSONResponse(response, 403)

        # Not enough perms.
        self.user.user_permissions.add(Permission.objects.get(codename=CORE_SOURCE_WRITE_PERMISSION.name))
        response = self.client.get("/api/datasources/sync/")
        self.assertJSONResponse(response, 403)

    def test_list_ok(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(4):
            response = self.client.get("/api/datasources/sync/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data["results"]))

    def test_list_ok_with_dynamic_fields(self):
        """
        Call the API with a restricted subset of the fields (`fields=id,name`).
        This can be useful to e.g. build a frontend dropdown.
        """
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/datasources/sync/?name__icontains=foo&fields=id,name")
        self.assertEqual(1, len(response.data["results"]))
        expected_result = {
            "id": self.data_source_sync_1.pk,
            "name": self.data_source_sync_1.name,
        }
        self.assertEqual(response.data["results"][0], expected_result)

    def test_retrieve_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/datasources/sync/{self.data_source_sync_1.id}/")
        self.assertJSONResponse(response, 200)

    def test_create_without_perms(self):
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        data = {
            "name": "Foo synchronization",
            "source_version_to_update": self.source_1.pk,
            "source_version_to_compare_with": self.source_3.pk,
        }
        response = self.client.post("/api/datasources/sync/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

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
        response = self.client.patch(f"/api/datasources/sync/{self.data_source_sync_1.id}/create_json_diff/")
        self.assertJSONResponse(response, 403)

    def test_create_json_diff(self):
        self.client.force_authenticate(self.user)

        self.assertIsNone(self.data_source_sync_1.json_diff)

        json_diff_params = {
            "source_version_to_update_validation_status": m.OrgUnit.VALIDATION_NEW,
            "source_version_to_compare_with_validation_status": m.OrgUnit.VALIDATION_NEW,
            "source_version_to_update_org_unit_group": self.group_1.id,
            "source_version_to_compare_with_org_unit_group": self.group_2.id,
            "ignore_groups": True,
            "show_deleted_org_units": False,
            "field_names": ["name"],
        }
        response = self.client.patch(
            f"/api/datasources/sync/{self.data_source_sync_1.id}/create_json_diff/", data=json_diff_params
        )
        self.assertJSONResponse(response, 200)

        self.data_source_sync_1.refresh_from_db()
        self.assertIsNotNone(self.data_source_sync_1.json_diff)

        expected_diff_config_str = (
            "{"
            f"'version': {self.source_1.pk}, "
            "'validation_status': 'NEW', "
            "'top_org_unit': None, "
            "'org_unit_types': None, "
            f"'org_unit_group': {self.group_1.pk}, "
            f"'version_ref': {self.source_2.pk}, "
            "'validation_status_ref': 'NEW', "
            "'top_org_unit_ref': None, "
            "'org_unit_types_ref': None, "
            f"'org_unit_group_ref': {self.group_2.pk}, "
            "'ignore_groups': True, "
            "'show_deleted_org_units': False, "
            "'field_names': {'name'}"
            "}"
        )
        self.assertEqual(self.data_source_sync_1.diff_config, expected_diff_config_str)

    def test_create_json_diff_error_code_in_field_names(self):
        self.client.force_authenticate(self.user)

        self.assertIsNone(self.data_source_sync_1.json_diff)

        json_diff_params = {
            "source_version_to_update_validation_status": m.OrgUnit.VALIDATION_NEW,
            "source_version_to_compare_with_validation_status": m.OrgUnit.VALIDATION_NEW,
            "source_version_to_update_org_unit_group": self.group_1.id,
            "source_version_to_compare_with_org_unit_group": self.group_2.id,
            "ignore_groups": True,
            "show_deleted_org_units": False,
            "field_names": ["name", "code"],
        }
        response = self.client.patch(
            f"/api/datasources/sync/{self.data_source_sync_1.id}/create_json_diff/", data=json_diff_params
        )
        json_response = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn('"code" is not a valid choice', json_response["field_names"][0])

        self.data_source_sync_1.refresh_from_db()
        self.assertIsNone(self.data_source_sync_1.json_diff)

    def test_synchronize_source_versions_async_without_perms(self):
        self.client.force_authenticate(self.user)
        self.user.user_permissions.clear()
        response = self.client.patch(
            f"/api/datasources/sync/{self.data_source_sync_1.id}/synchronize_source_versions_async/"
        )
        self.assertJSONResponse(response, 403)

    def test_synchronize_source_versions_async(self):
        # We use an empty `json_diff` here because `synchronize_source_versions()` (which
        # is called in the background task) is already fully tested in the model tests.
        # We're just interested in checking that the background task works as expected.
        self.data_source_sync_1.json_diff = "[]"
        self.data_source_sync_1.save()

        self.client.force_authenticate(self.user)
        response = self.client.patch(
            f"/api/datasources/sync/{self.data_source_sync_1.id}/synchronize_source_versions_async/"
        )

        self.assertJSONResponse(response, 200)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="synchronize_source_versions_task")

        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["data_source_versions_synchronization_id"], self.data_source_sync_1.id)

        self.runAndValidateTask(task, "SUCCESS")

        self.data_source_sync_1.refresh_from_db()
        self.assertEqual(self.data_source_sync_1.sync_task, task)
