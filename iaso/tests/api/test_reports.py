from django.core.files import File

from iaso import models as m
from iaso.models import Report, ReportVersion
from iaso.test import APITestCase


class ReportsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        kame_house = m.Account.objects.create(name="Kame House")
        rr_army = m.Account.objects.create(name="Red Ribbon Army")
        cls.sayanj = m.Project.objects.create(account=kame_house, name="sayanJ")
        cls.kefla = cls.create_user_with_profile(username="Kefla", account=kame_house, permissions=["iaso_reports"])
        cls.beerus = cls.create_user_with_profile(username="Beerus", account=kame_house)

        cls.tao = cls.create_user_with_profile(username="Tao", account=rr_army, permissions=["iaso_reports"])

    def test_get_reports_web(self):
        self.client.force_authenticate(self.kefla)

        file = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json()[0]["name"], "TEST_REPORT_A")

    def test_must_have_report_permission(self):
        self.client.force_authenticate(self.beerus)

        file = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(403, response.status_code)

    def test_get_reports_munlti_tenancy(self):
        self.client.force_authenticate(self.tao)

        file = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(200, response.status_code)
        self.assertEqual(len(response.json()), 0)

    def test_get_reports_must_be_authenticated(self):
        file = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/reports/")

        self.assertEqual(401, response.status_code)

    def test_get_reports_mobile(self):
        self.client.force_authenticate(self.kefla)

        file = File(open("iaso/tests/fixtures/test_user_bulk_create_valid.csv", "rb"))

        report_version = ReportVersion.objects.create(
            file=file,
            name="TEST_REPORT_VERSION_A",
            status="published",
        )

        Report.objects.create(name="TEST_REPORT_A", published_version=report_version, project=self.sayanj)

        response = self.client.get("/api/mobile/reports/")

        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json()[0]["name"], "TEST_REPORT_A")
