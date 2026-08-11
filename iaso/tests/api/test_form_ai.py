import tempfile

from unittest.mock import MagicMock, patch

import anthropic

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings
from rest_framework import status

from iaso import models as m
from iaso.api.form_ai.agent import (
    FORM_TOO_LARGE_MESSAGE,
    FormSettings,
    GeneratedForm,
    SurveyRow,
    generate_form,
    parse_form_response,
    parse_xlsform_to_json,
)
from iaso.models.form_ai import TemporaryForm
from iaso.modules import MODULE_FORM_AI
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase


def _make_xlsform_bytes() -> bytes:
    """Return the raw bytes of a simple valid XLSForm fixture."""
    with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xlsx", "rb") as f:
        return f.read()


def _make_generated_form() -> GeneratedForm:
    return GeneratedForm(
        survey=[SurveyRow(type="text", name="full_name", label="Full name")],
        choices=[],
        settings=FormSettings(form_title="Test Form", form_id="test_form"),
        message="Here is your form.",
    )


class FormAIParseResponseTestCase(APITestCase):
    def test_parses_response_with_missing_names_on_structural_rows(self):
        """end group/end repeat rows often omit name; parsing must still succeed."""
        response_text = """{
  "survey": [
    {"type": "text", "name": "q1", "label": "Question 1"},
    {"type": "begin group", "name": "grp", "label": "Group"},
    {"type": "end group "},
    {"type": "begin_repeat", "name": "rep", "label": "Repeat"},
    {"type": "end_repeat"}
  ],
  "choices": [],
  "settings": {"form_title": "Test", "form_id": "test", "version": "1"},
  "message": "Added a question."
}"""
        form = parse_form_response(response_text)

        self.assertEqual(form.message, "Added a question.")
        self.assertEqual(form.survey[2].type, "end group ")
        self.assertEqual(form.survey[2].name, "")
        self.assertEqual(form.survey[4].type, "end_repeat")
        self.assertEqual(form.survey[4].name, "")

    def test_parses_choices_with_list_name_containing_a_space(self):
        """Claude sometimes emits XLSForm's actual "list name" header (with a space)
        instead of the "list_name" key requested in the prompt; both must parse."""
        response_text = """{
  "survey": [{"type": "select_one yes_no", "name": "q1", "label": "Question 1"}],
  "choices": [
    {"list name": "yes_no", "name": "1", "label": "Yes"},
    {"list_name": "yes_no", "name": "0", "label": "No"}
  ],
  "settings": {"form_title": "Test", "form_id": "test", "version": "1"},
  "message": "Added a question."
}"""
        form = parse_form_response(response_text)

        self.assertEqual(form.choices[0].list_name, "yes_no")
        self.assertEqual(form.choices[0].model_dump()["list_name"], "yes_no")
        self.assertNotIn("list name", form.choices[0].model_dump())
        self.assertEqual(form.choices[1].list_name, "yes_no")


class FormAICompactParseTestCase(APITestCase):
    def test_parse_xlsform_omits_empty_string_fields(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xlsx", "rb") as xls_file:
            data = parse_xlsform_to_json(xls_file)

        self.assertIn("survey", data)
        self.assertTrue(data["survey"])
        for row in data["survey"]:
            for value in row.values():
                self.assertNotEqual(value, "")
        for row in data.get("choices", []):
            for value in row.values():
                self.assertNotEqual(value, "")


class FormAIGenerateFormTruncationTestCase(APITestCase):
    @patch("iaso.api.form_ai.agent.call_claude")
    def test_max_tokens_returns_friendly_message_without_poisoning_history(self, mock_call):
        truncated = '{"survey": [{"type": "text", "name": "q1", "label": "Hi'
        mock_call.return_value = {"text": truncated, "stop_reason": "max_tokens"}

        result = generate_form("Add a question", [], api_key="sk-test")

        self.assertIsNone(result["form"])
        self.assertEqual(result["assistant_message"], FORM_TOO_LARGE_MESSAGE)
        self.assertEqual(result["conversation_history"][-1]["content"], FORM_TOO_LARGE_MESSAGE)
        self.assertNotIn(truncated, result["conversation_history"][-1]["content"])

    @patch("iaso.api.form_ai.agent.call_claude")
    def test_invalid_form_json_returns_friendly_message_without_poisoning_history(self, mock_call):
        truncated = '{"survey": [{"type": "text", "name": "q1", "label": "Hi'
        mock_call.return_value = {"text": truncated, "stop_reason": "end_turn"}

        result = generate_form("Add a question", [], api_key="sk-test")

        self.assertIsNone(result["form"])
        self.assertEqual(result["assistant_message"], FORM_TOO_LARGE_MESSAGE)
        self.assertEqual(result["conversation_history"][-1]["content"], FORM_TOO_LARGE_MESSAGE)

    @patch("iaso.api.form_ai.agent.call_claude")
    def test_conversational_non_json_is_returned_as_is(self, mock_call):
        reply = "What kind of questions would you like to add?"
        mock_call.return_value = {"text": reply, "stop_reason": "end_turn"}

        result = generate_form("Hello", [], api_key="sk-test")

        self.assertIsNone(result["form"])
        self.assertEqual(result["assistant_message"], reply)
        self.assertEqual(result["conversation_history"][-1]["content"], reply)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormAIChatTestCase(APITestCase):
    url = "/api/form_ai/"

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(
            name="Test Account",
            anthropic_api_key="sk-test-key",
            modules=[MODULE_FORM_AI.codename],
        )
        cls.account_no_key = m.Account.objects.create(
            name="Account Without Key",
            modules=[MODULE_FORM_AI.codename],
        )
        cls.account_no_module = m.Account.objects.create(name="Account Without Module")

        cls.user = cls.create_user_with_profile(
            username="user_with_perm", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account)
        cls.user_no_key = cls.create_user_with_profile(
            username="user_no_key", account=cls.account_no_key, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.user_no_module = cls.create_user_with_profile(
            username="user_no_module", account=cls.account_no_module, permissions=[CORE_FORMS_PERMISSION]
        )

    def _mock_generate_form(self, with_form=True):
        return {
            "assistant_message": "Here is your form.",
            "form": _make_generated_form() if with_form else None,
            "conversation_history": [
                {"role": "user", "content": "Create a simple form"},
                {"role": "assistant", "content": "Here is your form."},
            ],
        }

    def test_unauthenticated_returns_401(self):
        response = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_permission_returns_403(self):
        self.client.force_authenticate(self.user_no_perm)
        response = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_module_disabled_returns_403(self):
        self.client.force_authenticate(self.user_no_module)
        response = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_api_key_returns_400(self):
        self.client.force_authenticate(self.user_no_key)
        response = self.client.post(self.url, {"message": "Create a form"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Form AI API key is not configured", response.data["error"])

    @patch("iaso.api.form_ai.views.generate_form")
    def test_claude_503_returns_503(self, mock_gen):
        mock_response = MagicMock()
        mock_response.status_code = 503
        mock_gen.side_effect = anthropic.APIStatusError("service unavailable", response=mock_response, body=None)
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, {"message": "Create a form"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_missing_message_returns_400(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("iaso.api.form_ai.views.generate_form")
    def test_successful_form_generation(self, mock_gen):
        mock_gen.return_value = self._mock_generate_form(with_form=True)
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url, {"message": "Create a simple form"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["assistant_message"], "Here is your form.")
        self.assertIsNotNone(response.data["xlsform_uuid"])
        self.assertEqual(len(response.data["conversation_history"]), 2)

        # A TemporaryForm should have been created for the user
        tf = TemporaryForm.objects.get(uuid=response.data["xlsform_uuid"])
        self.assertEqual(tf.user, self.user)
        self.assertEqual(tf.account, self.account)

    @patch("iaso.api.form_ai.views.generate_form")
    def test_conversational_response_has_no_uuid(self, mock_gen):
        mock_gen.return_value = self._mock_generate_form(with_form=False)
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url, {"message": "How are you?"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["xlsform_uuid"])

    @patch("iaso.api.form_ai.views.generate_form")
    def test_conversation_history_is_forwarded(self, mock_gen):
        mock_gen.return_value = self._mock_generate_form(with_form=False)
        self.client.force_authenticate(self.user)

        history = [{"role": "user", "content": "prev"}, {"role": "assistant", "content": "ok"}]
        self.client.post(
            self.url,
            {"message": "next", "conversation_history": history},
            format="json",
        )

        call_args = mock_gen.call_args
        self.assertEqual(call_args[0][1], history)

    @patch("iaso.api.form_ai.views.generate_form")
    def test_existing_form_odk_id_is_forwarded(self, mock_gen):
        mock_gen.return_value = self._mock_generate_form(with_form=True)
        self.client.force_authenticate(self.user)

        self.client.post(
            self.url,
            {"message": "Add a field", "existing_form_odk_id": "my_form"},
            format="json",
        )

        call_args = mock_gen.call_args
        self.assertEqual(call_args[0][2], "my_form")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormAILoadFormTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(
            name="Test Account",
            anthropic_api_key="sk-test-key",
            modules=[MODULE_FORM_AI.codename],
        )

        cls.user = cls.create_user_with_profile(
            username="user_with_perm", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account)

        cls.form = m.Form.objects.create(name="Census Form", form_id="census")
        xml_mock = MagicMock(spec=File)
        xml_mock.name = "form.xml"
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xlsx", "rb") as xls_file:
            cls.form.form_versions.create(
                file=xml_mock,
                xls_file=UploadedFile(xls_file),
                version_id="2020022401",
            )
        # Associate form with user's account via a project
        project = m.Project.objects.create(name="proj", app_id="test.app", account=cls.account)
        project.forms.set([cls.form])

    def _url(self, form_id):
        return f"/api/form_ai/load/{form_id}/"

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self._url(self.form.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_permission_returns_403(self):
        self.client.force_authenticate(self.user_no_perm)
        response = self.client.get(self._url(self.form.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unknown_form_returns_404(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self._url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_successful_load_returns_expected_fields(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self._url(self.form.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["form_id"], self.form.id)
        self.assertEqual(data["form_name"], "Census Form")
        self.assertEqual(data["form_odk_id"], "census")
        self.assertIn("xlsform_data", data)
        self.assertIn("survey", data["xlsform_data"])
        self.assertIn("choices", data["xlsform_data"])
        self.assertIn("settings", data["xlsform_data"])
        for row in data["xlsform_data"]["survey"]:
            for value in row.values():
                self.assertNotEqual(value, "")

    def test_form_with_no_version_returns_404(self):
        empty_form = m.Form.objects.create(name="Empty", form_id="empty")
        project = m.Project.objects.create(name="proj2", app_id="test.app2", account=self.account)
        project.forms.set([empty_form])

        self.client.force_authenticate(self.user)
        response = self.client.get(self._url(empty_form.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormAIDownloadTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(
            name="Test Account",
            anthropic_api_key="sk-test-key",
            modules=[MODULE_FORM_AI.codename],
        )
        cls.other_account = m.Account.objects.create(
            name="Other Account",
            modules=[MODULE_FORM_AI.codename],
        )

        cls.user = cls.create_user_with_profile(
            username="user_with_perm", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.other_user = cls.create_user_with_profile(
            username="other_user", account=cls.other_account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account)

    def _create_temporary_form(self, user=None, account=None):
        user = user or self.user
        account = account or self.account
        tf = TemporaryForm.objects.create(user=user, account=account)
        from django.core.files.base import ContentFile

        tf.xls_file.save("form.xlsx", ContentFile(_make_xlsform_bytes()))
        return tf

    def _url(self, form_uuid):
        return f"/api/form_ai/download/{form_uuid}/"

    def test_unauthenticated_returns_401(self):
        tf = self._create_temporary_form()
        response = self.client.get(self._url(tf.uuid))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_permission_returns_403(self):
        tf = self._create_temporary_form(user=self.user_no_perm)
        self.client.force_authenticate(self.user_no_perm)
        response = self.client.get(self._url(tf.uuid))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_users_file_returns_404(self):
        tf = self._create_temporary_form(user=self.other_user, account=self.other_account)
        self.client.force_authenticate(self.user)
        response = self.client.get(self._url(tf.uuid))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unknown_uuid_returns_404(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self._url("00000000-0000-0000-0000-000000000000"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_successful_download_returns_xlsx(self):
        tf = self._create_temporary_form()
        self.client.force_authenticate(self.user)
        response = self.client.get(self._url(tf.uuid))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIn("attachment", response.get("Content-Disposition", ""))


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormAISaveTestCase(APITestCase):
    url = "/api/form_ai/save/"

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(
            name="Test Account",
            anthropic_api_key="sk-test-key",
            modules=[MODULE_FORM_AI.codename],
        )
        cls.other_account = m.Account.objects.create(
            name="Other Account",
            modules=[MODULE_FORM_AI.codename],
        )

        source = m.DataSource.objects.create(name="Test Source")
        source_version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = source_version
        cls.account.save()

        cls.user = cls.create_user_with_profile(
            username="user_with_perm", account=cls.account, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.other_user = cls.create_user_with_profile(
            username="other_user",
            account=cls.other_account,
            permissions=[CORE_FORMS_PERMISSION],
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account)

        # Form has no form_id yet so the first save can adopt the XLS file's form_id
        cls.form = m.Form.objects.create(name="My Form")
        project = m.Project.objects.create(name="proj", app_id="test.app", account=cls.account)
        project.forms.set([cls.form])

    def _create_temporary_form(self, user=None, account=None) -> TemporaryForm:
        user = user or self.user
        account = account or self.account
        tf = TemporaryForm.objects.create(user=user, account=account)
        from django.core.files.base import ContentFile

        tf.xls_file.save("form.xlsx", ContentFile(_make_xlsform_bytes()))
        return tf

    def test_unauthenticated_returns_401(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_permission_returns_403(self):
        self.client.force_authenticate(self.user_no_perm)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_fields_returns_400(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_uuid_returns_404(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"form_id": self.form.id, "xlsform_uuid": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_other_users_uuid_returns_404(self):
        tf = self._create_temporary_form(user=self.other_user, account=self.other_account)
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"form_id": self.form.id, "xlsform_uuid": str(tf.uuid)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_successful_save_creates_form_version(self):
        tf = self._create_temporary_form()
        self.client.force_authenticate(self.user)

        response = self.client.post(
            self.url,
            {"form_id": self.form.id, "xlsform_uuid": str(tf.uuid)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["form_id"], self.form.id)
        self.assertIn("version_id", response.data)
        self.assertIn("id", response.data)

        self.form.refresh_from_db()
        self.assertEqual(self.form.form_versions.count(), 1)

    def test_save_with_form_odk_id_patches_settings(self):
        """When form_odk_id is provided, the saved version should use that ID."""
        tf = self._create_temporary_form()
        self.client.force_authenticate(self.user)

        # Use a different form without any versions so the form_id check won't conflict
        new_form = m.Form.objects.create(name="Patched Form")
        project = m.Project.objects.create(name="proj3", app_id="test.app3", account=self.account)
        project.forms.set([new_form])

        response = self.client.post(
            self.url,
            {
                "form_id": new_form.id,
                "xlsform_uuid": str(tf.uuid),
                "form_odk_id": "patched_id",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify the form now has the patched ODK ID
        new_form.refresh_from_db()
        self.assertEqual(new_form.form_id, "patched_id")

    def test_save_to_form_in_other_account_is_rejected(self):
        """A user must not be able to create a form version for a form that belongs to another account."""
        # other_form belongs to other_account only
        other_form = m.Form.objects.create(name="Other Account Form")
        other_project = m.Project.objects.create(name="other_proj", app_id="other.app", account=self.other_account)
        other_project.forms.set([other_form])

        # self.user has a valid TemporaryForm (own account, own uuid) but tries to target other_form
        tf = self._create_temporary_form(user=self.user, account=self.account)
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"form_id": other_form.id, "xlsform_uuid": str(tf.uuid)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # No version should have been created
        self.assertEqual(other_form.form_versions.count(), 0)

    def test_save_to_form_not_in_any_project_is_rejected(self):
        """A form not linked to any project is inaccessible and saving to it must be rejected."""
        orphan_form = m.Form.objects.create(name="Orphan Form")

        tf = self._create_temporary_form(user=self.user, account=self.account)
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            {"form_id": orphan_form.id, "xlsform_uuid": str(tf.uuid)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(orphan_form.form_versions.count(), 0)
