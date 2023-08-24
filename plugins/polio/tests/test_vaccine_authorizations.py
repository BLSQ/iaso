from datetime import date

from django.contrib.auth.models import User, Permission
from django.utils.timezone import now
from rest_framework.test import APIClient

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import Account, OrgUnitType, OrgUnit
from iaso.test import APITestCase
from plugins.polio.models import VaccineAuthorization


class VaccineAuthorizationAPITestCase(APITestCase):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    account: Account

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.default_project = m.Project.objects.create(name="Default project", app_id="default", account=cls.account)
        cls.data_source.projects.set([cls.default_project])

        cls.account_2 = Account.objects.create(name="second_account", default_version=cls.source_version_1)
        cls.user_1 = cls.create_user_with_profile(
            username="user_1",
            account=cls.account,
            permissions=["iaso_polio_vaccine_authorizations_admin", "iaso_polio_vaccine_authorizations_read_only"],
        )
        cls.user_2 = cls.create_user_with_profile(
            username="user_2", account=cls.account, permissions=["iaso_polio_vaccine_authorizations_read_only"]
        )
        cls.user_3 = cls.create_user_with_profile(username="user_3", account=cls.account, permissions=["iaso_forms"])

        cls.project = m.Project.objects.create(
            name="Polio",
            app_id="polio.projects",
            account=cls.account,
        )

        cls.project_2 = m.Project.objects.create(
            name="Project_2",
            app_id="pro.jects",
            account=cls.account_2,
        )

        cls.org_unit_type_country = OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")

        cls.org_unit_type_country.projects.set([cls.project, cls.project_2])
        cls.org_unit_type_country.save()

        cls.org_unit_DRC = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Democratic Republic of Congo",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_ALGERIA = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="ALGERIA",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_SOMALIA = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="SOMALIA",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

    def setUp(self):
        self.client = APIClient()

    def test_user_can_post(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        response = self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["country"]["name"], "Democratic Republic of Congo")
        self.assertEqual(response.data["expiration_date"], "2024-02-01"),
        self.assertEqual(response.data["status"], "ongoing")
        self.assertEqual(response.data["comment"], "waiting for approval.")
        self.assertEqual(response.data["quantity"], 12346)

    def test_get_vacc_auth_by_id(self):
        self.client.force_authenticate(self.user_1)

        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        vaccine_auth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            quantity=123456,
            status="ongoing",
            comment="waiting for approval",
            expiration_date="2024-02-01",
        )

        response = self.client.get(f"/api/polio/vaccineauthorizations/{vaccine_auth.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["country"]["id"], self.org_unit_DRC.id)
        self.assertEqual(response.data["country"]["name"], "Democratic Republic of Congo")
        self.assertEqual(response.data["quantity"], 123456)
        self.assertEqual(response.data["status"], "ongoing")
        self.assertEqual(response.data["comment"], "waiting for approval")

    def test_can_access_list(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        VaccineAuthorization.objects.create(
            country=self.org_unit_DRC,
            account=self.user_1.iaso_profile.account,
            quantity=1000000,
            status="signature",
            comment="validated",
            expiration_date="2024-02-01",
        )

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_without_perm_cant_read(self):
        self.client.force_authenticate(self.user_3)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        VaccineAuthorization.objects.create(
            country=self.org_unit_DRC,
            account=self.user_1.iaso_profile.account,
            quantity=1000000,
            status="signature",
            comment="validated",
            expiration_date="2024-02-01",
        )

        response = self.client.get("/api/polio/vaccineauthorizations/")
        self.assertEqual(response.status_code, 403)

    def test_user_need_admin_perm_for_write_operations(self):
        self.client.force_authenticate(self.user_2)

        response = self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        self.assertEqual(403, response.status_code)

    def test_user_without_read_only_cant_access_api(self):
        self.client.force_authenticate(self.user_3)

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 403)

    def test_get_most_recent_authorizations(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "new update",
                "expiration_date": "2024-03-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "validated",
                "comment": "Approved.",
                "expiration_date": "2024-04-01",
            },
        )

        response = self.client.get("/api/polio/vaccineauthorizations/?get_most_recent=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["comment"], "Approved.")
        self.assertEqual(response.data[0]["status"], "validated")
        self.assertEqual(response.data[0]["expiration_date"], "2024-04-01")

    def test_filters(self):
        self.client.force_authenticate(self.user_1)

        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk, self.org_unit_ALGERIA, self.org_unit_SOMALIA])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "new update",
                "expiration_date": "2024-03-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_ALGERIA.pk,
                "quantity": 12346,
                "status": "validated",
                "comment": "Approved.",
                "expiration_date": "2024-04-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_SOMALIA.pk,
                "quantity": 12346,
                "status": "validated",
                "comment": "Approved.",
                "expiration_date": "2024-04-01",
            },
        )

        # search by partial name

        response = self.client.get("/api/polio/vaccineauthorizations/?search=congo")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        # retrieve by status
        response = self.client.get("/api/polio/vaccineauthorizations/?auth_status=validated")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        # retrieve only non deleted entries

        self.client.delete(f"/api/polio/vaccineauthorizations/{VaccineAuthorization.objects.last().pk}/")

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

        # retrieve only deleted

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=deleted")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        # all

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=all")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 4)

        # only actives

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=active")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)
