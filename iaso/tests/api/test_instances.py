import datetime
import json
import typing
from unittest import mock
from uuid import uuid4

import pytz
from django.contrib.gis.geos import Point
from django.core.files import File
from django.utils import timezone
from django.utils.timezone import now

from hat.api.export_utils import timestamp_to_utc_datetime
from hat.audit.models import Modification
from iaso import models as m
from iaso.models import InstanceLock
from iaso.models.microplanning import Planning, Team
from iaso.models import OrgUnit, Instance, InstanceLock, FormVersion
from iaso.test import APITestCase

MOCK_DATE = datetime.datetime(2020, 2, 2, 2, 2, 2, tzinfo=pytz.utc)


class InstancesAPITestCase(APITestCase):
    @classmethod
    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_submissions"])
        cls.guest = cls.create_user_with_profile(username="guest", account=star_wars, permissions=["iaso_submissions"])
        cls.supervisor = cls.create_user_with_profile(
            username="supervisor", account=star_wars, permissions=["iaso_submissions", "iaso_forms"]
        )

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
            validation_status="VALID",
        )
        cls.ou_top_1 = m.OrgUnit.objects.create(
            name="ou_top_1",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
        )
        cls.ou_top_2 = m.OrgUnit.objects.create(
            name="ou_top_2",
            source_ref="jedi_council_corruscant_ref",
            parent=cls.ou_top_1,
            version=sw_version,
        )
        cls.ou_top_3 = m.OrgUnit.objects.create(
            name="ou_top_3",
            source_ref="jedi_council_corruscant_ref",
            parent=cls.ou_top_2,
            version=sw_version,
        )
        cls.jedi_council_endor = m.OrgUnit.objects.create(
            name="Endor Jedi Council", source_ref="jedi_council_endor_ref"
        )
        cls.jedi_council_endor_region = m.OrgUnit.objects.create(
            name="Endor Region Jedi Council", parent=cls.jedi_council_endor, source_ref="jedi_council_endor_region_ref"
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        sw_source.projects.add(cls.project)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        # Form without period
        cls.form_3 = m.Form.objects.create(
            name="Hydroponic public survey III",
            form_id="sample34",
            device_field="deviceid",
            location_field="geoloc",
            # period_type="QUARTER",
            # single_per_period=True,
        )

        cls.form_4 = m.Form.objects.create(
            name="Hydroponic public survey IV",
            form_id="sample26",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )

        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(
            form=cls.form_2, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )
        cls.form_2.save()

        # Instance saved without period
        cls.form_3.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_3.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(form=cls.form_3, org_unit=cls.jedi_council_corruscant, project=cls.project)
        cls.form_3.save()

        # A deleted Instance
        cls.form_4.form_versions.create(file=form_2_file_mock, version_id="2020022402")
        cls.form_4.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(
            form=cls.form_4, period="2020Q1", org_unit=cls.jedi_council_corruscant, project=cls.project, deleted=True
        )
        cls.form_4.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.forms.add(cls.form_3)
        cls.project.forms.add(cls.form_4)
        sw_source.projects.add(cls.project)
        cls.project.save()

    def test_instance_list_by_form_id_permission_denied_when_anonymous(self):
        """GET /instances/?form_id=form_id"""
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    def test_instance_details_permission_denied_when_anonymous(self):
        """GET /instances/?form_id=form_id"""
        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 403)

    def test_instance_create_planning(self):
        """POST /api/instances/ happy path (anonymous)"""

        instance_uuid = str(uuid4())
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153709,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "period": "202002",
                "latitude": 50.2,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "1",
            }
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        last_instance = m.Instance.objects.last()
        self.assertEqual(instance_uuid, last_instance.uuid)
        self.assertEquals("RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml", last_instance.file_name)
        self.assertEqual("202002", last_instance.period)
        self.assertIsInstance(last_instance.location, Point)
        self.assertEqual(10, last_instance.accuracy)
        self.assertEqual(4.4, last_instance.location.x)
        self.assertEqual(50.2, last_instance.location.y)
        self.assertEqual(self.jedi_council_corruscant, last_instance.org_unit)
        self.assertEqual(self.form_1, last_instance.form)
        self.assertEqual(timestamp_to_utc_datetime(1565258153704), last_instance.created_at)
        self.assertEqual(datetime.datetime(2019, 8, 8, 9, 55, 53, tzinfo=timezone.utc), last_instance.created_at)
        # TODO: the assertion below will fail because our API does not store properly the updated_at property
        # TODO: (See IA-278: https://bluesquare.atlassian.net/browse/IA-278)
        # self.assertEqual(
        #     timestamp_to_utc_datetime(1565258153709), last_instance.updated_at
        # )
        self.assertEqual(self.form_1, last_instance.form)
        self.assertIsNotNone(last_instance.project)

    def test_instance_create_anonymous_planning(self):
        """POST /api/instances/ happy path (anonymous)"""
        team = Team.objects.create(project=self.project, manager=self.yoda)
        planning = Planning.objects.create(org_unit=self.jedi_council_corruscant, project=self.project, team=team)

        instance_uuid = str(uuid4())
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153709,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "period": "202002",
                "latitude": 50.2,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "planningId": planning.id,
                "name": "1",
            }
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        last_instance = m.Instance.objects.last()
        self.assertEqual(instance_uuid, last_instance.uuid)
        self.assertEquals("RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml", last_instance.file_name)
        self.assertEqual("202002", last_instance.period)
        self.assertIsInstance(last_instance.location, Point)
        self.assertEqual(10, last_instance.accuracy)
        self.assertEqual(4.4, last_instance.location.x)
        self.assertEqual(50.2, last_instance.location.y)
        self.assertEqual(self.jedi_council_corruscant, last_instance.org_unit)
        self.assertEqual(self.form_1, last_instance.form)
        self.assertEqual(timestamp_to_utc_datetime(1565258153704), last_instance.created_at)
        self.assertEqual(datetime.datetime(2019, 8, 8, 9, 55, 53, tzinfo=timezone.utc), last_instance.created_at)
        # TODO: the assertion below will fail because our API does not store properly the updated_at property
        # TODO: (See IA-278: https://bluesquare.atlassian.net/browse/IA-278)
        # self.assertEqual(
        #     timestamp_to_utc_datetime(1565258153709), last_instance.updated_at
        # )
        self.assertEqual(self.form_1, last_instance.form)
        self.assertEqual(last_instance.project, self.project)
        self.assertEqual(last_instance.planning, planning)

    def test_instance_create_anonymous_microsecond(self):
        """POST /api/instances/ happy path (anonymous)

        Test creation using new iasoapp 2.0 format of using second instead of microsecond
        for timestamp https://bluesquare.atlassian.net/browse/IA-1473
        """

        instance_uuid = str(uuid4())
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704 / 1000,
                "updated_at": 1565258153709 / 1000,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "period": "202002",
                "latitude": 50.2,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "1",
            }
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        last_instance = m.Instance.objects.last()
        self.assertEqual(instance_uuid, last_instance.uuid)
        self.assertEquals("RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml", last_instance.file_name)
        self.assertEqual("202002", last_instance.period)
        self.assertIsInstance(last_instance.location, Point)
        self.assertEqual(10, last_instance.accuracy)
        self.assertEqual(4.4, last_instance.location.x)
        self.assertEqual(50.2, last_instance.location.y)
        self.assertEqual(self.jedi_council_corruscant, last_instance.org_unit)
        self.assertEqual(self.form_1, last_instance.form)
        self.assertEqual(timestamp_to_utc_datetime(1565258153704), last_instance.created_at)
        self.assertEqual(datetime.datetime(2019, 8, 8, 9, 55, 53, tzinfo=timezone.utc), last_instance.created_at)
        # TODO: the assertion below will fail because our API does not store properly the updated_at property
        # TODO: (See IA-278: https://bluesquare.atlassian.net/browse/IA-278)
        # self.assertEqual(
        #     timestamp_to_utc_datetime(1565258153709), last_instance.updated_at
        # )
        self.assertEqual(self.form_1, last_instance.form)
        self.assertIsNotNone(last_instance.project)

    def test_instance_create_pre_existing(self):
        """POST /api/instances/ with pre-existing, deleted instance"""

        instance_uuid = str(uuid4())
        pre_existing_instance = self.create_form_instance(
            form=self.form_1,
            name="Pre-existing name",
            period="202001",
            org_unit=self.jedi_council_corruscant,
            uuid=instance_uuid,
            deleted=True,
        )
        pre_existing_instance_count = m.Instance.objects.count()
        body = [
            {
                "id": instance_uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "Mobile app name",
            }
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        self.assertEqual(pre_existing_instance_count, m.Instance.objects.count())  # No added instance
        pre_existing_instance.refresh_from_db()
        self.assertTrue(pre_existing_instance.deleted)
        self.assertEqual("Pre-existing name", pre_existing_instance.name)

    def test_instance_create_two_one_is_pre_existing(self):
        """POST /api/instances/ with one pre-existing instance and a new one"""

        instance_uuid = str(uuid4())
        pre_existing_instance = self.create_form_instance(
            form=self.form_1,
            name="Pre-existing name",
            period="202002",
            org_unit=self.jedi_council_corruscant,
            uuid=instance_uuid,
        )
        pre_existing_instance_count = m.Instance.objects.count()
        body = [
            {
                "id": str(uuid4()),
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "Mobile app name i1",
            },
            {
                "id": instance_uuid,
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "Mobile app name i2",
            },
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        self.assertEqual(pre_existing_instance_count + 1, m.Instance.objects.count())  # One added instance
        pre_existing_instance.refresh_from_db()
        self.assertEqual("Pre-existing name", pre_existing_instance.name)

    def test_instance_create_after_sync(self):
        """POST /api/instances/ with one pre-existing instance (created by the /sync view, with a filename only)"""

        instance_filename = "RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml"
        pre_existing_instance = self.create_form_instance(file_name=instance_filename)
        pre_existing_instance_count = m.Instance.objects.count()
        body = [
            {
                "id": str(uuid4()),
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "Mobile app name",
            }
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(pre_existing_instance_count, m.Instance.objects.count())  # No-added instance
        pre_existing_instance.refresh_from_db()
        self.assertEqual("RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml", pre_existing_instance.file_name)
        self.assertEqual("Mobile app name", pre_existing_instance.name)

    def test_instance_list_by_form_id_ok(self):
        """GET /instances/?form_id=form_id"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 4)

    def test_instance_filter_by_org_unit_status(self):
        """GET /instances/?org_unit_status={status}"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/?org_unit_status=VALID")
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 6)

        response = self.client.get(f"/api/instances/?org_unit_status=REJECTED")
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 0)

    def test_instance_list_by_form_id_ok_soft_deleted(self):
        """GET /instances/?form_id=form_id"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 4)

        soft_deleted_instance = self.form_1.instances.first()
        soft_deleted_instance.deleted = True
        soft_deleted_instance.save()

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 3)

    def test_instance_details_by_id_ok_soft_deleted(self):
        """GET /instances/{instanceid}/"""

        soft_deleted_instance = self.form_1.instances.first()
        soft_deleted_instance.deleted = True
        soft_deleted_instance.save()

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)

    def test_soft_delete_an_instance(self):
        """DELETE /instances/{instanceid}/"""

        soft_deleted_instance = self.form_1.instances.first()

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)
        self.assertFalse(response.json()["deleted"])

        response = self.client.delete(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)
        self.assertTrue(response.json()["deleted"])

    def test_bulk_delete_selected_instance_ids(self):
        """POST /instances/bulkdelete and undelete"""

        soft_deleted_instance = self.form_1.instances.first()

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)
        self.assertFalse(response.json()["deleted"])

        # lets bulk delete

        audit_before_count = Modification.objects.all().count()

        response = self.client.post(
            f"/api/instances/bulkdelete/",
            {"selected_ids": [str(soft_deleted_instance.id)], "is_deletion": True, "showDeleted": False},
            format="json",
        )
        self.assertJSONResponse(response, 201)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)
        self.assertTrue(response.json()["deleted"])

        audit_after_count = Modification.objects.all().count()

        self.assertEqual(audit_after_count, audit_before_count + 1)
        last_modif = Modification.objects.all().order_by("created_at").last()
        self.assertFalse(last_modif.past_value[0]["fields"]["deleted"])
        self.assertTrue(last_modif.new_value[0]["fields"]["deleted"])

        self.assertEqual(audit_after_count, audit_before_count + 1)

        # lets restore
        response = self.client.post(
            f"/api/instances/bulkdelete/",
            {"selected_ids": [str(soft_deleted_instance.id)], "is_deletion": False, "showDeleted": "true"},
            format="json",
        )
        self.assertJSONResponse(response, 201)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)
        self.assertFalse(response.json()["deleted"])

        last_modif = Modification.objects.all().order_by("created_at").last()
        self.assertTrue(last_modif.past_value[0]["fields"]["deleted"])
        self.assertFalse(last_modif.new_value[0]["fields"]["deleted"])

    def test_instance_list_by_json_content(self):
        """Search using the instance content (in JSON field)"""
        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "a", "age": "18", "gender": "M"},
        )

        b = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "b", "age": "19", "gender": "F"},
        )

        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "c", "age": "30", "gender": "F"},
        )

        self.client.force_authenticate(self.yoda)
        json_filters = json.dumps({"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, 25]}]})
        response = self.client.get(f"/api/instances/", {"jsonContent": json_filters})
        self.assertJSONResponse(response, 200)
        response_json = response.json()
        self.assertValidInstanceListData(response_json, expected_length=1)
        self.assertEqual(response_json["instances"][0]["id"], b.id)

    def test_instance_list_by_json_content_not_operator(self):
        """We do the opposite than test_instance_list_by_json_content(): exclude all the women before 25"""
        a = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "a", "age": "18", "gender": "M"},
        )

        b = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "b", "age": "19", "gender": "F"},
        )

        c = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "c", "age": 30, "gender": "F"},
        )

        self.client.force_authenticate(self.yoda)
        json_filters = json.dumps({"!": {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, 25]}]}})
        response = self.client.get(f"/api/instances/", {"jsonContent": json_filters})

        response_json = response.json()
        # We should receive the a and c (+ the instances created in setupTestData), but not the b (because it's a female under 25)
        received_instances_ids = [instance["id"] for instance in response_json["instances"]]
        self.assertIn(a.id, received_instances_ids)
        self.assertIn(c.id, received_instances_ids)
        self.assertNotIn(b.id, received_instances_ids)

    def test_instance_list_by_json_content_nested(self):
        """Search using the instance content (in JSON field) with nested and/or operators"""
        a = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "a", "age": 18, "gender": "M"},
        )

        b = self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "b", "age": 19, "gender": "F"},
        )

        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_corruscant,
            project=self.project,
            json={"name": "c", "age": 30, "gender": "F"},
        )

        self.client.force_authenticate(self.yoda)

        # Either a male or a female under 20
        filters = {
            "or": [
                {"==": [{"var": "gender"}, "M"]},
                {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, 20]}]},
            ],
        }

        response = self.client.get(f"/api/instances/", {"jsonContent": json.dumps(filters)})
        self.assertJSONResponse(response, 200)
        response_json = response.json()
        self.assertValidInstanceListData(response_json, expected_length=2)
        for instance in response_json["instances"]:
            self.assertIn(instance["id"], [a.id, b.id])

    def test_instance_list_by_form_id_and_status_ok(self):
        """GET /instances/?form_id=form_id&status="""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            f"/api/instances/", {"form_id": self.form_1.id, "status": m.Instance.STATUS_DUPLICATED}
        )
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 2)

    def test_instance_list_by_search_org_unit_ref(self):
        """GET /instances/?search=refs:org_unit__source_ref"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/", {"search": "refs:" + self.jedi_council_corruscant.source_ref})
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 6)

    def test_instance_list_by_search_org_unit_ref_not_found(self):
        """GET /instances/?search=refs:org_unit__source_ref"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/", {"search": "refs:source_ref_not_in"})
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 0)

    def test_instance_list_duplicate(self):
        """Regression test for IA-771
        Make duplicate instance, delete them. Check status for delete instance
        """
        self.client.force_authenticate(self.yoda)
        form = m.Form.objects.create(name="test", period_type=m.MONTH, single_per_period=True)
        form.projects.add(self.project)

        # create first submission, validate status is ready
        self.create_form_instance(
            form=form, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )

        response = self.client.get(f"/api/instances/", {"form_id": form.id})
        res = self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(res, 1)
        self.assertEqual(res["instances"][0]["status"], "READY")
        # Create second submission, check status is duplicate
        dup = self.create_form_instance(
            form=form, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        response = self.client.get(f"/api/instances/", {"form_id": form.id})
        res = self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(res, 2)
        self.assertEqual(res["instances"][0]["status"], "DUPLICATED")
        self.assertEqual(res["instances"][1]["status"], "DUPLICATED")
        # soft delete instance
        response = self.client.delete(f"/api/instances/{dup.id}/")
        self.assertEqual(response.status_code, 200)
        dup.refresh_from_db()
        self.assertEqual(True, dup.deleted)
        self.assertEqual(1, Modification.objects.count())
        # check status is ready again
        self.client.get(f"/api/instances/", {"form_id": form.id})

        response = self.client.get(f"/api/instances/", {"form_id": form.id})
        res = self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(res, 1)
        self.assertEqual(res["instances"][0]["status"], "READY")

    def assertValidInstanceListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="instances", paginated=paginated
        )

        for instance_data in list_data["instances"]:
            self.assertValidInstanceData(instance_data)

    def assertValidInstanceData(self, instance_data: typing.Mapping):
        self.assertHasField(instance_data, "id", int)
        self.assertHasField(instance_data, "status", str)
        self.assertHasField(instance_data, "correlation_id", str, optional=True)

    def test_instance_patch_org_unit_period(self):
        """PATCH /instances/:pk"""
        self.client.force_authenticate(self.yoda)
        new_org_unit = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council New New", version=self.sw_version, org_unit_type=self.jedi_council
        )
        self.jedi_council_corruscant.version = self.sw_version
        self.jedi_council_corruscant.save()
        instance_to_patch = self.form_2.instances.first()

        response = self.client.patch(
            f"/api/instances/{instance_to_patch.id}/",
            data={"org_unit": new_org_unit.id, "period": "2022Q1"},
            format="json",
            HTTP_ACCEPT="application/json",
        )

        self.assertJSONResponse(response, 200)

        instance_to_patch.refresh_from_db()
        self.assertEqual(instance_to_patch.org_unit, new_org_unit)
        self.assertEqual(instance_to_patch.period, "2022Q1")

        # assert audit log works
        modification = Modification.objects.last()
        self.assertEqual(self.yoda, modification.user)
        self.assertEqual("202001", modification.past_value[0]["fields"]["period"])
        self.assertEqual("2022Q1", modification.new_value[0]["fields"]["period"])
        self.assertEqual(self.jedi_council_corruscant.id, modification.past_value[0]["fields"]["org_unit"])
        self.assertEqual(new_org_unit.id, modification.new_value[0]["fields"]["org_unit"])
        self.assertEqual(instance_to_patch, modification.content_object)

    def test_instance_patch_org_unit(self):
        """PATCH /instances/:pk"""
        self.client.force_authenticate(self.yoda)
        new_org_unit = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council Hospital", version=self.sw_version, org_unit_type=self.jedi_council
        )

        self.jedi_council_corruscant.version = self.sw_version
        self.jedi_council_corruscant.save()
        instance_to_patch = self.form_3.instances.first()

        response = self.client.patch(
            f"/api/instances/{instance_to_patch.id}/",
            data={"org_unit": new_org_unit.id},
            format="json",
            HTTP_ACCEPT="application/json",
        )
        self.assertJSONResponse(response, 200)

        instance_to_patch.refresh_from_db()
        self.assertEqual(instance_to_patch.org_unit, new_org_unit)
        self.assertEqual(instance_to_patch.period, None)

        # assert audit log works
        modification = Modification.objects.last()
        self.assertEqual(self.yoda, modification.user)
        self.assertEqual(None, modification.past_value[0]["fields"]["period"])
        self.assertEqual(None, modification.new_value[0]["fields"]["period"])
        self.assertEqual(self.jedi_council_corruscant.id, modification.past_value[0]["fields"]["org_unit"])
        self.assertEqual(new_org_unit.id, modification.new_value[0]["fields"]["org_unit"])
        self.assertEqual(instance_to_patch, modification.content_object)

    def test_instance_patch_org_unit_unlink_reference_instance_from_previous_org_unit(self):
        """PATCH /instances/:pk"""
        self.client.force_authenticate(self.yoda)

        previous_org_unit = m.OrgUnit.objects.create(
            name="previous organisation unit", version=self.sw_version, org_unit_type=self.jedi_council
        )

        instance = m.Instance.objects.create(org_unit=previous_org_unit, form=self.form_3, project=self.project)

        previous_org_unit.reference_instance = instance
        previous_org_unit.save()

        new_org_unit = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council Hospital", version=self.sw_version, org_unit_type=self.jedi_council
        )

        response = self.client.patch(
            f"/api/instances/{instance.id}/",
            data={"org_unit": new_org_unit.id},
            format="json",
            HTTP_ACCEPT="application/json",
        )

        self.assertJSONResponse(response, 200)
        previous_org_unit.refresh_from_db()
        instance.refresh_from_db()
        self.assertEqual(instance.org_unit, new_org_unit)
        self.assertEqual(previous_org_unit.reference_instance, None)

    def test_instance_patch_restore(self):
        """PATCH /instances/:pk"""
        self.client.force_authenticate(self.yoda)
        self.jedi_council_corruscant.version = self.sw_version
        self.jedi_council_corruscant.save()
        instance_to_patch = self.form_4.instances.first()
        self.assertTrue(instance_to_patch.deleted)
        self.assertEqual(0, Modification.objects.count())
        response = self.client.patch(
            f"/api/instances/{instance_to_patch.id}/",
            data={"deleted": False},
            format="json",
            HTTP_ACCEPT="application/json",
        )

        self.assertJSONResponse(response, 200)

        self.assertEqual(1, Modification.objects.count())
        instance_to_patch.refresh_from_db()
        self.assertFalse(instance_to_patch.deleted)

        # assert audit log works
        modification = Modification.objects.last()
        self.assertEqual(self.yoda, modification.user)
        self.assertNotEquals(modification.past_value[0]["fields"]["deleted"], modification.content_object.deleted)
        self.assertEqual(instance_to_patch, modification.content_object)

    def test_can_retrieve_instances_in_csv_format(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/instances/?format=csv", headers={"Content-Type": "text/csv"})
        self.assertFileResponse(response, 200, "text/csv; charset=utf-8")

    def test_user_restriction(self):
        full = self.create_user_with_profile(username="full", account=self.star_wars, permissions=["iaso_submissions"])
        self.client.force_authenticate(full)
        self.create_form_instance(
            form=self.form_1, period="202001", org_unit=self.jedi_council_endor, project=self.project
        )
        self.create_form_instance(
            form=self.form_1, period="202001", org_unit=self.jedi_council_endor_region, project=self.project
        )
        # without org unit. #TODO will waiting for precision on the spec, we also filter them
        self.create_form_instance(form=self.form_1, period="202001", project=self.project)

        org_unit_without_submissions = m.OrgUnit.objects.create(name="org unit without submissions")

        # not restricted yet, can list all instances
        response = self.client.get(f"/api/instances/")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 9)
        # restrict user to endor region, can only see one instance. Not instance without org unit
        restricted = self.create_user_with_profile(
            username="restricted", account=self.star_wars, permissions=["iaso_submissions"]
        )
        restricted.iaso_profile.org_units.set([self.jedi_council_endor_region])
        restricted.iaso_profile.save()
        self.client.force_authenticate(restricted)

        response = self.client.get(f"/api/instances/")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 1)

        # restrict to parent region, should give one instance for parent and one for child
        restricted.iaso_profile.org_units.set([self.jedi_council_endor])
        restricted.iaso_profile.save()

        response = self.client.get(f"/api/instances/")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 2)

        # check with multiple orgunits. Return all submissions, except the empty one on the one on endor, and the one without orgunit
        restricted.iaso_profile.org_units.set(
            [self.jedi_council_endor_region, self.jedi_council_corruscant, org_unit_without_submissions]
        )
        restricted.iaso_profile.save()

        response = self.client.get(f"/api/instances/")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 7)

        # Check org unit without submissions return empty
        restricted.iaso_profile.org_units.set([org_unit_without_submissions])

        response = self.client.get(f"/api/instances/")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 0)

    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def test_stats(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/instances/stats/")
        r = self.assertJSONResponse(response, 200)

        self.assertEqual(
            r["data"],
            [
                {
                    "Hydroponic public survey": 1,
                    "Hydroponic public survey III": 1,
                    "Hydroponics study": 4,
                    "index": "2020-02-01T00:00:00.000Z",
                    "name": "2020-02",
                }
            ],
        )

        self.assertListEqual(
            r["schema"]["fields"],
            [
                {"freq": "M", "name": "index", "type": "datetime"},
                {"name": "Hydroponics study", "type": "integer"},
                {"name": "Hydroponic public survey", "type": "integer"},
                {"name": "Hydroponic public survey III", "type": "integer"},
                {"name": "name", "type": "string"},
            ],
        )

    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def test_stats_sum(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/instances/stats_sum/")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(
            r["data"],
            [{"index": 0, "name": "2020-02-02", "period": "2020-02-02T00:00:00.000Z", "total": 6, "value": 6}],
        )

        self.assertEqual(
            r["schema"]["fields"],
            [
                {"name": "index", "type": "integer"},
                {"name": "period", "type": "datetime", "tz": "UTC"},
                {"name": "value", "type": "integer"},
                {"name": "total", "type": "integer"},
                {"name": "name", "type": "string"},
            ],
        )

    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def test_stats_dup(self):
        """Fix for regression on IA-940 endpoint was failing due to duplicate form name"""
        self.client.force_authenticate(self.yoda)
        duplicate_form_a = m.Form.objects.create(
            name="Duplicate form",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        duplicate_form_b = m.Form.objects.create(
            name="Duplicate form",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        self.create_form_instance(
            form=duplicate_form_a, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.create_form_instance(
            form=duplicate_form_b, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.create_form_instance(
            form=duplicate_form_b, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/instances/stats/")
        r = self.assertJSONResponse(response, 200)

        self.assertEqual(
            r["data"],
            [
                {
                    "Duplicate form": 2,
                    "Hydroponic public survey": 1,
                    "Hydroponic public survey III": 1,
                    "Hydroponics study": 4,
                    "index": "2020-02-01T00:00:00.000Z",
                    "name": "2020-02",
                }
            ],
        )
        response = self.client.get(f"/api/instances/stats_sum/")
        self.assertJSONResponse(response, 200)

    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def test_stats_dup_deleted(self):
        """Fix for regression on IA-940 endpoint was failing due to duplicate form name
        of a deleted form"""
        self.client.force_authenticate(self.yoda)
        duplicate_form_a = m.Form.objects.create(
            name="Duplicate form",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        duplicate_form_b = m.Form.objects.create(
            name="Duplicate form",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
            deleted_at=now(),
        )
        self.create_form_instance(
            form=duplicate_form_a, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.create_form_instance(
            form=duplicate_form_b, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.create_form_instance(
            form=duplicate_form_b, period="202001", org_unit=self.jedi_council_corruscant, project=self.project
        )
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/instances/stats/")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(
            r["data"],
            [
                {
                    "Duplicate form": 1,
                    "Hydroponic public survey": 1,
                    "Hydroponic public survey III": 1,
                    "Hydroponics study": 4,
                    "index": "2020-02-01T00:00:00.000Z",
                    "name": "2020-02",
                }
            ],
        )

        response = self.client.get(f"/api/instances/stats_sum/")
        self.assertJSONResponse(response, 200)

    def test_lock_instance(self):
        self.client.force_authenticate(self.yoda)

        instance = self.create_form_instance(
            org_unit=self.jedi_council_corruscant,
            period="202002",
            project=self.project,
            form=self.form_1,
        )

        response = self.client.post(f"/api/instances/{instance.pk}/add_lock/")

        lock = instance.instancelock_set.last()

        j = self.assertJSONResponse(response, 200)
        lock_id = j["lock_id"]
        self.assertEqual(lock.instance, instance)
        self.assertEqual(lock.id, lock_id)
        response = self.client.get(f"/api/instances/{instance.pk}/")
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(j["is_locked"], True)
        response = self.client.get(f"/api/instances/?limit=100")
        j = self.assertJSONResponse(response, 200)

        json_instance = list(filter(lambda x: x["id"] == instance.id, j["instances"]))[0]
        self.assertEqual(json_instance["is_locked"], True)

    def test_lock_scenario(self):
        """Mega test case for lock which test a lot of thing.
        A tree with 3 org units, 3 user and they add and remove lock.
        Between each step we ask the API (both detail and list) who has write access
        And we check by trying to modify the submission
        """
        instance = self.create_form_instance(
            org_unit=self.ou_top_3, project=self.project, form=self.form_1, period="202001"
        )
        alice = self.create_user_with_profile(
            username="alice", account=self.star_wars, permissions=["iaso_submissions", "iaso_update_submission"]
        )
        alice.iaso_profile.org_units.set([self.ou_top_1])
        bob = self.create_user_with_profile(
            username="bob", account=self.star_wars, permissions=["iaso_submissions", "iaso_update_submission"]
        )
        bob.iaso_profile.org_units.set([self.ou_top_2, self.ou_top_3])
        chris = self.create_user_with_profile(
            username="chris", account=self.star_wars, permissions=["iaso_submissions", "iaso_update_submission"]
        )
        chris.iaso_profile.org_units.set([self.ou_top_3])
        # Check that all user can modify, there is no lock
        for user in [alice, bob, chris]:
            self._check_via_api(instance, user, can_user_modify=True, is_locked=False)

        # Bob add a lock
        self.client.force_authenticate(bob)
        response = self.client.post(f"/api/instances/{instance.pk}/add_lock/")
        j = self.assertJSONResponse(response, 200)
        # Lock should be on ou_top_2
        lock = InstanceLock.objects.get(pk=j["lock_id"])
        self.assertEqual(lock.instance, instance)
        self.assertEqual(lock.top_org_unit, self.ou_top_2)
        # Alice, bob can modify but not chris
        self._check_via_api(instance, alice, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, bob, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, chris, can_user_modify=False, is_locked=True)
        # Alice add lock
        self.client.force_authenticate(alice)
        response = self.client.post(f"/api/instances/{instance.pk}/add_lock/")
        j = self.assertJSONResponse(response, 200)
        # Lock should be on ou_top_1
        lock = InstanceLock.objects.get(pk=j["lock_id"])
        self.assertEqual(lock.instance, instance)
        self.assertEqual(lock.top_org_unit, self.ou_top_1)
        self._check_via_api(instance, alice, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, bob, can_user_modify=False, is_locked=True)
        self._check_via_api(instance, chris, can_user_modify=False, is_locked=True)
        # Bob cannot remove Alice's lock
        self.client.force_authenticate(bob)
        response = self.client.post(
            f"/api/instances/unlock_lock/", {"lock": instance.instancelock_set.get(locked_by=alice).id}, json=True
        )
        self.assertJSONResponse(response, 403)
        # Alice remove her lock
        self.client.force_authenticate(alice)
        response = self.client.post(
            f"/api/instances/unlock_lock/", {"lock": instance.instancelock_set.get(locked_by=alice).id}, json=True
        )
        self.assertJSONResponse(response, 200)
        self._check_via_api(instance, alice, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, bob, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, chris, can_user_modify=False, is_locked=True)

        # Alice remove Bob's lock. No active lock, anyone can modify
        self.client.force_authenticate(alice)
        response = self.client.post(
            f"/api/instances/unlock_lock/", {"lock": instance.instancelock_set.get(locked_by=bob).id}, json=True
        )
        self.assertJSONResponse(response, 200)
        self._check_via_api(instance, alice, can_user_modify=True, is_locked=False)
        self._check_via_api(instance, bob, can_user_modify=True, is_locked=False)
        self._check_via_api(instance, chris, can_user_modify=True, is_locked=False)

        # Error if trying to unlock a lock already unlocked
        self.client.force_authenticate(alice)
        response = self.client.post(
            f"/api/instances/unlock_lock/", {"lock": instance.instancelock_set.get(locked_by=bob).id}, json=True
        )
        self.assertJSONResponse(response, 400)
        # Chris add lock. Anyone can modify
        self.client.force_authenticate(chris)
        response = self.client.post(f"/api/instances/{instance.pk}/add_lock/")
        j = self.assertJSONResponse(response, 200)
        # Lock should be on ou_top_3
        lock = InstanceLock.objects.get(pk=j["lock_id"])
        self.assertEqual(lock.instance, instance)
        self.assertEqual(lock.top_org_unit, self.ou_top_3)
        self._check_via_api(instance, alice, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, bob, can_user_modify=True, is_locked=True)
        self._check_via_api(instance, chris, can_user_modify=True, is_locked=True)

    def _check_via_api(self, instance, user, can_user_modify, is_locked):
        self.client.force_authenticate(user)
        response = self.client.get(f"/api/instances/{instance.pk}/")
        json = self.assertJSONResponse(response, 200)
        self.assertEqual(json["can_user_modify"], can_user_modify)
        self.assertEqual(json["is_locked"], is_locked)
        self.assertGreaterEqual(len(json["instance_locks"]), 1 if is_locked else 0, json["instance_locks"])
        # check from list view
        response = self.client.get(f"/api/instances/?limit=100")
        j = self.assertJSONResponse(response, 200)
        json_instance = list(filter(lambda x: x["id"] == instance.id, j["instances"]))[0]
        self.assertEqual(json_instance["is_locked"], is_locked)
        self.assertEqual(json_instance["can_user_modify"], can_user_modify)
        # Try to modify the instance
        response = self.client.patch(
            f"/api/instances/{instance.pk}/",
            {
                "period": "202201",
            },
            format="json",
        )
        if can_user_modify:
            self.assertJSONResponse(response, 200)
        else:
            self.assertJSONResponse(response, 403)

    def test_instance_create_entity(self):
        """POST /api/instances/ with an entity that don't exist in db, it creates it"""

        instance_uuid = str(uuid4())
        entity_uuid = str(uuid4())
        entity_type = m.EntityType.objects.create(account=self.star_wars)

        pre_existing_instance_count = m.Instance.objects.count()
        pre_existing_entity_count = m.Entity.objects.count()
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type.id,
                "name": "Mobile app name i2",
            },
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        self.assertEqual(pre_existing_instance_count + 1, m.Instance.objects.count())  # One added instance
        self.assertEqual(pre_existing_entity_count + 1, m.Entity.objects.count())  # One added instance
        entity = m.Entity.objects.get(uuid=entity_uuid)
        instance = m.Instance.objects.get(uuid=instance_uuid)
        self.assertEqual(entity.attributes, None)
        self.assertQuerysetEqual(entity.instances.all(), [instance], ordered=False)
        self.assertEqual(instance.entity, entity)
        self.assertEqual(entity.entity_type, entity_type)
        self.assertEqual(entity.account, self.star_wars)

    def test_instance_create_preexisting_entity(self):
        """POST /api/instances/ with an entity that exist in db, do not create it"""

        instance_uuid = str(uuid4())
        entity_uuid = str(uuid4())
        entity_type = m.EntityType.objects.create(account=self.star_wars)

        m.Entity.objects.create(
            account=self.star_wars,
            entity_type=entity_type,
            uuid=entity_uuid,
        )

        pre_existing_instance_count = m.Instance.objects.count()
        pre_existing_entity_count = m.Entity.objects.count()
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type.id,
                "name": "Mobile app name i2",
            },
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        self.assertEqual(pre_existing_instance_count + 1, m.Instance.objects.count())  # One added instance
        self.assertEqual(pre_existing_entity_count, m.Entity.objects.count())  # No added enity
        entity = m.Entity.objects.get(uuid=entity_uuid)
        instance = m.Instance.objects.get(uuid=instance_uuid)
        self.assertEqual(entity.attributes, None)
        self.assertQuerysetEqual(entity.instances.all(), [instance], ordered=False)
        self.assertEqual(instance.entity, entity)
        self.assertEqual(entity.entity_type, entity_type)
        self.assertEqual(entity.account, self.star_wars)

    def test_instance_create_preexisting_entity_attribute(self):
        """POST /api/instances/ with a new entity where form is reference_form set new instance as attributes"""

        instance_uuid = str(uuid4())
        entity_uuid = str(uuid4())
        entity_type = m.EntityType.objects.create(account=self.star_wars, reference_form=self.form_1)

        pre_existing_instance_count = m.Instance.objects.count()
        pre_existing_entity_count = m.Entity.objects.count()
        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type.id,
                "name": "Mobile app name i2",
            },
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertAPIImport("instance", request_body=body, has_problems=False)

        self.assertEqual(pre_existing_instance_count + 1, m.Instance.objects.count())  # One added instance
        self.assertEqual(pre_existing_entity_count + 1, m.Entity.objects.count())  # One added Entity
        entity = m.Entity.objects.get(uuid=entity_uuid)
        instance = m.Instance.objects.get(uuid=instance_uuid)
        self.assertEqual(entity.attributes, instance)
        self.assertQuerysetEqual(entity.instances.all(), [instance], ordered=False)
        self.assertEqual(instance.entity, entity)
        self.assertEqual(entity.entity_type, entity_type)
        self.assertEqual(entity.account, self.star_wars)

    def test_assign_form_version_id_on_save(self):
        instance_uuid = str(uuid4())
        entity_uuid = str(uuid4())
        entity_type = m.EntityType.objects.create(account=self.star_wars)

        body = [
            {
                "id": instance_uuid,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type.id,
                "name": "Mobile app name i2",
            },
        ]
        response = self.client.post(
            f"/api/instances/?app_id=stars.empire.agriculture.hydroponics", data=body, format="json"
        )

        self.assertEqual(response.status_code, 200)

        # Check if the instance created without FormVersion has form_version = None

        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.get(uuid=instance_uuid)

        response = self.client.get(f"/api/instances/{instance.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["form_version_id"], None)

        # Check that once the FormVersion is created and instance.json updated with a "_version" instance.form_version_id is properly updated

        form_version = FormVersion.objects.create(version_id="2022112301", form_id=instance.form.id)

        instance.json = {
            "end": "2022-11-23T12:12:45.803+01:00",
            "start": "2022-11-23T12:12:25.930+01:00",
            "_version": "2022112301",
            "ou_region": "30015",
            "instanceID": "uuid:381e988e-87b5-4758-b31a-eb1dac1430a7",
            "ou_country": "29694",
            "admin_doses": "66",
            "ou_district": "32128",
            "insert_obr_name": "",
            "insert_doses_requested": "",
        }
        instance.save()

    def test_instances_list_planning(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/instances/", headers={"Content-Type": "application/json"})
        self.assertEqual(response.status_code, 200)
        self.assertValidInstanceListData(response.json(), 6)

        team = Team.objects.create(project=self.project, manager=self.yoda)
        orgunit = m.OrgUnit.objects.create(name="Org Unit 1")
        instance_1 = self.create_form_instance(form=self.form_1, period="202001", org_unit=orgunit)
        instance_2 = self.create_form_instance(
            form=self.form_1, period="202002", org_unit=orgunit, last_export_success_at=now()
        )
        planning_1 = Planning.objects.create(name="Planning 1", org_unit=orgunit, project=self.project, team=team)
        planning_2 = Planning.objects.create(name="Planning 2", org_unit=orgunit, project=self.project, team=team)

        planning_1.instances.add(instance_1)

        # it should return only instance_1
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            "/api/instances/", {"planning_id": planning_1.id}, headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 1)
        self.assertEqual(response.json()["instances"][0]["name"], instance_1.name)
        # it should return instance_1 and instance_2
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/instances/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 2)
        self.assertEqual(response.json()["instances"][0]["name"], instance_2.name)
        self.assertEqual(response.json()["instances"][1]["name"], instance_1.name)
        # it should return none of the forms
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            "/api/instances/", {"planning_id": planning_2.id}, headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 0)
