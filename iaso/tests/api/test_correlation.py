import json

import responses

from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from django.utils.timezone import now

from iaso import models as m
from iaso.models import FeatureFlag, Instance, Mapping, Profile
from iaso.test import APITestCase


def build_form_mapping():
    return {
        "data_set_id": "DATASET_DHIS2_ID",
        "question_mappings": {
            "Ident_nom_responsable": {"id": "DE_DHIS2_ID", "valueType": "TEXT"},
            "_version": {"id": "DE_DHIS2_ID", "valueType": "TEXT"},
        },
    }


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


class CorrelationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars
        cls.the_empire = m.Account.objects.create(name="The Empire")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.coruscant = m.OrgUnit.objects.create(name="coruscant", org_unit_type=cls.jedi_council)

        cls.doku = cls.create_user_with_profile(username="doku", account=cls.the_empire, permissions=["iaso_forms"])
        cls.grievous = cls.create_user_with_profile(
            username="grievous", account=cls.the_empire, permissions=["iaso_forms"]
        )

        cls.form_1 = m.Form.objects.create(name="Land Speeder", form_id="sample1")
        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey", form_id="sample2", correlatable=True, correlation_field="service"
        )

    def test_correlation_creation_without_correlation_field(self):
        """POST of a form where correlation is not set up"""
        file_name = "land_speeder.xml"
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b32d2"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        with open("iaso/tests/fixtures/land_speeder.xml") as fp:
            self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")
        self.assertEqual(response.status_code, 200)
        instance = m.Instance.objects.get(uuid=uuid)
        self.assertTrue(str(instance.correlation_id).startswith(str(instance.id)))

        modulo = int(str(instance.correlation_id)[-2:])
        base = int(str(instance.correlation_id)[0:-2])

        self.assertEqual(base % 97, modulo)
        self.assertEqual(
            len(str(instance.id)) + 3, len(str(instance.correlation_id))
        )  # verify that one random number was added

    def test_correlation_creation_with_correlation_field(self):
        """POST of a form where correlation is set up"""
        file_name = "land_speeder_with_service.xml"
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3342"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        with open("iaso/tests/fixtures/%s" % file_name) as fp:
            self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")

        instance = m.Instance.objects.get(uuid=uuid)

        modulo = int(str(instance.correlation_id)[-2:])
        base = int(str(instance.correlation_id)[0:-2])
        correlation_code = int(str(instance.correlation_id)[-6:-3])

        self.assertEqual(correlation_code, 123)
        self.assertEqual(base % 97, modulo)
        self.assertEqual(len(str(instance.id)) + 6, len(str(instance.correlation_id)))

    def test_jwt_decode_instance_upload(self):
        user = User.objects.create_user(username="testuser", password="12345")
        user.save()
        Profile.objects.create(account=self.the_empire, user=user)

        login_data = {"username": "testuser", "password": "12345"}

        jwt_token = self.client.post("/api/token/", data=login_data, format="json")

        file_name = "land_speeder_with_service.xml"
        uuid = "4b7c3954-f69a-4b99-43b1-df73957b3349"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )

        anonymous_uploaded_instance = Instance.objects.last()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(anonymous_uploaded_instance.created_by, None)
        self.assertEqual(anonymous_uploaded_instance.last_modified_by, None)

        self.client.credentials(HTTP_AUTHORIZATION="Token: {0}".format(jwt_token.json()["access"]))

        with open("iaso/tests/fixtures/%s" % file_name) as fp:
            response_form = self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")

        updated_instance = Instance.objects.get(uuid=anonymous_uploaded_instance.uuid)

        self.assertEqual(response_form.status_code, 201)
        self.assertEqual(updated_instance.last_modified_by, user)

    @responses.activate
    def test_creation_with_instant_export_feature_flag(self):
        """POST of a form with instant export feature is enabled"""

        # don't understand why I need to create it, thought it was part of a migration ?
        instant_export, _ = FeatureFlag.objects.get_or_create(
            code=FeatureFlag.INSTANT_EXPORT,
            defaults={"name": "Instant export"},
        )
        self.project.feature_flags.add(instant_export)

        # setup necessary info for export

        credentials, creds_created = m.ExternalCredentials.objects.get_or_create(
            name="Test export api", url="https://dhis2.com", login="admin", password="whocares", account=self.star_wars
        )

        sw_source = m.DataSource.objects.create(name="Evil Empire", credentials=credentials)
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        self.star_wars.default_version = sw_version
        self.star_wars.save()

        form_version_1 = m.FormVersion.objects.create(
            form=self.form_2,
            version_id="1",
            file=UploadedFile(open("iaso/tests/fixtures/form_rapide_1666691000_with_injectables.xml")),
        )

        mapping = Mapping(form=self.form_2, data_source=sw_source, mapping_type=m.AGGREGATE)
        mapping.save()

        # align version_id with xml of the submission
        form_version_1.version_id = "201911280919"
        form_version_1.save()

        mapping_version = m.MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=form_version_1, mapping=mapping
        )
        mapping_version.save()

        # exercise
        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-ok.json"),
            status=200,
        )
        responses.add(responses.POST, "https://dhis2.com/api/completeDataSetRegistrations", json={}, status=200)

        file_name = "land_speeder_with_service.xml"
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3342"
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": self.form_2.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/%s" % file_name,
                "name": file_name,
            }
        ]

        response = self.client.post(
            "/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=instance_body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        with open("iaso/tests/fixtures/%s" % file_name) as fp:
            self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")

        instance = m.Instance.objects.get(uuid=uuid)
