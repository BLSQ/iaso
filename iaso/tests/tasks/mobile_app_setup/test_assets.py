from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.assets import (
    AssetFile,
    filename_from_url,
    form_attachment_files,
    form_version_files,
    report_files,
    rewrite_manifest,
)
from iaso.tests.tasks.mobile_app_setup.mocks import S3, SERVER


class AssetsTest(SimpleTestCase):
    def test_filename_from_signed_url(self):
        self.assertEqual(filename_from_url(f"{S3}/a/b/file.xml?X-Amz-Signature=1&b=2"), "file.xml")

    def test_filename_from_url_is_url_decoded(self):
        self.assertEqual(filename_from_url(f"{S3}/a/r%C3%A9gions.csv?sig=1"), "régions.csv")
        manifest = f"<downloadUrl>{S3}/a/r%C3%A9gions.csv?sig=1</downloadUrl>".encode()
        self.assertEqual(
            rewrite_manifest(1, manifest),
            "<downloadUrl>formattachments/1/régions.csv</downloadUrl>".encode(),
        )

    def test_form_attachment_paths_are_url_decoded(self):
        payload = {
            "results": [{"form_id": 1, "file": f"{SERVER}/media/acc/form_attachments/f/vaccins_%C3%A9t%C3%A9.csv"}]
        }

        files = form_attachment_files(payload, "app")

        self.assertEqual(files[0].path, "formattachments/1/vaccins_été.csv")
        self.assertEqual(payload["results"][0]["file"], files[0].path)

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
