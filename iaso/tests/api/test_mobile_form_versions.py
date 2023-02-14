import tempfile
import typing
from unittest import mock

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings

from iaso import models as m
from iaso.test import APITestCase

BASE_URL = "/api/mobile/formversions/"


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class MobileFormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])
        cls.batman = cls.create_user_with_profile(username="batman", account=dc, permissions=["iaso_forms"])
        cls.superman = cls.create_user_with_profile(username="superman", account=dc)

        cls.sith_council = m.OrgUnitType.objects.create(name="Sith Council", short_name="Cnc")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
            needs_authentication=True,
        )
        cls.project.unit_types.add(cls.sith_council)
        cls.form_1 = m.Form.objects.create(
            name="New Land Speeder concept",  # no form_id yet (no version)
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.form_1.org_unit_types.add(cls.sith_council)
        cls.form_1.save()
        form_1_file_mock = mock.MagicMock(spec=File)
        form_1_file_mock.name = "test.xml"
        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xls", "rb") as xls_file:
            cls.form_1.form_versions.create(
                file=form_1_file_mock, xls_file=UploadedFile(xls_file), version_id="2020022401"
            )

        cls.form_1.save()

        cls.project.forms.add(cls.form_1)
        cls.project.save()

        cls.project_no_read_only = m.Project.objects.create(
            name="Hydroponic gardens No RO", app_id="stars.empire.agriculture.hydroponics_noro", account=star_wars
        )

        cls.project_no_read_only.unit_types.add(cls.sith_council)
        cls.project_no_read_only.feature_flags.add(m.FeatureFlag.objects.get(code="FORM_VERSIONS_NO_READ_ONLY"))

        cls.form_2 = m.Form.objects.create(
            name="Death Start survey", form_id="sample2", period_type="MONTH", single_per_period=False
        )
        cls.form_2.org_unit_types.add(cls.sith_council)

        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xls", "rb") as xls_file:
            cls.form_2.form_versions.create(
                file=form_2_file_mock, xls_file=UploadedFile(xls_file), version_id="2020022401"
            )

        cls.project_no_read_only.forms.add(cls.form_2)
        cls.project_no_read_only.save()

    def test_form_versions_list_without_auth(self):
        """GET /mobile/formversions/: without auth: 403"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 403)

    def test_form_versions_list_wrong_permission(self):
        """GET /mobile/formversions/: with auth but without the iaso_forms permission"""

        self.client.force_authenticate(self.superman)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 403)

    def test_form_versions_list(self):
        """GET /mobile/formversions/: allowed"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        form_versions_data = response.json()["form_versions"]

        for form_version_data in form_versions_data:
            self.assertValidFormVersionData(form_version_data)
            self.assertNotIn("descriptor", form_version_data)

    def test_form_versions_retrieve_ok_user_in_account(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which allow read only: ok"""

        self.client.force_authenticate(self.yoda)  # anyone should be able to read a form version
        response = self.client.get(
            f"{BASE_URL}{self.form_1.form_versions.first().id}/?fields=:all&app_id=stars.empire.agriculture.hydroponics"
        )
        self.assertJSONResponse(response, 200)
        form_version_data = response.json()
        self.assertValidFormVersionData(form_version_data)
        self.assertHasField(form_version_data, "descriptor", dict)

    def test_form_versions_retrieve_not_ok_no_appid(self):
        """GET /mobile/formversions/<form_id> No app id is provided"""

        self.client.force_authenticate(self.superman)
        response = self.client.get(f"{BASE_URL}{self.form_1.form_versions.first().id}/?fields=:all")
        self.assertJSONResponse(response, 403)

    def test_form_versions_retrieve_not_ok_project_has_noro_feature_flag(self):
        """GET /mobile/formversions/<form_id> This form is linked to a project which doesn't allow read only: ok"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"{BASE_URL}{self.form_2.form_versions.first().id}/?fields=:allapp_id=stars.empire.agriculture.hydroponics_noro"
        )
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
