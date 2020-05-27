import typing
from django.test import tag

from iaso import models as m
from iaso.test import APITestCase


class DevicesPositionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_forms"]
        )

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept",
            app_id="stars.empire.agriculture.land_speeder",
            account=star_wars,
        )

        cls.device_1 = m.Device.objects.create()
        cls.device_1.projects.set([cls.project_1])
        cls.device_2 = m.Device.objects.create()
        cls.device_2.projects.set([cls.project_2])

    @tag("iaso_only")
    def test_post_ok_no_auth(self):
        """POST /iasodevicesposition/ without auth: should work"""

        response = self.client.post("/api/iasodevicesposition/", [
            {
                "captured_at": 1590506880,
                "uuid": "d31d0c7b-632b-4944-8fda-ca3688153ef9",
                "device_id": self.device_1.pk,
                "latitude": 0.4,
                "longitude": 44.56,
                "altitude": 33.1,
                "accuracy": 22.5,
            },
        ], format="json")
        self.assertJSONResponse(response, 201)
        self.assertValidDevicePositionListData(response.json(), 1, with_result_key=False)

    @tag("iaso_only")
    def test_post_ok_with_auth(self):
        self.fail()

    @tag("iaso_only")
    def test_post_ko_no_auth(self):
        self.fail()

    @tag("iaso_only")
    def test_post_ko_invalid_device_id(self):
        self.fail()

    def assertValidDevicePositionListData(
        self, list_data: typing.Mapping, expected_length: int, with_result_key=True, paginated: bool = False
    ):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key=None,
            paginated=paginated,
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
