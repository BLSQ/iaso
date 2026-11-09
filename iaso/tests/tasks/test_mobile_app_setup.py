"""Unit tests for the mobile app setup export."""

import io
import json
import zipfile

from unittest import mock

import responses

from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.api_calls import API_CALLS, ApiCall, Page
from iaso.tasks.mobile_app_setup.archive import ZipArchive
from iaso.tasks.mobile_app_setup.assets import (
    AssetFile,
    filename_from_url,
    form_attachment_files,
    form_version_files,
    report_files,
    rewrite_manifest,
)
from iaso.tasks.mobile_app_setup.exporter import export_app_setup
from iaso.tasks.mobile_app_setup.progress import ExportProgress
from iaso.utils.iaso_api_client import HttpClient


SERVER = "https://iaso.test"
S3 = "https://bucket.s3.amazonaws.com"


class FakeClient:
    def __init__(self, responses=None, files=None):
        self.responses = responses or {}
        self.files = files or {}
        self.requests = []
        self.token = None

    def get_bytes(self, url):
        return self.files[url]

    def get_json(self, path, params=None):
        self.requests.append((path, dict(params or {})))
        response = self.responses[path]
        if isinstance(response, list) and params and "page" in params:
            return response[params["page"] - 1]
        return response

    def authenticate_with_token(self, token):
        self.token = token


class FakeStorage:
    def __init__(self, files=None):
        self.files = files or {}

    def get_bytes(self, url):
        return self.files[url]


def _page(page, pages, results):
    return {"page": page, "pages": pages, "has_next": page < pages, "results": results}


class ApiCallTest(SimpleTestCase):
    def test_is_enabled(self):
        self.assertTrue(ApiCall(path="/api/x/", filename="x").is_enabled({}))
        flagged = ApiCall(path="/api/x/", filename="x", required_feature_flag="ENTITY")
        self.assertTrue(flagged.is_enabled({"ENTITY"}))
        self.assertFalse(flagged.is_enabled({"PLANNING"}))

    def test_filenames_are_unique(self):
        filenames = [call.filename for call in API_CALLS]
        self.assertEqual(len(filenames), len(set(filenames)))


class FetchPagesTest(SimpleTestCase):
    def test_not_paginated(self):
        client = FakeClient({"/api/x/": [{"id": 1}]})
        call = ApiCall(path="/api/x/", filename="x", default_params={"a": "1"})

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual(pages, [Page(filename="x.json", payload=[{"id": 1}])])
        self.assertEqual(client.requests, [("/api/x/", {"a": "1", "app_id": "app"})])

    def test_paginated(self):
        client = FakeClient({"/api/x/": [_page(1, 2, [1]), _page(2, 2, [2])]})
        call = ApiCall(path="/api/x/", filename="x", paginated=True, page_size=10)

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual(
            [(p.filename, p.number, p.total_pages) for p in pages], [("x-1.json", 1, 2), ("x-2.json", 2, 2)]
        )
        self.assertEqual(
            client.requests,
            [
                ("/api/x/", {"app_id": "app", "page": 1, "limit": 10}),
                ("/api/x/", {"app_id": "app", "page": 2, "limit": 10}),
            ],
        )

    def test_paginated_endpoint_returning_a_list(self):
        client = FakeClient({"/api/x/": [[1, 2]]})
        call = ApiCall(path="/api/x/", filename="x", paginated=True)

        pages = list(call.fetch_pages(client, "app"))

        self.assertEqual([(p.filename, p.payload, p.total_pages) for p in pages], [("x-1.json", [1, 2], 1)])


class ExportProgressTest(SimpleTestCase):
    def setUp(self):
        self.task = mock.Mock()
        self.calls = [
            ApiCall(path="/api/a/", filename="a"),
            ApiCall(path="/api/b/", filename="b", paginated=True, sub_steps=10),
        ]
        self.progress = ExportProgress(self.task, self.calls)

    def reported_values(self):
        return [c.kwargs["progress_value"] for c in self.task.report_progress_and_stop_if_killed.call_args_list]

    def test_end_value(self):
        self.progress.start()

        self.task.report_progress_and_stop_if_killed.assert_called_once_with(
            progress_value=0, progress_message="Starting", end_value=13
        )

    def test_pages_spread_the_call_progress(self):
        self.progress.call_done(self.calls[0])
        for number in [1, 2, 3]:
            self.progress.page_done(self.calls[1], Page(filename="b", payload={}, number=number, total_pages=3))
        self.progress.call_done(self.calls[1])

        self.assertEqual(self.reported_values(), [3, 6, 9, 13, 13])

    def test_progress_is_capped_when_there_are_more_pages_than_announced(self):
        self.progress.call_done(self.calls[0])
        self.progress.page_done(self.calls[1], Page(filename="b", payload={}, number=5, total_pages=2))

        self.assertEqual(self.reported_values(), [3, 13])


class AssetsTest(SimpleTestCase):
    def test_filename_from_signed_url(self):
        self.assertEqual(filename_from_url(f"{S3}/a/b/file.xml?X-Amz-Signature=1&b=2"), "file.xml")

    def test_filename_from_url_is_not_url_decoded(self):
        # Also test that the filenames match the rewritten manifests.
        self.assertEqual(filename_from_url(f"{S3}/a/my%20file.png?sig=1"), "my%20file.png")
        manifest = f"<downloadUrl>{S3}/a/my%20file.png?sig=1</downloadUrl>".encode()
        self.assertEqual(rewrite_manifest(1, manifest), b"<downloadUrl>formattachments/1/my%20file.png</downloadUrl>")

    def test_form_version_files(self):
        payload = {"form_versions": [{"id": 1, "file": f"{S3}/acc/forms/a.xml?X-Amz-Signature=1"}]}

        files = form_version_files(payload, "app")

        self.assertEqual(files, [AssetFile(path="forms/a.xml", url=f"{S3}/acc/forms/a.xml?X-Amz-Signature=1")])
        self.assertEqual(payload, {"form_versions": [{"id": 1, "file": "forms/a.xml"}]})

    def test_report_files(self):
        payload = [{"name": "Report", "url": "/media/reports/r.zip"}]

        files = report_files(payload, "app")

        self.assertEqual(files, [AssetFile(path="reports/r.zip", url="/media/reports/r.zip")])
        self.assertEqual(payload, [{"name": "Report", "url": "reports/r.zip"}])

    def test_form_attachment_files_with_a_manifest_per_form(self):
        payload = {
            "results": [
                {"form_id": 1, "file": f"{S3}/acc/form_attachments/form_a/a.png?sig=1"},
                {"form_id": 1, "file": f"{S3}/acc/form_attachments/form_a/b.png?sig=1"},
                {"form_id": 2, "file": f"{SERVER}/media/acc/form_attachments/form_b/c.csv"},
            ]
        }

        files = form_attachment_files(payload, "app")

        self.assertEqual(
            [(file.path, file.url, file.from_api, file.rewrite is not None) for file in files],
            [
                ("formattachments/1/a.png", f"{S3}/acc/form_attachments/form_a/a.png?sig=1", False, False),
                ("formattachments/1/manifest.xml", "/api/forms/1/manifest/?app_id=app", True, True),
                ("formattachments/1/b.png", f"{S3}/acc/form_attachments/form_a/b.png?sig=1", False, False),
                ("formattachments/2/c.csv", f"{SERVER}/media/acc/form_attachments/form_b/c.csv", False, False),
                ("formattachments/2/manifest.xml", "/api/forms/2/manifest/?app_id=app", True, True),
            ],
        )
        self.assertEqual(
            [attachment["file"] for attachment in payload["results"]],
            ["formattachments/1/a.png", "formattachments/1/b.png", "formattachments/2/c.csv"],
        )
        # Each manifest is rewritten for its own form.
        manifest = b"<downloadUrl>https://iaso.test/media/x.png</downloadUrl>"
        self.assertEqual(files[4].rewrite(manifest), b"<downloadUrl>formattachments/2/x.png</downloadUrl>")

    def test_rewrite_manifest(self):
        manifest = (
            "<manifest>"
            f"<mediaFile><downloadUrl>{S3}/f/a.png?X-Amz-Signature=1&amp;b=2</downloadUrl></mediaFile>"
            f"<mediaFile><downloadUrl>{SERVER}/media/f/b.csv</downloadUrl></mediaFile>"
            "</manifest>"
        ).encode()

        self.assertEqual(
            rewrite_manifest(7, manifest),
            b"<manifest>"
            b"<mediaFile><downloadUrl>formattachments/7/a.png</downloadUrl></mediaFile>"
            b"<mediaFile><downloadUrl>formattachments/7/b.csv</downloadUrl></mediaFile>"
            b"</manifest>",
        )


class ZipArchiveTest(SimpleTestCase):
    def test_round_trip(self):
        payload = {"name": "Kinshasa – Gombé", "ids": [1, 2]}
        content = bytes(range(256))  # binary content, written as is
        buffer = io.BytesIO()
        with ZipArchive(buffer) as archive:
            archive.write_json("a.json", payload)
            archive.write_bytes("b.bin", content)

        zip_file = zipfile.ZipFile(buffer)
        written = zip_file.read("a.json")
        self.assertEqual(json.loads(written), payload)
        # ASCII JSON with default separators
        self.assertEqual(written, json.dumps(payload).encode())
        self.assertEqual(written, b'{"name": "Kinshasa \\u2013 Gomb\\u00e9", "ids": [1, 2]}')
        self.assertEqual(zip_file.read("b.bin"), content)

    def test_entries_are_compressed(self):
        buffer = io.BytesIO()
        with ZipArchive(buffer) as archive:
            archive.write_json("a.json", {"a": 1})
            archive.write_bytes("b.bin", b"b")

        infos = zipfile.ZipFile(buffer).infolist()
        self.assertEqual([info.compress_type for info in infos], [zipfile.ZIP_DEFLATED] * 2)


class StorageDownloadTest(SimpleTestCase):
    @responses.activate
    def test_download(self):
        url = f"{S3}/acc/form_attachments/form_a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc"
        content = bytes(range(256))  # binary content
        responses.add(responses.GET, url, body=content, content_type="image/png")

        self.assertEqual(HttpClient().get_bytes(url), content)

        self.assertEqual(len(responses.calls), 1)
        self.assertEqual(responses.calls[0].request.url, url)


class ExportAppSetupTest(SimpleTestCase):
    def export(self, client, api_calls, access_token="token", storage=None):
        buffer = io.BytesIO()
        archive = ZipArchive(buffer)
        export_app_setup(
            client=client,
            storage=storage or FakeStorage(),
            archive=archive,
            app_id="app",
            api_calls=api_calls,
            progress=mock.Mock(),
            access_token=access_token,
        )
        archive.close()
        return zipfile.ZipFile(buffer)

    def app_info(self, needs_authentication, feature_flags=()):
        return {
            "name": "App",
            "app_id": "app",
            "needs_authentication": needs_authentication,
            "feature_flags": [{"code": code, "name": code} for code in feature_flags],
        }

    def test_does_not_authenticate_when_not_needed(self):
        client = FakeClient({"/api/apps/current/": self.app_info(needs_authentication=False)})

        self.export(client, [])

        self.assertIsNone(client.token)

    def test_authenticates_before_the_api_calls(self):
        client = FakeClient({"/api/apps/current/": self.app_info(needs_authentication=True), "/api/a/": []})

        self.export(client, [ApiCall(path="/api/a/", filename="a")], access_token="token")

        self.assertEqual(client.token, "token")

    def test_writes_the_responses_of_the_enabled_calls(self):
        client = FakeClient(
            {
                "/api/apps/current/": self.app_info(needs_authentication=False, feature_flags=["ENTITY"]),
                "/api/a/": {"a": 1},
                "/api/b/": {"b": 1},
            }
        )
        calls = [
            ApiCall(path="/api/a/", filename="a", required_feature_flag="ENTITY"),
            ApiCall(path="/api/b/", filename="b", required_feature_flag="PLANNING"),
        ]

        archive = self.export(client, calls)

        self.assertEqual(archive.namelist(), ["app.json", "a.json"])
        self.assertEqual(json.loads(archive.read("a.json")), {"a": 1})
        self.assertNotIn("/api/b/", [path for path, _ in client.requests])

    def test_downloads_the_asset_files(self):
        client = FakeClient(
            {"/api/apps/current/": self.app_info(needs_authentication=False), "/api/a/": {"file": "https://x/f.xml"}},
            files={"/api/h/": b"h"},
        )

        def asset_files(payload, app_id):
            url, payload["file"] = payload["file"], "files/f.xml"
            return [
                AssetFile(path="files/f.xml", url=url),
                AssetFile(path="files/g.xml", url="https://x/g.xml", rewrite=lambda content: content.upper()),
                AssetFile(path="files/h.xml", url="/api/h/", from_api=True),  # should use api client
            ]

        storage = FakeStorage({"https://x/f.xml": b"f", "https://x/g.xml": b"g"})
        calls = [ApiCall(path="/api/a/", filename="a", asset_files=asset_files)]

        archive = self.export(client, calls, storage=storage)

        self.assertEqual(json.loads(archive.read("a.json")), {"file": "files/f.xml"})
        self.assertEqual(archive.read("files/f.xml"), b"f")
        self.assertEqual(archive.read("files/g.xml"), b"G")
        self.assertEqual(archive.read("files/h.xml"), b"h")
