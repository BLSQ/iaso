from django.test import TestCase, tag

from hat.vector_control.models import APIImport
from ..models import (
    OrgUnit,
    Form,
    Instance,
    OrgUnitType,
    Account,
    Project,
)
from math import floor
from rest_framework.test import APIClient
import json


class BasicAPITestCase(TestCase):
    def setUp(self):
        account = Account(name="Les Inconnus")
        account.save()

        self.project = Project(name="Le spectacle", app_id="org.bluesquarehub.iaso")
        self.project.save()

        unit_type = OrgUnitType(name="Hospital", short_name="Hosp")
        unit_type.save()
        self.project.unit_types.add(unit_type)

        unit_type_2 = OrgUnitType(name="CDS", short_name="CDS")
        unit_type_2.save()

        self.project.unit_types.add(unit_type_2)
        unit_type.sub_unit_types.add(unit_type_2)

    @tag("iaso_only")
    def test_org_unit_insertion(self):
        """Creating Org Units through the API"""

        c = APIClient()
        hospital_unit_type = OrgUnitType.objects.get(name="Hospital")
        uuid = "f6ec1672-ab58-4fb2-a4a0-4af80573e2ae"
        name = "Hopital Velpo"

        # with latitude and longitude
        unit_body = {
            "id": uuid,
            "latitude": 50.503,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "orgUnitTypeId": hospital_unit_type.id,
            "parentId": None,
            "longitude": 4.469,
            # passing the altitude parameter here, as the mobile app seems to send it - we will ignore it
            "altitude": 110,
            "accuracy": 0,
            "time": 0,
            "name": name,
        }

        response = c.post("/api/orgunits/", data=[unit_body], format="json")
        self.assertEqual(response.status_code, 200)
        velpo_model = OrgUnit.objects.get(uuid=uuid)
        self.assertEqual(velpo_model.name, name)
        # Latitude and longitude are legacy fields that are not filled for new records
        self.assertIsNone(velpo_model.latitude)
        self.assertIsNone(velpo_model.longitude)
        # Location should be filled
        self.assertEqual(4.469, velpo_model.location.x)
        self.assertEqual(50.503, velpo_model.location.y)

        # make sure APIImport record has been created
        last_api_import = APIImport.objects.order_by("-created_at").first()
        self.assertIsInstance(last_api_import.headers, dict)
        self.assertEqual(last_api_import.json_body, [unit_body])
        self.assertEqual(last_api_import.import_type, "orgUnit")
        self.assertFalse(last_api_import.has_problem)
        self.assertEqual(last_api_import.exception, "")

        response = c.get("/api/orgunits/", accept="application/json")

        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        self.assertEqual(len(units), 0)

        velpo_model.validated = True
        velpo_model.save()

        response = c.get(
            "/api/orgunits/", accept="application/json"
        )  # by default, the endpoint will answer with the orgunits of the org.bluesquarehub.iaso app_id

        content_1 = response.content
        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        velpo_json = units[0]
        self.assertEqual(velpo_json["name"], name)
        self.assertEqual(floor(velpo_json["created_at"]), floor(1565194077692 / 1000))
        self.assertTrue(floor(velpo_json["updated_at"]) > floor(1565194077693 / 1000))
        self.assertEqual(velpo_json["org_unit_type_id"], hospital_unit_type.id)
        self.assertEqual(velpo_json["parent_id"], None)
        self.assertEqual(velpo_json["id"], velpo_model.id)

        response = c.get(
            "/api/orgunits/?app_id=org.bluesquarehub.iaso", accept="application/json"
        )  # this should be the same result as without the app_id
        content_2 = response.content
        self.assertEqual(content_1, content_2)

        response = c.get(
            "/api/orgunits/?app_id=com.pascallegitimus.iaso", accept="application/json"
        )  # this should have 0 result
        json_response = json.loads(response.content)
        self.assertEqual(len(json_response["orgUnits"]), 0)

        # inserting a child org_unit
        uuid2 = "61e1dbfe-a1fc-4075-bfa2-5f3201c918f1"
        name2 = "Hopital Sous Fifre"

        # without latitude / longitude (our code handles lat=0, lng=0 as "no location provided")
        unit_body_2 = {
            "id": uuid2,
            "latitude": 0,
            "created_at": 1565194077699,
            "updated_at": 1565194077800,
            "orgUnitTypeId": hospital_unit_type.id,
            "parentId": uuid,
            "longitude": 0,
            "accuracy": 0,
            "time": 0,
            "name": name2,
        }

        response = c.post("/api/orgunits/", data=[unit_body_2], format="json")
        self.assertEqual(response.status_code, 200)

        fifre_model = OrgUnit.objects.get(uuid=uuid2)
        self.assertEqual(fifre_model.name, name2)
        # No location field should be filled (neither the legacy latitude / longitude fields or the
        # newer location field)
        self.assertIsNone(fifre_model.latitude)
        self.assertIsNone(fifre_model.longitude)
        self.assertIsNone(fifre_model.location)

    @tag("iaso_only")
    def test_org_unit_insertion_new_field_names(self):
        """Creating Org Units through the API but using org_unit_type_id and parent_id instead of orgUnitTypeId and parentId """
        c = APIClient()
        hospital_unit_type = OrgUnitType.objects.get(name="Hospital")
        uuid = "w5dg2671-aa59-4fb2-a4a0-4af80573e2de"
        name = "Hopital Saint-André"
        unit_body = {
            "id": uuid,
            "latitude": 0,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "org_unit_type_id": hospital_unit_type.id,
            "parent_id": None,
            "longitude": 0,
            "accuracy": 0,
            "time": 0,
            "name": name,
        }

        response = c.post("/api/orgunits/", data=[unit_body], format="json")
        self.assertEqual(response.status_code, 200)
        velpo_model = OrgUnit.objects.get(uuid=uuid)
        self.assertEqual(velpo_model.name, name)

        response = c.get("/api/orgunits/", accept="application/json")

        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        self.assertEqual(len(units), 0)

        velpo_model.validated = True
        velpo_model.save()

        response = c.get(
            "/api/orgunits/", accept="application/json"
        )  # by default, the endpoint will answer with the orgunits of the org.bluesquarehub.iaso app_id

        content_1 = response.content
        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        velpo_json = units[0]
        self.assertEqual(velpo_json["name"], name)
        self.assertEqual(floor(velpo_json["created_at"]), floor(1565194077692 / 1000))
        self.assertTrue(floor(velpo_json["updated_at"]) > floor(1565194077693 / 1000))
        self.assertEqual(velpo_json["org_unit_type_id"], hospital_unit_type.id)
        self.assertEqual(velpo_json["parent_id"], None)
        self.assertEqual(velpo_json["id"], velpo_model.id)

        response = c.get(
            "/api/orgunits/?app_id=org.bluesquarehub.iaso", accept="application/json"
        )  # this should be the same result as without the app_id
        content_2 = response.content
        self.assertEqual(content_1, content_2)

        response = c.get(
            "/api/orgunits/?app_id=com.pascallegitimus.iaso", accept="application/json"
        )  # this should have 0 result
        json_response = json.loads(response.content)
        self.assertEqual(len(json_response["orgUnits"]), 0)

        # inserting a child org_unit
        uuid2 = "61e1dbfe-a0fc-4075-bfa2-5f3201c918f3"
        name2 = "Hopital Sous Fifre"
        unit_body_2 = {
            "id": uuid2,
            "latitude": 0,
            "created_at": 1565194077699,
            "updated_at": 1565194077800,
            "orgUnitTypeId": hospital_unit_type.id,
            "parentId": uuid,
            "longitude": 0,
            "accuracy": 0,
            # passing the altitude parameter here, as the mobile app seems to send it - we will ignore it
            "altitude": 0,
            "time": 0,
            "name": name2,
        }

        response = c.post("/api/orgunits/", data=[unit_body_2], format="json")
        self.assertEqual(response.status_code, 200)

        fifre_model = OrgUnit.objects.get(uuid=uuid2)
        self.assertEqual(fifre_model.name, name2)

    @tag("iaso_only")
    def test_instance_insertion(self):
        """Creating Instance Units through the API"""
        c = APIClient()
        cds_unit_type = OrgUnitType.objects.get(name="CDS")

        uuid = "f6ec1671-aa59-4fb2-a4a0-4af80573e2ae"
        name = "Hopital Velpo"
        unit_body = {
            "id": uuid,
            "latitude": 0,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "orgUnitTypeId": cds_unit_type.id,
            "parentId": None,
            "longitude": 0,
            "accuracy": 0,
            "time": 0,
            "name": name,
        }

        c.post("/api/orgunits/", data=[unit_body], format="json")
        velpo_model = OrgUnit.objects.get(uuid=uuid)
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b32b8"
        name = "Questionnaire CDS"

        form = Form(name="CDS FORM")
        form.save()
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": velpo_model.id,
                "formId": form.id,
                "longitude": 4.4,
                "accuracy": 10,
                # passing the altitude parameter here, as the mobile app seems to send it - we will ignore it
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": name,
            }
        ]

        response = c.post("/api/instances/", data=instance_body, format="json")
        self.assertEqual(response.status_code, 200)

        instance = Instance.objects.get(uuid=uuid)

        self.assertEqual(instance.name, name)
        self.assertEqual(instance.org_unit_id, velpo_model.id)
        self.assertEqual(instance.form_id, form.id)
        self.assertEqual(floor(instance.location.x), floor(4.4))

        last_api_import = APIImport.objects.order_by("-created_at").first()
        self.assertIsInstance(last_api_import.headers, dict)
        self.assertEqual(last_api_import.json_body, instance_body)
        self.assertEqual(last_api_import.import_type, "instance")
        self.assertFalse(last_api_import.has_problem)
        self.assertEqual(last_api_import.exception, "")

    @tag("iaso_only")
    def test_fetch_org_unit_type(self):
        """Fetch Org Unit Types through the API"""
        c = APIClient()

        response = c.get(
            "/api/orgunittypes/?app_id=com.pascallegitimus.iaso",
            accept="application/json",
        )  # this should have 0 result
        json_response = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(json_response["orgUnitTypes"]), 0)

        response = c.get(
            "/api/orgunittypes/?app_id=org.bluesquarehub.iaso",
            accept="application/json",
        )  # this should have 2 results
        json_response = json.loads(response.content)
        org_unit_types = json_response["orgUnitTypes"]
        self.assertEqual(len(org_unit_types), 2)

        found = False
        for org_unit_type in org_unit_types:
            if org_unit_type["name"] == "Hospital":
                self.assertTrue(
                    org_unit_type["created_at"] < org_unit_type["updated_at"]
                )
                self.assertEqual(len(org_unit_type["sub_unit_types"]), 1)
                found = True

        self.assertTrue(found)
