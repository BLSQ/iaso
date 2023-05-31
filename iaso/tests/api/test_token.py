from unittest import mock

from django.core.files import File

from iaso import models as m
from iaso.test import APITestCase


class TokenAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="counsil")
        version = m.SourceVersion.objects.create(data_source=data_source, number=1)
        star_wars = m.Account.objects.create(name="Star Wars", default_version=version)
        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)

        cls.yoda.set_password("IMomLove")
        cls.yoda.save()

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Corruscant Jedi Council")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
            needs_authentication=True,
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(form=cls.form_2, period="202001", org_unit=cls.jedi_council_corruscant)
        cls.form_2.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.save()

    def authenticate_using_token(self):
        response = self.client.post(f"/api/token/", data={"username": "yoda", "password": "IMomLove"}, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()

        access_token = response_data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        return response_data

    def test_acquire_token_and_authenticate(self):
        """Test token authentication"""

        self.authenticate_using_token()

        response = self.client.get("/api/forms/?app_id=stars.empire.agriculture.hydroponics")
        self.assertJSONResponse(response, 200)

        response_data = response.json()

        form_ids = [f["id"] for f in response_data["forms"]]

        self.assertTrue(self.form_2.id in form_ids)

    def test_acquire_token_and_post_instance(self):
        """Test upload to a project that requires authentication"""
        # Unauthenticated case is already tested in test_api
        self.authenticate_using_token()
        uuid = "4b7c3954-f69a-4b99-83b1-df73957b32E1"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "the name",
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertTrue(m.Instance.objects.filter(uuid=uuid).first() is not None)

    def test_unauthenticated_post_instance(self):
        """Test unauthenticated upload to a project that requires authentication"""
        # Unauthenticated case is already tested in test_api

        uuid = "4b7c3954-f69a-4b99-83b1-df73957b32E2"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "the name",
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertIsNone(m.Instance.objects.filter(uuid=uuid).first())
        # The result is that the instance is not created, even though the api sent back a 200
        # this is normal: we want the api to accept all creations requests to be able to debug on the server
        # and not have data stuck on a mobile phone.
        # An APIImport record with has_problem set to True should be created
        self.assertAPIImport(
            "instance",
            request_body=instance_body,
            has_problems=True,
            exception_contains_string="Could not find project for user",
        )

    def test_refresh(self):
        """Test refreshing authentication token"""
        # Unauthenticated case is already tested in test_api
        response_data = self.authenticate_using_token()
        refresh_token = response_data.get("refresh")
        response = self.client.post(f"/api/token/refresh/", data={"refresh": refresh_token}, format="json")
        self.assertJSONResponse(response, 200)
        response_data = response.json()

        access_token_2 = response_data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token_2}")

        # test an endpoint that requires authentication
        response = self.client.get("/api/orgunits/?app_id=stars.empire.agriculture.hydroponics")

        self.assertJSONResponse(response, 200)

    def test_no_token(self):
        """Test invalid authentication tokens"""
        # Unauthenticated case is already tested in test_api

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer  ")

        # test an endpoint that requires authentication
        response = self.client.get("/api/groups/?app_id=stars.empire.agriculture.hydroponics")

        self.assertJSONResponse(response, 403)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer  WRONG")

        # test an endpoint that requires authentication
        response = self.client.get("/api/groups/?app_id=stars.empire.agriculture.hydroponics")

        self.assertJSONResponse(response, 403)

    def test_acquire_token_and_post_org_unit(self):
        """Test upload to a project that requires authentication"""
        # Unauthenticated case is already tested in test_api
        self.authenticate_using_token()
        uuid = "r5dx2671-bb59-4fb2-a4a0-4af80573e2de"
        name = "Kashyyyk Wookies Council"
        unit_body = [
            {
                "id": uuid,
                "latitude": 0,
                "created_at": 1565194077692,
                "updated_at": 1565194077693,
                "org_unit_type_id": self.jedi_council.id,
                "parent_id": None,
                "longitude": 0,
                "accuracy": 0,
                "altitude": 0,
                "time": 0,
                "name": name,
            }
        ]

        response = self.client.post(
            "/api/orgunits/?app_id=stars.empire.agriculture.hydroponics", data=unit_body, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(m.OrgUnit.objects.filter(uuid=uuid).first() is not None)
        self.assertAPIImport("orgUnit", request_body=unit_body, has_problems=False, check_auth_header=True)

    def test_unauthenticated_post_org_unit(self):
        """Test upload to a project that requires authentication without token"""
        # Unauthenticated case is already tested in test_api

        uuid = "s5dx2671-ac59-4fb2-a4a0-4af80573e2de"
        name = "Antar 4 Council"
        unit_body = [
            {
                "id": uuid,
                "latitude": 0,
                "created_at": 1565194077692,
                "updated_at": 1565194077693,
                "org_unit_type_id": self.jedi_council.id,
                "parent_id": None,
                "longitude": 0,
                "accuracy": 0,
                "altitude": 0,
                "time": 0,
                "name": name,
            }
        ]

        response = self.client.post(
            "/api/orgunits/?app_id=stars.empire.agriculture.hydroponics", data=unit_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertIsNone(m.OrgUnit.objects.filter(uuid=uuid).first())
        # The result is that the org unit is not created, even though the api sent back a 200
        # this is normal: we want the api to accept all creations requests to be able to debug on the server
        # and not have data stuck on a mobile phone.
        # An APIImport record with has_problem set to True should be created

        self.assertAPIImport(
            "orgUnit",
            request_body=unit_body,
            has_problems=True,
            exception_contains_string="Could not find project for user",
        )
