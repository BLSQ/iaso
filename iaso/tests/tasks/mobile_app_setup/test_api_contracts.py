"""Contract tests: the real API endpoints behave the way the export relies on."""

import dataclasses
import json
import math
import re
import uuid

from urllib.parse import unquote

from django.core.files.base import ContentFile

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_REPORTS_PERMISSION
from iaso.tasks.mobile_app_setup.api_calls import API_CALLS, Pagination
from iaso.tasks.mobile_app_setup.assets import AssetFile
from iaso.test import APITestCase
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase
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


class EntityCursorPaginationContractTest(EntityAPITestCase):
    """Verify the surface of the mobile entity endpoint.

    This is a tripwire test designed to test the pagination with the real mobile entity api.
    While most of the task treats the API as opaque and just saves the json payloads to the zip,
    the entity api calls rely on specific cursor pagination behavior.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.entities = []
        for i in range(3):
            instance = cls.create_form_instance(
                project=cls.project, org_unit=cls.ou_country, form=cls.form_1, uuid=uuid.uuid4()
            )
            entity = m.Entity.objects.create(
                name=f"entity_{i}", entity_type=cls.entity_type, attributes=instance, account=cls.account
            )
            instance.entity = entity
            instance.save()
            cls.entities.append(entity)

    def setUp(self):
        self.client.force_authenticate(self.yoda)
        self.requests = []
        self.responses = []

    def get_json(self, path, params=None):
        response = self.client.get(path, params)
        self.assertEqual(response.status_code, 200, response.content)
        self.requests.append(dict(params))
        self.responses.append(json.loads(response.content))
        return response.json()

    def fetch_pages(self, filename):
        call = next(call for call in API_CALLS if call.filename == filename)
        self.assertEqual(call.pagination, Pagination.CURSOR)
        return list(dataclasses.replace(call, page_size=2).fetch_pages(self, self.project.app_id))

    def assert_cursor_pages(self, pages, expected_ids):
        self.assertEqual([page.number for page in pages], [1, 2])

        self.assertNotIn("cursor", self.requests[0])
        self.assertIsNotNone(self.responses[0]["next_cursor"])
        self.assertEqual(self.requests[1]["cursor"], self.responses[0]["next_cursor"])
        self.assertEqual([(r["count"], r["pages"]) for r in self.responses], [(3, 2), (None, None)])
        self.assertEqual([r["has_next"] for r in self.responses], [True, False])
        # With a cursor, the server echoes the `page` param sent.
        self.assertEqual([r["page"] for r in self.responses], [1, 2])

        # The task copies the totals of page 1 to page 2.
        for page in pages:
            self.assertEqual((page.payload["count"], page.payload["pages"], page.total_pages), (3, 2, 2))

        ids = [entity["id"] for page in pages for entity in page.payload["results"]]
        self.assertEqual(ids, expected_ids)

    def test_entities(self):
        pages = self.fetch_pages("entities")

        self.assert_cursor_pages(pages, [str(entity.uuid) for entity in self.entities])

    def test_deleted_entities(self):
        for entity in self.entities:
            entity.delete()

        pages = self.fetch_pages("deletedentities")

        self.assert_cursor_pages(pages, [entity.id for entity in self.entities])
