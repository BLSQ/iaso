import requests
import responses

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase


class Dhis2APITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        account = m.Account(name="Zelda")
        source = m.DataSource.objects.create(name="Korogu")
        cls.source = source
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()
        cls.account = account

        cls.project = m.Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        cls.project.save()

        source.projects.add(cls.project)

        user = m.User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = m.Profile(user=user, account=account)
        p.save()
        cls.user = user

    def with_credentials(self):
        credentials = m.ExternalCredentials.objects.create(
            name="Test export api", url="https://dhis2.com", login="admin", password="district", account=self.account
        )
        self.source.credentials = credentials
        self.source.save()

    DHIS2_DATA_ELEMENTS_URL = "https://dhis2.com/api/dataElements.json"

    def assertDhis2Error(self, response, code, message):
        res = self.assertJSONResponse(response, status.HTTP_409_CONFLICT)
        self.assertEqual({"error": message, "code": code}, res)

    def get_data_elements(self):
        self.with_credentials()
        self.client.force_authenticate(self.user)
        return self.client.get(f"/api/datasources/{self.source.id}/dataElements/?filter=name:ilike:malaria")

    @responses.activate
    def test_data_element_list_dhis2_rejects_credentials(self):
        responses.add(responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body="Unauthorized", status=401)

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_invalid_credentials", "DHIS2 credentials are not valid")

    @responses.activate
    def test_data_element_list_dhis2_forbids_access(self):
        responses.add(responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body="Forbidden", status=403)

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_invalid_credentials", "DHIS2 credentials are not valid")

    @responses.activate
    def test_data_element_list_dhis2_server_error(self):
        responses.add(responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body="Bad Gateway", status=502)

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_unavailable", "DHIS2 is not available")

    @responses.activate
    def test_data_element_list_dhis2_unreachable(self):
        responses.add(
            responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body=requests.exceptions.ConnectionError("Name not resolved")
        )

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_unavailable", "DHIS2 is not available")

    @responses.activate
    def test_data_element_list_dhis2_timeout(self):
        responses.add(responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body=requests.exceptions.ReadTimeout("timed out"))

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_unavailable", "DHIS2 is not available")

    @responses.activate
    def test_data_element_list_dhis2_answers_html(self):
        """e.g. a login page or a proxy maintenance page served with a 200"""
        responses.add(responses.GET, self.DHIS2_DATA_ELEMENTS_URL, body="<html>Maintenance</html>", status=200)

        response = self.get_data_elements()

        self.assertDhis2Error(response, "dhis2_unavailable", "DHIS2 is not available")

    def test_data_element_list_without_auth(self):
        """GET /dataElements/ without auth should result in a 401"""

        response = self.client.get("/api/datasources/" + str(self.source.id) + "/dataElements/")
        self.assertEqual(status.HTTP_401_UNAUTHORIZED, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_data_element_list_with_auth_but_non_configured_credentials(self):
        """GET /dataElements/ without credentials should return error"""

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/datasources/" + str(self.source.id) + "/dataElements/")
        self.assertDhis2Error(response, "dhis2_no_credentials", "No credentials configured")

    def test_data_element_list_with_auth_but_non_configured_source(self):
        """GET /dataElements/ without credentials should return error"""

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/datasources/9999999/dataElements/")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        self.assertEqual({"error": "Data source not available"}, response.json())

    @responses.activate
    def test_data_element_list_with_auth_and_configured_without_params(self):
        """GET /dataElements/ return a list of first 50 data elements"""

        self.with_credentials()
        self.client.force_authenticate(self.user)

        responses.add(
            responses.GET,
            "https://dhis2.com/api/dataElements.json?fields=id%2CdisplayName&pageSize=50",
            json={
                "pager": {
                    "page": 1,
                    "pageCount": 4,
                    "nextPage": "https://dhis2.com/api/dataElements.json?fields=id%2CdisplayName&pageSize=50&page=2",
                },
                "dataElements": [{"id": "aze4a65z", "displayName": "Hello data element"}],
            },
            status=200,
        )

        response = self.client.get("/api/datasources/" + str(self.source.id) + "/dataElements/")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        response_json = response.json()
        # nextPage should have disappeared
        self.assertEqual({"page": 1, "pageCount": 4}, response_json["pager"])
        self.assertEqual([{"id": "aze4a65z", "displayName": "Hello data element"}], response_json["dataElements"])

    @responses.activate
    def test_data_element_list_with_auth_and_configured_with_filter_fields_pageSize(
        self,
    ):
        """GET /dataElements/ with params return filtered"""

        self.with_credentials()
        self.client.force_authenticate(self.user)

        responses.add(
            responses.GET,
            "https://dhis2.com/api/dataElements.json?filter=name:ilike:flucid&pageSize=500&fields=id,name,optionSet[id,name]",
            json={
                "pager": {
                    "page": 1,
                    "pageCount": 4,
                    "nextPage": "https://dhis2.com/api/dataElements.json?filter=name:ilike:flucid&pageSize=500&fields=id,name,optionSet[id,name]&page=2",
                },
                "dataElements": [{"id": "aze4a65z", "displayName": "Hello data element"}],
            },
            status=200,
        )

        response = self.client.get(
            "/api/datasources/"
            + str(self.source.id)
            + "/dataElements/?filter=name:ilike:flucid&pageSize=500&fields=id,name,optionSet[id,name]"
        )
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        respose_json = response.json()
        # nextPage should have disappeared
        self.assertEqual({"page": 1, "pageCount": 4}, respose_json["pager"])
        self.assertEqual([{"id": "aze4a65z", "displayName": "Hello data element"}], respose_json["dataElements"])
