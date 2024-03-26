import json
import urllib.parse

import responses
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.uploadedfile import UploadedFile
from django.test import override_settings

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import Instance
from iaso.test import APITestCase

from urllib.parse import parse_qs

enketo_test_settings = {
    "ENKETO_API_TOKEN": "ENKETO_API_TOKEN_TEST",
    "ENKETO_URL": "https://enketo_url.host.test",
    "ENKETO_API_SURVEY_PATH": "/api_v2/survey",
    "ENKETO_API_INSTANCE_PATH": "/api_v2/instance",
}


class EnketoAPITestCase(APITestCase):
    # Set by setUpTestData
    form_1: m.Form
    project: m.Project
    jedi_council_corruscant: m.OrgUnit
    jedi_council: m.OrgUnit
    yoda: m.User
    gunther: m.User

    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_forms", "iaso_update_submission"]
        )
        cls.gunther = cls.create_user_with_profile(username="gunther", account=star_wars, permissions=["iaso_forms"])

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Corruscant Jedi Council", source_ref="dw234q", version=sw_version
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study", form_id="hydro_1", period_type=m.MONTH, single_per_period=True
        )

        cls.form_version_1 = m.FormVersion.objects.create(
            form=cls.form_1,
            version_id="1",
            file=UploadedFile(open("iaso/tests/fixtures/form_rapide_1666691000.xml")),
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
        self.assertJSONResponse(response, 401)

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
        self.assertEqual({"error": "Enketo is not available"}, resp)

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
        expected = f'form_id={instance.uuid}&server_url=http://testserver/api/enketo&instance=<PLAN_INT_CAR_FOSA+xmlns:h="http://www.w3.org/1999/xhtml"+xmlns:jr="http://openrosa.org/javarosa"+xmlns:xsd="http://www.w3.org/2001/XMLSchema"+xmlns:ev="http://www.w3.org/2001/xml-events"+xmlns:orx="http://openrosa.org/xforms"+xmlns:odk="http://www.opendatakit.org/xforms"+id="PLAN_CAR_FOSA"+version="1"+iasoInstance="{instance.id}"><formhub><uuid>385689b3b55f4739b80dcba5540c5f87</uuid></formhub><start>2019-12-02T14:07:52.465+01:00</start><end>2019-12-02T14:10:11.380+01:00</end><today>2019-12-02</today><deviceid>358544083104930</deviceid><subscriberid>206300001285696</subscriberid><imei>358544083104930</imei><simserial>8932030000106638166</simserial><phonenumber/><user_name>Tttt</user_name><region>UnCrC8p12UN</region><prefecture>IJoQdfGfYsC</prefecture><district>tSs16aZvMD4</district><sous-prefecture>drMs7e3pDFZ</sous-prefecture><fosa>FeNjVewpswJ</fosa><year>2019</year><quarter>1</quarter><Ident_type_structure>ce</Ident_type_structure><Ident_type_services>serv_prot</Ident_type_services><Ident_type_serv_medical>0</Ident_type_serv_medical><Ident_type_serv_protect>1</Ident_type_serv_protect><Ident_type_serv_jurid>0</Ident_type_serv_jurid><Ident_type_serv_psycho>0</Ident_type_serv_psycho><Ident_type_serv_educ>0</Ident_type_serv_educ><Ident_type_serv_recope>0</Ident_type_serv_recope><Ident_type_serv_club>0</Ident_type_serv_club><Ident_statut>ong</Ident_statut><Ident_eau_courante>1</Ident_eau_courante><Ident_electricite>0</Ident_electricite><Ident_nom_responsable>Chggh</Ident_nom_responsable><Ident_telephone>256</Ident_telephone><fermeture_structure>sam</fermeture_structure><Ident_ferm_lundi>0</Ident_ferm_lundi><Ident_ferm_mardi>0</Ident_ferm_mardi><Ident_ferm_mercredi>0</Ident_ferm_mercredi><Ident_ferm_jeudi>0</Ident_ferm_jeudi><Ident_ferm_vendredi>0</Ident_ferm_vendredi><Ident_ferm_samedi>1</Ident_ferm_samedi><Ident_ferm_dim>0</Ident_ferm_dim><Ident_ferm_aucun>0</Ident_ferm_aucun><Ident_serv_cout>0</Ident_serv_cout><Ident_type_batiment>sem_dur</Ident_type_batiment><imgUrl>1575292156137.jpg</imgUrl><gps>50.8367386+4.40093901+123.56201171875+49.312</gps><meta><instanceID>uuid:7ff9b3b4-9404-4702-bbe4-efe2407aef02</instanceID><editUserID>{self.yoda.id}</editUserID></meta></PLAN_INT_CAR_FOSA>&instance_id=7ff9b3b4-9404-4702-bbe4-efe2407aef02&return_url=http://testserver/api/enketo/edit/uuid-1/'
        from urllib.parse import parse_qs

        parsed_actual = parse_qs(enketo_contents[0])["instance"][0]
        parsed_expected = parse_qs(expected)["instance"][0]
        self.assertEqual(
            parsed_actual,
            parsed_expected,
        )

        self.assertEqual(
            enketo_contents[0],
            expected,
        )

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_regression_problematic_xml(self):
        """GET /api/enketo/edit/{uuid}/

        Variation of test_when_authenticated_edit_url_should_return_an_enketo_url
        to check regression of IA-2049. Submission with problematic char that didn't parse correctly
        """
        instance = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid="uuid-2",
        )
        instance.file = UploadedFile(open("iaso/tests/fixtures/xml_submission_file_Ck2rvmg.xml"))
        instance.save()

        self.client.force_authenticate(self.yoda)
        enketo_received = []

        def request_callback(request):
            enketo_received.append(parse_qs(urllib.parse.unquote(request.body)))
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

        received = enketo_received[0]
        expected = {
            "form_id": ["uuid-2"],
            "server_url": ["http://testserver/api/enketo"],
            "instance": [
                f"""<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:odk="http://www.opendatakit.org/xforms" id="Nouv_verif_comm_FBPCI" version="1" iasoInstance="{instance.id}">
          <start>2023-04-03T10:51:59.531 00:00</start>
          <end>2023-04-04T07:30:33.329-00:00</end>
          <today>2023-04-03</today>
          <deviceid>2</deviceid>
          <subscriberid>subscriberid not found</subscriberid>
          <imei>1</imei>
          <simserial>simserial not found</simserial>
          <Utilisateur>
            <utilisateur>2</utilisateur>
          </Utilisateur>
          <identification>
            <acv>1</acv>
          </identification>
          <nom-enqueteur>FAKE</nom-enqueteur>
          <contact>0748644316</contact>
          <geopoint/>
          <verification_client>
            <notes/>
            <date-enquete>2023-02-14</date-enquete>
            <reference>10</reference>
            <id-client>BAD CHAR: ÏGA</id-client>
          </verification_client>
          <number_of_echantillon>1</number_of_echantillon>
          <satisfaction_spec>
            <total_satis_spec>11</total_satis_spec>
            <aff_total_satis_spec/>
          </satisfaction_spec>
          <meta>
            <instanceID>uuid:9f5efef7-045e-4660-b0ba-ac4d532ef4fb</instanceID>
          <editUserID>{self.yoda.id}</editUserID><deprecatedID>uuid:91d0a541-0a4d-4b11-91df-023d66371b61</deprecatedID></meta>
        </data>"""
            ],
            "instance_id": ["9f5efef7-045e-4660-b0ba-ac4d532ef4fb"],
            "return_url": ["http://testserver/api/enketo/edit/uuid-2/"],
        }
        self.assertEqual(
            received,
            expected,
        )

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_unauthorized_user_cant_edit_submission(self):
        """GET /api/enketo/edit/{uuid}/"""
        instance = self.form_1.instances.first()
        self.client.force_authenticate(self.gunther)
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

        self.assertEqual(response.status_code, 403)

    def test_when_anonymous_head_submission_should_work(self):
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
                "<hash>md5:4571fa4a8caa18cb4b8b97d81430077a</hash>",
                "<descriptionText>Hydroponics study</descriptionText>",
                f"<downloadUrl>http://testserver/api/enketo/formDownload/?uuid={instance.uuid}</downloadUrl>",
                "</xform>",
                "</xforms>",
            ]
        )
        self.assertEqual(response.content.decode("utf-8"), expected_list)

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
            self.client.post(f"/api/enketo/submission", {"name": "xml_submission_file", "xml_submission_file": f})

            instance = self.form_1.instances.first()

            # assert audit log works
            modification = Modification.objects.last()

            self.assertEqual(self.yoda, modification.user)
            self.assertEqual("0", modification.past_value[0]["fields"]["json"]["Ident_type_serv_medical"])
            self.assertEqual("1", modification.new_value[0]["fields"]["json"]["Ident_type_serv_medical"])

            self.assertEqual(instance, modification.content_object)

    def assertXmlResponse(self, response, expected_status_code):
        self.assertEqual(expected_status_code, response.status_code, response)
        if expected_status_code != 204:
            self.assertEqual("application/xml", response["Content-Type"])

    def test_save_last_user_modified_submission(self):
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

            self.assertEqual(response.status_code, 201)
            self.assertEqual(self.yoda, instance.last_modified_by)

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_public_create_url(self):
        self.setUpMockEnketo()
        # usually passed to the external service when configuring
        token = self.project.external_token
        form_id = self.form_1.form_id
        old_count = Instance.objects.count()

        data = {
            "period": "202301",
            "form_id": form_id,
            "external_org_unit_id": self.jedi_council_corruscant.source_ref,
            "token": token,
        }

        response = self.client.get("/api/enketo/public_create_url/", data=data)
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r, {"url": "https://enketo_url.host.test/something"})
        self.assertTrue(
            responses.assert_call_count("https://enketo_url.host.test/api_v2/survey/single", 1),
        )
        self.assertEqual(len(responses.calls), 1)
        self.assertEqual(old_count + 1, Instance.objects.count())

    def setUpMockEnketo(self):
        self.enketo_contents = []

        def request_callback(request):
            self.enketo_contents.append(urllib.parse.unquote(request.body))
            return (200, {}, json.dumps({"edit_url": "https://enketo_url.host.test/something"}))

        self.rsp_instance = responses.add_callback(
            responses.POST,
            "https://enketo_url.host.test/api_v2/instance",
            callback=request_callback,
            content_type="application/json",
        )

        self.rsp_survey = responses.add_callback(
            responses.POST,
            "https://enketo_url.host.test/api_v2/survey/single",
            callback=request_callback,
            content_type="application/json",
        )

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_public_create_url_duplicate_fail(self):
        """There is already more than two instance for the form/period, and it is single_per_period so it fail"""
        token = self.project.external_token
        form_id = self.form_1.form_id
        # Mark form as single per period and add a duplicate
        self.setUpMockEnketo()
        self.form_1.single_per_period = True
        self.form_1.save()
        self.create_form_instance(form=self.form_1, period="202001", org_unit=self.jedi_council_corruscant)
        self.create_form_instance(form=self.form_1, period="202001", org_unit=self.jedi_council_corruscant)

        data = {
            "period": "202001",
            "form_id": form_id,
            "external_org_unit_id": self.jedi_council_corruscant.source_ref,
            "token": token,
        }

        # test setup

        response = self.client.get("/api/enketo/public_create_url/", data=data)
        r = self.assertJSONResponse(response, 400)
        self.assertEqual(
            r,
            {
                "error": "Ambiguous request",
                "message": "There are multiple submissions for this period and organizational unit, please log in the dashboard to fix.",
            },
        )
        self.assertEqual(len(responses.calls), 0)

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_public_create_url_single_edit(self):
        """There is an instance for Form/OrgUnit/Period and it is single per period, so we edit it"""
        token = self.project.external_token
        form_id = self.form_1.form_id
        # Mark form as single per period and add a duplicate
        self.setUpMockEnketo()
        self.form_1.single_per_period = True
        self.form_1.save()
        instance = self.create_form_instance(form=self.form_1, period="20220201", org_unit=self.jedi_council_corruscant)
        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.save()

        old_count = Instance.objects.count()
        data = {
            "period": "20220201",
            "form_id": form_id,
            "external_org_unit_id": self.jedi_council_corruscant.source_ref,
            "token": token,
        }

        response = self.client.get("/api/enketo/public_create_url/", data=data)
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r, {"url": "https://enketo_url.host.test/something"})
        self.assertEqual(len(responses.calls), 1)
        self.assertTrue(responses.assert_call_count("https://enketo_url.host.test/api_v2/instance", 1), responses.calls)
        self.assertEqual(old_count, Instance.objects.count())

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_public_create_url_non_single_create(self):
        """There is an instance on the Form/OrgUnit/Period and it is NOT single per period, so we create a new one"""
        token = self.project.external_token
        form_id = self.form_1.form_id
        # Mark form as single per period and add a duplicate
        self.setUpMockEnketo()
        self.form_1.single_per_period = False
        self.form_1.save()
        instance = self.create_form_instance(form=self.form_1, period="20220201", org_unit=self.jedi_council_corruscant)
        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.save()
        old_count = Instance.objects.count()

        data = {
            "period": "20220201",
            "form_id": form_id,
            "external_org_unit_id": self.jedi_council_corruscant.source_ref,
            "token": token,
        }

        response = self.client.get("/api/enketo/public_create_url/", data=data)
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r, {"url": "https://enketo_url.host.test/something"})
        self.assertEqual(len(responses.calls), 1)
        # self.assertEqual(responses.calls[0].request.url, 1)
        self.assertTrue(responses.assert_call_count("https://enketo_url.host.test/api_v2/survey/single", 1))
        self.assertEqual(old_count + 1, Instance.objects.count())

    @override_settings(ENKETO=enketo_test_settings)
    @responses.activate
    def test_public_create_url_non_single_create_2(self):
        """There is 2 instances on the Form/OrgUnit/Period, and it is NOT single per period, so we create a new one"""
        token = self.project.external_token
        form_id = self.form_1.form_id
        # Mark form as single per period and add a duplicate
        self.setUpMockEnketo()
        self.form_1.single_per_period = False
        self.form_1.save()
        instance = self.create_form_instance(form=self.form_1, period="20220201", org_unit=self.jedi_council_corruscant)
        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.save()
        instance = self.create_form_instance(form=self.form_1, period="20220201", org_unit=self.jedi_council_corruscant)
        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.save()
        old_count = Instance.objects.count()

        data = {
            "period": "20220201",
            "form_id": form_id,
            "external_org_unit_id": self.jedi_council_corruscant.source_ref,
            "token": token,
        }

        response = self.client.get("/api/enketo/public_create_url/", data=data)
        r = self.assertJSONResponse(response, 201)
        self.assertEqual(r, {"url": "https://enketo_url.host.test/something"})
        self.assertEqual(len(responses.calls), 1)
        # self.assertEqual(responses.calls[0].request.url, 1)
        self.assertTrue(responses.assert_call_count("https://enketo_url.host.test/api_v2/survey/single", 1))
        self.assertEqual(old_count + 1, Instance.objects.count())

    def test_form_list_work_with_duplicate_instance(self):
        "Check form list work when there are two instances with the same UUID"
        uuid_dup = "uuid-dup"
        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid=uuid_dup,
        )
        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid=uuid_dup,
        )
        response = self.client.get(f"/api/enketo/formList?formID={uuid_dup}")
        self.assertXmlResponse(response, 200)

        expected_list = "".join(
            [
                '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
                "<xform>",
                f"<formID>{uuid_dup}</formID>",
                "<name>Hydroponics study</name>",
                "<version>1</version>",
                "<hash>md5:4571fa4a8caa18cb4b8b97d81430077a</hash>",
                "<descriptionText>Hydroponics study</descriptionText>",
                f"<downloadUrl>http://testserver/api/enketo/formDownload/?uuid={uuid_dup}</downloadUrl>",
                "</xform>",
                "</xforms>",
            ]
        )
        self.assertEqual(response.content.decode("utf-8"), expected_list)

    def test_duplicate_instance_download(self):
        "form download works if there is two instance"
        uuid_dup = "uuid-dup"
        instance1 = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid=uuid_dup,
            json={"a": 2, "hello": "world"},
        )
        # json empty
        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid=uuid_dup,
        )
        response = self.client.get(f"/api/enketo/formDownload/?uuid={uuid_dup}")
        self.assertXmlResponse(response, 200)
        content = response.content.decode("utf-8")
        self.assertEqual(
            content,
            f"""<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:orx="http://openrosa.org/xforms" xmlns:xsd="http://www.w3.org/2001/XMLSchema" iasoInstance="{instance1.id}">
  <h:head>
    <h:title>Very quick form for test</h:title>
    <model odk:xforms-version="1.0.0">
      <submission orx:auto-delete="default" orx:auto-send="default"/>
      <itext>
        <translation lang="French">
          <text id="/data/mon_champ:label">
            <value>Une valeur</value>
          </text>
        </translation>
        <translation lang="English">
          <text id="/data/mon_champ:label">
            <value>A value</value>
          </text>
        </translation>
      </itext>
      <instance>
        <data id="Form-rapide" version="1666691000" iasoInstance="{instance1.id}">
          <mon_champ>Valeur par default</mon_champ>
          <meta>
            <instanceID/>
          </meta>
        </data>
      </instance>
      <bind nodeset="/data/mon_champ" type="string"/>
      <bind jr:preload="uid" nodeset="/data/meta/instanceID" readonly="true()" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/mon_champ">
      <label ref="jr:itext('/data/mon_champ:label')"/>
    </input>
  </h:body>
</h:html>""",
        )

    def test_form_download(self):
        """form download works"""
        submission_uuid = "uuid-dup"
        instance1 = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            uuid=submission_uuid,
        )

        response = self.client.get(f"/api/enketo/formDownload/?uuid={submission_uuid}")
        self.assertXmlResponse(response, 200)
        content = response.content.decode("utf-8")
        self.assertEqual(
            content,
            f"""<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:orx="http://openrosa.org/xforms" xmlns:xsd="http://www.w3.org/2001/XMLSchema" iasoInstance="{instance1.id}">
  <h:head>
    <h:title>Very quick form for test</h:title>
    <model odk:xforms-version="1.0.0">
      <submission orx:auto-delete="default" orx:auto-send="default"/>
      <itext>
        <translation lang="French">
          <text id="/data/mon_champ:label">
            <value>Une valeur</value>
          </text>
        </translation>
        <translation lang="English">
          <text id="/data/mon_champ:label">
            <value>A value</value>
          </text>
        </translation>
      </itext>
      <instance>
        <data id="Form-rapide" version="1666691000" iasoInstance="{instance1.id}">
          <mon_champ>Valeur par default</mon_champ>
          <meta>
            <instanceID/>
          </meta>
        </data>
      </instance>
      <bind nodeset="/data/mon_champ" type="string"/>
      <bind jr:preload="uid" nodeset="/data/meta/instanceID" readonly="true()" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/mon_champ">
      <label ref="jr:itext('/data/mon_champ:label')"/>
    </input>
  </h:body>
</h:html>""",
        )
