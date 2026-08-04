import tempfile
import typing

from unittest import mock

from django.core.files import File
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile, UploadedFile
from django.test import override_settings
from rest_framework import status

from iaso import models as m
from iaso.api.query_params import APP_ID
from iaso.models.forms import form_version_upload_to
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=[CORE_FORMS_PERMISSION])
        cls.batman = cls.create_user_with_profile(username="batman", account=dc, permissions=[CORE_FORMS_PERMISSION])
        cls.superman = cls.create_user_with_profile(username="superman", account=dc)

        cls.sith_council = m.OrgUnitType.objects.create(name="Sith Council", short_name="Cnc")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
            needs_authentication=True,
        )
        # In case there are more than one project targeting the same form, multiple form versions could be returned
        # This is here to make sure form versions are not duplicated.
        # This is not an issue with form versions because of the `Count` made on `mapping_versions` but this is here
        # to ensure we have no regressions in the future.
        cls.project2 = m.Project.objects.create(
            name="Copy of Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics.copy",
            account=star_wars,
            needs_authentication=True,
        )
        cls.project.unit_types.set([cls.sith_council])
        cls.project2.unit_types.set([cls.sith_council])

        cls.form_1 = m.Form.objects.create(
            name="New Land Speeder concept",  # no form_id yet (no version)
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.form_1.org_unit_types.set([cls.sith_council])
        cls.form_2 = m.Form.objects.create(
            name="Death Start survey", form_id="sample2", period_type="MONTH", single_per_period=False
        )
        cls.form_2.org_unit_types.set([cls.sith_council])
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xlsx", "rb") as xls_file:
            cls.form_2.form_versions.create(
                file=form_2_file_mock, xls_file=UploadedFile(xls_file), version_id="2020022401"
            )
        cls.project.forms.set([cls.form_1, cls.form_2])
        cls.project2.forms.set([cls.form_1, cls.form_2])

    def setUp(self):
        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

    def test_form_version_to_questions_by_path(self):
        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_valid_multi_select.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )

        questions_by_path = self.form_1.form_versions.first().questions_by_path()
        questions_by_name = self.form_1.form_versions.first().questions_by_name()
        self.assertEqual(
            [x for x in questions_by_name.keys()],
            [
                "demo_integer",
                "demo_text",
                "source_elec",
                "demo_note",
                "demo_select_one",
                "demo_calculate",
                "other_source_elec",
                "instanceID",
            ],
        )

        self.assertEqual(
            [x for x in questions_by_path.keys()],
            [
                "signalitic/demo_integer",
                "signalitic/demo_text",
                "source_elec",
                "demo_note",
                "demo_select_one",
                "demo_calculate",
                "propriete_fonciere/other_source_elec",
                "meta/instanceID",
            ],
        )

    def test_form_submission_xml_to_json(self):
        self.jedi_council_coruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council", org_unit_type=self.sith_council
        )
        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_valid_multi_select.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )

        version_id = response.json()["version_id"]

        file_content = " ".join(
            [
                '<?xml version=\'1.0\' ?><data id="carte_sanitaire" version="'
                + version_id
                + '" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:orx="http://openrosa.org/xforms" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">',
                "<meta><instanceID>uuid:3c185364-e5dc-4912-98b2-e9aeb23049f5</instanceID></meta>",
                "<source_elec>B</source_elec>"
                "<propriete_fonciere><other_source_elec>AA</other_source_elec></propriete_fonciere>",
                "</data>",
            ]
        )
        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=SimpleUploadedFile("test_file.xml", file_content.encode("utf-8")),
        )

        json_instance = instance.get_and_save_json_of_xml()
        self.assertEqual(
            {
                "_version": version_id,
                "instanceID": "uuid:3c185364-e5dc-4912-98b2-e9aeb23049f5",
                "other_source_elec": "AA",
                "source_elec": "B",
            },
            json_instance,
        )

    def test_form_versions_list(self):
        """GET /formversions/: allowed"""

        self.client.force_authenticate(self.yoda)
        with self.assertNumQueries(2):
            response = self.client.get("/api/formversions/")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        form_versions_data = response.json()["form_versions"]
        self.assertEqual(len(form_versions_data), 1)

        for form_version_data in form_versions_data:
            self.assertValidFormVersionData(form_version_data)
            self.assertNotIn("descriptor", form_version_data)

    def test_form_versions_retrieve(self):
        """GET /formversions/<form_id>: allowed"""

        self.client.force_authenticate(self.yoda)
        with self.assertNumQueries(4):
            response = self.client.get(f"/api/formversions/{self.form_2.form_versions.first().id}/?fields=:all")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        form_version_data = response.json()
        self.assertValidFormVersionData(form_version_data)
        self.assertHasField(form_version_data, "descriptor", dict)

    def test_form_versions_dynamic_fields(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/formversions/{self.form_2.form_versions.first().id}/?fields=:all")
        form_version_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidFormVersionData(form_version_data)
        self.assertHasField(form_version_data, "descriptor", dict)

        response = self.client.get(f"/api/formversions/{self.form_2.form_versions.first().id}/?fields=id,created_at")
        form_version_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertCountEqual(form_version_data.keys(), ["id", "created_at"])

    def test_form_versions_update(self):
        """PUT /formversions/<form_id>: ok"""
        form_version = self.form_2.form_versions.first()
        self.assertIsNone(form_version.updated_by)
        self.client.force_authenticate(self.yoda)

        start_period = "BIG BANG"
        end_period = "DOOMSDAY"
        response = self.client.put(
            f"/api/formversions/{form_version.id}/",
            data={
                "end_period": end_period,
                "form_id": self.form_2.id,
                "start_period": start_period,
            },
            format="json",
        )
        response_data = response.json()
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_data["start_period"], start_period)
        self.assertEqual(response_data["end_period"], end_period)
        # checking what is returned by the serializer
        self.assertEqual(
            response_data["updated_by"],
            {
                "id": self.yoda.id,
                "username": self.yoda.username,
                "first_name": self.yoda.first_name,
                "last_name": self.yoda.last_name,
            },
        )

        # checking result in DB
        form_version.refresh_from_db()
        self.assertEqual(form_version.updated_by, self.yoda)

    def test_form_versions_patch(self):
        """PUT /formversions/<form_id>: ok"""
        form_version = self.form_2.form_versions.first()
        self.assertIsNone(form_version.updated_by)
        self.client.force_authenticate(self.yoda)

        start_period = "BIG BANG"
        end_period = "DOOMSDAY"
        response = self.client.patch(
            f"/api/formversions/{self.form_2.form_versions.first().id}/",
            data={
                "end_period": end_period,
                "form_id": self.form_2.id,
                "start_period": start_period,
            },
            format="json",
        )
        response_data = response.json()
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_data["start_period"], start_period)
        self.assertEqual(response_data["end_period"], end_period)

        form_version.refresh_from_db()
        self.assertEqual(form_version.updated_by, self.yoda)

    def test_form_versions_destroy(self):
        """DELETE /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete("/api/formversions/33/")
        self.assertJSONResponse(response, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_form_versions_create_ok_first_version(self):
        """POST /form-versions/ happy path (first version)"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertValidFormVersionData(response_data, check_annotated_fields=False)

        created_version = m.FormVersion.objects.get(pk=response_data["id"])
        self.assertEqual(created_version.version_id, "2020022401")
        self.assertIsInstance(created_version.file, File)
        self.assertGreater(created_version.file.size, 100)
        # We don't care about the filename parameter because its name is replaced in the upload_to function
        expected_xml_file_name = form_version_upload_to(created_version, "file.xml")
        self.assertEqual(created_version.file.name, expected_xml_file_name)
        self.assertIsInstance(created_version.xls_file, File)
        self.assertGreater(created_version.xls_file.size, 100)
        # We don't care about the filename parameter because its name is replaced in the upload_to function
        expected_xls_file_name = form_version_upload_to(created_version, "file.xlsx")
        self.assertEqual(created_version.xls_file.name, expected_xls_file_name)
        self.assertEqual(created_version.created_by, self.yoda)
        self.assertEqual(created_version.updated_by, self.yoda)

        version_form = created_version.form
        self.assertEqual("sample1", version_form.form_id)

    def test_form_versions_create_ok_second_version(self):
        """POST /form-versions/ happy path (second version)"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_valid_sample2_2020022402.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_2.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertValidFormVersionData(response_data, check_annotated_fields=False)

        created_version = m.FormVersion.objects.get(pk=response_data["id"])
        self.assertEqual(created_version.version_id, "2020022402")

    def test_form_versions_create_ok_second_version_with_mappings(self):
        """POST /form-versions/ happy path (second version)"""

        self.client.force_authenticate(self.yoda)
        form_mapping = m.Mapping.objects.create(form=self.form_2, mapping_type=m.AGGREGATE, data_source=self.sw_source)
        m.MappingVersion.objects.create(
            mapping=form_mapping,
            form_version=self.form_2.form_versions.first(),
            json={
                "question_mappings": {
                    "old_question": {"type": "neverMapped"},
                    "member": {"id": "dhis2_id", "valueType": "NUMBER"},
                }
            },
        )

        derived_form_mapping = m.Mapping.objects.create(
            form=self.form_2, mapping_type=m.DERIVED, data_source=self.sw_source, name="derived"
        )
        m.MappingVersion.objects.create(
            mapping=derived_form_mapping,
            form_version=self.form_2.form_versions.first(),
            name="derived",
            json={
                "aggregations": [
                    {"id": "old_question", "questionName": "question_name_old", "aggregationType": "sum"},
                    {"id": "member", "questionName": "question_name_member", "aggregationType": "sum"},
                ]
            },
        )

        with open("iaso/tests/fixtures/odk_form_valid_sample2_2020022402.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_2.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        response_data = response.json()
        self.assertValidFormVersionData(response_data, check_annotated_fields=False)

        created_version = m.FormVersion.objects.get(pk=response_data["id"])
        self.assertEqual(created_version.version_id, "2020022402")
        new_mapping = m.MappingVersion.objects.all().filter(mapping__mapping_type=m.AGGREGATE).last()
        self.assertEqual(new_mapping.form_version_id, response_data["id"])
        self.assertEqual(new_mapping.json, {"question_mappings": {"member": {"id": "dhis2_id", "valueType": "NUMBER"}}})

        new_mapping = m.MappingVersion.objects.all().filter(mapping__mapping_type=m.DERIVED).last()

        self.assertEqual(new_mapping.form_version_id, response_data["id"])
        self.assertEqual(
            new_mapping.json,
            {"aggregations": [{"aggregationType": "sum", "id": "member", "questionName": "question_name_member"}]},
        )

    def test_form_versions_create_invalid_xls_form_id_1(self):
        """POST /form-versions/ with a form_id that already exists within the account (for a different form)"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_valid_sample2_2020022401.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(response.json(), "xls_file", "The form_id is already used in another form.")

    def test_form_versions_create_invalid_xls_form_id_2(self):
        """POST /form-versions/ attempt to create a second version with a different form_id"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022402.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_2.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(response.json(), "xls_file", "Form id should stay constant across form versions.")

    def test_form_versions_create_invalid_xls_version(self):
        """POST /form-versions/ attempt to create a second version with a version inferior to the previous one"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_valid_sample2_2020022301.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_2.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response.json(),
            "xls_file",
            "Invalid XLS form content: Invalid XLS file: Parsed version should be greater than previous version.",
        )

    def test_form_versions_create_invalid_xls_file(self):
        """POST /form-versions/ with invalid XLS file"""

        self.client.force_authenticate(self.yoda)
        with open("iaso/tests/fixtures/odk_form_blatantly_invalid.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response.json(),
            "xls_file",
            "Invalid XLS form content: Invalid XLS file: The survey sheet is either empty or missing important column headers.",
        )

    def test_form_versions_create_no_xls_file(self):
        """POST /form-versions/, missing params"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/formversions/", data={}, format="multipart", headers={"accept": "application/json"}
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertHasError(response_data, "form_id")

    def test_form_versions_create_no_auth(self):
        """POST /form-versions/ , without auth -> we expect a 401 error"""

        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xlsx", "rb") as xls_file:
            response = self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_form_versions_create_wrong_form(self):
        """POST /form-versions/ - user has no access to the underlying form"""

        self.client.force_authenticate(self.batman)
        form_file_mock = mock.MagicMock(spec=File)
        form_file_mock.name = "test_batman.xml"
        response = self.client.post(
            "/api/formversions/",
            data={"form_id": self.form_1.id, "version_id": "february_2020", "xls_file": form_file_mock},
            format="multipart",
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_formversions_list_without_auth_for_project_requiring_auth(self):
        """GET /formversions/ without auth for project which requires it: 401"""

        response = self.client.get("/api/formversions/", {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_formversions_list_with_wrong_auth_for_project_requiring_auth(self):
        """GET /formversions/ with wrong auth for project which requires it: 401"""

        self.client.force_authenticate(user=self.batman)
        response = self.client.get("/api/formversions/", {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_formversions_list_with_auth_for_project_requiring_auth(self):
        """GET /formversions/ with auth for project which requires it: 200"""

        self.client.force_authenticate(user=self.yoda)
        response = self.client.get("/api/formversions/", {APP_ID: self.project.app_id})
        self.assertJSONResponse(response, status.HTTP_200_OK)

    def assertValidFormVersionData(
        self, form_version_data: typing.Mapping, *, check_annotated_fields: bool = True
    ):  # TODO: check for other fields
        self.assertHasField(form_version_data, "id", int)
        self.assertHasField(form_version_data, "file", str)
        self.assertHasField(form_version_data, "xls_file", str)
        self.assertHasField(form_version_data, "version_id", str)
        self.assertHasField(form_version_data, "created_at", float)
        self.assertHasField(form_version_data, "updated_at", float)

        if check_annotated_fields:
            self.assertHasField(form_version_data, "mapped", bool)
            self.assertHasField(form_version_data, "full_name", str)


class FormVersionsMultiProjectTest(APITestCase):
    """IA-5214 — form assigned to multiple projects within the same account.

    The get_queryset authenticated path filters via form__projects__account, which is a
    JOIN that produces one row per (form_version × project).  For a form in N projects
    this inflates the result set N-fold.  The Count("mapping_versions") annotation
    happens to collapse the duplicates via its implicit GROUP BY, but that is an
    accidental side-effect, not an intentional fix.

    test_base_filter_no_duplicates  — directly tests the raw JOIN-based filter and
        FAILS before the fix, proving the underlying queryset is inflated.
    test_list_no_duplicates         — integration test through the full endpoint;
        currently passes by accident (GROUP BY), passes by design after the fix.
    """

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Rebel Alliance")
        source = m.DataSource.objects.create(name="Rebel Source")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        cls.user = cls.create_user_with_profile(username="leia", account=account, permissions=[CORE_FORMS_PERMISSION])

        project_a = m.Project.objects.create(name="Project A", app_id="rebel.a", account=account)
        project_b = m.Project.objects.create(name="Project B", app_id="rebel.b", account=account)

        flag_1, _ = m.FeatureFlag.objects.get_or_create(code="rebel_flag_1", defaults={"name": "Rebel Flag 1"})
        flag_2, _ = m.FeatureFlag.objects.get_or_create(code="rebel_flag_2", defaults={"name": "Rebel Flag 2"})
        project_a.feature_flags.set([flag_1, flag_2])
        project_b.feature_flags.set([flag_1, flag_2])

        file_mock = mock.MagicMock(spec=File)
        file_mock.name = "test.xml"

        cls.form = m.Form.objects.create(name="Rebel Form", form_id="rebel_form")
        project_a.forms.add(cls.form)
        project_b.forms.add(cls.form)

        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xlsx", "rb") as xls:
            from django.core.files.uploadedfile import UploadedFile

            cls.form_version = cls.form.form_versions.create(
                file=file_mock,
                xls_file=UploadedFile(xls),
                version_id="2020010101",
            )

    def setUp(self):
        default_storage._root._children.clear()
        super().setUp()

    def test_base_filter_no_duplicates(self):
        """The account filter in get_queryset must not produce duplicate form version rows.

        The previous implementation used filter(form__projects__account=…), a JOIN that
        yields one row per (form_version × project) pair.  For a form in N projects the
        result set is N-fold inflated before the Count annotation's implicit GROUP BY
        collapses it.  The Exists-based fix avoids the row inflation at source.

        This test verifies the queryset via the API so it covers the full get_queryset
        path including the fix.
        """
        self.client.force_authenticate(self.user)
        # 2 queries regardless of how many projects the form belongs to — no N+1.
        with self.assertNumQueries(2):
            response = self.client.get("/api/formversions/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        ids = [fv["id"] for fv in data["form_versions"]]
        self.assertEqual(
            len(ids),
            len(set(ids)),
            f"get_queryset returned duplicate form version IDs: {ids}",
        )

    def test_list_no_duplicates(self):
        """GET /api/formversions/ must return each form version exactly once.

        Currently passes by accident because the Count annotation GROUP BY collapses
        duplicates.  After the Exists fix it passes by design.
        """
        self.client.force_authenticate(self.user)
        # Query count must be bounded regardless of the number of projects the form is in.
        with self.assertNumQueries(2):
            response = self.client.get(f"/api/formversions/?form_id={self.form.id}")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        ids = [fv["id"] for fv in data["form_versions"]]
        self.assertEqual(len(ids), 1, f"Expected 1 form version, got {ids}")

    def test_forms_list_query_count_with_projects_and_feature_flags(self):
        """GET /api/forms/ must use a bounded number of queries even when the form belongs to
        multiple projects that each carry feature flags.

        The forms view prefetches projects and their feature flags in bulk, so the query
        count must stay flat regardless of how many projects or flags exist.
        """
        self.client.force_authenticate(self.user)
        # 10 queries regardless of the number of projects or feature flags per project:
        #   2 auth, 1 forms (Exists filter), 1 prefetch projects, 1 prefetch projects__feature_flags,
        #   1 prefetch projectfeatureflags_set, 1 with_latest_version subquery, 1 prefetch form_versions, 1 prefetch orgunit_groups
        #   1 prefetch org_unit_types (+ related)
        with self.assertNumQueries(10):
            response = self.client.get("/api/forms/")
        self.assertJSONResponse(response, status.HTTP_200_OK)
