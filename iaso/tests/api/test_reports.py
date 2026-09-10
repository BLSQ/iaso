from django.core.files import File
from rest_framework import status

from iaso import models as m
from iaso.models import Report, ReportVersion
from iaso.permissions.core_permissions import CORE_REPORTS_PERMISSION
from iaso.test import APITestCase


class ReportsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        kame_house = m.Account.objects.create(name="Kame House")
        rr_army = m.Account.objects.create(name="Red Ribbon Army")
        cls.sayanj = m.Project.objects.create(account=kame_house, name="sayanJ", app_id="sayanj.app")
        cls.freeza_project = m.Project.objects.create(account=kame_house, name="Freeza Force", app_id="freeza.app")
        cls.kefla = cls.create_user_with_profile(
            username="Kefla", account=kame_house, permissions=[CORE_REPORTS_PERMISSION]
        )
        cls.beerus = cls.create_user_with_profile(username="Beerus", account=kame_house)

        cls.tao = cls.create_user_with_profile(username="Tao", account=rr_army, permissions=[CORE_REPORTS_PERMISSION])

    def test_get_reports_web(self):
        self.client.force_authenticate(self.kefla)

        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(response.json()[0]["name"], "TEST_REPORT_A")

    def test_must_have_report_permission(self):
        self.client.force_authenticate(self.beerus)

        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(status.HTTP_403_FORBIDDEN, response.status_code)

    def test_get_reports_munlti_tenancy(self):
        self.client.force_authenticate(self.tao)

        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(len(response.json()), 0)

    def test_get_reports_must_be_authenticated(self):
        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(status.HTTP_401_UNAUTHORIZED, response.status_code)

    def test_get_reports_mobile(self):
        self.client.force_authenticate(self.kefla)

        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get(f"/api/mobile/reports/?app_id={self.sayanj.app_id}")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(response.json()[0]["name"], "TEST_REPORT_A")

    def test_get_reports_mobile_filters_by_project(self):
        # IA-5422: /api/mobile/reports/ must only return the reports for the project
        # matching `app_id`, not every report on the account.
        self.client.force_authenticate(self.kefla)

        file = File(open("iaso/tests/fixtures/bulk_create_users/test_user_bulk_create_valid.csv", "rb"))

        sayanj_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )
        Report.objects.create(name="TEST_REPORT_A", published_version=sayanj_version, project=self.sayanj)

        freeza_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_B",
            status="published",
        )
        Report.objects.create(name="TEST_REPORT_B", published_version=freeza_version, project=self.freeza_project)

        response = self.client.get(f"/api/mobile/reports/?app_id={self.sayanj.app_id}")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        report_names = [report["name"] for report in response.json()]
        self.assertEqual(report_names, ["TEST_REPORT_A"])

    def test_get_reports_mobile_requires_app_id(self):
        self.client.force_authenticate(self.kefla)

        response = self.client.get("/api/mobile/reports/")

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
