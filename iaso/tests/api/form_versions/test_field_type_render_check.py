"""Chain covered by iaso/tests/fixtures/field_type_render_check.xlsx.

1. The workbook can be saved as a form version. background-audio q_background_audio
   becomes an odk:recordaudio bind. The file question stays a normal upload.
   xml-external and select_*_from_file are not in this workbook.
2. A mobile bulk-upload zip of a submission for that version is imported, including
   the background recording.
3. GET /api/instances/<id>/ — the call the submission detail page makes — returns a
   form_descriptor and file_content the submission view can walk.
"""

import io
import json
import uuid
import zipfile

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


XLS_PATH = "iaso/tests/fixtures/field_type_render_check.xlsx"
FIXTURES_PATH = "iaso/tests/fixtures"
FORM_ID_STRING = "field_type_render_check"
APP_ID = "field.type.render.check"
FORM_VERSION_ID = "2026102605"
INSTANCE_ID = "uuid:3c185364-e5dc-4912-98b2-e9aeb23049f5"
BACKGROUND_AUDIO_FILE = "q_background_audio.m4a"

# Question name -> type pyxform emits. image becomes photo; both select spellings collapse.
EXPECTED_TYPES = {
    "q_note_intro": "note",
    "q_background_audio": "background-audio",
    "g_scalars": "group",
    "g_scalars/q_integer": "integer",
    "g_scalars/q_decimal": "decimal",
    "g_scalars/q_range": "range",
    "g_scalars/q_text": "text",
    "g_scalars/q_barcode": "barcode",
    "g_scalars/q_date": "date",
    "g_scalars/q_time": "time",
    "g_scalars/q_datetime": "dateTime",
    "g_scalars/q_geopoint": "geopoint",
    "g_scalars/q_geotrace": "geotrace",
    "g_scalars/q_geoshape": "geoshape",
    "g_scalars/q_start": "start",
    "g_scalars/q_end": "end",
    "g_scalars/q_acknowledge": "acknowledge",
    "g_selects": "group",
    "g_selects/q_select_one_underscore": "select one",
    "g_selects/q_select_one_space": "select one",
    "g_selects/q_select_multiple_underscore": "select all that apply",
    "g_selects/q_select_all_that_apply": "select all that apply",
    "g_selects/q_rank": "rank",
    "g_media": "group",
    "g_media/q_image": "photo",
    "g_media/q_photo": "photo",
    "g_media/q_audio": "audio",
    "g_media/q_video": "video",
    "g_media/q_file": "file",
    "g_special": "group",
    "g_special/q_calculate": "calculate",
    "g_special/deviceid": "deviceid",
    "g_special/subscriberid": "subscriberid",
    "g_special/simserial": "simserial",
    "g_special/phonenumber": "phonenumber",
    "g_special/q_note_inside_group": "note",
    "household_count": "calculate",
    "household": "repeat",
    "household/member_name": "text",
    "household/member_age": "integer",
    "q_note_unsupported": "note",
    "meta": "group",
    "meta/instanceID": "calculate",
}

# Values the device stored. Groups are flattened in file_content; the repeat stays a list of iterations.
# Notes are labels only, so they are absent here. meta/instanceID is asserted separately because the
# parser stores it as instanceID plus _version, not under the meta group.
EXPECTED_ANSWERS = {
    "q_integer": "42",
    "q_decimal": "3.5",
    "q_range": "4",
    "q_text": "hello render",
    "q_barcode": "ABC-123",
    "q_date": "2026-10-23",
    "q_time": "08:30:00",
    "q_datetime": "2026-10-23T08:30:00.000",
    "q_geopoint": "50.8503 4.3517 0 0",
    "q_geotrace": "50.85 4.35 0 0; 50.86 4.36 0 0",
    "q_geoshape": "50.85 4.35 0 0; 50.86 4.36 0 0; 50.85 4.35 0 0",
    "q_start": "2026-10-23T13:59:00.000+02:00",
    "q_end": "2026-10-23T14:13:00.000+02:00",
    "q_acknowledge": "OK",
    "q_select_one_underscore": "red",
    "q_select_one_space": "green",
    "q_select_multiple_underscore": "red blue",
    "q_select_all_that_apply": "red green",
    "q_rank": "red green blue",
    "q_image": "facility.png",
    "q_photo": "facility.png",
    "q_audio": "voice.mp3",
    "q_video": "clip.mp4",
    "q_file": "report.pdf",
    "q_background_audio": BACKGROUND_AUDIO_FILE,
    "q_calculate": "45.5",
    "deviceid": "354450115013285",
    "subscriberid": "608015139845644",
    "simserial": "8922101051398456440",
    "phonenumber": "+32470123456",
    "household_count": "2",
    "household": [
        {"member_name": "Ada", "member_age": "7"},
        {"member_name": "Grace", "member_age": "8"},
    ],
}

MEDIA_FILES = {
    "facility.png": (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    ),
    "voice.mp3": b"not-really-audio",
    "clip.mp4": b"not-really-video",
    "report.pdf": b"%PDF-1.1\n",
    BACKGROUND_AUDIO_FILE: b"not-really-background-audio",
}

PARENT_TYPES = {"group", "repeat", "survey"}


def index_questions(node, path=""):
    """Flatten a form descriptor to {path: type}, skipping choice options."""
    indexed = {}
    for child in node.get("children") or []:
        if child.get("type") == "option":
            continue
        here = f"{path}/{child['name']}" if path else child["name"]
        indexed[here] = child["type"]
        if child.get("type") in PARENT_TYPES:
            indexed.update(index_questions(child, here))
    return indexed


class FieldTypeRenderCheckChainTest(TaskAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Field type render check")
        cls.project = m.Project.objects.create(
            name="Field type render check",
            app_id=APP_ID,
            account=cls.account,
        )
        cls.user = cls.create_user_with_profile(
            username="render-check",
            account=cls.account,
            permissions=[CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION],
        )
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Facility", short_name="HF")
        cls.project.unit_types.set([cls.org_unit_type])
        cls.org_unit = m.OrgUnit.objects.create(name="Clinic", org_unit_type=cls.org_unit_type)
        cls.form = m.Form.objects.create(name="Field type render check")
        cls.form.org_unit_types.set([cls.org_unit_type])
        cls.project.forms.set([cls.form])

    def submission_xml(self, version_id):
        return self.load_fixture_with_jinja_template(
            path_to_fixtures=FIXTURES_PATH,
            fixture_name="field_type_render_check_submission.xml",
            context={
                "form_id": FORM_ID_STRING,
                "version_id": version_id,
                "instance_id": INSTANCE_ID,
                "answers": EXPECTED_ANSWERS,
            },
        ).encode()

    def mobile_zip(self, form_pk, org_unit_pk, version_id):
        instance_uuid = str(uuid.uuid4())
        xml_name = "submission.xml"
        instances = [
            {
                "id": instance_uuid,
                "created_at": 1712326182450,
                "updated_at": 1712326182450,
                "file": f"/storage/emulated/0/instances/{xml_name}",
                "name": "Field type render check",
                "formId": str(form_pk),
                "orgUnitId": str(org_unit_pk),
                "latitude": 50.8503,
                "longitude": 4.3517,
                "altitude": 0,
                "accuracy": 5,
            }
        ]
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr("instances.json", json.dumps(instances))
            archive.writestr(f"{instance_uuid}/{xml_name}", self.submission_xml(version_id))
            for name, content in MEDIA_FILES.items():
                archive.writestr(f"{instance_uuid}/{name}", content)
        buffer.seek(0)
        return buffer

    def test_form_version_mobile_zip_and_submission_detail(self):
        self.client.force_authenticate(self.user)

        with open(XLS_PATH, "rb") as xls_file:
            version_response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form.id, "xls_file": xls_file},
                format="multipart",
            )
        response_data = self.assertJSONResponse(version_response, status.HTTP_201_CREATED)
        version_id = response_data["version_id"]
        self.assertEqual(version_id, FORM_VERSION_ID)

        self.form.refresh_from_db()
        self.assertEqual(self.form.form_id, FORM_ID_STRING)
        form_version = self.form.form_versions.get()
        self.assertEqual(form_version.version_id, version_id)
        descriptor = form_version.get_or_save_form_descriptor()
        # Paths and types the submission view switches on. A rewritten type (image -> photo, select spellings) fails here.
        self.assertEqual(index_questions(descriptor), EXPECTED_TYPES)
        # Choice names are not in EXPECTED_TYPES. The view resolves "red" to its label from these children.
        selects = next(child for child in descriptor["children"] if child["name"] == "g_selects")
        for question in selects["children"]:
            self.assertCountEqual([choice["name"] for choice in question["children"]], ["red", "green", "blue"])

        form_xml = form_version.file.read().decode()
        # background-audio stays in the workbook: pyxform emits a binary bind plus odk:recordaudio, not a top-level tag.
        self.assertIn(
            '<odk:recordaudio ref="/data/q_background_audio" event="odk-instance-load"/>',
            form_xml,
        )
        self.assertIn('<bind nodeset="/data/q_background_audio" type="binary"/>', form_xml)
        # q_file stays a normal upload. xml-external and select_*_from_file are left out: they need media files the
        # current Collect build cannot open (no manifest, missing label node).
        self.assertIn('<upload mediatype="application/*" ref="/data/g_media/q_file">', form_xml)
        self.assertNotIn("jr://file", form_xml)
        self.assertNotIn("q_xml_external", form_xml)
        self.assertNotIn("items.csv", form_xml)

        zip_buffer = self.mobile_zip(self.form.id, self.org_unit.id, version_id)
        upload_response = self.client.post(
            f"/api/mobile/bulkupload/?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile("field-type-render-check.zip", zip_buffer.read())},
            format="multipart",
        )
        self.assertJSONResponse(upload_response, status.HTTP_204_NO_CONTENT)

        task = m.Task.objects.get(name="process_mobile_bulk_upload")
        self.runAndValidateTask(task, m.SUCCESS)
        api_import = APIImport.objects.get()
        self.assertFalse(api_import.has_problem, api_import.exception)

        instance = m.Instance.objects.get()
        self.assertEqual(instance.form_id, self.form.id)
        self.assertEqual(instance.org_unit_id, self.org_unit.id)
        self.assertEqual(instance.project_id, self.project.id)
        self.assertEqual(instance.form_version_id, form_version.id)
        self.assertEqual(instance.instancefile_set.count(), len(MEDIA_FILES))

        detail = self.assertJSONResponse(self.client.get(f"/api/instances/{instance.id}/"), status.HTTP_200_OK)

        self.assertEqual(detail["form_name"], self.form.name)
        self.assertEqual(detail["org_unit"]["name"], self.org_unit.name)
        self.assertEqual(detail["form_descriptor"], descriptor)
        file_content = detail["file_content"]
        for name, value in EXPECTED_ANSWERS.items():
            self.assertEqual(file_content[name], value, name)
        self.assertEqual(file_content["_version"], version_id)
        self.assertEqual(file_content["instanceID"], INSTANCE_ID)

        matched_files = [filename for filename in MEDIA_FILES if any(filename in url for url in detail["files"])]
        self.assertCountEqual(matched_files, MEDIA_FILES)
