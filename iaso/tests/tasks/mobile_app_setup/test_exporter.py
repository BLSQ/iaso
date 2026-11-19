import io
import json
import zipfile

from unittest import mock

from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.api_calls import ApiCall
from iaso.tasks.mobile_app_setup.archive import ZipArchive
from iaso.tasks.mobile_app_setup.assets import AssetFile
from iaso.tasks.mobile_app_setup.exporter import export_app_setup
from iaso.tests.tasks.mobile_app_setup.mocks import FakeClient, FakeStorage


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
