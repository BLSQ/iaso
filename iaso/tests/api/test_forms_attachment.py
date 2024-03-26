import typing
from unittest import mock
from xml.sax.saxutils import escape

from django.core.files import File
from django.http import HttpResponse
from django.utils.timezone import now

from iaso import models as m
from iaso.test import APITestCase

BASE_URL = "/api/formattachments/"
MANIFEST_URL = "/api/forms/{form_id}/manifest/"


class FormAttachmentsAPITestCase(APITestCase):
    project_1: m.Project

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

    def test_form_attachments_create(self):
        f"""POST {BASE_URL}: allowed"""

        self.client.force_authenticate(self.yoda)
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

    def test_manifest_without_auth(self):
        f"""GET {BASE_URL} without auth: 0 result"""

        response = self.client.get(MANIFEST_URL.format(form_id=self.form_2.id))
        self.assertJSONResponse(response, 404)

    def test_manifest_form_not_found(self):
        f"""GET {MANIFEST_URL} with wrong id: 404"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_URL.format(form_id=100))
        self.assertJSONResponse(response, 404)

    def test_manifest_form_found_but_empty_attachments(self):
        f"""GET {MANIFEST_URL} with no attachments: 200"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_URL.format(form_id=self.form_1.id))
        content = self.assertXMLResponse(response, 200)
        self.assertEqual(
            b'<?xml version="1.0" encoding="UTF-8"?>\n<manifest '
            b'xmlns="http://openrosa.org/xforms/xformsManifest">\n\n</manifest>',
            content,
        )

    def test_manifest_form_found_with_attachments(self):
        f"""GET {MANIFEST_URL} with attachments: 200"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(MANIFEST_URL.format(form_id=self.form_2.id))
        content = self.assertXMLResponse(response, 200)
        self.assertEqual(
            str(
                b'<?xml version="1.0" encoding="UTF-8"?>\n<manifest '
                b'xmlns="http://openrosa.org/xforms/xformsManifest">\n<mediaFile>\n    <filename>first '
                b"attachment</filename>\n    <hash>md5:test1</hash>\n    "
                b"<downloadUrl>http://testserver"
                + self.attachment1.file.url.encode("ascii")
                + b"</downloadUrl>\n</mediaFile>\n<mediaFile>\n    "
                b"<filename>second attachment</filename>\n    <hash>md5:test2</hash>\n    "
                b"<downloadUrl>http://testserver"
                + self.attachment2.file.url.encode("ascii")
                + b"</downloadUrl>\n</mediaFile>\n</manifest>"
            ),
            str(content),
        )

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
        response = self.client.get(MANIFEST_URL.format(form_id=self.form_1.id))
        content = self.assertXMLResponse(response, 200)
        self.assertEqual(
            b'<?xml version="1.0" encoding="UTF-8"?>\n<manifest '
            b'xmlns="http://openrosa.org/xforms/xformsManifest">\n<mediaFile>\n    <filename>&lt;&amp;&gt;.png'
            b"</filename>\n    <hash>md5:test1</hash>\n    "
            b"<downloadUrl>http://testserver"
            + escape(attachment.file.url).encode("ascii")
            + b"</downloadUrl>\n</mediaFile>\n</manifest>",
            content,
        )

    def assertXMLResponse(self, response: typing.Any, expected_status_code: int):
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(expected_status_code, response.status_code, response.content)

        self.assertEqual("1.0", response["X-OpenRosa-Version"], response.content)
        if expected_status_code != 204:
            self.assertEqual("text/xml", response["Content-Type"], response.content)

        return response.content

    def test_manifest_anonymous_app_id(self):
        f"""GET {BASE_URL} via app id"""

        response = self.client.get(
            MANIFEST_URL.format(form_id=self.form_2.id),
            headers={"Content-Type": "application/json"},
            data={"app_id": self.project_1.app_id},
        )
        self.assertXMLResponse(response, 200)
