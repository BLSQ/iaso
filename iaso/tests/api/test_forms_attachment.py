import datetime
import typing

from unittest import mock
from unittest.mock import MagicMock, patch

import time_machine

from django.conf import settings
from django.core.files import File
from django.db import connection, reset_queries
from django.http import HttpResponse
from django.test import override_settings
from django.utils.timezone import now
from rest_framework import status

from iaso import models as m
from iaso.api.query_params import APP_ID
from iaso.enketo.enketo_url import generate_signed_url
from iaso.test import APITestCase, MockClamavScanResults
from iaso.utils.virus_scan.model import VirusScanStatus


BASE_URL = "/api/formattachments/"
MANIFEST_MOBILE_URL = "/api/forms/{form_id}/manifest/"
MANIFEST_ENKETO_URL = "/api/forms/{form_id}/manifest_enketo/"
SAFE_FILE_PATH = "iaso/tests/fixtures/clamav/safe.jpg"
EICAR_FILE_PATH = "iaso/tests/fixtures/clamav/eicar.txt"


enketo_test_settings = {
    "ENKETO_API_TOKEN": "ENKETO_API_TOKEN_TEST",
    "ENKETO_URL": "https://enketo_url.host.test",
    "ENKETO_API_SURVEY_PATH": "/api_v2/survey",
    "ENKETO_API_INSTANCE_PATH": "/api_v2/instance",
    "ENKETO_SIGNING_SECRET": "supersecret",
}


@override_settings(ENKETO=enketo_test_settings)
class FormAttachmentsAPITestCase(APITestCase):
    project_1: m.Project
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    PATH_TO_FIXTURES = "iaso/tests/fixtures/form_attachments/"
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        time = cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])

        jedi_council = cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        jedi_academy = cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")

        project_1 = cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        form_1 = cls.form_1 = m.Form.objects.create(name="Hydroponics study", created_at=time)
        form_2 = cls.form_2 = m.Form.objects.create(name="Hydroponic public survey", created_at=time)

        file_mock_1 = mock.MagicMock(spec=File)
        file_mock_1.name = "document1"
        cls.attachment1 = form_2.attachments.create(
            name="first attachment",
            file=file_mock_1,
            md5="test1",
        )
        file_mock_2 = mock.MagicMock(spec=File)
        file_mock_2.name = "document2"
        cls.attachment2 = form_2.attachments.create(
            name="second attachment",
            file=file_mock_2,
            md5="test2",
        )
        form_2.save()

        project_1.unit_types.add(jedi_council)
        project_1.unit_types.add(jedi_academy)
        project_1.forms.add(form_1)
        project_1.forms.add(form_2)
        project_1.save()

    def test_forms_list_without_auth(self):
        f"""GET {BASE_URL} without auth: 0 result"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)

        self.assertValidAttachmentListData(response.json(), 0)

    def test_attachment_list_wrong_id(self):
        f"""GET {BASE_URL} with wrong id: 404"""

        response = self.client.get(BASE_URL, headers={"Content-Type": "application/json"}, data={"form_id": -1})
        self.assertJSONResponse(response, 404)

    def test_attachment_list_wrong_app_id(self):
        f"""GET {BASE_URL} with wrong app id: 404"""

        response = self.client.get(BASE_URL, headers={"Content-Type": "application/json"}, data={"app_id": "wrong"})
        self.assertJSONResponse(response, 404)

    def test_attachment_list_ok_empty_list(self):
        f"""GET {BASE_URL} empty list: we expect no results"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            BASE_URL, headers={"Content-Type": "application/json"}, data={"form_id": self.form_1.id}
        )
        self.assertJSONResponse(response, 200)
        self.assertValidAttachmentListData(response.json(), 0)

    def test_attachment_list_ok_not_empty_list(self):
        f"""GET {BASE_URL} not empty list: we expect 2 results"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            BASE_URL, headers={"Content-Type": "application/json"}, data={"form_id": self.form_2.id}
        )
        self.assertJSONResponse(response, 200)
        self.assertValidAttachmentListData(response.json(), 2)

    def test_form_attachments_retrieve(self):
        f"""GET {BASE_URL}<form_attachment_id>: allowed"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"{BASE_URL}{self.attachment1.id}/")
        self.assertJSONResponse(response, 200)
        form_version_data = response.json()
        self.assertValidAttachmentData(form_version_data)

    def test_form_attachments_delete_unauthenticated(self):
        f"""DELETE {BASE_URL}<form_attachment_id>: is not allowed"""

        response = self.client.delete(f"{BASE_URL}{self.attachment1.id}/")
        self.assertJSONResponse(response, 401)

    def test_form_attachments_delete(self):
        f"""DELETE {BASE_URL}<form_attachment_id>: allowed"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"{BASE_URL}{self.attachment1.id}/")
        self.assertJSONResponse(response, 204)

    def test_form_attachments_create_unauthenticated(self):
        f"""POST {BASE_URL}: is not allowed"""

        with open("iaso/static/images/logo.png", "rb") as file:
            response = self.client.post(
                BASE_URL,
                data={"form_id": self.form_1.id, "file": file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, 401)

    def test_form_attachments_create_without_scanning_file(self):
        f"""POST {BASE_URL}: allowed"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/static/images/logo.png", "rb") as file:
            response = self.client.post(
                BASE_URL,
                data={"form_id": self.form_1.id, "file": file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        form_attachment_data = response.json()
        self.assertValidAttachmentData(form_attachment_data)
        self.assertEqual("logo.png", form_attachment_data["name"])
        self.assertEqual("36e9383ddb4944fee0f791eedbab13db", form_attachment_data["md5"])
        self.assertEqual(f"http://testserver{self.form_1.attachments.first().file.url}", form_attachment_data["file"])
        self.assertEqual(VirusScanStatus.PENDING, form_attachment_data["scan_result"])
        self.assertIsNone(form_attachment_data["scan_timestamp"])

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_form_attachments_create_with_scanning_virus_free_file(self, mock_get_scanner):
        f"""POST {BASE_URL}: allowed"""

        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        self.client.force_authenticate(self.yoda)
        with open(SAFE_FILE_PATH, "rb") as safe_file:
            response = self.client.post(
                BASE_URL,
                data={"form_id": self.form_1.id, "file": safe_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual(1, mock_scanner.scan.call_count)
        form_attachment_data = response.json()
        self.assertValidAttachmentData(form_attachment_data)
        self.assertEqual("safe.jpg", form_attachment_data["name"])
        self.assertEqual(f"http://testserver{self.form_1.attachments.first().file.url}", form_attachment_data["file"])
        self.assertEqual(VirusScanStatus.CLEAN, form_attachment_data["scan_result"])
        self.assertEqual(self.DT.timestamp(), form_attachment_data["scan_timestamp"])

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_form_attachments_create_with_scanning_virus_file(self, mock_get_scanner):
        f"""POST {BASE_URL}: allowed"""

        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="FOUND",
            details="Eicar-Signature",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        self.client.force_authenticate(self.yoda)
        with open(EICAR_FILE_PATH, "rb") as safe_file:
            response = self.client.post(
                BASE_URL,
                data={"form_id": self.form_1.id, "file": safe_file},
                format="multipart",
                headers={"accept": "application/json"},
            )

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        form_attachment_data = response.json()
        self.assertValidAttachmentData(form_attachment_data)
        self.assertEqual(1, mock_scanner.scan.call_count)
        self.assertEqual(VirusScanStatus.INFECTED, form_attachment_data["scan_result"])
        self.assertEqual(self.DT.timestamp(), form_attachment_data["scan_timestamp"])

    def test_form_attachments_update(self):
        f"""POST {BASE_URL}: allowed to update"""

        file = mock.MagicMock(spec=File)
        file.name = "logo.png"
        attachment = self.form_1.attachments.create(
            name="logo.png",
            file=file,
            md5="test1",
        )
        self.form_1.save()
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"{BASE_URL}{attachment.id}/")
        self.assertJSONResponse(response, 200)
        form_attachment_data = response.json()
        self.assertEqual("logo.png", form_attachment_data["name"])
        self.assertEqual(f"http://testserver{attachment.file.url}", form_attachment_data["file"])
        self.assertEqual("test1", form_attachment_data["md5"])

        with open("iaso/static/images/logo.png", "rb") as file:
            response = self.client.post(
                BASE_URL,
                data={"form_id": self.form_1.id, "file": file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, 201)
        form_attachment_data = response.json()
        self.assertValidAttachmentData(form_attachment_data)
        self.assertEqual("logo.png", form_attachment_data["name"])
        self.assertEqual("36e9383ddb4944fee0f791eedbab13db", form_attachment_data["md5"])
        self.assertEqual(f"http://testserver{self.form_1.attachments.first().file.url}", form_attachment_data["file"])
        response = self.client.delete(f"{BASE_URL}{form_attachment_data['id']}/")
        self.assertJSONResponse(response, 204)

    def assertValidAttachmentListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="results", paginated=paginated
        )

        for form_data in list_data["results"]:
            self.assertValidAttachmentData(form_data)

    def assertValidAttachmentData(self, form_data: typing.Mapping):
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "name", str)
        self.assertHasField(form_data, "file", str)
        self.assertHasField(form_data, "md5", str)
        self.assertHasField(form_data, "form_id", int)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)
        self.assertHasField(form_data, "scan_result", str)
        self.assertHasField(form_data, "scan_timestamp", float, optional=True)

    def test_manifest_without_auth(self):
        f"""GET {BASE_URL} without auth: 0 result"""
        response = self.client.get(MANIFEST_MOBILE_URL.format(form_id=self.form_2.id))

        self.assertJSONResponse(response, 404)

    def test_manifest_form_not_found(self):
        f"""GET {MANIFEST_MOBILE_URL} with wrong id: 404"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_MOBILE_URL.format(form_id=100))
        self.assertJSONResponse(response, 404)

    def test_manifest_form_found_but_empty_attachments(self):
        f"""GET {MANIFEST_MOBILE_URL} with no attachments: 200"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_MOBILE_URL.format(form_id=self.form_1.id))
        content = self.assertXMLResponse(response, 200)
        # be careful when you edit the xml file, because any difference in spacing will break the test!
        with open("iaso/tests/fixtures/form_attachments/manifest_empty.xml", "rb") as f:
            expected_content = f.read()
        self.assertEqual(
            expected_content,
            content,
        )

    def test_manifest_form_found_with_attachments(self):
        f"""GET {MANIFEST_MOBILE_URL} with attachments: 200"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_MOBILE_URL.format(form_id=self.form_2.id))
        content = self.assertXMLResponse(response, 200)
        content_str = content.decode("utf-8")

        # Prepare values for each variable in the Jinja template
        context = {
            "attachment_1_hash": self.attachment1.md5,
            "attachment_2_hash": self.attachment2.md5,
            "attachment_1_name": self.attachment1.name,
            "attachment_2_name": self.attachment2.name,
            "attachment_1_url": self.attachment1.file.url,
            "attachment_2_url": self.attachment2.file.url,
        }
        # be careful when you edit the xml file, because any difference in spacing will break the test!
        expected_xml = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="manifest_multiple_attachments.xml", context=context
        )
        self.assertEqual(expected_xml, content_str)

    def test_form_attachments_with_invalid_character(self):
        f"""POST {BASE_URL}: allowed to update"""
        file = mock.MagicMock(spec=File)
        file.name = "<&>.png"
        attachment = self.form_1.attachments.create(
            name="<&>.png",
            file=file,
            md5="test1",
        )
        self.form_1.save()
        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_MOBILE_URL.format(form_id=self.form_1.id))
        content = self.assertXMLResponse(response, 200)
        content_str = content.decode("utf-8")

        # Prepare values for each variable in the Jinja template
        context = {
            "attachment_url": attachment.file.url,
        }
        # be careful when you edit the xml file, because any difference in spacing will break the test!
        expected_xml = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="manifest_invalid_character.xml", context=context
        )
        self.assertEqual(expected_xml, content_str)

    def assertXMLResponse(self, response: typing.Any, expected_status_code: int):
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(expected_status_code, response.status_code, response.content)

        self.assertEqual("1.0", response["X-OpenRosa-Version"], response.content)
        if expected_status_code != 204:
            self.assertEqual("text/xml", response["Content-Type"], response.content)

        return response.content

    @override_settings(
        MIDDLEWARE=[mw for mw in settings.MIDDLEWARE if "querycount.middleware.QueryCountMiddleware" not in mw],
        DEBUG=True,
    )
    def test_manifest_anonymous_app_id(self):
        f"""GET {BASE_URL} via app id"""
        reset_queries()

        response = self.client.get(
            MANIFEST_MOBILE_URL.format(form_id=self.form_2.id),
            headers={"Content-Type": "application/json"},
            data={"app_id": self.project_1.app_id},
        )
        self.assertXMLResponse(response, 200)

        # to ensure performance we clearly don't want to hit iaso_instance
        sql_queries = [q["sql"] for q in connection.queries]
        self.assertEqual(len(sql_queries), 8, f"should have collected queries {sql_queries}")
        matching = [q for q in sql_queries if "iaso_instance" in q.lower()]

        self.assertEqual(len(matching), 0, f"'iaso_instance' found in queries: {matching}")

    def test_manifest_anonymous_app_id_project_with_authentication(self):
        f"""GET {BASE_URL} via app id"""

        self.project_1.needs_authentication = True
        self.project_1.save()

        response = self.client.get(
            MANIFEST_MOBILE_URL.format(form_id=self.form_2.id),
            headers={"Content-Type": "application/json"},
            data={"app_id": self.project_1.app_id},
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_enketo_manifest_anonymous_with_signed_url(self):
        """Test that signed anonymous URLs can be used to fetch manifests (enketo use case)"""
        path = MANIFEST_ENKETO_URL.format(form_id=self.form_2.id)
        signed_url = generate_signed_url(
            path, settings.ENKETO.get("ENKETO_SIGNING_SECRET"), extra_params={APP_ID: self.project_1.app_id}
        )

        response = self.client.get(signed_url)
        self.assertXMLResponse(response, status.HTTP_200_OK)

        content_str = response.content.decode("utf-8")

        # Prepare values for each variable in the Jinja template
        context = {
            "attachment_1_hash": self.attachment1.md5,
            "attachment_2_hash": self.attachment2.md5,
            "attachment_1_name": self.attachment1.name,
            "attachment_2_name": self.attachment2.name,
            "attachment_1_url": self.attachment1.file.url,
            "attachment_2_url": self.attachment2.file.url,
        }
        # be careful when you edit the xml file, because any difference in spacing will break the test!
        expected_xml = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="manifest_multiple_attachments.xml", context=context
        )
        self.assertEqual(expected_xml, content_str)

    def test_enketo_manifest_anonymous_with_signed_url_and_authentication_feature_flag(self):
        """Test that signed anonymous URLs can be used to fetch manifests,
        even if the authentication feature flag is enabled"""
        # Setting the authentication feature flag
        feature_flag = m.FeatureFlag.objects.get(code=m.FeatureFlag.REQUIRE_AUTHENTICATION)
        self.project_1.needs_authentication = True
        self.project_1.feature_flags.add(feature_flag)
        self.project_1.save()

        # Rebuilding the signed URL with the app_id
        path = MANIFEST_ENKETO_URL.format(form_id=self.form_2.id)
        signed_url = generate_signed_url(
            path, settings.ENKETO.get("ENKETO_SIGNING_SECRET"), extra_params={APP_ID: self.project_1.app_id}
        )

        response = self.client.get(signed_url)
        self.assertXMLResponse(response, status.HTTP_200_OK)  # 200 even without authentication

        content_str = response.content.decode("utf-8")

        # Prepare values for each variable in the Jinja template
        context = {
            "attachment_1_hash": self.attachment1.md5,
            "attachment_2_hash": self.attachment2.md5,
            "attachment_1_name": self.attachment1.name,
            "attachment_2_name": self.attachment2.name,
            "attachment_1_url": self.attachment1.file.url,
            "attachment_2_url": self.attachment2.file.url,
        }
        # be careful when you edit the xml file, because any difference in spacing will break the test!
        expected_xml = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="manifest_multiple_attachments.xml", context=context
        )
        self.assertEqual(expected_xml, content_str)

    def test_enketo_manifest_anonymous_with_invalid_signed_url(self):
        """Test that an invalid signed anonymous URL generates an error"""
        path = MANIFEST_ENKETO_URL.format(form_id=self.form_2.id)
        signed_url = generate_signed_url(
            path, settings.ENKETO.get("ENKETO_SIGNING_SECRET"), extra_params={APP_ID: self.project_1.app_id}
        )

        response = self.client.get(f"{signed_url}error")
        self.assertXMLResponse(response, status.HTTP_400_BAD_REQUEST)

        content_str = response.content.decode("utf-8")
        self.assertEqual(content_str, "<error>Invalid URL signature</error>")

    def test_enketo_manifest_anonymous_with_signed_url_error_unknown_form(self):
        """Test that a signed anonymous URL generates an error when querying an unknown form"""
        path = MANIFEST_ENKETO_URL.format(form_id=123456789)
        signed_url = generate_signed_url(
            path, settings.ENKETO.get("ENKETO_SIGNING_SECRET"), extra_params={APP_ID: self.project_1.app_id}
        )

        response = self.client.get(signed_url)
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)
