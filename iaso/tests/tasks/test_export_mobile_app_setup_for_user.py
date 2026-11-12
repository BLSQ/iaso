import json
import os
import re
import shutil
import tempfile
import zipfile

from unittest import mock
from urllib.parse import parse_qs, urlparse

import responses

from django.contrib.auth.models import User
from django.test import TestCase

from iaso.models import ERRORED, SUCCESS, Account, FeatureFlag, Project, Task
from iaso.tasks import export_mobile_app_setup_for_user as export_module
from iaso.tasks.export_mobile_app_setup_for_user import SERVER, export_mobile_app_setup_for_user
from iaso.tasks.mobile_app_setup.api_calls import API_CALLS
from iaso.utils import iaso_api_client
from iaso.utils.encryption import decrypt_file


PASSWORD = "supersecret"
# The files the API responses reference (form versions, attachments, reports) are signed storage URLs.
STORAGE = "https://iaso-bucket.s3.amazonaws.com"
SIGNATURE = "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123"
REPORT_PATH = "/test/reports/report_1.zip"
REPORT_URL = f"{STORAGE}{REPORT_PATH}{SIGNATURE}"

ALL_FEATURE_FLAGS = [
    FeatureFlag.ENTITY,
    FeatureFlag.REPORTS,
    FeatureFlag.PLANNING,
    FeatureFlag.MOBILE_ORG_UNIT_REGISTRY,
]

FORM_ATTACHMENTS = {
    10: [
        f"{STORAGE}/test/form_attachments/form_a/image_1.png{SIGNATURE}",
        f"{STORAGE}/test/form_attachments/form_a/image_2.png{SIGNATURE}",
    ],
    11: [f"{STORAGE}/test/form_attachments/form_b/choices.csv{SIGNATURE}"],
}


def _manifest(urls):
    media_files = "".join(
        f"<mediaFile><filename>{url.split('?')[0].split('/')[-1]}</filename><hash>md5:abc</hash>"
        f"<downloadUrl>{url.replace('&', '&amp;')}</downloadUrl></mediaFile>"
        for url in urls
    )
    return f'<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="http://openrosa.org/xforms/xformsManifest">{media_files}</manifest>'


def _page(results, page, pages, count):
    return {
        "count": count,
        "results": results,
        "has_next": page < pages,
        "has_previous": page > 1,
        "page": page,
        "pages": pages,
        "limit": 1,
    }


def _url_pattern(url):
    """Matches `url` independently of its query string (ignore a storage signature)."""
    return re.compile(re.escape(url.split("?")[0]) + r"(\?.*)?$")


class FakeIasoServer:
    """Fakes the Iaso server the task calls over HTTP (API calls and file downloads)."""

    def __init__(self, feature_flags=None, needs_authentication=True):
        self.feature_flags = ALL_FEATURE_FLAGS if feature_flags is None else feature_flags
        self.needs_authentication = needs_authentication
        self.mock = responses.RequestsMock(assert_all_requests_are_fired=False)
        self._register()

    def __enter__(self):
        self.mock.__enter__()
        return self

    def __exit__(self, *exc_info):
        # The recorded calls are reset when the mock stops.
        self.calls = list(self.mock.calls)
        return self.mock.__exit__(*exc_info)

    def calls_to(self, path):
        return [call for call in self.calls if urlparse(call.request.url).path == path]

    def _json(self, path, payload):
        self.mock.add(responses.GET, f"{SERVER}{path}", json=payload)

    def _paginated(self, path, pages):
        count = sum(len(page) for page in pages)

        def callback(request):
            page = int(parse_qs(urlparse(request.url).query)["page"][0])
            body = _page(pages[page - 1], page, len(pages), count)
            return 200, {}, json.dumps(body)

        self.mock.add_callback(responses.GET, f"{SERVER}{path}", callback=callback)

    def _cursor_paginated(self, path, pages):
        """Cursor pagination as implemented on the mobile entity endpoints."""
        count = sum(len(page) for page in pages)

        def callback(request):
            query = parse_qs(urlparse(request.url).query)
            page = int(query["page"][0])
            body = _page(pages[page - 1], page, len(pages), count)
            if "cursor" in query:
                assert query["cursor"] == [f"after-page-{page - 1}"], query
                body.update(count=None, pages=None)
            body["next_cursor"] = f"after-page-{page}" if body["has_next"] else None
            return 200, {}, json.dumps(body)

        self.mock.add_callback(responses.GET, f"{SERVER}{path}", callback=callback)

    def _file(self, url, body):
        self.mock.add(responses.GET, _url_pattern(url), body=body)

    def _register(self):
        self._json(
            "/api/apps/current/",
            {
                "id": "com.fixtures.app",
                "name": "Fixtures",
                "app_id": "com.fixtures.app",
                "needs_authentication": self.needs_authentication,
                "feature_flags": [{"name": code, "code": code} for code in self.feature_flags],
            },
        )
        self._json("/api/orgunittypes/", {"orgUnitTypes": [{"id": 1, "name": "District"}]})
        self._json("/api/mobile/groups/", [{"id": 1, "name": "Group"}])
        self._json("/api/mobile/group_sets/", {"groupSets": []})
        self._json("/api/mobile/forms/", {"forms": [{"id": 10}, {"id": 11}]})
        self._json(
            "/api/formversions/",
            {
                "form_versions": [
                    {"id": 1, "form_id": 10, "file": f"{STORAGE}/test/forms/form_a_v1.xml{SIGNATURE}"},
                    {"id": 2, "form_id": 11, "file": f"{STORAGE}/test/forms/form_b_v1.xml{SIGNATURE}"},
                ]
            },
        )
        self._file(f"{STORAGE}/test/forms/form_a_v1.xml", b"<form-a/>")
        self._file(f"{STORAGE}/test/forms/form_b_v1.xml", b"<form-b/>")

        attachments = [
            {"id": index, "form_id": form_id, "file": url}
            for index, (form_id, url) in enumerate(
                (form_id, url) for form_id, urls in FORM_ATTACHMENTS.items() for url in urls
            )
        ]
        self._json("/api/formattachments/", {"results": attachments})
        for form_id, urls in FORM_ATTACHMENTS.items():
            self.mock.add(responses.GET, f"{SERVER}/api/forms/{form_id}/manifest/", body=_manifest(urls))
            for url in urls:
                self._file(url, f"content of {url.split('?')[0]}".encode())

        self._paginated("/api/mobile/orgunits/", [[{"id": 1}, {"id": 2}], [{"id": 3}]])
        self._json("/api/mobile/orgunits/changes/", [])
        self._json("/api/mobile/plannings/", {"plannings": []})
        self._json("/api/mobile/storage/passwords/", {"results": []})
        self._json("/api/mobile/storage/blacklisted/", {"results": []})
        self._cursor_paginated("/api/mobile/entities/", [[{"id": "e1"}], [{"id": "e2"}], [{"id": "e3"}]])
        self._cursor_paginated("/api/mobile/entities/deleted/", [[]])
        self._paginated("/api/mobile/entitytypes/", [[{"id": 1}]])
        self._json(
            "/api/mobile/reports/",
            [{"name": "Report 1", "url": REPORT_URL}],
        )
        self._file(REPORT_URL, b"report-1")
        self._json("/api/mobile/workflows/", {"workflows": []})


class ExportMobileAppSetupTestCase(TestCase):
    fixtures = ["user.yaml"]

    def setUp(self):
        self.user = User.objects.get(username="test")
        self.project = Project.objects.get(app_id="com.fixtures.app")
        self.task = Task.objects.create(
            name="export_mobile_app_setup",
            launcher=self.user,
            account=Account.objects.get(name="test"),
        )
        # Refactor note:
        # Because of `upload_file_to_s3`, and `decrypt_file`, the tests write files to disk.
        # Once we migrate the task to use Django's storage in a subsequent PR, we can use Django's
        # InMemoryStorage and stop mocking the upload.
        self.out_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.out_dir, ignore_errors=True)
        self.uploaded = []

        upload_patcher = mock.patch.object(export_module, "upload_file_to_s3", side_effect=self._fake_upload)
        self.upload_mock = upload_patcher.start()
        self.addCleanup(upload_patcher.stop)

        sleep_patcher = mock.patch("time.sleep")
        self.sleep_mock = sleep_patcher.start()
        self.addCleanup(sleep_patcher.stop)

    def _fake_upload(self, file_name, object_name=None):
        self.uploaded.append({"source": file_name, "object_name": object_name})
        shutil.copy(file_name, os.path.join(self.out_dir, os.path.basename(object_name)))

    def run_export(self, server):
        with server:
            export_mobile_app_setup_for_user(
                user_id=self.user.id,
                project_id=self.project.id,
                password=PASSWORD,
                task=self.task,
                _immediate=True,
            )
        self.task.refresh_from_db()

    def open_export(self) -> zipfile.ZipFile:
        self.assertEqual(len(self.uploaded), 1)
        zip_name = os.path.basename(self.uploaded[0]["object_name"])
        decrypted = decrypt_file(
            file_path=self.out_dir, file_name_in=zip_name, file_name_out="decrypted.zip", password=PASSWORD
        )
        archive = zipfile.ZipFile(decrypted)
        self.addCleanup(archive.close)
        return archive


class ExportMobileAppSetupTest(ExportMobileAppSetupTestCase):
    def test_export_succeeds_and_uploads_encrypted_zip(self):
        self.run_export(FakeIasoServer())

        self.assertEqual(self.task.status, SUCCESS, self.task.result)
        self.assertRegex(self.task.result_file.file, r"^export-files/mobile-app-export-[0-9a-f-]+\.zip$")
        self.assertIsNone(self.task.result_file.expires_at)
        self.upload_mock.assert_called_once()
        self.assertEqual(self.uploaded[0]["object_name"], self.task.result_file.file)
        # The temporary files are removed once uploaded.
        self.assertFalse(os.path.exists(self.uploaded[0]["source"]))

    def test_zip_contents(self):
        self.run_export(FakeIasoServer())

        names = set(self.open_export().namelist())
        self.assertEqual(
            names,
            {
                "app.json",
                "orgunittypes.json",
                "groups.json",
                "groupsets.json",
                "forms.json",
                "formversions.json",
                "forms/form_a_v1.xml",
                "forms/form_b_v1.xml",
                "formattachments.json",
                "formattachments/10/image_1.png",
                "formattachments/10/image_2.png",
                "formattachments/10/manifest.xml",
                "formattachments/11/choices.csv",
                "formattachments/11/manifest.xml",
                "orgunitchanges.json",
                "plannings.json",
                "storage-passwords.json",
                "storage-blacklisted.json",
                "entitytypes-1.json",
                "reports.json",
                "reports/report_1.zip",
                "workflows.json",
                "orgunits-1.json",
                "orgunits-2.json",
                "entities-1.json",
                "entities-2.json",
                "entities-3.json",
                "deletedentities-1.json",
            },
        )

    def test_paginated_resources_are_saved_page_by_page(self):
        self.run_export(FakeIasoServer())
        archive = self.open_export()

        self.assertEqual(json.loads(archive.read("orgunits-1.json"))["results"], [{"id": 1}, {"id": 2}])
        self.assertEqual(json.loads(archive.read("orgunits-2.json"))["results"], [{"id": 3}])
        self.assertEqual(json.loads(archive.read("entities-2.json"))["results"], [{"id": "e2"}])

    def test_entities_use_cursor_pagination(self):
        server = FakeIasoServer()
        self.run_export(server)
        archive = self.open_export()

        queries = [parse_qs(urlparse(c.request.url).query) for c in server.calls_to("/api/mobile/entities/")]
        self.assertEqual([q.get("cursor") for q in queries], [None, ["after-page-1"], ["after-page-2"]])
        self.assertEqual([q["page"] for q in queries], [["1"], ["2"], ["3"]])

        # The totals of the first page are copied to the next ones.
        for page in [1, 2, 3]:
            entities = json.loads(archive.read(f"entities-{page}.json"))
            self.assertEqual(
                entities,
                {
                    "count": 3,
                    "results": [{"id": f"e{page}"}],
                    "has_next": page < 3,
                    "has_previous": page > 1,
                    "page": page,
                    "pages": 3,
                    "limit": 1,
                    "next_cursor": f"after-page-{page}" if page < 3 else None,
                },
            )

    def test_query_params(self):
        server = FakeIasoServer()
        self.run_export(server)

        orgunit_queries = [parse_qs(urlparse(c.request.url).query) for c in server.calls_to("/api/mobile/orgunits/")]
        self.assertEqual(
            orgunit_queries,
            [
                {"shapes": ["0"], "app_id": ["com.fixtures.app"], "page": ["1"], "limit": ["5000"]},
                {"shapes": ["0"], "app_id": ["com.fixtures.app"], "page": ["2"], "limit": ["5000"]},
            ],
        )
        for call in server.calls:
            if urlparse(call.request.url).path.startswith("/api/"):
                self.assertIn("app_id=com.fixtures.app", call.request.url)

    def test_api_calls_config_is_not_mutated(self):
        api_calls_before = [(call, dict(call.default_params)) for call in API_CALLS]

        self.run_export(FakeIasoServer())

        self.assertEqual([(call, dict(call.default_params)) for call in API_CALLS], api_calls_before)
        # Also catches a mutation made by an earlier test run in the same process.
        for call in API_CALLS:
            for param in ["app_id", "page", "limit"]:
                self.assertNotIn(param, call.default_params, call.path)

    def test_file_urls_are_rewritten_to_files_in_the_zip(self):
        self.run_export(FakeIasoServer())
        archive = self.open_export()
        names = set(archive.namelist())

        form_versions = json.loads(archive.read("formversions.json"))["form_versions"]
        self.assertEqual([v["file"] for v in form_versions], ["forms/form_a_v1.xml", "forms/form_b_v1.xml"])
        self.assertEqual(archive.read("forms/form_a_v1.xml"), b"<form-a/>")

        reports = json.loads(archive.read("reports.json"))
        self.assertEqual([r["url"] for r in reports], ["reports/report_1.zip"])
        self.assertEqual(archive.read("reports/report_1.zip"), b"report-1")

        attachments = json.loads(archive.read("formattachments.json"))["results"]
        self.assertEqual(
            [a["file"] for a in attachments],
            ["formattachments/10/image_1.png", "formattachments/10/image_2.png", "formattachments/11/choices.csv"],
        )
        for path in [v["file"] for v in form_versions] + [r["url"] for r in reports] + [a["file"] for a in attachments]:
            self.assertIn(path, names)
        self.assertEqual(
            archive.read("formattachments/10/image_2.png"),
            f"content of {STORAGE}/test/form_attachments/form_a/image_2.png".encode(),
        )

    def test_manifest_download_urls_point_to_each_attachment(self):
        self.run_export(FakeIasoServer())
        archive = self.open_export()

        for form_id, expected in [
            (10, ["formattachments/10/image_1.png", "formattachments/10/image_2.png"]),
            (11, ["formattachments/11/choices.csv"]),
        ]:
            manifest = archive.read(f"formattachments/{form_id}/manifest.xml").decode()
            self.assertEqual(re.findall(r"<downloadUrl>(.*?)</downloadUrl>", manifest), expected)
            self.assertIn("<hash>md5:abc</hash>", manifest)

    def test_manifest_is_downloaded_once_per_form(self):
        server = FakeIasoServer()
        self.run_export(server)

        self.assertEqual(len(server.calls_to("/api/forms/10/manifest/")), 1)
        self.assertEqual(len(server.calls_to("/api/forms/11/manifest/")), 1)

    def test_auth_header_is_only_sent_to_the_api(self):
        server = FakeIasoServer()
        self.run_export(server)

        for call in server.calls:
            url = call.request.url
            if url.startswith(f"{SERVER}/api/") and not url.startswith(f"{SERVER}/api/apps/current/"):
                # Including the form manifests
                self.assertTrue(call.request.headers["Authorization"].startswith("Bearer "), url)
            else:
                # The app info (before authentication) and the media files
                self.assertNotIn("Authorization", call.request.headers, url)
        self.assertEqual(len(server.calls_to("/api/forms/10/manifest/")), 1)
        self.assertEqual(len(server.calls_to(REPORT_PATH)), 1)

    def test_no_auth_header_when_app_does_not_need_authentication(self):
        server = FakeIasoServer(needs_authentication=False)
        self.run_export(server)

        self.assertEqual(self.task.status, SUCCESS, self.task.result)
        for call in server.calls:
            self.assertNotIn("Authorization", call.request.headers, call.request.url)

    def test_feature_flags(self):
        server = FakeIasoServer(feature_flags=[])
        self.run_export(server)

        names = set(self.open_export().namelist())
        for skipped in [
            "entities-1.json",
            "deletedentities-1.json",
            "entitytypes-1.json",
            "storage-passwords.json",
            "storage-blacklisted.json",
            "workflows.json",
            "plannings.json",
            "orgunitchanges.json",
            "reports.json",
        ]:
            self.assertNotIn(skipped, names)
        self.assertIn("orgunits-1.json", names)
        self.assertEqual(server.calls_to("/api/mobile/entities/"), [])


class ExportMobileAppSetupProgressTest(ExportMobileAppSetupTestCase):
    def test_progress(self):
        reported = []
        original = Task.report_progress_and_stop_if_killed

        def record(task, progress_value=None, progress_message=None, end_value=None, **kwargs):
            reported.append((progress_value, progress_message, end_value))
            return original(task, progress_value, progress_message, end_value, **kwargs)

        with mock.patch.object(Task, "report_progress_and_stop_if_killed", autospec=True, side_effect=record):
            self.run_export(FakeIasoServer())

        expected_end_value = 2 + sum(call.sub_steps for call in API_CALLS)
        self.assertEqual(reported[0], (0, "Starting", expected_end_value))
        self.assertEqual(self.task.end_value, expected_end_value)

        values = [value for value, _, _ in reported if value is not None]
        self.assertEqual(values, sorted(values), "progress never goes backwards")
        self.assertEqual(values[-1], expected_end_value)

        messages = [message for _, message, _ in reported]
        self.assertIn("Fetching orgunits (page 1/2)", messages)
        self.assertIn("Fetching orgunits (page 2/2)", messages)
        self.assertIn("Fetching entities (page 3/3)", messages)
        self.assertIn("Fetching forms", messages)


class ExportMobileAppSetupRetryTest(ExportMobileAppSetupTestCase):
    """Test the retries on failed API calls and downloads."""

    def test_api_call_is_retried(self):
        server = FakeIasoServer()
        server.mock.replace(responses.GET, f"{SERVER}/api/mobile/forms/", status=502, body="Bad gateway")
        server.mock.add(responses.GET, f"{SERVER}/api/mobile/forms/", json={"forms": [{"id": 10}]})

        self.run_export(server)

        self.assertEqual(self.task.status, SUCCESS, self.task.result)
        self.assertEqual(len(server.calls_to("/api/mobile/forms/")), 2)
        self.assertEqual(json.loads(self.open_export().read("forms.json")), {"forms": [{"id": 10}]})

    def test_download_is_retried(self):
        server = FakeIasoServer()
        server.mock.replace(responses.GET, _url_pattern(REPORT_URL), status=503)
        server.mock.add(responses.GET, _url_pattern(REPORT_URL), body=b"report-1")

        self.run_export(server)

        self.assertEqual(self.task.status, SUCCESS, self.task.result)
        self.assertEqual(len(server.calls_to(REPORT_PATH)), 2)
        self.assertEqual(self.open_export().read("reports/report_1.zip"), b"report-1")

    def test_task_errors_when_retries_are_exhausted(self):
        server = FakeIasoServer()
        server.mock.replace(responses.GET, _url_pattern(REPORT_URL), status=503)

        self.run_export(server)

        self.assertEqual(self.task.status, ERRORED)
        self.assertEqual(len(server.calls_to(REPORT_PATH)), 1 + iaso_api_client.RETRIES)
        self.upload_mock.assert_not_called()
