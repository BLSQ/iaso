"""Contract tests: the real API endpoints behave the way the export relies on."""

import dataclasses
import json
import math
import re

from urllib.parse import unquote

from django.core.files.base import ContentFile

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_REPORTS_PERMISSION
from iaso.tasks.mobile_app_setup.api_calls import API_CALLS
from iaso.tasks.mobile_app_setup.assets import AssetFile
from iaso.test import APITestCase
from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


class AssetFilesContractTest(APITestCase):
    """Verify the API surface of the endpoints with file references."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Account")
        cls.project = m.Project.objects.create(name="Project", app_id="project.app", account=account)
        cls.user = cls.create_user_with_profile(
            username="user", account=account, permissions=[CORE_FORMS_PERMISSION, CORE_REPORTS_PERMISSION]
        )

        cls.form = m.Form.objects.create(name="Form")
        cls.project.forms.add(cls.form)
        cls.form_version = m.FormVersion.objects.create(
            form=cls.form, version_id="1", file=ContentFile(b"<form/>", name="form.xml")
        )
        cls.attachments = [
            cls.form.attachments.create(name="image", file=ContentFile(b"png", name="image.png"), md5="1"),
            # The storage sanitizes the `&` and spaces, the `é` stays and is encoded in the URLs.
            cls.form.attachments.create(name="choices", file=ContentFile(b"csv", name="choices & more é.csv"), md5="2"),
        ]

        cls.report_version = m.ReportVersion.objects.create(
            name="Report v1", file=ContentFile(b"zip", name="report.zip"), status="published"
        )
        m.Report.objects.create(name="Report", published_version=cls.report_version, project=cls.project)

    def setUp(self):
        self.client.force_authenticate(self.user)

    def get_json(self, path, params=None):
        response = self.client.get(path, params)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def fetch_payload_and_files(self, filename):
        """Return the call response, and the files found in it (with rewritten URLs)."""
        call = next(call for call in API_CALLS if call.filename == filename)
        [page] = call.fetch_pages(self, self.project.app_id)
        response = json.loads(json.dumps(page.payload))
        files = call.asset_files(page.payload, self.project.app_id)
        return response, page.payload, files

    def test_form_versions(self):
        response, payload, files = self.fetch_payload_and_files("formversions")

        stored_url = self.form_version.file.url
        url = response["form_versions"][0]["file"]
        self.assertEqual(url, f"http://testserver{stored_url}")
        path = f"forms/{stored_url.split('/')[-1]}"
        self.assertEqual(files, [AssetFile(path=path, url=url)])
        self.assertEqual(payload["form_versions"][0]["file"], path)

    def test_reports(self):
        response, payload, files = self.fetch_payload_and_files("reports")

        stored_url = self.report_version.file.url
        url = response[0]["url"]
        self.assertEqual(url, f"http://testserver{stored_url}")
        path = f"reports/{stored_url.split('/')[-1]}"
        self.assertEqual(files, [AssetFile(path=path, url=url)])
        self.assertEqual(payload[0]["url"], path)

    def test_form_attachments_and_their_manifest_point_to_the_same_files(self):
        response, payload, files = self.fetch_payload_and_files("formattachments")

        self.assertEqual([attachment["form_id"] for attachment in response["results"]], [self.form.id, self.form.id])
        attachment_paths = sorted(attachment["file"] for attachment in payload["results"])
        self.assertEqual(
            attachment_paths,
            sorted(
                f"formattachments/{self.form.id}/{unquote(attachment.file.url.split('/')[-1])}"
                for attachment in self.attachments
            ),
        )
        # Check that special characters are encoded in URLs, and decoded in the zip file paths.
        self.assertIn("%C3%A9", self.attachments[1].file.url)
        self.assertIn("é", attachment_paths[0])
        self.assertEqual(sorted(file.path for file in files if not file.from_api), attachment_paths)

        [manifest] = [file for file in files if file.from_api]
        manifest_response = self.client.get(manifest.url)
        self.assertEqual(manifest_response.status_code, 200, manifest_response.content)
        rewritten = manifest.rewrite(manifest_response.content).decode("utf-8")

        download_urls = sorted(re.findall(r"<downloadUrl>(.*?)</downloadUrl>", rewritten))
        self.assertEqual(download_urls, attachment_paths)

    def test_forms_include_their_org_unit_groups(self):
        call = next(call for call in API_CALLS if call.filename == "forms")
        [page] = call.fetch_pages(self, self.project.app_id)

        self.assertEqual(page.payload["forms"][0]["org_unit_groups"], [])


class OrgUnitChangeRequestConfigsContractTest(OUCRCAPIBase):
    def get_json(self, path, params=None):
        response = self.client.get(path, params)
        self.assertEqual(response.status_code, 200, response.content)
        self.requests.append(dict(params))
        return response.json()

    def test_configs_are_saved_page_by_page(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        self.requests = []
        call = next(call for call in API_CALLS if call.filename == "orgunitchangerequestconfigs")

        pages = list(dataclasses.replace(call, page_size=4).fetch_pages(self, self.app_id))

        count = pages[0].payload["count"]
        self.assertGreater(count, 4)
        page_count = math.ceil(count / 4)
        self.assertEqual(
            [page.filename for page in pages],
            [f"orgunitchangerequestconfigs-{number}.json" for number in range(1, page_count + 1)],
        )
        self.assertEqual({request["include_creation"] for request in self.requests}, {"1"})
        types = [config["type"] for page in pages for config in page.payload["results"]]
        self.assertEqual(len(types), count)
        self.assertIn("creation", types)
