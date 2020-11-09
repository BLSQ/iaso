import typing
from django.test import tag
from uuid import uuid4

from iaso import models as m
from iaso.test import APITestCase


class DevicesPositionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
            needs_authentication=False,
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept",
            app_id="stars.empire.agriculture.land_speeder",
            account=star_wars,
            needs_authentication=True,
        )

        cls.device_1 = m.Device.objects.create()
        cls.device_1.projects.set([cls.project_1])
        cls.device_2 = m.Device.objects.create()
        cls.device_2.projects.set([cls.project_2])

    @tag("iaso_only")
    def test_post_ok_no_auth(self):
        """POST /devicesposition/ without auth: should work"""

        devices_position_body = [
            {
                "captured_at": 1590506880,
                "uuid": "d31d0c7b-632b-4944-8fda-ca3688153ef9",
                "device_id": self.device_1.pk,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            }
        ]
        response = self.client.post(
            f"/api/devicesposition/?app_id={self.project_1.app_id}", devices_position_body, format="json"
        )
        self.assertJSONResponse(response, 201)
        self.assertValidDevicePositionListData(response.json(), 1, with_result_key=False)
        self.assertAPIImport("devicesposition", request_body=devices_position_body, has_problems=False)

    @tag("iaso_only")
    def test_post_ok_no_auth_many(self):
        """POST /devicesposition/ without auth and many positions"""

        devices_position_body = [
            {
                "captured_at": 1590506880 + i,
                "uuid": str(uuid4()),
                "device_id": self.device_1.pk,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            }
            for i in range(50)
        ]
        response = self.client.post(
            f"/api/devicesposition/?app_id={self.project_1.app_id}", devices_position_body, format="json"
        )
        self.assertJSONResponse(response, 201)
        self.assertValidDevicePositionListData(response.json(), 50, with_result_key=False)
        self.assertAPIImport("devicesposition", request_body=devices_position_body, has_problems=False)

    @tag("iaso_only")
    def test_post_ko_no_auth(self):
        """POST /devicesposition/ without auth for "authentication required" project"""

        devices_position_body = [
            {
                "captured_at": 1590506880,
                "uuid": "06248c2d-545a-4a6b-9135-fb0fc750e956",
                "device_id": self.device_2.pk,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            }
        ]
        response = self.client.post(
            f"/api/devicesposition/?app_id={self.project_2.app_id}", devices_position_body, format="json"
        )
        self.assertJSONResponse(response, 201)
        self.assertDictEqual(response.json(), {"res": "a problem happened, but your data was saved"})
        self.assertAPIImport(
            "devicesposition",
            request_body=devices_position_body,
            has_problems=True,
            exception_contains_string="Could not find project for user",
        )

    @tag("iaso_only")
    def test_post_ok_with_auth(self):
        devices_position_body = [
            {
                "captured_at": 1590506880,
                "uuid": "06248c2d-545a-4a6b-9135-fb0fc750e956",
                "device_id": self.device_2.pk,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            }
        ]
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/devicesposition/?app_id={self.project_2.app_id}", devices_position_body, format="json"
        )
        self.assertJSONResponse(response, 201)
        self.assertValidDevicePositionListData(response.json(), 1, with_result_key=False)

    @tag("iaso_only")
    def test_post_ko_invalid_device_id(self):
        devices_position_body = [
            {
                "captured_at": 1590506880,
                "uuid": "d31d0c7b-632b-4944-8fda-ca3688153ef9",
                "device_id": 9999,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            }
        ]
        response = self.client.post(
            f"/api/devicesposition/?app_id={self.project_1.app_id}", devices_position_body, format="json"
        )
        self.assertJSONResponse(response, 201)
        self.assertDictEqual(response.json(), {"res": "a problem happened, but your data was saved"})
        self.assertAPIImport(
            "devicesposition",
            request_body=devices_position_body,
            has_problems=True,
            exception_contains_string="device_id",
        )

    def assertValidDevicePositionListData(
        self, list_data: typing.Mapping, expected_length: int, with_result_key=True, paginated: bool = False
    ):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key=None, paginated=paginated
        )

        device_positions = list_data["devicesposition"] if with_result_key else list_data

        for form_data in device_positions:
            self.assertValidDevicePositionData(form_data)

    def assertValidDevicePositionData(self, form_data: typing.Mapping):
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "uuid", str)
        self.assertHasField(form_data, "device_id", int)
        self.assertHasField(form_data, "latitude", float)
        self.assertHasField(form_data, "longitude", float)
        self.assertHasField(form_data, "altitude", float)
        self.assertHasField(form_data, "accuracy", float)
        self.assertHasField(form_data, "captured_at", float)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)
