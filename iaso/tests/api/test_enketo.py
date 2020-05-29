import typing
from django.test import tag
from django.core.files.uploadedfile import UploadedFile
from iaso.test import APITestCase
from iaso import models as m
from django.contrib.gis.geos import Point
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from hat.audit.models import Modification

import responses


class EnketoAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_forms"]
        )

        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Corruscant Jedi Council"
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study",
            form_id="hydro_1",
            period_type=m.MONTH,
            single_per_period=True,
        )

        cls.form_version_1 = m.FormVersion.objects.create(
            form=cls.form_1,
            version_id="1",
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml")),
        )

        cls.create_form_instance(
            form=cls.form_1,
            period="202001",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
            uuid="uuid-1",
        )

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.save()
        cls.maxDiff = None

    @tag("iaso_only")
    def test_when_anonymous_edit_url_permission_denied_(self):
        """GET /api/enketo/edit/{uuid}/"""
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/enketo/edit/{instance.uuid}/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_when_anonymous_head_submission_should_work(self):
        instance = self.form_1.instances.first()
        response = self.client.head(f"/api/enketo/submission")

        self.assertXmlResponse(response, 204)
        self.assertEqual("100000000", response.get("x-openrosa-accept-content-length"))

    @tag("iaso_only")
    def test_when_anonymous_get_formList_should_work(self):
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/enketo/formList?formID={self.form_1.form_id}")
        self.assertXmlResponse(response, 200)
        expected_list = "".join(
            [
                '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
                "<xform>",
                "<formID>hydro_1</formID>",
                "<name>Hydroponics study</name>",
                "<version>1</version>",
                "<hash>md5:0803e94efbd5e88e444dffa60c015931</hash>",
                "<descriptionText>Hydroponics study</descriptionText>",
                f"<downloadUrl>http://testserver{self.form_version_1.file.url}</downloadUrl>",
                "</xform>",
                "</xforms>",
            ]
        )
        self.assertEquals(response.content.decode("utf-8"), expected_list)

    @tag("iaso_only")
    def test_when_anonymous_get_formList_should_work(self):

        with open("iaso/tests/fixtures/hydroponics_test_upload.xml") as modified_xml:
            original_instance = self.form_1.instances.first()
            original_instance.file = SimpleUploadedFile(
                "file.txt", modified_xml.read().encode()
            )
            original_instance.get_and_save_json_of_xml()

        with open(
            "iaso/tests/fixtures/hydroponics_test_upload_modified.xml"
        ) as modified_xml:
            f = SimpleUploadedFile(
                "file.txt",
                modified_xml.read()
                .replace("REPLACEuserID", str(self.yoda.id))
                .encode(),
            )
            response = self.client.post(
                f"/api/enketo/submission",
                {"name": "xml_submission_file", "xml_submission_file": f},
            )

            instance = self.form_1.instances.first()

            # assert audit log works
            modification = Modification.objects.last()

            self.assertEqual(self.yoda, modification.user)
            self.assertEqual(
                "0",
                modification.past_value[0]["fields"]["json"]["Ident_type_serv_medical"],
            )
            self.assertEqual(
                "1",
                modification.new_value[0]["fields"]["json"]["Ident_type_serv_medical"],
            )

            self.assertEqual(instance, modification.content_object)

    def assertXmlResponse(self, response, expected_status_code):
        self.assertEqual(expected_status_code, response.status_code)
        if expected_status_code != 204:
            self.assertEqual("application/xml", response["Content-Type"])
