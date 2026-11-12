import datetime

import time_machine

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class DevicesAPITestCase(SwaggerTestCaseMixin, APITestCase):
    DT = datetime.datetime(2025, 1, 3, 16, 0, 0, 0, tzinfo=datetime.UTC)

    @property
    def url(self):
        return reverse("devices-list")

    @classmethod
    @time_machine.travel(DT, tick=False)
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Account")
        account2 = m.Account.objects.create(name="Account2")

        cls.project = m.Project.objects.create(name="Project", account=account)
        cls.project2 = m.Project.objects.create(name="Project2", account=account2)

        cls.manager = cls.create_user_with_profile(username="manager", account=account, permissions=[])
        cls.user = cls.create_user_with_profile(username="user", account=account, permissions=[])
        cls.user_with_perm = cls.create_user_with_profile(
            username="user_with_perm", account=account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.team_1 = m.Team.objects.create(name="Team 1", project=cls.project, manager=cls.manager)
        cls.team_2 = m.Team.objects.create(name="Team 2", project=cls.project, manager=cls.manager)
        cls.team_3 = m.Team.objects.create(name="Team 3", project=cls.project2, manager=cls.manager)

        cls.team_1.users.set([cls.user])
        cls.team_2.users.set([cls.user_with_perm])

        cls.device_1 = m.Device.objects.create(installation_id="device1", account=account)
        cls.device_2 = m.Device.objects.create(installation_id="device2", account=account)
        cls.device_2.projects.set([cls.project])

        m.DeviceOwnership.objects.create(
            device_id=cls.device_2.id,
            user=cls.user_with_perm,
        )
        m.DeviceLog.objects.create(
            device_id=cls.device_1.id,
            user=cls.user,
            app_id="app_id",
            app_version="1.0.0",
        )
        m.Instance.objects.create(device_id=cls.device_1.id)
        m.Instance.objects.create(device_id=cls.device_1.id)
        m.Instance.objects.create(device_id=cls.device_1.id)
        m.Instance.objects.create(device_id=None)
        m.Instance.objects.create(device_id=None)

    def test_permissions(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_with_perm)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create(self):
        self.client.force_authenticate(user=self.user_with_perm)
        res = self.client.post(self.url, data={"installation_id": "device3"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_update(self):
        self.client.force_authenticate(user=self.user_with_perm)
        res = self.client.patch(f"""{self.url}{self.device_1.id}/""", data={"installation_id": "device3"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete(self):
        self.client.force_authenticate(user=self.user_with_perm)
        res = self.client.delete(f"""{self.url}{self.device_1.id}/""", data={"installation_id": "device3"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_num_queries(self):
        self.client.force_authenticate(self.user_with_perm)

        ContentType.objects.clear_cache()

        with self.assertNumQueries(4):
            # 1. SELECT FROM "auth_permission"
            # 2. SELECT FROM "auth_permission"
            # 3. SELECT COUNT(*) FROM "iaso_device"
            # 4. SELECT FROM "iaso_device"
            res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

    def test_content(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        first = res_data["results"][0]
        self.assertEqual("device1", first["installation_id"])
        self.assertEqual("1.0.0", first["last_app_version_id"])
        self.assertEqual(None, first["current_owner"])
        self.assertEqual(3, first["instance_count"])
        second = res_data["results"][1]
        self.assertEqual("device2", second["installation_id"])
        self.assertEqual(None, second["last_app_version_id"])
        self.assertEqual("user_with_perm", second["current_owner"]["username"])
        self.assertEqual(0, second["instance_count"])

    def test_has_synced_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"synced": False})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device1", res_data["results"][0]["installation_id"])

        res = self.client.get(self.url, data={"synced": True})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device2", res_data["results"][0]["installation_id"])

    def test_search_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"search": "Devi"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        res = self.client.get(self.url, data={"search": "2"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device2", res_data["results"][0]["installation_id"])

    def test_active_before_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"active_before": "2025-01-1"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

        res = self.client.get(self.url, data={"active_before": "2025-02-1"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device1", res_data["results"][0]["installation_id"])

    def test_active_after_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"active_after": "2025-01-1"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device1", res_data["results"][0]["installation_id"])

        res = self.client.get(self.url, data={"active_after": "2025-02-1"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

    def test_app_version_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"app_version": "1.0"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device1", res_data["results"][0]["installation_id"])

        res = self.client.get(self.url, data={"app_version": "1.0.1"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

    def test_app_id_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"app_id": "app_"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device1", res_data["results"][0]["installation_id"])

        res = self.client.get(self.url, data={"app_id": "wrong_app_id"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

    def test_team_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"team": -1})
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.json()["team"],
            ["Select a valid choice. That choice is not one of the available choices."],
        )

        res = self.client.get(self.url, data={"team": self.team_1.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

        res = self.client.get(self.url, data={"team": self.team_2.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device2", res_data["results"][0]["installation_id"])

        res = self.client.get(self.url, data={"team": self.team_3.pk})
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.json()["team"],
            ["Select a valid choice. That choice is not one of the available choices."],
        )

    def test_projects_filter(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(self.url, data={"project_ids": -1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

        res = self.client.get(self.url, data={"project_ids": self.project.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual("device2", res_data["results"][0]["installation_id"])

    def assertValidData(self, data, expected_length):
        self.assertValidListData(list_data=data, paginated=True, results_key="results", expected_length=expected_length)
        self.assertResponseCompliantToSwagger(data, "PaginatedListDeviceList")
