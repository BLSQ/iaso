from django.test import TestCase
from .models import OrgUnit, Form, InstanceFile, Instance, OrgUnitType, Account, Project
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

        unit_type = OrgUnitType(name="CDS", short_name="CDS")
        unit_type.save()

        self.project.unit_types.add(unit_type)

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
            "altitude": 0,
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
