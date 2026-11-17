from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase, SwaggerTestCaseMixin
from iaso.tests.utils.query_profiler import QueryProfiler


class DeviceLogsAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @property
    def url(self):
        return reverse("mobile_devices_sync-list")

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
        self.assertEqual(response.json()["app_id"], ["This field is required."])

    def test_get_return_404_with_invalid_project(self):
        response = self.client.get(f"""{self.url}?app_id=foobar""")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_return_403_with_project_from_other_account(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"""{self.url}?app_id={self.project_3.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_details(self):
        response = self.client.get(f"""{self.url}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list(self):
        response = self.client.get(f"""{self.url}?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch(self):
        response = self.client.patch(f"""{self.url}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete(self):
        response = self.client.delete(f"""{self.url}123/?app_id={self.project_1.app_id}""")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_for_project_without_authentication(self):
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_1.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertIsNone(log.user, "anonymous sync must not store a user")

    def test_create_for_project_with_authentication(self):
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_for_project_with_authentication_and_authenticated(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_twice(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m.Device.objects.filter(installation_id="test").count(), 1)
        self.assertEqual(m.DeviceLog.objects.filter(device__installation_id="test").count(), 1)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m.Device.objects.filter(installation_id="test").count(), 1)
        self.assertEqual(m.DeviceLog.objects.filter(device__installation_id="test").count(), 2)
        self.assertEqual(1, m.DeviceOwnership.objects.filter(device__installation_id="test").count())
        # DeviceLog.user used to be a OneToOneField: a user could only sync once
        self.assertEqual(
            [self.user, self.user],
            [log.user for log in m.DeviceLog.objects.filter(device__installation_id="test").order_by("id")],
        )

    def test_create_with_same_installation_id_in_other_account(self):
        other_account_device = m.Device.objects.create(installation_id="test", account=self.project_3.account)
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        device = m.DeviceLog.objects.get(id=response.json()["id"]).device
        self.assertNotEqual(other_account_device, device)
        self.assertEqual(self.project_2.account, device.account)
        self.assertEqual(2, m.Device.objects.filter(installation_id="test").count())

    def test_create_with_duplicate_installation_id_in_same_account(self):
        # duplicates exist in prod (the unique constraint was dropped for them)
        oldest_device = m.Device.objects.create(installation_id="test", account=self.project_2.account)
        m.Device.objects.create(installation_id="test", account=self.project_2.account)
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(2, m.Device.objects.filter(installation_id="test").count(), "no third device created")
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(oldest_device, log.device, "log must go to the oldest duplicate")

    def test_create_for_project_with_same_project(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [
                self.project_2.app_id,
            ],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(list(log.projects.all()), [self.project_2])
        self.assertEqual(self.user, log.user)

    def test_create_for_project_with_different_projects(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [
                self.project_2.app_id,
            ],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_1.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(list(log.projects.all()), [self.project_2])
        self.assertEqual(self.user, log.user)

    def test_create_for_project_with_data(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": {"foo": "bar"},
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [
                self.project_2.app_id,
            ],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = m.DeviceLog.objects.get(device__installation_id="test")
        self.assertEqual(["id"], list(response.json()))
        self.assertEqual(log.id, response.json()["id"])
        self.assertEqual(log.data, {"foo": "bar"})
        self.assertEqual(self.user, log.user)

    def test_create_for_project_with_authentication_in_wrong_account_and_authenticated(self):
        self.client.force_authenticate(user=self.user)
        body = {
            "device": "test",
            "data": None,
            "app_id": "app_id",
            "app_version": "300500101",
            "projects": [],
        }
        self.assertValidBodyData(body)
        response = self.client.post(f"""{self.url}?app_id={self.project_3.app_id}""", data=body)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_on_two_projects_links_device_to_both(self):
        body = {"device": "test", "data": None, "app_id": "app_id", "app_version": "300500101", "projects": []}
        response = self.client.post(f"""{self.url}?app_id={self.project_1.app_id}""", data=body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        device = m.Device.objects.get(installation_id="test")
        self.assertEqual([self.project_1], list(device.projects.all()), "anonymous sync links the project too")

        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(device, m.Device.objects.get(installation_id="test"))
        self.assertCountEqual([self.project_1, self.project_2], device.projects.all())

    def test_create_query_counts_new_device(self):
        self.client.force_authenticate(user=self.user)
        body = {"device": "test", "data": None, "app_id": "app_id", "app_version": "300500101", "projects": ["p2"]}
        with QueryProfiler() as profiler:
            response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        with profiler.report_on_failure("device_sync_new_device_queries.md"):
            # project from app_id + projects field (2), device lookup + insert, ownership, device.projects.add(), log
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_project": 4,
                    "iaso_device": 2,
                    "iaso_device_projects": 1,
                    "iaso_deviceownership": 1,
                    "iaso_devicelog": 1,
                    "iaso_devicelog_projects": 1,
                }
            )

    def test_create_query_counts_existing_device(self):
        m.Device.objects.create(installation_id="test", account=self.project_2.account)
        self.client.force_authenticate(user=self.user)
        body = {"device": "test", "data": None, "app_id": "app_id", "app_version": "300500101", "projects": ["p2"]}
        with QueryProfiler() as profiler:
            response = self.client.post(f"""{self.url}?app_id={self.project_2.app_id}""", data=body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        with profiler.report_on_failure("device_sync_existing_device_queries.md"):
            # project from app_id + projects field, a single device lookup, device.projects.add(), log + its projects
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_project": 3,
                    "iaso_device": 1,
                    "iaso_device_projects": 1,
                    "iaso_devicelog": 1,
                    "iaso_devicelog_projects": 1,
                }
            )

    def assertValidBodyData(self, data):
        self.assertResponseCompliantToSwagger(data, "DeviceLogCreateRequest")
