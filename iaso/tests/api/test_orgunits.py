from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Polygon, Point, MultiPolygon
from django.test import tag
import typing
import datetime

from iaso import models as m
from hat.audit import models as am
from iaso.test import APITestCase


class OrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.luke = cls.create_user_with_profile(
            username="luke", account=star_wars, permissions=["iaso_org_units"], org_units=[cls.jedi_council_endor]
        )
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

    @tag("iaso_only")
    def test_org_unit_bulkupdate_not_authenticated(self):
        """POST /orgunits/bulkupdate, no auth -> 403"""

        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_REJECTED},
            format="json",
        )
        self.assertJSONResponse(response, 403)
        self.assertEqual(0, m.BulkOperation.objects.count())
        self.assertEqual(0, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access to specified org units)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(0, m.BulkOperation.objects.count())
        self.assertEqual(0, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access any org unit)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_REJECTED},
            format="json",
        )

        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(0, m.BulkOperation.objects.count())
        self.assertEqual(0, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some(self):
        """POST /orgunits/bulkupdate happy path"""

        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
            "groups_added": [self.unofficial_group.pk],
            "validation_status": m.OrgUnit.VALIDATION_REJECTED,
        }
        response = self.client.post(f"/api/orgunits/bulkupdate/", data=operation_payload, format="json")
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_REJECTED)
            self.assertIn(self.unofficial_group, jedi_council.groups.all())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_REJECTED)
        self.assertNotIn(self.unofficial_group, self.jedi_council_corruscant.groups.all())

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(2, am.Modification.objects.count())

        operation = m.BulkOperation.objects.first()
        self.assertEqual(ContentType.objects.get_for_model(m.OrgUnit), operation.content_type)
        self.assertEqual(operation_payload, operation.json_body)
        self.assertEqual(self.yoda, operation.user)
        self.assertEqual(m.BulkOperation.OPERATION_TYPE_UPDATE, operation.operation_type)
        self.assertEqual(2, operation.operation_count)

        modification_endor = am.Modification.objects.get(object_id=self.jedi_council_endor.pk)
        self.assertEqual(ContentType.objects.get_for_model(m.OrgUnit), modification_endor.content_type)
        self.assertEqual(self.yoda, modification_endor.user)
        self.assertEqual(am.ORG_UNIT_API_BULK, modification_endor.source)
        self.assertEqual(m.OrgUnit.VALIDATION_VALID, modification_endor.past_value[0]["fields"]["validation_status"])
        self.assertEqual(m.OrgUnit.VALIDATION_REJECTED, modification_endor.new_value[0]["fields"]["validation_status"])

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all(self):
        """POST /orgunits/bulkupdate happy path (select all)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_VALID},
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_corruscant, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(5, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_with_search(self):
        """POST /orgunits/bulkupdate happy path (select all, but with search)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": True,
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
                "searches": [{"group": f"{self.elite_group.pk}"}],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(self.jedi_council_corruscant.validation_status, m.OrgUnit.VALIDATION_REJECTED)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(1, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_search_with_ids(self):
        """GET /orgunits/ with a search based on refs"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","search":"refs%3AF9w3VW1cQmb%2CPvtAI4RUMkr","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

    @tag("iaso_only")
    def test_org_unit_search_with_ref(self):
        """GET /orgunits/ with a search based on ids"""

        self.client.force_authenticate(self.yoda)
        endor_id = self.jedi_council_endor.id
        corr_id = self.jedi_council_corruscant.id

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","search":"ids%3A'
            + str(endor_id)
            + "%2C"
            + str(corr_id)
            + '","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

    @tag("iaso_only")
    def test_org_unit_search(self):
        """GET /orgunits/ with a search based on name"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","search":"corr","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 1)
        ou_id = response.json()["orgunits"][0]["id"]
        self.assertEqual(ou_id, self.jedi_council_corruscant.id)

    @tag("iaso_only")
    def test_org_unit_instance_duplicate_search(self):
        """GET /orgunits/ with a search based on duplicates"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","hasInstances":"duplicates","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 1)
        ou_id = response.json()["orgunits"][0]["id"]
        self.assertEqual(ou_id, self.jedi_council_corruscant.id)

    @tag("iaso_only")
    def test_org_unit_instance_dates_search(self):
        """GET /orgunits/ with a search based on dates"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","dateFrom":"2021-02-10 00:00:00","dateTo":"2050-06-26 23:00:00","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 1)
        instances_count = response.json()["orgunits"][0]["instances_count"]
        self.assertEqual(instances_count, m.Instance.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_with_multiple_searches(self):
        """POST /orgunits/bulkupdate happy path (select all, but with multiple searches)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": True,
                "groups_added": [self.another_group.pk],
                "searches": [{"validation_status": "all"}, {"validation_status": m.OrgUnit.VALIDATION_REJECTED}],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertIn(self.another_group, jedi_council.groups.all())

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(5, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_but_some(self):
        """POST /orgunits/bulkupdate/ happy path (select all except some)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/bulkupdate/",
            data={
                "select_all": True,
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
                "unselected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
                "groups_removed": [self.elite_group.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        self.assertValidBulkupdateData(response.json())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(self.jedi_council_corruscant.validation_status, m.OrgUnit.VALIDATION_REJECTED)
        self.assertNotIn(self.elite_group, self.jedi_council_corruscant.groups.all())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(3, am.Modification.objects.count())

    def test_org_unit_list_without_auth_or_app_id(self):
        """GET /api/orgunits/ with no auth or app id -> 200 with 0 org unit"""

        response = self.client.get(f"/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=0)

    def test_org_unit_list_ok(self):
        """GET /api/orgunits/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=5)

    def test_org_unit_list_ok_user_has_org_unit_restrictions(self):
        """GET /api/orgunits/ happy path"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=3)

    @tag("iaso_only")
    def test_org_unit_retrieve_without_auth_or_app_id(self):
        """GET /orgunits/<org_unit_id>/ without auth or app id should result in a 200 empty response"""

        response = self.client.get(f"/api/orgunits/{self.jedi_council_corruscant.id}/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_org_unit_retrieve_wrong_user(self):
        """GET /orgunits/<org_unit_id>/ with user that does not have access to the org unit -> 404"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/{self.jedi_council_corruscant.id}/")
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_org_unit_retrieve_ok_1(self):
        """GET /orgunits/<org_unit_id>/ happy path (user has no restriction)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{self.jedi_council_corruscant.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())

    @tag("iaso_only")
    def test_org_unit_retrieve_ok_2(self):
        """GET /orgunits/<org_unit_id>/ happy path (user is restricted to a few org units)"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/{self.jedi_squad_endor.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())

    def assertValidOrgUnitListData(self, *, list_data: typing.Mapping, expected_length: int):
        self.assertValidListData(list_data=list_data, results_key="orgUnits", expected_length=expected_length)
        for org_unit_data in list_data["orgUnits"]:
            self.assertValidOrgUnitData(org_unit_data)

    def assertValidOrgUnitData(self, org_unit_data: typing.Mapping):
        self.assertHasField(org_unit_data, "id", int)
        self.assertHasField(org_unit_data, "name", str)

    def assertValidBulkupdateData(self, bulkupdate_data: typing.Mapping):
        self.assertHasField(bulkupdate_data, "id", int)
