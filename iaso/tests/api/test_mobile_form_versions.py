import tempfile
import typing
from unittest import mock

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings

from iaso import models as m
from iaso.test import APITestCase

BASE_URL = "/api/mobile/formversions/"


def create_add_form(f_name, o_unit_type, add_to_project):
    the_form = m.Form.objects.create(
        name="f_name",  # no form_id yet (no version)
        period_type="QUARTER",
        single_per_period=True,
    )
    the_form.org_unit_types.add(o_unit_type)
    the_form.save()

    form_1_file_mock = mock.MagicMock(spec=File)
    form_1_file_mock.name = "test.xml"
    with open("iaso/tests/fixtures/odk_form_valid_no_settings.xls", "rb") as xls_file:
        the_form.form_versions.create(file=form_1_file_mock, xls_file=UploadedFile(xls_file), version_id="2020022401")

    the_form.save()

    add_to_project.add(the_form)
    add_to_project.save()

    return the_form


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class MobileFormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        blue_account = m.Account.objects.create(name="Blue Account")
        red_account = m.Account.objects.create(name="Red Account")

        blue_source = m.DataSource.objects.create(name="Blue Source")
        blue_source_version = m.SourceVersion.objects.create(data_source=blue_source, number=1)
        blue_source.default_version = blue_source_version
        blue_source.save()

        cls.blue_with_perms = cls.create_user_with_profile(
            username="blue_with_perms", account=blue_account, permissions=["iaso_forms"]
        )
        cls.red_with_perms = cls.create_user_with_profile(
            username="red_with_perms", account=red_account, permissions=["iaso_forms"]
        )
        cls.red_no_perms = cls.create_user_with_profile(username="red_no_perms", account=red_account)

        cls.blue_council = m.OrgUnitType.objects.create(name="Blue Council", short_name="BC1")

        cls.blue_project_need_auth_allow_ro = m.Project.objects.create(
            name="Blue Project Needs Auth Allow RO",
            app_id="blue.project_need_auth_allow_ro",
            account=blue_account,
            needs_authentication=True,
        )
        cls.blue_project_need_auth_allow_ro.unit_types.add(cls.blue_council)

        cls.blue_project_need_auth_not_allow_ro = m.Project.objects.create(
            name="Blue Project Needs Auth Not Allow RO",
            app_id="blue.project_need_auth_not_allow_ro",
            account=blue_account,
            needs_authentication=True,
        )

        cls.blue_project_need_auth_not_allow_ro.feature_flags.add(
            m.FeatureFlag.objects.get(code="FORM_VERSIONS_NO_READ_ONLY")
        )
        cls.blue_project_need_auth_not_allow_ro.unit_types.add(cls.blue_council)
        cls.blue_project_need_auth_not_allow_ro.save()

        cls.blue_project_no_need_auth_allow_ro = m.Project.objects.create(
            name="Blue Project  No Needs Auth Allow RO",
            app_id="blue.project_no_need_auth_allow_ro",
            account=blue_account,
            needs_authentication=False,
        )

        cls.blue_project_no_need_auth_allow_ro.unit_types.add(cls.blue_council)
        cls.blue_project_no_need_auth_allow_ro.save()

        cls.blue_project_no_need_auth_not_allow_ro = m.Project.objects.create(
            name="Blue Project  No Needs Auth Allow RO",
            app_id="blue.project_no_need_auth_not_allow_ro",
            account=blue_account,
            needs_authentication=False,
        )

        cls.blue_project_no_need_auth_not_allow_ro.feature_flags.add(
            m.FeatureFlag.objects.get(code="FORM_VERSIONS_NO_READ_ONLY")
        )
        cls.blue_project_no_need_auth_not_allow_ro.unit_types.add(cls.blue_council)
        cls.blue_project_no_need_auth_not_allow_ro.save()

        cls.form_need_auth_allow_ro = create_add_form(
            "Form need_auth_allow_ro", cls.blue_council, cls.blue_project_need_auth_allow_ro
        )
        cls.form_need_auth_not_allow_ro = create_add_form(
            "Form need_auth_not_allow_ro", cls.blue_council, cls.blue_project_need_auth_not_allow_ro
        )
        cls.form_no_need_auth_allow_ro = create_add_form(
            "Form no_need_auth_allow_ro", cls.blue_council, cls.blue_project_no_need_auth_allow_ro
        )
        cls.form_no_need_auth_not_allow_ro = create_add_form(
            "Form no_need_auth_not_allow_ro", cls.blue_council, cls.blue_project_no_need_auth_not_allow_ro
        )

    def test_form_versions_list_without_auth(self):
        """GET /mobile/formversions/: without auth should not be allowed"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 403)

    def test_form_versions_list_wrong_permission(self):
        """GET /mobile/formversions/: without the right permission should not be allowed"""

        self.client.force_authenticate(self.red_no_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 403)

    def test_form_versions_list(self):
        """GET /mobile/formversions/: allowed"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        form_versions_data = response.json()["form_versions"]

        for form_version_data in form_versions_data:
            self.assertValidFormVersionData(form_version_data)
            self.assertNotIn("descriptor", form_version_data)

    def test_form_need_auth_allow_ro(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which allow read only: ok"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(f"{BASE_URL}{self.form_need_auth_allow_ro.id}/")
        self.assertJSONResponse(response, 200)
        form_version_data = response.json()["form_version"]
        self.assertValidFormVersionData(form_version_data)

    def test_form_need_auth_not_allow_ro(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which does not allow read only: 403"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(f"{BASE_URL}{self.form_need_auth_not_allow_ro.id}/")
        self.assertJSONResponse(response, 403)

    def test_form_no_need_auth_allow_ro(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which allow read only: ok"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(f"{BASE_URL}{self.form_no_need_auth_allow_ro.id}/")
        self.assertJSONResponse(response, 200)
        form_version_data = response.json()["form_version"]
        self.assertValidFormVersionData(form_version_data)
        self.assertIn("descriptor", form_version_data)

    def test_form_no_need_auth_not_allow_ro(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which does not allow read only: 403"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(f"{BASE_URL}{self.form_no_need_auth_not_allow_ro.id}/")
        self.assertJSONResponse(response, 403)

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
