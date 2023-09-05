import responses

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

    def test_data_element_list_without_auth(self):
        """GET /dataElements/ without auth should result in a 403"""

        response = self.client.get("/api/datasources/" + str(self.source.id) + "/dataElements/")
        self.assertEqual(403, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_data_element_list_with_auth_but_non_configured_credentials(self):
        """GET /dataElements/ without credentials should return error"""

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/datasources/" + str(self.source.id) + "/dataElements/")
        self.assertEqual(401, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        self.assertEqual({"error": "No credentials configured"}, response.json())

    def test_data_element_list_with_auth_but_non_configured_source(self):
        """GET /dataElements/ without credentials should return error"""

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/datasources/9999999/dataElements/")
        self.assertEqual(404, response.status_code)
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
        self.assertEqual(200, response.status_code)
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
        self.assertEqual(200, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        respose_json = response.json()
        # nextPage should have disappeared
        self.assertEqual({"page": 1, "pageCount": 4}, respose_json["pager"])
        self.assertEqual([{"id": "aze4a65z", "displayName": "Hello data element"}], respose_json["dataElements"])
