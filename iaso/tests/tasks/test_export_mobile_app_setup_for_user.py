import os
import zipfile

from unittest import mock

from django.contrib.auth.models import User
from django.test import TestCase

from iaso.models import SUCCESS, Account, Project, Task
from iaso.tasks.export_mobile_app_setup_for_user import (
    _call_cursor_pagination_page,
    _get_cursor_pagination_metadata,
    export_mobile_app_setup_for_user,
)
from iaso.utils.encryption import decrypt_file


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


class ExportMobileAppSetupForUserTest(TestCase):
    fixtures = ["user.yaml"]

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

        s3_client_mock = mock.MagicMock()
        s3_client_mock.upload_file.return_value = None
        mock_s3_client.return_value = s3_client_mock

        export_mobile_app_setup_for_user(
            user_id=self.user.id,
            project_id=self.project.id,
            password="supersecret",
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, SUCCESS)
        self.assertIn("file:export-files/mobile-app-export-", self.task.result["data"])

        s3_client_mock.upload_file.assert_called_once()

        # check zip file contents
        zip_name = self.task.result["data"].replace("file:export-files/", "")
        folder_name = zip_name.replace(".zip", "")
        zip_path = os.path.join("/tmp", folder_name)
        # breakpoint()
        created_files = _get_files_in_zipfile(zip_path, zip_name)
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


class CursorPaginationShimTest(TestCase):
    def setUp(self):
        self.iaso_client = mock.MagicMock()
        self.call = {
            "path": "/api/internal/entities/",
            "filename": "entities",
            "required_feature_flag": "ENTITY",
            "filename": "entities",
            "paginated": True,
            "cursor_pagination": {
                "shim": True,
                "legacy_url": "/api/mobile/entities/"
            },
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

