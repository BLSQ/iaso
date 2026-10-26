"""Chain covered by testdata/field_type_render_check/field_type_render_check.xlsx.

1. The workbook can be saved as a form version.
2. A mobile bulk-upload zip of a submission for that version is imported.
3. GET /api/instances/<id>/ — the call the submission detail page makes — returns a
   form_descriptor and file_content the submission view can walk.
"""

import io
import json
import uuid
import zipfile

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from beanstalk_worker.services import TestTaskService
from hat.api_import.models import APIImport
from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase


XLS_PATH = "testdata/field_type_render_check/field_type_render_check.xlsx"
FORM_ID_STRING = "field_type_render_check"
APP_ID = "field.type.render.check"

# Question name -> type pyxform emits. image becomes photo; both select spellings collapse.
EXPECTED_TYPES = {
    "q_note_intro": "note",
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

# Answers a device would store. Groups are flattened; the repeat stays a list.
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
    "q_calculate": "45.5",
    "deviceid": "354450115013285",
    "subscriberid": "608015139845644",
    "simserial": "8922101051398456440",
    "phonenumber": "+32470123456",
    "household_count": "2",
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
}

PARENT_TYPES = {"group", "repeat", "survey"}


def index_questions(node, path=""):
    indexed = {}
    for child in node.get("children") or []:
        if child.get("type") == "option":
            continue
        here = f"{path}/{child['name']}" if path else child["name"]
        indexed[here] = child["type"]
        if child.get("type") in PARENT_TYPES:
            indexed.update(index_questions(child, here))
    return indexed


def find_question(node, name):
    for child in node.get("children") or []:
        if child.get("name") == name:
            return child
        found = find_question(child, name)
        if found is not None:
            return found
    return None


def empty_rendered_fields(descriptor, data):
    """Names the submission view would render with no value. Notes and meta are skipped."""
    missing = []

    def walk(node, node_data):
        for child in node.get("children") or []:
            name = child.get("name")
            child_type = child.get("type")
            if name == "meta" or child_type == "note":
                continue
            if child_type == "group":
                walk(child, node_data)
            elif child_type == "repeat":
                iterations = node_data.get(name)
                if not isinstance(iterations, list) or not iterations:
                    missing.append(name)
                else:
                    for iteration in iterations:
                        walk(child, iteration)
            elif node_data.get(name) in (None, ""):
                missing.append(name)

    walk(descriptor, data)
    return missing


def submission_xml(version_id):
    answers = EXPECTED_ANSWERS
    return f"""<?xml version='1.0' ?>
<data id="{FORM_ID_STRING}" version="{version_id}">
  <g_scalars>
    <q_integer>{answers["q_integer"]}</q_integer>
    <q_decimal>{answers["q_decimal"]}</q_decimal>
    <q_range>{answers["q_range"]}</q_range>
    <q_text>{answers["q_text"]}</q_text>
    <q_barcode>{answers["q_barcode"]}</q_barcode>
    <q_date>{answers["q_date"]}</q_date>
    <q_time>{answers["q_time"]}</q_time>
    <q_datetime>{answers["q_datetime"]}</q_datetime>
    <q_geopoint>{answers["q_geopoint"]}</q_geopoint>
    <q_geotrace>{answers["q_geotrace"]}</q_geotrace>
    <q_geoshape>{answers["q_geoshape"]}</q_geoshape>
    <q_start>{answers["q_start"]}</q_start>
    <q_end>{answers["q_end"]}</q_end>
    <q_acknowledge>{answers["q_acknowledge"]}</q_acknowledge>
  </g_scalars>
  <g_selects>
    <q_select_one_underscore>{answers["q_select_one_underscore"]}</q_select_one_underscore>
    <q_select_one_space>{answers["q_select_one_space"]}</q_select_one_space>
    <q_select_multiple_underscore>{answers["q_select_multiple_underscore"]}</q_select_multiple_underscore>
    <q_select_all_that_apply>{answers["q_select_all_that_apply"]}</q_select_all_that_apply>
    <q_rank>{answers["q_rank"]}</q_rank>
  </g_selects>
  <g_media>
    <q_image>{answers["q_image"]}</q_image>
    <q_photo>{answers["q_photo"]}</q_photo>
    <q_audio>{answers["q_audio"]}</q_audio>
    <q_video>{answers["q_video"]}</q_video>
    <q_file>{answers["q_file"]}</q_file>
  </g_media>
  <g_special>
    <q_calculate>{answers["q_calculate"]}</q_calculate>
    <deviceid>{answers["deviceid"]}</deviceid>
    <subscriberid>{answers["subscriberid"]}</subscriberid>
    <simserial>{answers["simserial"]}</simserial>
    <phonenumber>{answers["phonenumber"]}</phonenumber>
  </g_special>
  <household_count>{answers["household_count"]}</household_count>
  <household>
    <member_name>Ada</member_name>
    <member_age>7</member_age>
  </household>
  <household>
    <member_name>Grace</member_name>
    <member_age>8</member_age>
  </household>
  <meta><instanceID>uuid:3c185364-e5dc-4912-98b2-e9aeb23049f5</instanceID></meta>
</data>
""".encode()


def mobile_zip(form_pk, org_unit_pk, version_id):
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
        archive.writestr(f"{instance_uuid}/{xml_name}", submission_xml(version_id))
        for name, content in MEDIA_FILES.items():
            archive.writestr(f"{instance_uuid}/{name}", content)
    buffer.seek(0)
    return buffer


class FieldTypeRenderCheckChainTest(APITestCase):
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

    def test_form_version_mobile_zip_and_submission_detail(self):
        self.client.force_authenticate(self.user)

        with open(XLS_PATH, "rb") as xls_file:
            version_response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form.id, "xls_file": xls_file},
                format="multipart",
            )
        self.assertEqual(version_response.status_code, status.HTTP_201_CREATED, version_response.content)
        version_id = version_response.json()["version_id"]
        self.assertEqual(version_id, "2026102306")

        self.form.refresh_from_db()
        self.assertEqual(self.form.form_id, FORM_ID_STRING)
        form_version = self.form.form_versions.get()
        self.assertEqual(form_version.version_id, version_id)
        descriptor = form_version.get_or_save_form_descriptor()
        self.assertEqual(index_questions(descriptor), EXPECTED_TYPES)
        for select_name in (
            "q_select_one_underscore",
            "q_select_one_space",
            "q_select_multiple_underscore",
            "q_select_all_that_apply",
            "q_rank",
        ):
            choice_names = {child["name"] for child in find_question(descriptor, select_name)["children"]}
            self.assertEqual(choice_names, {"red", "green", "blue"})

        form_xml = form_version.file.read().decode()
        self.assertNotIn("<recordaudio", form_xml)
        self.assertNotIn("jr://file", form_xml)

        zip_buffer = mobile_zip(self.form.id, self.org_unit.id, version_id)
        upload_response = self.client.post(
            f"/api/mobile/bulkupload/?app_id={APP_ID}",
            {"zip_file": SimpleUploadedFile("field-type-render-check.zip", zip_buffer.read())},
            format="multipart",
        )
        self.assertEqual(upload_response.status_code, status.HTTP_204_NO_CONTENT, upload_response.content)

        task = m.Task.objects.get(name="process_mobile_bulk_upload")
        TestTaskService().run_all()
        task.refresh_from_db()
        api_import = APIImport.objects.get()
        self.assertEqual(task.status, m.SUCCESS, api_import.exception)

        instance = m.Instance.objects.get()
        self.assertEqual(instance.form_id, self.form.id)
        self.assertEqual(instance.org_unit_id, self.org_unit.id)
        self.assertEqual(instance.project_id, self.project.id)
        self.assertEqual(instance.form_version_id, form_version.id)
        self.assertEqual(instance.instancefile_set.count(), len(MEDIA_FILES))

        detail_response = self.client.get(f"/api/instances/{instance.id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK, detail_response.content)
        detail = detail_response.json()

        self.assertEqual(detail["form_name"], self.form.name)
        self.assertEqual(detail["org_unit"]["name"], self.org_unit.name)
        self.assertEqual(detail["form_descriptor"], descriptor)
        file_content = detail["file_content"]
        for name, value in EXPECTED_ANSWERS.items():
            self.assertEqual(file_content[name], value, name)
        self.assertEqual(
            file_content["household"],
            [
                {"member_name": "Ada", "member_age": "7"},
                {"member_name": "Grace", "member_age": "8"},
            ],
        )
        self.assertEqual(file_content["_version"], version_id)
        self.assertEqual(file_content["instanceID"], "uuid:3c185364-e5dc-4912-98b2-e9aeb23049f5")
        self.assertEqual(empty_rendered_fields(detail["form_descriptor"], file_content), [])

        file_urls = detail["files"]
        for filename in MEDIA_FILES:
            self.assertTrue(any(filename in url for url in file_urls), file_urls)
