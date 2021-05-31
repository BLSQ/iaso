import typing

from django.test import tag
from django.utils.timezone import now

from iaso import models as m
from iaso.test import APITestCase


class CorrelationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.coruscant = m.OrgUnit.objects.create(name="coruscant", org_unit_type=cls.jedi_council)

        cls.form_1 = m.Form.objects.create(name="Land Speeder", form_id="sample1")
        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey", form_id="sample2", correlatable=True, correlation_field="service"
        )

    def test_correlation_creation_without_correlation_field(self):
        """POST of a form where correlation is not set up"""
        file_name = "land_speeder.xml"
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b32d2"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        with open("iaso/tests/fixtures/land_speeder.xml") as fp:
            self.client.post("/sync/form_upload/", {"xml_submission_file": fp})
        self.assertEqual(response.status_code, 200)
        instance = m.Instance.objects.get(uuid=uuid)
        self.assertTrue(str(instance.correlation_id).startswith(str(instance.id)))

        modulo = int(str(instance.correlation_id)[-2:])
        base = int(str(instance.correlation_id)[0:-2])

        self.assertEqual(base % 97, modulo)
        self.assertEqual(
            len(str(instance.id)) + 3, len(str(instance.correlation_id))
        )  # verify that one random number was added

    def test_correlation_creation_with_correlation_field(self):
        """POST of a form where correlation is set up"""
        file_name = "land_speeder_with_service.xml"
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3342"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        with open("iaso/tests/fixtures/%s" % file_name) as fp:
            self.client.post("/sync/form_upload/", {"xml_submission_file": fp})

        instance = m.Instance.objects.get(uuid=uuid)

        modulo = int(str(instance.correlation_id)[-2:])
        base = int(str(instance.correlation_id)[0:-2])
        correlation_code = int(str(instance.correlation_id)[-6:-3])

        self.assertEqual(correlation_code, 123)
        self.assertEqual(base % 97, modulo)
        self.assertEqual(len(str(instance.id)) + 6, len(str(instance.correlation_id)))
