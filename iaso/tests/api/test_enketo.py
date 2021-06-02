import typing
import json
import urllib

from django.test import tag
from django.core.files.uploadedfile import UploadedFile
from iaso.test import APITestCase
from iaso import models as m
from django.contrib.gis.geos import Point
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from hat.audit.models import Modification
from django.test import override_settings

import responses

enketo_test_settings = {
    "ENKETO_API_TOKEN": "ENKETO_API_TOKEN_TEST",
    "ENKETO_URL": "https://enketo_url.host.test",
    "ENKETO_API_SURVEY_PATH": "/api_v2/survey",
    "ENKETO_API_INSTANCE_PATH": "/api_v2/instance",
}


class EnketoAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Corruscant Jedi Council")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study", form_id="hydro_1", period_type=m.MONTH, single_per_period=True
        )

        cls.form_version_1 = m.FormVersion.objects.create(
            form=cls.form_1, version_id="1", file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        )

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project, uuid="uuid-1"
        )

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.save()
        cls.maxDiff = None

        with open("iaso/tests/fixtures/hydroponics_test_upload.xml") as modified_xml:
            instance = cls.form_1.instances.first()
            instance.file = SimpleUploadedFile("file.txt", modified_xml.read().encode())
            instance.get_and_save_json_of_xml()

    def test_when_anonymous_edit_url_permission_denied_(self):
        """GET /api/enketo/edit/{uuid}/"""
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/enketo/edit/{instance.uuid}/")
        self.assertJSONResponse(response, 403)

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_when_authenticated_edit_url_and_no_enketo_server_should_return_an_error(
        self,
    ):
        """GET /api/enketo/edit/{uuid}/"""
        instance = self.form_1.instances.first()
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/enketo/edit/{instance.uuid}/")
        resp = response.json()
        self.assertEquals({"error": "Enketo is not available"}, resp)

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_when_authenticated_edit_url_should_return_an_enketo_url(self):
        """GET /api/enketo/edit/{uuid}/"""
        instance = self.form_1.instances.first()
        self.client.force_authenticate(self.yoda)
        enketo_contents = []

        def request_callback(request):
            enketo_contents.append(urllib.parse.unquote(request.body))
            return (200, {}, json.dumps({"edit_url": "https://enketo_url.host.test/something"}))

        responses.add_callback(
            responses.POST,
            "https://enketo_url.host.test/api_v2/instance",
            callback=request_callback,
            content_type="application/json",
        )

        response = self.client.get(f"/api/enketo/edit/{instance.uuid}/")
        resp = response.json()

        self.assertEqual(resp, {"edit_url": "https://enketo_url.host.test/something"})

        self.assertEqual(
            enketo_contents[0],
            f'form_id={instance.uuid}&server_url=http://testserver/api/enketo&instance=<PLAN_INT_CAR_FOSA+xmlns:h="http://www.w3.org/1999/xhtml"+xmlns:jr="http://openrosa.org/javarosa"+xmlns:xsd="http://www.w3.org/2001/XMLSchema"+xmlns:ev="http://www.w3.org/2001/xml-events"+xmlns:orx="http://openrosa.org/xforms"+xmlns:odk="http://www.opendatakit.org/xforms"+id="PLAN_CAR_FOSA"+version="1"+iasoInstance="{instance.id}"><formhub><uuid>385689b3b55f4739b80dcba5540c5f87</uuid></formhub><start>2019-12-02T14:07:52.465+01:00</start><end>2019-12-02T14:10:11.380+01:00</end><today>2019-12-02</today><deviceid>358544083104930</deviceid><subscriberid>206300001285696</subscriberid><imei>358544083104930</imei><simserial>8932030000106638166</simserial><phonenumber/><user_name>Tttt</user_name><region>UnCrC8p12UN</region><prefecture>IJoQdfGfYsC</prefecture><district>tSs16aZvMD4</district><sous-prefecture>drMs7e3pDFZ</sous-prefecture><fosa>FeNjVewpswJ</fosa><year>2019</year><quarter>1</quarter><Ident_type_structure>ce</Ident_type_structure><Ident_type_services>serv_prot</Ident_type_services><Ident_type_serv_medical>0</Ident_type_serv_medical><Ident_type_serv_protect>1</Ident_type_serv_protect><Ident_type_serv_jurid>0</Ident_type_serv_jurid><Ident_type_serv_psycho>0</Ident_type_serv_psycho><Ident_type_serv_educ>0</Ident_type_serv_educ><Ident_type_serv_recope>0</Ident_type_serv_recope><Ident_type_serv_club>0</Ident_type_serv_club><Ident_statut>ong</Ident_statut><Ident_eau_courante>1</Ident_eau_courante><Ident_electricite>0</Ident_electricite><Ident_nom_responsable>Chggh</Ident_nom_responsable><Ident_telephone>256</Ident_telephone><fermeture_structure>sam</fermeture_structure><Ident_ferm_lundi>0</Ident_ferm_lundi><Ident_ferm_mardi>0</Ident_ferm_mardi><Ident_ferm_mercredi>0</Ident_ferm_mercredi><Ident_ferm_jeudi>0</Ident_ferm_jeudi><Ident_ferm_vendredi>0</Ident_ferm_vendredi><Ident_ferm_samedi>1</Ident_ferm_samedi><Ident_ferm_dim>0</Ident_ferm_dim><Ident_ferm_aucun>0</Ident_ferm_aucun><Ident_serv_cout>0</Ident_serv_cout><Ident_type_batiment>sem_dur</Ident_type_batiment><imgUrl>1575292156137.jpg</imgUrl><gps>50.8367386+4.40093901+123.56201171875+49.312</gps><meta><instanceID>uuid:7ff9b3b4-9404-4702-bbe4-efe2407aef02</instanceID><editUserID>{self.yoda.id}</editUserID></meta></PLAN_INT_CAR_FOSA>&instance_id=7ff9b3b4-9404-4702-bbe4-efe2407aef02&return_url=http://testserver/api/enketo/edit/uuid-1/',
        )

    def test_when_anonymous_head_submission_should_work(self):
        instance = self.form_1.instances.first()
        response = self.client.head(f"/api/enketo/submission")

        self.assertXmlResponse(response, 204)
        self.assertEqual("100000000", response.get("x-openrosa-accept-content-length"))

    def test_when_anonymous_get_formList_should_work_1(self):
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/enketo/formList?formID={instance.uuid}")
        self.assertXmlResponse(response, 200)

        expected_list = "".join(
            [
                '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
                "<xform>",
                f"<formID>{instance.uuid}</formID>",
                "<name>Hydroponics study</name>",
                "<version>1</version>",
                "<hash>md5:0803e94efbd5e88e444dffa60c015931</hash>",
                "<descriptionText>Hydroponics study</descriptionText>",
                f"<downloadUrl>http://testserver/api/enketo/formDownload/?uuid={instance.uuid}</downloadUrl>",
                "</xform>",
                "</xforms>",
            ]
        )
        self.assertEquals(response.content.decode("utf-8"), expected_list)

    def test_when_anonymous_get_formList_should_work_2(self):

        with open("iaso/tests/fixtures/hydroponics_test_upload_modified.xml") as modified_xml:
            instance = self.form_1.instances.first()
            f = SimpleUploadedFile(
                "file.txt",
                modified_xml.read()
                .replace("replaceInstanceId", str(instance.id))
                .replace("REPLACEuserID", str(self.yoda.id))
                .encode(),
            )
            response = self.client.post(
                f"/api/enketo/submission", {"name": "xml_submission_file", "xml_submission_file": f}
            )

            instance = self.form_1.instances.first()

            # assert audit log works
            modification = Modification.objects.last()

            self.assertEqual(self.yoda, modification.user)
            self.assertEqual("0", modification.past_value[0]["fields"]["json"]["Ident_type_serv_medical"])
            self.assertEqual("1", modification.new_value[0]["fields"]["json"]["Ident_type_serv_medical"])

            self.assertEqual(instance, modification.content_object)

    def assertXmlResponse(self, response, expected_status_code):
        self.assertEqual(expected_status_code, response.status_code)
        if expected_status_code != 204:
            self.assertEqual("application/xml", response["Content-Type"])
