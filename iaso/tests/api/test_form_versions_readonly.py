import tempfile
import typing
from unittest import mock

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings
from django.contrib.auth.models import AnonymousUser


from iaso import models as m
from iaso.models.org_unit import OrgUnitType
from iaso.models.project import Project
from iaso.test import APITestCase

BASE_URL = "/api/formversions/"


def create_add_form(f_name: str, o_unit_type: OrgUnitType, add_to_project: Project):
    the_form = m.Form.objects.create(
        name=f_name,
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

    add_to_project.forms.add(the_form)
    add_to_project.save()

    return the_form


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ReadOnlyFormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        blue_account = m.Account.objects.create(name="Blue Account")
        red_account = m.Account.objects.create(name="Red Account")

        blue_source = m.DataSource.objects.create(name="Blue Source")
        blue_source_version = m.SourceVersion.objects.create(data_source=blue_source, number=1)
        blue_source.default_version = blue_source_version
        blue_source.save()

        cls.anon = AnonymousUser()

        cls.blue_with_perms = cls.create_user_with_profile(
            username="blue_with_perms", account=blue_account, permissions=["iaso_forms"]
        )
        cls.red_with_perms = cls.create_user_with_profile(
            username="red_with_perms", account=red_account, permissions=["iaso_forms"]
        )
        cls.red_no_perms = cls.create_user_with_profile(username="red_no_perms", account=red_account)

        cls.blue_council = m.OrgUnitType.objects.create(name="Blue Council", short_name="BC1")

        cls.blue_project_need_auth = m.Project.objects.create(
            name="Blue Project Needs Auth",
            app_id="blue.project_need_auth",
            account=blue_account,
            needs_authentication=True,
        )
        cls.blue_project_need_auth.unit_types.add(cls.blue_council)

        cls.blue_project_no_need_auth = m.Project.objects.create(
            name="Blue Project No Needs Auth",
            app_id="blue.project_no_need_auth",
            account=blue_account,
            needs_authentication=False,
        )

        cls.blue_project_no_need_auth.unit_types.add(cls.blue_council)
        cls.blue_project_no_need_auth.save()

        cls.form_need_auth = create_add_form("Form need_auth", cls.blue_council, cls.blue_project_need_auth)
        cls.form_no_need_auth = create_add_form("Form no_need_auth", cls.blue_council, cls.blue_project_no_need_auth)

    def test_form_versions_list_without_auth(self):
        """GET /mobile/formversions/: without auth should return no versions"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        assert response_data["form_versions"] == []

    def test_form_versions_list_without_auth_with_appid(self):
        """GET /mobile/formversions/: without auth but with app_id should return the version of the form which allow access without auth"""

        response = self.client.get(f"{BASE_URL}?app_id={self.blue_project_no_need_auth.app_id}")
        self.assertJSONResponse(response, 200)
        form_versions_data = response.json()["form_versions"]

        assert len(form_versions_data) == 1

        for form_version_data in form_versions_data:
            self.assertValidFormVersionData(form_version_data)
            self.assertNotIn("descriptor", form_version_data)

    def test_form_versions_list_wrong_permission(self):
        """GET /mobile/formversions/: without the right permission should return no versions"""

        self.client.force_authenticate(self.red_no_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        assert response_data["form_versions"] == []

    def test_form_versions_list(self):
        """GET /mobile/formversions/: allowed"""

        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        form_versions_data = response.json()["form_versions"]

        assert len(form_versions_data) == 2

        for form_version_data in form_versions_data:
            self.assertValidFormVersionData(form_version_data)
            self.assertNotIn("descriptor", form_version_data)

    def test_form_need_auth(self):
        """This form is linked to a project needs authentication"""

        self.client.force_authenticate(self.blue_with_perms)

        # it should work both with and without app_id for this project as the user is authenticated and has the right
        response_1 = self.client.get(f"{BASE_URL}{self.form_need_auth.latest_version.id}/")
        response_2 = self.client.get(
            f"{BASE_URL}{self.form_need_auth.latest_version.id}/?app_id={self.blue_project_need_auth.app_id}"
        )

        self.assertJSONResponse(response_1, 200)
        self.assertJSONResponse(response_2, 200)

        self.assertValidFormVersionData(response_1.json())
        self.assertValidFormVersionData(response_2.json())

    def test_form_need_auth_should_fail(self):
        self.client.force_authenticate(self.anon)
        response_3 = self.client.get(f"{BASE_URL}{self.form_need_auth.latest_version.id}/")
        response_4 = self.client.get(
            f"{BASE_URL}{self.form_need_auth.latest_version.id}/?app_id={self.blue_project_need_auth.app_id}"
        )

        # Should fail in both cases as the project needs authentication and the user is not authenticated
        self.assertJSONResponse(response_3, 404)
        self.assertJSONResponse(response_4, 403)

    def test_form_no_need_auth(self):
        self.client.force_authenticate(self.blue_with_perms)
        response = self.client.get(
            f"{BASE_URL}{self.form_no_need_auth.latest_version.id}/"
        )  # should work without app id as the user is authenticated

        self.assertJSONResponse(response, 200)
        self.assertValidFormVersionData(response.json())

    def test_form_no_need_auth_should_fail_without_app_id(self):
        self.client.force_authenticate(self.anon)
        response_1 = self.client.get(
            f"{BASE_URL}{self.form_no_need_auth.latest_version.id}/"
        )  # should fail without app id
        self.assertJSONResponse(response_1, 404)

        response_2 = self.client.get(
            f"{BASE_URL}{self.form_no_need_auth.latest_version.id}/?app_id={self.blue_project_no_need_auth.app_id}"
        )  # should work with app id
        self.assertJSONResponse(response_2, 200)
        self.assertValidFormVersionData(response_2.json())

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
