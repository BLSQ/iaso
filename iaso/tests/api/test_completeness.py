from django.contrib.gis.geos import Point
from django.utils import timezone

from iaso import models as m
from iaso.test import APITestCase


class CompletenessAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        account = m.Account(name="Zelda")

        source = m.DataSource.objects.create(name="Korogu")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        cls.project = m.Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        cls.project.save()

        source.projects.add(cls.project)

        unit_type = m.OrgUnitType(name="Village", short_name="Vil")
        unit_type.save()
        cls.project.unit_types.add(unit_type)
        cls.village_unit_type = unit_type

        cls.user = cls.create_user_with_profile(username="link", account=account, permissions=["iaso_completeness"])

        cls.village_1 = m.OrgUnit.objects.create(name="Akkala", org_unit_type=unit_type, version=version)
        cls.village_2 = m.OrgUnit.objects.create(name="Kakariko", org_unit_type=unit_type, version=version)
        form = m.Form(name="Quantity FORM")
        form.period_type = "monthly"
        form.form_id = "quantityf"
        form.single_per_period = True
        form.save()
        cls.form = form

    def build_instance(self, org_unit, instance_uuid, period):

        instance = m.Instance()
        instance.uuid = instance_uuid
        instance.export_id = "EVENT_DHIS2_UID"
        instance.org_unit = org_unit
        instance.json = {"question1": "1"}
        instance.location = Point(1.5, 7.3, 0)
        instance.period = period
        instance.form = self.form
        instance.project = self.project
        instance.file = "something_fake"
        instance.save()
        return instance

    def uuid(self, number):
        return str(number) + "b7c3954-f69a-4b99-83b1-db73957b32b" + str(number)

    def test_completeness_list_without_auth(self):
        """GET /completeness/ without auth should result in a 403"""

        response = self.client.get("/api/completeness/")
        self.assertEqual(403, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_completeness_list(self):
        """GET /completeness/ should return counts"""

        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.build_instance(self.village_1, self.uuid(2), "201901")
        self.build_instance(self.village_1, self.uuid(3), "201902")
        self.build_instance(self.village_1, self.uuid(4), "201903")

        self.build_instance(self.village_2, self.uuid(5), "201901")
        self.build_instance(self.village_2, self.uuid(6), "201902")

        exported_instance = self.build_instance(self.village_2, self.uuid(7), "201903")
        exported_instance.last_export_success_at = timezone.now()
        exported_instance.save()

        deleted_instance = self.build_instance(self.village_1, self.uuid(8), "201903")
        deleted_instance.deleted = True
        deleted_instance.save()

        self.client.force_authenticate(self.user)

        expected_counts = [
            {
                "period": "201901",
                "form": {
                    "id": self.form.id,
                    "name": "Quantity FORM",
                    "period_type": "MONTH",
                    "generate_derived": None,
                    "form_id": "quantityf",
                },
                "counts": {"total": 3, "error": 2, "exported": 0, "ready": 1},
            },
            {
                "period": "201902",
                "form": {
                    "id": self.form.id,
                    "name": "Quantity FORM",
                    "period_type": "MONTH",
                    "generate_derived": None,
                    "form_id": "quantityf",
                },
                "counts": {"total": 2, "error": 0, "exported": 0, "ready": 2},
            },
            {
                "period": "201903",
                "form": {
                    "id": self.form.id,
                    "name": "Quantity FORM",
                    "period_type": "MONTH",
                    "generate_derived": None,
                    "form_id": "quantityf",
                },
                "counts": {"total": 2, "error": 0, "exported": 1, "ready": 1},
            },
        ]

        response = self.client.get("/api/completeness/")
        self.assertEqual(200, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        response_data = response.json()

        self.assertEqual({"completeness": expected_counts}, response_data)
