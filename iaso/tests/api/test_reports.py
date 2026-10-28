import io
import zipfile

from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile
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

    def test_get_reports_mobile_without_app_id_falls_back_to_account(self):
        # Backward compatibility: a caller that doesn't pass `app_id` keeps the previous
        # behaviour (every report on the account), instead of being rejected.
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

        response = self.client.get("/api/mobile/reports/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        report_names = {report["name"] for report in response.json()}
        self.assertEqual(report_names, {"TEST_REPORT_A", "TEST_REPORT_B"})


def make_zip(files: dict, name: str = "report.zip") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for path, content in files.items():
            archive.writestr(path, content)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="application/zip")


def valid_zip(name: str = "report.zip") -> SimpleUploadedFile:
    return make_zip({"index.html": "<html></html>", "assets/app.js": "console.log(1)"}, name)


class ReportsUploadAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        kame_house = m.Account.objects.create(name="Kame House")
        rr_army = m.Account.objects.create(name="Red Ribbon Army")
        cls.sayanj = m.Project.objects.create(account=kame_house, name="sayanJ", app_id="sayanj.app")
        cls.freeza_project = m.Project.objects.create(account=kame_house, name="Freeza Force", app_id="freeza.app")
        cls.rr_project = m.Project.objects.create(account=rr_army, name="Red Ribbon", app_id="rr.app")
        cls.kefla = cls.create_user_with_profile(
            username="Kefla", account=kame_house, permissions=[CORE_REPORTS_PERMISSION]
        )
        cls.beerus = cls.create_user_with_profile(username="Beerus", account=kame_house)
        cls.tao = cls.create_user_with_profile(username="Tao", account=rr_army, permissions=[CORE_REPORTS_PERMISSION])
        cls.goku = cls.create_user_with_profile(
            username="Goku", account=kame_house, permissions=[CORE_REPORTS_PERMISSION], projects=[cls.sayanj]
        )

    def create_report(self, project=None, file=None, **extra):
        data = {"project": (project or self.sayanj).id, "name": "Campaign progress", "file": file or valid_zip()}
        data.update(extra)
        return self.client.post("/api/reports/", data, format="multipart")

    def test_create_report(self):
        self.client.force_authenticate(self.kefla)

        response = self.create_report(version_name="v1")

        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.content)
        report = Report.objects.get(pk=response.json()["id"])
        self.assertEqual(report.project, self.sayanj)
        self.assertEqual(report.name, "Campaign progress")
        version = report.published_version
        self.assertEqual(version.name, "v1")
        self.assertEqual(version.status, "published")
        self.assertEqual(version.report, report)
        self.assertEqual(version.created_by, self.kefla)
        self.assertTrue(version.file.name.endswith(".zip"))
        self.assertEqual(response.json()["published_version_id"], version.id)
        self.assertEqual(response.json()["status"], "published")
        self.assertTrue(response.json()["url"].endswith(".zip"))

    def test_create_report_keeps_zip_extension(self):
        self.client.force_authenticate(self.kefla)

        response = self.create_report(file=valid_zip(name="my report"))

        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.content)
        version = Report.objects.get(pk=response.json()["id"]).published_version
        self.assertTrue(version.file.name.endswith(".zip"))
        self.assertEqual(version.name, "my report")

    def test_create_report_rejects_invalid_zips(self):
        self.client.force_authenticate(self.kefla)
        cases = {
            "not a zip": SimpleUploadedFile("report.zip", b"hello", content_type="application/zip"),
            "index.html in a folder": make_zip({"report/index.html": "<html></html>"}),
            "no index.html": make_zip({"main.html": "<html></html>"}),
            "path traversal": make_zip({"index.html": "<html></html>", "../evil.js": "x"}),
        }
        for case, file in cases.items():
            with self.subTest(case):
                response = self.create_report(file=file)
                self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
                self.assertIn("file", response.json())
        self.assertEqual(Report.objects.count(), 0)
        self.assertEqual(ReportVersion.objects.count(), 0)

    def test_create_report_one_per_project(self):
        self.client.force_authenticate(self.kefla)
        first = self.create_report()

        response = self.create_report()

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn(f"/api/reports/{first.json()['id']}/versions/", response.json()["project"][0])
        self.assertEqual(Report.objects.filter(project=self.sayanj).count(), 1)

    def test_create_report_project_of_other_account(self):
        self.client.force_authenticate(self.kefla)

        response = self.create_report(project=self.rr_project)

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("project", response.json())

    def test_create_report_project_not_in_user_projects(self):
        self.client.force_authenticate(self.goku)

        response = self.create_report(project=self.freeza_project)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("project", response.json())

        response = self.create_report(project=self.sayanj)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.content)

    def test_reports_of_other_projects_are_hidden_from_restricted_users(self):
        self.client.force_authenticate(self.kefla)
        sayanj_report_id = self.create_report().json()["id"]
        freeza_report_id = self.create_report(project=self.freeza_project).json()["id"]
        freeza_version_id = Report.objects.get(pk=freeza_report_id).published_version_id
        self.client.force_authenticate(self.goku)

        response = self.client.get("/api/reports/")
        self.assertEqual([r["id"] for r in response.json()], [sayanj_report_id])
        url = f"/api/reports/{freeza_report_id}/"
        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.get(url).status_code)
        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.get(f"{url}versions/").status_code)
        response = self.client.post(f"{url}versions/", {"file": valid_zip()}, format="multipart")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)
        response = self.client.post(f"{url}publish/", {"version_id": freeza_version_id})
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)
        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.patch(url, {"name": "x"}).status_code)
        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.delete(url).status_code)
        self.assertEqual(ReportVersion.objects.filter(report_id=freeza_report_id).count(), 1)
        self.assertEqual(Report.objects.get(pk=freeza_report_id).name, "Campaign progress")

    def test_create_report_requires_permission(self):
        self.client.force_authenticate(self.beerus)

        response = self.create_report()

        self.assertEqual(status.HTTP_403_FORBIDDEN, response.status_code)

    def test_upload_new_version_publishes_it(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report(version_name="v1").json()["id"]
        first_version = Report.objects.get(pk=report_id).published_version

        response = self.client.post(
            f"/api/reports/{report_id}/versions/", {"file": valid_zip(), "name": "v2"}, format="multipart"
        )

        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.content)
        report = Report.objects.get(pk=report_id)
        self.assertEqual(report.published_version_id, response.json()["id"])
        self.assertEqual(report.published_version.status, "published")
        first_version.refresh_from_db()
        self.assertEqual(first_version.status, "unpublished")

    def test_upload_new_version_without_publishing(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report(version_name="v1").json()["id"]
        first_version = Report.objects.get(pk=report_id).published_version

        response = self.client.post(
            f"/api/reports/{report_id}/versions/",
            {"file": valid_zip(), "name": "v2", "publish": "false"},
            format="multipart",
        )

        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.content)
        self.assertEqual(response.json()["status"], "unpublished")
        self.assertEqual(Report.objects.get(pk=report_id).published_version, first_version)

    def test_upload_new_version_rejects_invalid_zip(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report().json()["id"]

        response = self.client.post(
            f"/api/reports/{report_id}/versions/",
            {"file": make_zip({"dist/index.html": "<html></html>"})},
            format="multipart",
        )

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEqual(ReportVersion.objects.count(), 1)

    def test_list_versions(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report(version_name="v1").json()["id"]
        self.client.post(f"/api/reports/{report_id}/versions/", {"file": valid_zip(), "name": "v2"}, format="multipart")

        response = self.client.get(f"/api/reports/{report_id}/versions/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        versions = response.json()
        self.assertEqual([v["name"] for v in versions], ["v2", "v1"])
        self.assertEqual([v["status"] for v in versions], ["published", "unpublished"])
        self.assertEqual(versions[0]["created_by"], "Kefla")
        self.assertTrue(versions[0]["url"].endswith(".zip"))

    def test_versions_multi_tenancy(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report().json()["id"]
        self.client.force_authenticate(self.tao)

        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.get(f"/api/reports/{report_id}/versions/").status_code)
        response = self.client.post(f"/api/reports/{report_id}/versions/", {"file": valid_zip()}, format="multipart")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)
        self.assertEqual(status.HTTP_404_NOT_FOUND, self.client.get(f"/api/reports/{report_id}/").status_code)

    def test_publish_version(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report(version_name="v1").json()["id"]
        first_version = Report.objects.get(pk=report_id).published_version
        self.client.post(f"/api/reports/{report_id}/versions/", {"file": valid_zip(), "name": "v2"}, format="multipart")

        response = self.client.post(f"/api/reports/{report_id}/publish/", {"version_id": first_version.id})

        self.assertEqual(status.HTTP_200_OK, response.status_code, response.content)
        self.assertEqual(response.json()["published_version_id"], first_version.id)
        statuses = dict(ReportVersion.objects.filter(report_id=report_id).values_list("name", "status"))
        self.assertEqual(statuses, {"v1": "published", "v2": "unpublished"})

    def test_publish_version_of_other_report(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report().json()["id"]
        other_id = self.create_report(project=self.freeza_project).json()["id"]
        other_version = Report.objects.get(pk=other_id).published_version

        response = self.client.post(f"/api/reports/{report_id}/publish/", {"version_id": other_version.id})

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEqual(Report.objects.get(pk=report_id).published_version.report_id, report_id)

    def test_retrieve_and_filter_by_project(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report().json()["id"]
        self.create_report(project=self.freeza_project)

        response = self.client.get(f"/api/reports/{report_id}/")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(response.json()["status"], "published")
        self.assertTrue(response.json()["url"].endswith(".zip"))

        response = self.client.get(f"/api/reports/?project={self.sayanj.id}")
        self.assertEqual([r["id"] for r in response.json()], [report_id])

    def test_rename_and_delete_report(self):
        self.client.force_authenticate(self.kefla)
        report_id = self.create_report().json()["id"]

        response = self.client.patch(f"/api/reports/{report_id}/", {"name": "Progress"}, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(Report.objects.get(pk=report_id).name, "Progress")

        response = self.client.delete(f"/api/reports/{report_id}/")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertFalse(Report.objects.filter(pk=report_id).exists())
        self.assertTrue(Report.objects_include_deleted.filter(pk=report_id).exists())
        # The project can get a new report once the previous one is deleted.
        self.assertEqual(status.HTTP_201_CREATED, self.create_report().status_code)


class MobileReportsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        kame_house = m.Account.objects.create(name="Kame House")
        cls.sayanj = m.Project.objects.create(account=kame_house, name="sayanJ", app_id="sayanj.app")
        cls.kefla = cls.create_user_with_profile(
            username="Kefla", account=kame_house, permissions=[CORE_REPORTS_PERMISSION]
        )

    def make_report(self, name, version_status="published"):
        version = ReportVersion.objects.create(file=valid_zip(), name=f"{name} version", status=version_status)
        report = Report.objects.create(name=name, published_version=version, project=self.sayanj)
        version.report = report
        version.save()
        return report

    def get_names(self, query="?app_id=sayanj.app"):
        response = self.client.get(f"/api/mobile/reports/{query}")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        return [report["name"] for report in response.json()]

    def test_only_published_versions(self):
        self.client.force_authenticate(self.kefla)
        self.make_report("PUBLISHED")
        self.make_report("UNPUBLISHED", version_status="unpublished")

        self.assertEqual(self.get_names(), ["PUBLISHED"])
        self.assertEqual(self.get_names(""), ["PUBLISHED"])

    def test_deleted_reports_and_versions_are_not_returned(self):
        self.client.force_authenticate(self.kefla)
        self.make_report("DELETED REPORT").delete()
        self.make_report("DELETED VERSION").published_version.delete()
        self.make_report("KEPT")

        self.assertEqual(self.get_names(), ["KEPT"])

    def test_most_recently_updated_first(self):
        # The mobile app downloads the first report of the list.
        self.client.force_authenticate(self.kefla)
        old = self.make_report("OLD")
        self.make_report("NEW")
        self.assertEqual(self.get_names(), ["NEW", "OLD"])

        old.name = "OLD UPDATED"
        old.save()

        self.assertEqual(self.get_names(), ["OLD UPDATED", "NEW"])

    def test_unknown_app_id(self):
        self.client.force_authenticate(self.kefla)

        response = self.client.get("/api/mobile/reports/?app_id=unknown.app")

        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_mobile_api_is_read_only(self):
        self.client.force_authenticate(self.kefla)
        report = self.make_report("REPORT")

        url = f"/api/mobile/reports/{report.id}/"
        self.assertEqual(status.HTTP_405_METHOD_NOT_ALLOWED, self.client.delete(url).status_code)
        self.assertEqual(status.HTTP_405_METHOD_NOT_ALLOWED, self.client.patch(url, {"name": "x"}).status_code)
        self.assertEqual(status.HTTP_405_METHOD_NOT_ALLOWED, self.client.post("/api/mobile/reports/", {}).status_code)
        self.assertTrue(Report.objects.filter(pk=report.id, name="REPORT").exists())

    def test_url_is_absolute(self):
        # The app downloads the URL as is; with a local file storage it would be relative.
        self.client.force_authenticate(self.kefla)
        self.make_report("REPORT")

        response = self.client.get("/api/mobile/reports/?app_id=sayanj.app")

        self.assertTrue(response.json()[0]["url"].startswith("http://testserver/"), response.json()[0]["url"])
        self.assertTrue(response.json()[0]["url"].endswith(".zip"))
