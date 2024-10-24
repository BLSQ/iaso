import datetime

import jsonschema
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from rest_framework.test import APIClient

import hat.menupermissions.models as permissions
from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm

BASE_URL = "/api/polio/vaccine/vaccine_stock/"
BASE_URL_SUB_RESOURCES = "/api/polio/vaccine/stock/"


class VaccineStockManagementAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up data for the whole TestCase
        cls.now = timezone.now()
        cls.account = m.Account.objects.create(name="test_account")
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.projects", account=cls.account)
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")
        cls.org_unit_type_country.projects.set([cls.project])
        cls.org_unit_type_country.save()
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.set([cls.project])
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)

        cls.anon = AnonymousUser()

        cls.user_rw_perms = cls.create_user_with_profile(
            username="user_rw_perms",
            account=cls.account,
            permissions=[
                permissions._POLIO_VACCINE_STOCK_MANAGEMENT_READ,
                permissions._POLIO_VACCINE_STOCK_MANAGEMENT_WRITE,
            ],
        )
        cls.user_ro_perms = cls.create_user_with_profile(
            username="user_ro_perms",
            account=cls.account,
            permissions=[permissions._POLIO_VACCINE_STOCK_MANAGEMENT_READ],
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_no_perms", account=cls.account, permissions=[])

        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Testland",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestlandRef",
        )
        cls.campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign",
            country=cls.country,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_round_1 = pm.Round.objects.create(
            campaign=cls.campaign,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
            number=1,
        )

        cls.vaccine_request_form = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )

        cls.vaccine_arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=cls.vaccine_request_form,
            arrival_report_date=cls.now - datetime.timedelta(days=5),
            doses_received=400,
            doses_shipped=400,
            po_number="PO123",
            lot_numbers=["LOT123", "LOT456"],
            expiration_date=cls.now + datetime.timedelta(days=180),
            # the Model on save will implicitly set doses_per_vial to pm.DOSES_PER_VIAL[vaccine_type]
            # and calculated vials_received and vials_shipped
        )

        cls.vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.country,
            vaccine=pm.VACCINES[0][0],
        )
        cls.outgoing_stock_movement = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            lot_numbers=["LOT123"],
            missing_vials=2,
            comment="Hello world",
        )
        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            action="Destroyed due to expiration",
            rrt_destruction_report_reception_date=cls.now - datetime.timedelta(days=1),
            destruction_report_date=cls.now,
            unusable_vials_destroyed=3,
            lot_numbers=["LOT456"],
            comment="Goodbye World",
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.now - datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=3),
            unusable_vials=1,  # 1 vial will be moved from usable to unusable
            usable_vials=0,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.BROKEN,
            date_of_incident_report=cls.now - datetime.timedelta(days=5),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=4),
            unusable_vials=0,
            usable_vials=1,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=0,
            usable_vials=16,
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.PHYSICAL_INVENTORY,
            date_of_incident_report=cls.now - datetime.timedelta(days=6),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=5),
            unusable_vials=20,
            usable_vials=0,
        )

    def test_anonymous_user_cannot_see_list(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_read_rights_cannot_see_list(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_can_see_list(self):
        # Test the vaccine stock list API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 1)
        stock = results[0]
        print("stock", stock)
        self.assertEqual(stock["country_name"], "Testland")
        self.assertEqual(stock["vaccine_type"], pm.VACCINES[0][0])
        self.assertEqual(stock["vials_received"], 20)  # 400 doses / 20 doses per vial
        self.assertEqual(stock["vials_used"], 10)
        self.assertEqual(stock["stock_of_usable_vials"], 22)  # 20 received - 13 used + 15 found in inventory
        self.assertEqual(stock["stock_of_unusable_vials"], 28)
        self.assertEqual(stock["vials_destroyed"], 3)  # 3 destroyed

    def test_usable_vials_endpoint(self):
        # Authenticate and make request to the API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/")

        # Assert the response status code
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Define the JSON schema for the response
        usable_vials_schema = {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"},
                            "action": {"type": "string"},
                            "vials_in": {"type": ["integer", "null"]},
                            "doses_in": {"type": ["integer", "null"]},
                            "vials_out": {"type": ["integer", "null"]},
                            "doses_out": {"type": ["integer", "null"]},
                            "type": {"type": "string"},
                        },
                        "required": ["date", "action", "vials_in", "doses_in", "vials_out", "doses_out", "type"],
                    },
                },
            },
            "required": ["results"],
        }

        # Check that we have 6 entries in the results array
        self.assertEqual(len(data["results"]), 6)

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=usable_vials_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(data["results"][0]["vials_in"], 20)
        self.assertEqual(data["results"][0]["doses_in"], 400)
        self.assertEqual(data["results"][0]["type"], "vaccine_arrival_report")  # From arrival report
        self.assertEqual(data["results"][1]["vials_out"], 10)
        self.assertEqual(data["results"][1]["doses_out"], 200)
        self.assertEqual(data["results"][1]["type"], "outgoing_stock_movement")  # Outgoing movement (form A)
        self.assertEqual(data["results"][2]["vials_out"], 2)
        self.assertEqual(data["results"][2]["doses_out"], 40)
        self.assertEqual(data["results"][2]["type"], "outgoing_stock_movement")  # missing vials (form A)
        self.assertEqual(data["results"][3]["vials_in"], 16)
        self.assertEqual(data["results"][3]["doses_in"], 320)
        self.assertEqual(data["results"][3]["type"], "incident_report")  # Physical inventory
        self.assertEqual(data["results"][4]["vials_out"], 1)
        self.assertEqual(data["results"][4]["doses_out"], 20)
        self.assertEqual(data["results"][4]["type"], "incident_report")  # Broken
        self.assertEqual(data["results"][5]["vials_out"], 1)
        self.assertEqual(data["results"][5]["doses_out"], 20)
        self.assertEqual(data["results"][5]["type"], "incident_report")  # Expiry date

    def test_unusable_vials_endpoint(self):
        # Authenticate and make request to the API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/")

        # Assert the response status code
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Define the JSON schema for the response
        unusable_vials_schema = {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"},
                            "action": {"type": "string"},
                            "vials_in": {"type": ["integer", "null"]},
                            "doses_in": {"type": ["integer", "null"]},
                            "vials_out": {"type": ["integer", "null"]},
                            "doses_out": {"type": ["integer", "null"]},
                            "type": {"type": "string"},
                        },
                        "required": ["date", "action", "vials_in", "doses_in", "vials_out", "doses_out"],
                    },
                },
            },
            "required": ["results"],
        }

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=unusable_vials_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        # Check that the response contains the expected number of unusable vials entries
        self.assertEqual(len(data["results"]), 4)

        self.assertEqual(data["results"][0]["vials_in"], 10)
        self.assertEqual(data["results"][0]["doses_in"], 200)
        self.assertEqual(data["results"][0]["type"], "outgoing_stock_movement")
        self.assertEqual(data["results"][1]["vials_out"], 3)
        self.assertEqual(data["results"][1]["doses_out"], 60)
        self.assertEqual(data["results"][1]["type"], "destruction_report")
        self.assertEqual(data["results"][2]["vials_in"], 1)
        self.assertEqual(data["results"][2]["doses_in"], 20)
        self.assertEqual(data["results"][2]["type"], "incident_report")
        self.assertEqual(data["results"][3]["vials_in"], 20)
        self.assertEqual(data["results"][3]["doses_in"], 400)
        self.assertEqual(data["results"][3]["type"], "incident_report")

    def test_summary_endpoint(self):
        # Authenticate as a user with read/write permissions
        self.client.force_authenticate(user=self.user_ro_perms)

        # Make a GET request to the summary endpoint
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        summary_schema = {
            "type": "object",
            "properties": {
                "country_name": {"type": "string"},
                "vaccine_type": {"type": "string"},
                "total_usable_vials": {"type": "integer"},
                "total_unusable_vials": {"type": "integer"},
                "total_usable_doses": {"type": "integer"},
                "total_unusable_doses": {"type": "integer"},
            },
            "required": [
                "country_name",
                "vaccine_type",
                "total_usable_vials",
                "total_unusable_vials",
                "total_usable_doses",
                "total_unusable_doses",
            ],
        }

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=summary_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        # Check that the values match what is expected
        self.assertEqual(data["country_name"], self.vaccine_stock.country.name)
        self.assertEqual(data["vaccine_type"], self.vaccine_stock.vaccine)
        self.assertEqual(data["total_usable_vials"], 22)
        self.assertEqual(data["total_unusable_vials"], 28)
        self.assertEqual(data["total_usable_doses"], 440)
        self.assertEqual(data["total_unusable_doses"], 560)

    def test_delete(self):
        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.delete(f"{BASE_URL}{self.vaccine_stock.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertIsNone(pm.VaccineStock.objects.filter(pk=self.vaccine_stock.pk).first())

    def test_incident_report_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}incident_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "vaccine_stock",
            "date_of_incident_report",
            "usable_vials",
            "unusable_vials",
            "stock_correction",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

            # Add a new test which adds the order=date_of_incident_report and verify that the results are ordered by date_of_incident_report

    def test_incident_report_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}incident_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=date_of_incident_report"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["date_of_incident_report"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_destruction_report_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "vaccine_stock",
            "destruction_report_date",
            "rrt_destruction_report_reception_date",
            "action",
            "unusable_vials_destroyed",
            "lot_numbers",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

            # Add a new test which adds the order=date_of_incident_report and verify that the results are ordered by date_of_incident_report

    def test_destruction_report_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=destruction_report_date"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["destruction_report_date"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_outgoing_stock_movement_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "campaign",
            "vaccine_stock",
            "report_date",
            "form_a_reception_date",
            "usable_vials_used",
            "lot_numbers",
            "missing_vials",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

            # Add a new test which adds the order=date_of_incident_report and verify that the results are ordered by date_of_incident_report

    def test_outgoing_stock_movement_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=form_a_reception_date"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["form_a_reception_date"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))
