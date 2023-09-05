import typing

from iaso import models as m
from iaso.test import APITestCase


class DevicesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        wha = m.Account.objects.create(name="Worldwide Health Aid")
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=["iaso_forms"])
        cls.jim = cls.create_user_with_profile(username="jimdoe", account=wha)
        project = m.Project.objects.create(name="Project 1", app_id="org.ghi.p1", account=wha)
        cls.device_1 = m.Device.objects.create(imei="AAABBBCCCDDD")
        cls.device_2 = m.Device.objects.create(imei="EEEFFFGGGHHH")
        cls.device_1.projects.add(project)

    def test_devices_list_without_auth(self):
        """GET /devices/ without auth should result in a 403"""

        response = self.client.get("/api/devices/")
        self.assertJSONResponse(response, 403)

    def test_devices_list_no_permission(self):
        """GET /devices/ with auth but without the proper permission"""

        self.client.force_authenticate(self.jim)
        response = self.client.get("/api/devices/")
        self.assertJSONResponse(response, 403)

    def test_devices_list_with_permission(self):
        """GET /devices/ with auth and the proper permission"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/devices/")
        self.assertJSONResponse(response, 200)

    def test_devices_list_paginated(self):
        """GET /devices/ paginated happy path"""

        self.client.force_authenticate(self.john)
        response = self.client.get("/api/devices/?limit=1&page=1", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidDeviceListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 1)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 1)

    def test_devices_retrieve_ok(self):
        """GET /devices/<device_id> happy path"""

        self.client.force_authenticate(self.john)
        response = self.client.get(f"/api/devices/{self.device_1.id}/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidDeviceData(response_data)
        self.assertEquals(self.device_1.imei, response_data["imei"])

    def assertValidDeviceData(self, device_data: typing.Mapping):
        self.assertHasField(device_data, "id", int)
        self.assertHasField(device_data, "imei", str)
        self.assertHasField(device_data, "test_device", bool)
        self.assertHasField(device_data, "last_owner", object)
        self.assertHasField(device_data, "created_at", float)
        self.assertHasField(device_data, "updated_at", float)

    def assertValidDeviceListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="devices", paginated=paginated
        )

        for project_data in list_data["devices"]:
            self.assertValidDeviceData(project_data)
