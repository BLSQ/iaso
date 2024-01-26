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
            unusable_vials=5,
            lot_numbers=["LOT123"],
            missing_vials=2,
        )
        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            action="Destroyed due to expiration",
            rrt_destruction_report_reception_date=cls.now - datetime.timedelta(days=1),
            destruction_report_date=cls.now,
            unusable_vials_destroyed=3,
            lot_number="LOT456",
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.now - datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=3),
            unusable_vials=1,
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
        self.assertEqual(stock["country_name"], "Testland")
        self.assertEqual(stock["vaccine_type"], pm.VACCINES[0][0])
        self.assertEqual(stock["vials_received"], 20)  # 400 doses / 20 doses per vial
        self.assertEqual(stock["vials_used"], 10)
        self.assertEqual(stock["stock_of_usable_vials"], 10)  # 20 received - 10 used
        self.assertEqual(stock["stock_of_unusable_vials"], 6)  # 5 unusable + 1 incident
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

        # Check that we have 4 entries in the results array
        self.assertEqual(len(data["results"]), 4)

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=usable_vials_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

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
        self.assertEqual(len(data["results"]), 2)

        self.assertEqual(data["results"][0]["vials_out"], 5)
        self.assertEqual(data["results"][0]["doses_out"], 100)
        self.assertEqual(data["results"][0]["type"], "outgoing_stock_movement")
        self.assertEqual(data["results"][1]["vials_out"], 1)
        self.assertEqual(data["results"][1]["doses_out"], 20)
        self.assertEqual(data["results"][1]["type"], "incident_report")

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
        self.assertEqual(data["total_usable_vials"], 10)
        self.assertEqual(data["total_unusable_vials"], 6)
        self.assertEqual(data["total_usable_doses"], 200)
        self.assertEqual(data["total_unusable_doses"], 120)
