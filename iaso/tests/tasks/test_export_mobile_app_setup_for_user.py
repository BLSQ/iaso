import io
import json
import os
import shutil
import tempfile
import zipfile

from unittest import mock

from django.contrib.auth.models import User
from django.test import TestCase

from iaso.models import SUCCESS, Account, Form, Project, Task
from iaso.tasks.export_mobile_app_setup_for_user import (
    _call_cursor_pagination_page,
    _get_cursor_pagination_metadata,
    _get_resource,
    export_mobile_app_setup_for_user,
)
from iaso.utils.encryption import decrypt_file
from plugins.trypelim.constants import REGISTRATION_FORM_ID


def mocked_iaso_client_get(*args, **kwargs):
    url = args[0]
    if url.startswith("/api/apps/current/"):
        return {
            "id": "org.bluesquare.trypelim",
            "name": "Trypelim",
            "app_id": "org.bluesquare.trypelim",
            "feature_flags": [{"name": "Mobile: Show entities screen)", "code": "ENTITY"}],
            "needs_authentication": True,
        }
    if url.startswith("/api/formversions/"):
        return {"form_versions": []}
    if url.startswith("/api/formattachments/"):
        return {"results": []}
    if url.startswith("/api/internal/entities/"):
        return {
            "next": None,
            "previous": None,
            "results": [],
        }
    if url.startswith("/api/mobile/entities/"):
        return {
            "count": 1,
            "results": [],
            "has_next": False,
            "has_previous": False,
            "page": 1,
            "pages": 1,
            "limit": 1000,
        }
    # for all other calls, return an empty array
    return []


def _get_files_in_zipfile(zip_path, zip_name):
    decrypted_file_path = decrypt_file(
        file_path=zip_path,
        file_name_in=zip_name,
        file_name_out="decrypted.zip",
        password="supersecret",
    )
    with zipfile.ZipFile(decrypted_file_path, "r") as zip_ref:
        return zip_ref.namelist()


def mock_upload_file(dest):
    """Custom mock for boto3.client.upload_file.

    Copies the file content to a safe location before the original
    temporary file is automatically deleted.
    """

    def wrapped(Filename, Bucket, Key, ExtraArgs=None):
        shutil.copyfile(Filename, dest)

    return wrapped


class ExportMobileAppSetupForUserTest(TestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.registration_form = Form.objects.create(name="Trypelim registration", form_id=REGISTRATION_FORM_ID)

    def setUp(self):
        self.user = User.objects.first()
        self.project = Project.objects.first()
        self.task = Task.objects.create(
            name="export_mobile_app_setup",
            launcher=self.user,
            account=Account.objects.first(),
        )

    @mock.patch("iaso.tasks.export_mobile_app_setup_for_user.IasoClient")
    @mock.patch("boto3.client")
    def test_export(self, mock_s3_client, MockIasoClient):
        iaso_client_mock = mock.MagicMock()
        iaso_client_mock.get.side_effect = mocked_iaso_client_get
        MockIasoClient.return_value = iaso_client_mock

        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)

        s3_client_mock = mock.MagicMock()
        side_effect = mock_upload_file(os.path.join(tmpdir.name, "_result.zip"))
        s3_client_mock.upload_file.side_effect = side_effect
        mock_s3_client.return_value = s3_client_mock

        export_mobile_app_setup_for_user(
            user_id=self.user.id,
            project_id=self.project.id,
            password="supersecret",
            task=self.task,
            options={},
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, SUCCESS)
        self.assertIn("file:export-files/mobile-app-export-", self.task.result["data"])

        s3_client_mock.upload_file.assert_called_once()
        call_args, _ = s3_client_mock.upload_file.call_args

        zip_name = self.task.result["data"].replace("file:export-files/", "")
        self.assertTrue(call_args[0].endswith(zip_name))

        # check zip file contents
        created_files = _get_files_in_zipfile(tmpdir.name, "_result.zip")
        self.assertIn("app.json", created_files)
        self.assertIn("entities-1.json", created_files)
        self.assertIn("entitytypes-1.json", created_files)
        self.assertIn("formattachments.json", created_files)
        self.assertIn("forms.json", created_files)
        self.assertIn("formversions.json", created_files)
        self.assertIn("groups.json", created_files)
        self.assertIn("orgunits-1.json", created_files)
        self.assertIn("orgunittypes.json", created_files)
        self.assertIn("storage-blacklisted.json", created_files)
        self.assertIn("storage-passwords.json", created_files)
        self.assertIn("workflows.json", created_files)


class MockZip:
    """Mock object for ZipFileWriter."""

    def __init__(self):
        self.captured_files = {}

    def open(self, filename, *args, **kwargs):
        return self._FileContext(self, filename)

    class _FileContext:
        def __init__(self, parent_mock, filename):
            self.parent_mock = parent_mock
            self.filename = filename
            self.stream = io.StringIO()

        def __enter__(self):
            return self.stream

        def __exit__(self, exc_type, exc_value, traceback):
            self.parent_mock.captured_files[self.filename] = self.stream.getvalue()
            self.stream.close()


class ExportMobileAppSetupTrypelimFeatures(TestCase):
    """Test trypelim-specific features for the export mobile setup task."""

    @classmethod
    def setUpTestData(cls):
        cls.registration_form = Form.objects.create(name="Trypelim registration", form_id=REGISTRATION_FORM_ID)

    def setUp(self):
        self.call = {
            "path": "/api/internal/entities/",
            "filename": "entities",
            "required_feature_flag": "ENTITY",
            "filename": "entities",
            "paginated": True,
            "cursor_pagination": {"shim": True, "legacy_url": "/api/mobile/entities/"},
        }
        self.app_id = "org.test.app"
        self.feature_flags = ["ENTITY"]

    def test_strip_visited_at(self):
        """SLEEP-1698: Test that `visited_at` is set to null when `strip_visited_at` options is set."""

        registration_id = self.registration_form.id
        other_form = Form.objects.create(name="Random form", form_id="foo")

        iaso_client_mock = mock.MagicMock()
        iaso_client_mock.get.side_effect = [
            {"count": 4},
            {
                "next": None,
                "previous": None,
                "results": [
                    {
                        "instances": [
                            {"id": 1, "form_id": registration_id, "json": {"visited_at": "2021-03-10"}},
                            {"id": 2, "form_id": registration_id, "json": {"visited_at": None}},
                            {"id": 3, "form_id": registration_id, "json": {}},
                            {"id": 4, "form_id": registration_id, "json": {"unrelated_attr": "bar"}},
                            {"id": 5, "form_id": registration_id},
                            {"id": 6, "form_id": other_form.id, "json": {"visited_at": None}},
                        ]
                    }
                ],
            },
        ]
        options = {
            "strip_visited_at": True,
        }
        zipf_mock = MockZip()
        _get_resource(iaso_client_mock, self.call, zipf_mock, self.app_id, self.feature_flags, options)
        self.assertIn("entities-1.json", zipf_mock.captured_files)
        expected = {
            "instances": [
                {"id": 1, "form_id": registration_id, "json": {"visited_at": "0"}},
                {"id": 2, "form_id": registration_id, "json": {"visited_at": "0"}},
                {"id": 3, "form_id": registration_id, "json": {}},
                {"id": 4, "form_id": registration_id, "json": {"unrelated_attr": "bar"}},
                {"id": 5, "form_id": registration_id},
                {"id": 6, "form_id": other_form.id, "json": {"visited_at": None}},
            ],
        }
        self.assertDictEqual(json.loads(zipf_mock.captured_files["entities-1.json"])["results"][0], expected)


class CursorPaginationShimTest(TestCase):
    def setUp(self):
        self.iaso_client = mock.MagicMock()
        self.call = {
            "path": "/api/internal/entities/",
            "filename": "entities",
            "required_feature_flag": "ENTITY",
            "filename": "entities",
            "paginated": True,
            "cursor_pagination": {"shim": True, "legacy_url": "/api/mobile/entities/"},
        }
        self.app_id = "org.test.app"

    @mock.patch("iaso.tasks.export_mobile_app_setup_for_user._call_endpoint")
    def test_cursor_pagination_single_page(self, mock_call_endpoint):
        """Verify that the cursor shim returns offset-style metadata for a single-page cursor response."""

        #  Mock the legacy count endpoint
        mock_call_endpoint.side_effect = [
            {"count": 3},  # called by _get_cursor_pagination_metadata
            {
                "next": None,
                "previous": None,
                "results": [{"id": 1}, {"id": 2}, {"id": 3}],
            },  # called by _call_cursor_pagination_page
        ]

        # Retrieve total count and pages
        cursor_state = _get_cursor_pagination_metadata(self.iaso_client, self.call, self.app_id)

        self.assertEqual(cursor_state.total_count, 3)
        self.assertEqual(cursor_state.page_size, 1000)
        self.assertEqual(cursor_state.total_pages, 1)

        # Simulate page 1 call
        result, filename = _call_cursor_pagination_page(
            self.iaso_client, self.call, self.app_id, page=1, cursor_state=cursor_state
        )

        # Verify transformation to offset-like metadata
        self.assertEqual(filename, "entities-1.json")
        self.assertIn("count", result)
        self.assertIn("page", result)
        self.assertIn("pages", result)
        self.assertIn("limit", result)
        self.assertFalse(result["has_next"])
        self.assertFalse(result["has_previous"])
        self.assertEqual(result["count"], 3)
        self.assertEqual(result["page"], 1)
        self.assertEqual(result["pages"], 1)
        self.assertEqual(len(result["results"]), 3)

        # Verify _call_endpoint calls
        self.assertEqual(mock_call_endpoint.call_count, 2)

    @mock.patch("iaso.tasks.export_mobile_app_setup_for_user._call_endpoint")
    def test_cursor_pagination_multiple_pages(self, mock_call_endpoint):
        """Simulate two cursor pages and verify has_next flips correctly."""

        # First call: legacy count endpoint
        # Second call: first page (has next)
        # Third call: second page (no next)
        mock_call_endpoint.side_effect = [
            {"count": 2},
            {"next": "/api/internal/entities/?cursor=abc123", "previous": None, "results": [{"id": 1}]},
            {"next": None, "previous": "/api/internal/entities/?cursor=abc123", "results": [{"id": 2}]},
        ]

        cursor_state = _get_cursor_pagination_metadata(self.iaso_client, self.call, self.app_id)

        # Page 1
        result1, filename1 = _call_cursor_pagination_page(
            self.iaso_client, self.call, self.app_id, page=1, cursor_state=cursor_state
        )
        self.assertTrue(result1["has_next"])
        self.assertFalse(result1["has_previous"])

        # Page 2 (using the updated next_url)
        result2, filename2 = _call_cursor_pagination_page(
            self.iaso_client, self.call, self.app_id, page=2, cursor_state=cursor_state
        )
        self.assertFalse(result2["has_next"])
        self.assertTrue(result2["has_previous"])

        self.assertEqual(mock_call_endpoint.call_count, 3)
