import datetime

import time_machine

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class DevicesAPITestCase(SwaggerTestCaseMixin, APITestCase):
    DT = datetime.datetime(2025, 1, 3, 16, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @property
    def url(self):
        return reverse("devices-list")

    @classmethod
    @time_machine.travel(DT, tick=False)
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Account")

        cls.project = m.Project.objects.create(name="Project", account=account)

        cls.manager = cls.create_user_with_profile(username="manager", account=account, permissions=[])
        cls.user = cls.create_user_with_profile(username="user", account=account, permissions=[])
        cls.user_with_perm = cls.create_user_with_profile(
            username="user_with_perm", account=account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.team_1 = m.Team.objects.create(name="Team 1", project=cls.project, manager=cls.manager)
        cls.team_2 = m.Team.objects.create(name="Team 2", project=cls.project, manager=cls.manager)

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

    def test_num_queries(self):
        self.client.force_authenticate(self.user_with_perm)

        ContentType.objects.clear_cache()

        with self.assertNumQueries(3):
            # 1. SELECT FROM "auth_permission"
            # 2. SELECT FROM "auth_permission"
            # 3. SELECT FROM "iaso_device"
            res = self.client.get(f"{self.url}{self.device_1.installation_id}/")
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_content(self):
        self.client.force_authenticate(self.user_with_perm)

        res = self.client.get(f"{self.url}{self.device_1.installation_id}/")
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertEqual("device1", res_data["installation_id"])
        self.assertEqual("1.0.0", res_data["last_app_version_id"])
        self.assertEqual(None, res_data["current_owner"])
        self.assertEqual(3, res_data["instance_count"])
