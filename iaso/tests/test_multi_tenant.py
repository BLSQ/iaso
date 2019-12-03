from django.test import TestCase, tag
from ..models import (
    OrgUnit,
    Form,
    InstanceFile,
    Profile,
    Instance,
    OrgUnitType,
    Account,
    Project,
    DataSource,
    SourceVersion,
)

from rest_framework.test import APIClient
from django.contrib.auth.models import User

import json


class MultiTenantTestCase(TestCase):
    def setUp(self):
        account = Account(name="Star Wars")

        source = DataSource.objects.create(name="Jedi Academy")
        version = SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        self.project = Project(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=account,
        )
        self.project.save()

        source.projects.add(self.project)

        unit_type = OrgUnitType(name="Empire", short_name="Emp")
        unit_type.save()
        self.project.unit_types.add(unit_type)

        self.empire_unit_type = unit_type

        unit_type_2 = OrgUnitType(name="Planet", short_name="Plan")
        unit_type_2.save()

        self.project.unit_types.add(unit_type_2)
        unit_type.sub_unit_types.add(unit_type_2)
        user = User.objects.create(username="yoda")
        user.set_password("ActuallyTheDarkSideRule2")
        user.save()
        p = Profile(user=user, account=account)
        p.save()
        self.yoda = user

        account = Account(name="Marvel")
        account.save()

        user = User.objects.create(username="rraccoon")
        user.set_password("OhSweetNatasha")
        user.save()
        p = Profile(user=user, account=account)
        p.save()
        self.raccoon = user

        OrgUnit.objects.create(name="Tatooine", org_unit_type=unit_type_2)

    @tag("iaso_only")
    def test_org_unit_access(self):
        """Checking access to org units based on account"""
        yoda_client = APIClient()
        yoda_client.login(username="yoda", password="ActuallyTheDarkSideRule2")
        planet_unit_type = OrgUnitType.objects.get(name="Planet")
        uuid = "f6ec1671-aa59-4fb2-a4a0-4af80573e2ae"
        name = "Coruscant"
        unit_body = {
            "id": uuid,
            "latitude": 0,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "orgUnitTypeId": planet_unit_type.id,
            "parentId": None,
            "longitude": 0,
            "accuracy": 0,
            "altitude": 0,
            "time": 0,
            "name": name,
        }

        response = yoda_client.post("/api/orgunits/", data=[unit_body], format="json")
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        coruscant_id = json_response[0]["id"]

        raccoon_client = APIClient()
        raccoon_client.login(username="rraccoon", password="OhSweetNatasha")

        response = raccoon_client.get("/api/orgunits/", accept="application/json")
        json_response = json.loads(response.content)

        units = json_response["orgUnits"]
        self.assertEqual(len(units), 0)

        response = raccoon_client.get(
            "/api/orgunits/%s/" % coruscant_id, accept="application/json"
        )
        self.assertEqual(
            response.status_code, 403
        )  # raccoon not authorized to see Star Wars data

        response = yoda_client.get(
            "/api/orgunits/%s/" % coruscant_id, accept="application/json"
        )
        self.assertEqual(
            response.status_code, 200
        )  # yoda authorized to see Star Wars data

    @tag("iaso_only")
    def test_instance_access(self):
        """Checking access to org units based on account"""
        c = APIClient()
        planet_unit_type = OrgUnitType.objects.get(name="Planet")

        unit_uuid = "f6ec1671-aa49-4fb2-a4a0-4af8e573e2ae"
        name = "Kashyyyk"
        unit_body = {
            "id": unit_uuid,
            "latitude": 0,
            "created_at": 1565194077692,
            "updated_at": 1565194077693,
            "orgUnitTypeId": planet_unit_type.id,
            "parentId": None,
            "longitude": 0,
            "accuracy": 0,
            "altitude": 0,
            "time": 0,
            "name": name,
        }

        c.post("/api/orgunits/", data=[unit_body], format="json")
        instance_uuid = "4b7c3954-f69a-4b99-83b1-db73957b32b4"
        name = "Wooooh wooooh woo riii"

        form = Form(name="Hydroponics study")
        form.save()
        instance_body = [
            {
                "id": instance_uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": unit_uuid,
                "formId": form.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "hydroponics_test_upload.xml",
                "name": name,
            }
        ]

        response = c.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics",
            data=instance_body,
            format="json",
        )
        # if you don't provide an app id, the instances will not be added to a project, and consequently, not be shown to anybody
        # notice that the instance won't appear in the /instances/ endpoint until a file is uploaded. You can access it directly through its id, though.

        self.assertEqual(response.status_code, 200)
        instance = Instance.objects.get(uuid=instance_uuid)

        yoda_client = APIClient()
        yoda_client.login(username="yoda", password="ActuallyTheDarkSideRule2")
        response = yoda_client.get(
            "/api/instances/%s/" % instance.id, accept="application/json"
        )
        self.assertEqual(
            response.status_code, 200
        )  # yoda authorized to see Star Wars data

        raccoon_client = APIClient()
        raccoon_client.login(username="rraccoon", password="OhSweetNatasha")

        response = raccoon_client.get(
            "/api/instances/%s/" % instance.id, accept="application/json"
        )
        self.assertEqual(
            response.status_code, 403
        )  # raccoon not authorized to see Star Wars data

        # now uploading the file content, so that it will appear in /instances/ for the Star Wars account
        with open("iaso/tests/fixtures/hydroponics_test_upload.xml") as fp:
            c.post(
                "/sync/form_upload/",
                {"name": "hydroponics_test_upload.xml", "xml_submission_file": fp},
            )

        response = yoda_client.get("/api/instances/", accept="application/json")
        self.assertEqual(
            response.status_code, 200
        )  # yoda authorized to see Star Wars data
        content = json.loads(response.content)
        instances = content["instances"]
        found = False
        for instance in instances:
            if instance["uuid"] == instance_uuid:
                found = True

        self.assertTrue(found)  # yoda authorized to see Star Wars data

        response = raccoon_client.get("/api/instances/", accept="application/json")

        content = json.loads(response.content)
        instances = content["instances"]
        found = False
        for instance in instances:
            if instance["uuid"] == instance_uuid:
                found = True

        self.assertFalse(found)  # raccoon not supposed to see Star Wars data
