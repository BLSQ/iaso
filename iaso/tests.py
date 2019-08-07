from django.test import TestCase
from .models import OrgUnit, Form, InstanceFile, Instance, OrgUnitType
from math import floor
from rest_framework.test import APIClient
import json


class OrgUnitsTestCase(TestCase):
    def setUp(self):
        unit_type = OrgUnitType(name="Hospital", short_name="Hosp")
        unit_type.save()

    def test_org_unit_insertion(self):
        """Creating Org Units through the API"""
        c = APIClient()
        hospital_unit_type = OrgUnitType.objects.get(name="Hospital")
        uuid = "f6ec1671-aa59-4fb2-a4a0-4af80573e2ae"
        name = "Hopital Velpo"
        unit_body = {
            "id": uuid,
            "latitude": 0,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "orgUnitTypeId": hospital_unit_type.id,
            "parentId": None,
            "longitude": 0,
            "accuracy": 0,
            "altitude": 0,
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

        response = c.get("/api/orgunits/", accept="application/json")

        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        velpo_json = units[0]
        self.assertEqual(velpo_json["name"], name)
        self.assertEqual(floor(velpo_json["created_at"]), floor(1565194077692 / 1000))
        self.assertTrue(floor(velpo_json["updated_at"]) > floor(1565194077693 / 1000))
        self.assertEqual(velpo_json["org_unit_type_id"], hospital_unit_type.id)
        self.assertEqual(velpo_json["parent_id"], None)
        self.assertEqual(velpo_json["id"], velpo_model.id)
