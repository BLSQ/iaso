import json

import responses

from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from django.utils.timezone import now

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import FeatureFlag, FormVersion, Instance, InstanceFile, Mapping, Profile
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
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

        cls.doku = cls.create_user_with_profile(
            username="doku", account=cls.the_empire, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.grievous = cls.create_user_with_profile(
            username="grievous", account=cls.the_empire, permissions=[CORE_FORMS_PERMISSION]
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

    def _upload_land_speeder(self, form, uuid, file_name="land_speeder.xml"):
        """POST the empty instance metadata then upload the XML file, returning the resulting Instance."""
        instance_body = [
            {
                "id": uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.coruscant.id,
                "formId": form.id,
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

        return m.Instance.objects.get(uuid=uuid)

    def test_form_version_derived_on_sync_upload_when_version_matches(self):
        """`Instance.save()` should auto-derive form_version from json['_version'] when a matching FormVersion exists."""
        form_version = FormVersion.objects.create(
            form=self.form_1,
            version_id="201911280919",
            file=UploadedFile(open("iaso/tests/fixtures/form_rapide_1666691000_with_injectables.xml")),
        )
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3401"

        instance = self._upload_land_speeder(self.form_1, uuid)

        self.assertEqual(instance.form_version, form_version)

    def test_form_version_left_unset_on_sync_upload_when_version_does_not_match(self):
        """No FormVersion with a matching version_id exists: `Instance.save()` silently skips derivation."""
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3402"

        instance = self._upload_land_speeder(self.form_1, uuid)

        self.assertIsNone(instance.form_version)

    def test_json_parsed_from_xml_on_sync_upload(self):
        """`get_and_save_json_of_xml()` should parse the submitted XML fields into instance.json."""
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3403"

        instance = self._upload_land_speeder(self.form_2, uuid, file_name="land_speeder_with_service.xml")

        self.assertEqual(instance.json["_version"], "201911280919")
        self.assertEqual(instance.json["service"], "123")
        self.assertEqual(instance.json["Ident_nom_responsable"], "Chggh")
        self.assertEqual(instance.json["deviceid"], "358544083104930")

    def test_location_and_accuracy_converted_on_sync_upload(self):
        """`convert_location_from_field()` should set location/accuracy from the form's configured geo field."""
        form = m.Form.objects.create(name="Land Speeder Geo", form_id="land_speeder_geo", location_field="gps")
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3404"

        instance = self._upload_land_speeder(form, uuid)

        self.assertAlmostEqual(instance.location.y, 50.8367386)  # latitude
        self.assertAlmostEqual(instance.location.x, 4.40093901)  # longitude
        self.assertAlmostEqual(instance.location.z, 123.56201171875)  # altitude
        self.assertAlmostEqual(float(instance.accuracy), 49.312, places=2)

    def test_earlier_conversions_persist_when_a_later_one_raises_value_error_on_sync_upload(self):
        """A ValueError in one convert_* step must not discard the ones that already succeeded.

        `correlation_field` is pointed at "user_name" (a non-numeric field present in the fixture
        XML), so `convert_correlation()` raises ValueError (`int("...Tttt...")`) after
        `convert_location_from_field()` and `convert_device()` have already run. The location and
        device conversions -- which run earlier in the chain -- must still be persisted even though
        correlation fails; only `correlation_id` should be left unset.
        """
        form = m.Form.objects.create(
            name="Land Speeder Geo Error",
            form_id="land_speeder_geo_error",
            location_field="gps",
            correlation_field="user_name",
        )
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3408"

        instance = self._upload_land_speeder(form, uuid)

        self.assertAlmostEqual(instance.location.y, 50.8367386)  # latitude
        self.assertAlmostEqual(instance.location.x, 4.40093901)  # longitude
        self.assertAlmostEqual(float(instance.accuracy), 49.312, places=2)
        self.assertIsNotNone(instance.device)
        self.assertEqual(instance.device.imei, "358544083104930")
        self.assertIsNone(instance.correlation_id)

    def test_multiple_attachments_create_instance_files_on_sync_upload(self):
        """Extra files posted alongside the xml_submission_file should become InstanceFile rows."""
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3405"
        file_name = "land_speeder.xml"
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

        with (
            open("iaso/tests/fixtures/%s" % file_name) as fp,
            open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as photo1,
            open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as photo2,
        ):
            self.client.post(
                "/sync/form_upload/",
                {"xml_submission_file": fp, "photo1.jpg": photo1, "photo2.jpg": photo2},
                format="multipart",
            )

        instance = m.Instance.objects.get(uuid=uuid)
        self.assertEqual(instance.instancefile_set.count(), 2)
        self.assertEqual(
            set(instance.instancefile_set.values_list("name", flat=True)),
            {"photo1.jpg", "photo2.jpg"},
        )
        for instance_file in InstanceFile.objects.filter(instance=instance):
            self.assertEqual(instance_file.instance_id, instance.id)

    def test_audit_modification_created_on_sync_upload(self):
        """A Modification audit record should be created with source='SYNC FORM UPLOAD'."""
        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3406"

        instance = self._upload_land_speeder(self.form_1, uuid)

        modification = Modification.objects.filter(object_id=instance.id).latest("created_at")
        self.assertEqual(modification.source, "SYNC FORM UPLOAD")

    def test_sync_upload_creates_new_instance_without_preexisting_skeleton(self):
        """Calling /sync/form_upload/ with no prior POST /api/instances/ skeleton should still create an Instance.

        Characterizes current behavior: such an instance has no `form` (nothing set it), so
        `get_and_save_json_of_xml()` raises (`self.form` is None) and is silently swallowed by
        `form_upload()`'s bare except -- the instance is created with its file, but `.json` stays unset.
        """
        self.assertEqual(Instance.objects.filter(file_name="land_speeder.xml").count(), 0)

        with open("iaso/tests/fixtures/land_speeder.xml") as fp:
            response = self.client.post("/sync/form_upload/", {"xml_submission_file": fp}, format="multipart")

        self.assertEqual(response.status_code, 201)
        instance = Instance.objects.get(file_name="land_speeder.xml")
        self.assertIsNone(instance.form)
        self.assertTrue(instance.file)
        self.assertIsNone(instance.json)

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
        called_urls = [call.request.url for call in responses.calls]
        self.assertIn("https://dhis2.com/api/dataValueSets", called_urls)
        self.assertIn("https://dhis2.com/api/completeDataSetRegistrations", called_urls)

    @responses.activate
    def test_no_export_without_instant_export_feature_flag(self):
        """Without the INSTANT_EXPORT feature flag, uploading should not trigger any DHIS2 export call."""
        credentials, _ = m.ExternalCredentials.objects.get_or_create(
            name="Test export api", url="https://dhis2.com", login="admin", password="whocares", account=self.star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire", credentials=credentials)
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        self.star_wars.default_version = sw_version
        self.star_wars.save()

        form_version_1 = m.FormVersion.objects.create(
            form=self.form_2,
            version_id="201911280919",
            file=UploadedFile(open("iaso/tests/fixtures/form_rapide_1666691000_with_injectables.xml")),
        )
        mapping = Mapping(form=self.form_2, data_source=sw_source, mapping_type=m.AGGREGATE)
        mapping.save()
        m.MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=form_version_1, mapping=mapping
        ).save()

        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-ok.json"),
            status=200,
        )
        responses.add(responses.POST, "https://dhis2.com/api/completeDataSetRegistrations", json={}, status=200)

        uuid = "4b7c3954-f69a-4b99-83b1-db73957b3407"
        self._upload_land_speeder(self.form_2, uuid, file_name="land_speeder_with_service.xml")

        self.assertEqual(len(responses.calls), 0)
