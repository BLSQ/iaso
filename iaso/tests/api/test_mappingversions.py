import typing
import tempfile
from django.test import tag
from django.core.files import File
from django.test import override_settings
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        cls.sw_source = sw_source

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.batman = cls.create_user_with_profile(username="batman", account=dc)

        cls.sith_council = m.OrgUnitType.objects.create(
            name="Sith Council", short_name="Cnc"
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )
        cls.project.unit_types.add(cls.sith_council)

        cls.form_1 = m.Form.objects.create(
            name="New Land Speeder concept",  # no form_id yet (no version)
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.form_1.org_unit_types.add(cls.sith_council)
        cls.form_1.save()
        cls.project.forms.add(cls.form_1)
        cls.project.save()

        cls.form_2 = m.Form.objects.create(
            name="Death Start survey",
            form_id="sample2",
            period_type="MONTH",
            single_per_period=False,
        )
        cls.form_2.org_unit_types.add(cls.sith_council)
        cls.form_1.save()
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.project.forms.add(cls.form_2)

        cls.project.save()

    @tag("iaso_only")
    def test_mappingversions_update(self):
        """PUT /mappingversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/formversions/33/", data={})
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_mappingversions_destroy(self):
        """DELETE /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/formversions/33/")
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_mappingversions_create_ok_first_version(self):
        """POST /mappingversions/ happy path (first version)"""

        self.client.force_authenticate(self.yoda)
        with open(
            "iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xls", "rb"
        ) as xls_file:
            self.client.post(
                f"/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                HTTP_ACCEPT="application/json",
            )

        formversion = m.FormVersion.objects.all()[0]

        self.client.post(
            f"/api/mappingversions/",
            data={
                "form_version": {"id": formversion.id},
                "mapping": {
                    "type": "AGGREGATE",
                    "datasource": {"id": self.sw_source.id},
                },
            },
            format="json",
            HTTP_ACCEPT="application/json",
        )

        mapping_versions = self.client.get(f"/api/mappingversions/?fields=:all").json()

        self.assertEqual(
            mapping_versions["mapping_versions"][0]["question_mappings"], {}
        )

        mappingversionid = str(mapping_versions["mapping_versions"][0]["id"])
        self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={
                "question_mappings": {
                    "question_1": {
                        "id": "dataelementDHIS2Id",
                        "categoryOptionCombo": "cocDHIS2Id",
                        # optional
                        "name": "dataelement name",
                        "code": "dataelement code",
                    }
                }
            },
            format="json",
            HTTP_ACCEPT="application/json",
        )
        mapping_version = self.client.get(
            f"/api/mappingversions/" + mappingversionid + "/?fields=:all",
            format="json",
            HTTP_ACCEPT="application/json",
        )

        self.assertEqual(
            mapping_version.json()["question_mappings"]["question_1"],
            {
                "id": "dataelementDHIS2Id",
                "categoryOptionCombo": "cocDHIS2Id",
                # optional
                "name": "dataelement name",
                "code": "dataelement code",
            },
        )
