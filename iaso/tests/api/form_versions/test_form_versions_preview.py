"""
Tests for POST /api/formversions/preview/

Fixtures used
-------------
form_preview_diff_v1.xlsx  (form_id=test_preview_diff, version=2020010101)
    full_name  (text)
    age        (integer)
    birth_date (date)
    instanceID (calculate)   ← auto-added by pyxform

form_preview_diff_v2.xlsx  (form_id=test_preview_diff, version=2020010102)
    full_name    (text)       ← unchanged
    age          (text)       ← type changed: integer → text
    phone_number (text)       ← added
    instanceID   (calculate)  ← unchanged

Expected diff v1 → v2:
    removed:  birth_date
    added:    phone_number
    modified: age (integer → text)
"""

import tempfile

from unittest import mock

from django.core.files import File
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase


PREVIEW_URL = "/api/formversions/preview/"
FIXTURE_V1 = "iaso/tests/fixtures/form_preview_diff_v1.xlsx"
FIXTURE_V2 = "iaso/tests/fixtures/form_preview_diff_v2.xlsx"
INVALID_XLS = "iaso/tests/fixtures/odk_form_blatantly_invalid.xlsx"


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormVersionPreviewAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")

        sw_source = m.DataSource.objects.create(name="SW Source")
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=[CORE_FORMS_PERMISSION])
        cls.batman = cls.create_user_with_profile(username="batman", account=dc, permissions=[CORE_FORMS_PERMISSION])
        cls.clark_kent = cls.create_user_with_profile(username="clark_kent", account=star_wars)

        project = m.Project.objects.create(name="SW Project", app_id="sw.project", account=star_wars)

        # Form with no existing versions — used to test the "no baseline" path.
        cls.form_empty = m.Form.objects.create(name="Empty Form")
        project.forms.set([cls.form_empty])

        # Form with v1 already saved — used to test the diff against a known baseline.
        cls.form_with_version = m.Form.objects.create(name="Form With Version", form_id="test_preview_diff")
        project.forms.add(cls.form_with_version)

        file_mock = mock.MagicMock(spec=File)
        file_mock.name = "test.xml"
        with open(FIXTURE_V1, "rb") as xls_file:
            cls.form_with_version.form_versions.create(
                file=file_mock,
                xls_file=UploadedFile(xls_file),
                version_id="2020010101",
            )

    def setUp(self):
        default_storage._root._children.clear()
        super().setUp()

    # -------------------------------------------------------------------------
    # Authentication and permission
    # -------------------------------------------------------------------------

    def test_preview_unauthenticated(self):
        """No credentials → 401."""
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 401)

    def test_preview_no_form_permission(self):
        """Authenticated user without CORE_FORMS_PERMISSION → 403."""
        self.client.force_authenticate(self.clark_kent)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 403)

    def test_preview_wrong_account(self):
        """User from a different account cannot access the form → 400 (serializer ValidationError)."""
        self.client.force_authenticate(self.batman)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 400)

    # -------------------------------------------------------------------------
    # Input validation
    # -------------------------------------------------------------------------

    def test_preview_form_not_found(self):
        """Non-existent form_id → 400 (PrimaryKeyRelatedField raises ValidationError)."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": 99999, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 400)

    def test_preview_missing_form_id(self):
        """Request without form_id → 400."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 400)

    def test_preview_missing_xls_file(self):
        """Request without xls_file → 400."""
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            PREVIEW_URL,
            data={"form_id": self.form_with_version.id},
            format="multipart",
        )
        self.assertJSONResponse(response, 400)

    def test_preview_invalid_xls(self):
        """Structurally invalid XLS → 400 with an xls_file error key.

        Depending on where parsing fails the error appears under either
        'xls_file_validation_errors' (validator pass) or 'xls_file' (parse
        pass), both are acceptable 400 responses.
        """
        self.client.force_authenticate(self.yoda)
        with open(INVALID_XLS, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 400)
        data = response.json()
        self.assertTrue(
            "xls_file_validation_errors" in data or "xls_file" in data,
            f"Expected an xls_file error key in response, got: {data}",
        )

    # -------------------------------------------------------------------------
    # Diff content — no baseline
    # -------------------------------------------------------------------------

    def test_preview_no_previous_version(self):
        """Form with no prior version → empty diff, previous_version_id is None."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V1, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_empty.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        data = response.json()
        self.assertIsNone(data["previous_version_id"])
        self.assertEqual(data["removed_questions"], [])
        self.assertEqual(data["added_questions"], [])
        self.assertEqual(data["modified_questions"], [])

    # -------------------------------------------------------------------------
    # Diff content — v1 → v2
    # -------------------------------------------------------------------------

    def test_preview_reports_previous_version_id(self):
        """Response includes the version_id of the latest saved version."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["previous_version_id"], "2020010101")

    def test_preview_removed_question(self):
        """birth_date is in v1 but absent from v2 → appears in removed_questions."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        removed_names = {q["name"] for q in response.json()["removed_questions"]}
        self.assertIn("birth_date", removed_names)

    def test_preview_added_question(self):
        """phone_number is in v2 but absent from v1 → appears in added_questions."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        added_names = {q["name"] for q in response.json()["added_questions"]}
        self.assertIn("phone_number", added_names)

    def test_preview_modified_question_type(self):
        """age is integer in v1 and text in v2 → appears in modified_questions with correct types."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        modified_by_name = {q["name"]: q for q in response.json()["modified_questions"]}
        self.assertIn("age", modified_by_name)
        self.assertEqual(modified_by_name["age"]["old_type"], "integer")
        self.assertEqual(modified_by_name["age"]["new_type"], "text")

    def test_preview_unchanged_questions_absent_from_diff(self):
        """full_name and instanceID are identical in v1 and v2 → absent from all diff lists."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        data = response.json()
        all_diff_names = (
            {q["name"] for q in data["removed_questions"]}
            | {q["name"] for q in data["added_questions"]}
            | {q["name"] for q in data["modified_questions"]}
        )
        self.assertNotIn("full_name", all_diff_names)
        self.assertNotIn("instanceID", all_diff_names)

    def test_preview_combined_diff_counts(self):
        """v2 vs v1 produces exactly 1 removed, 1 added, 1 modified question."""
        self.client.force_authenticate(self.yoda)
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        data = response.json()
        self.assertEqual(len(data["removed_questions"]), 1, data["removed_questions"])
        self.assertEqual(len(data["added_questions"]), 1, data["added_questions"])
        self.assertEqual(len(data["modified_questions"]), 1, data["modified_questions"])

    def test_preview_does_not_create_form_version(self):
        """Calling preview must not persist a new FormVersion in the database."""
        self.client.force_authenticate(self.yoda)
        count_before = self.form_with_version.form_versions.count()
        with open(FIXTURE_V2, "rb") as xls_file:
            response = self.client.post(
                PREVIEW_URL,
                data={"form_id": self.form_with_version.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertJSONResponse(response, 200)
        self.assertEqual(self.form_with_version.form_versions.count(), count_before)
