from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase, SwaggerTestCaseMixin


class DeviceLogsAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Account 1")
        account_2 = m.Account.objects.create(name="Account 2")

        cls.project_1 = m.Project.objects.create(
            name="Project 1", app_id="p1", account=account, needs_authentication=False
        )
        cls.project_2 = m.Project.objects.create(
            name="Project 2", app_id="p2", account=account, needs_authentication=True
        )
        cls.project_3 = m.Project.objects.create(
            name="Project 3", app_id="p3", account=account_2, needs_authentication=True
        )

        cls.user = cls.create_user_with_profile(username="user", account=account, permissions=[])

    def test_get_return_400_without_project(self):
        response = self.client.get(reverse("mobile_devices_sync-list"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_return_404_with_invalid_project(self):
        response = self.client.get(f"""{reverse("mobile_devices_sync-list")}?app_id=foobar""")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_details(self):
        response = self.client.get(f"""{reverse("mobile_devices_sync-list")}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_list(self):
        response = self.client.get(f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch(self):
        response = self.client.patch(f"""{reverse("mobile_devices_sync-list")}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete(self):
        response = self.client.delete(f"""{reverse("mobile_devices_sync-list")}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_create_for_project_without_authentication(self):
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_1.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_for_project_with_authentication(self):
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_for_project_with_authentication_and_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_twice(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m.Device.objects.filter(installation_id="test").count(), 1)
        self.assertEqual(m.DeviceLog.objects.filter(device__installation_id="test").count(), 1)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m.Device.objects.filter(installation_id="test").count(), 1)
        self.assertEqual(m.DeviceLog.objects.filter(device__installation_id="test").count(), 2)

    def test_create_for_project_with_same_project(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [
                    self.project_2.app_id,
                ],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(list(log.projects.all()), [self.project_2])

    def test_create_for_project_with_different_projects(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_1.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [
                    self.project_2.app_id,
                ],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(list(log.projects.all()), [self.project_2])

    def test_create_for_project_with_data(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_2.app_id}""",
            data={
                "device": "test",
                "data": {"foo": "bar"},
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [
                    self.project_2.app_id,
                ],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(log.data, {"foo": "bar"})

    def test_create_for_project_with_authentication_in_wrong_account_and_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"""{reverse("mobile_devices_sync-list")}?app_id={self.project_3.app_id}""",
            data={
                "device": "test",
                "data": None,
                "app_id": "app_id",
                "app_version": "300500101",
                "projects": [],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
