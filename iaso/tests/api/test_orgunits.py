import csv
import datetime
import io
import json
import typing

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Point, Polygon
from django.db import connection
from django.test import SimpleTestCase
from rest_framework import status

from hat.audit.models import Modification
from iaso import models as m
from iaso.api.org_units import OrgUnitViewSet
from iaso.models import OrgUnit, OrgUnitType
from iaso.test import APITestCase
from iaso.utils.gis import simplify_geom


class OrgUnitAPIUtilsTestCase(SimpleTestCase):
    def test_get_date(self):
        """
        Test OrgUnitViewSet.get_date()
        """
        self.assertEqual(OrgUnitViewSet().get_date(None), None)
        self.assertEqual(OrgUnitViewSet().get_date(""), None)
        self.assertEqual(OrgUnitViewSet().get_date("03-04-2025"), datetime.date(2025, 4, 3))
        self.assertEqual(OrgUnitViewSet().get_date("03/04/2025"), datetime.date(2025, 4, 3))
        self.assertEqual(OrgUnitViewSet().get_date("2025-04-03"), datetime.date(2025, 4, 3))
        self.assertEqual(OrgUnitViewSet().get_date("2025/04/03"), datetime.date(2025, 4, 3))


class OrgUnitAPITestCase(APITestCase):
    ORG_UNIT_CREATE_URL = "/api/orgunits/create_org_unit/"

    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        cls.sw_source = sw_source
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.sw_version_2 = sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        jedi_squad.projects.add(project)
        jedi_squad.save()
        cls.reference_form = reference_form = m.Form.objects.create(
            name="Reference form", period_type=m.MONTH, single_per_period=True
        )
        cls.not_a_reference_form = not_a_reference_form = m.Form.objects.create(
            name="Not a reference form", period_type=m.MONTH, single_per_period=True
        )
        cls.jedi_council = jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council",
            short_name="Cnc",
        )
        jedi_council.sub_unit_types.add(jedi_squad)
        cls.jedi_council.reference_forms.add(cls.reference_form)
        cls.jedi_council.save()

        cls.mock_multipolygon = mock_multipolygon = MultiPolygon(
            Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])
        )
        cls.mock_point = mock_point = Point(x=4, y=50, z=100)
        cls.mock_multipolygon_empty = mock_multipolygon_empty = GEOSGeometry("MULTIPOLYGON EMPTY", srid=4326)

        cls.elite_group = elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            code="code1",
        )

        cls.instance_related_to_reference_form = cls.create_form_instance(
            form=reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.instance_not_related_to_reference_form = cls.create_form_instance(
            form=not_a_reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        jedi_council_corruscant.groups.set([elite_group])

        cls.jedi_council_endor = jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=mock_multipolygon_empty,
            simplified_geom=mock_multipolygon_empty,
            catchment=mock_multipolygon_empty,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code2",
        )

        # I am really sorry to have to rely on this ugly hack to set the location field to an empty point, but
        # unfortunately GEOS doesn't seem to support empty 3D geometries yet:
        # see: https://trac.osgeo.org/geos/ticket/1129, https://trac.osgeo.org/geos/ticket/1005 and
        # https://code.djangoproject.com/ticket/33787 for example
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE iaso_orgunit SET location=ST_GeomFromText('POINT Z EMPTY') WHERE id = %s",
                [jedi_council_endor.pk],
            )

        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=jedi_council_endor,
            org_unit_type=jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=mock_multipolygon,
            catchment=mock_multipolygon,
            location=mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
            code="code3",
        )
        cls.jedi_squad_endor_2 = m.OrgUnit.objects.create(
            parent=jedi_council_endor,
            org_unit_type=jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 2",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code4",
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            location=mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code5",
        )

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.user_read_permission = cls.create_user_with_profile(
            username="user_read_permission",
            account=star_wars,
            permissions=["iaso_org_units_read"],
        )
        cls.luke = cls.create_user_with_profile(
            username="luke",
            account=star_wars,
            permissions=["iaso_org_units"],
            org_units=[jedi_council_endor],
        )
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.form_1 = form_1 = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )

        cls.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.create_form_instance(
            form=form_1,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

    def setUp(self):
        self.old_counts = self.counts()

    def counts(self) -> dict:
        return {
            m.OrgUnit: m.OrgUnit.objects.count(),
            m.OrgUnitType: m.OrgUnitType.objects.count(),
            Modification: Modification.objects.count(),
        }

    def assertValidOrgUnitListData(self, *, list_data: typing.Mapping, expected_length: int):
        self.assertValidListData(list_data=list_data, results_key="orgUnits", expected_length=expected_length)
        for org_unit_data in list_data["orgUnits"]:
            self.assertValidOrgUnitData(org_unit_data)

    def assertValidOrgUnitData(self, org_unit_data: typing.Mapping):
        self.assertHasField(org_unit_data, "id", int)
        self.assertHasField(org_unit_data, "name", str)

    def assertNoCreation(self):
        self.assertEqual(self.old_counts, self.counts())

    def assertCreated(self, createds: dict):
        new_counts = self.counts()
        diff = {}

        for model in new_counts.keys():
            diff[model] = new_counts[model] - self.old_counts[model]

        self.assertTrue(set(createds.items()).issubset(set(diff.items())))

    def test_org_unit_search_with_ids(self):
        """GET /orgunits/ with a search based on refs"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","search":"refs%3AF9w3VW1cQmb%2CPvtAI4RUMkr","orgUnitParentId":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

    def test_org_unit_search_with_project(self):
        """GET /orgunits/ with a search based on project"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"project":'
            + str(self.project.id)
            + "}]&limit=50"
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

    def test_org_unit_list_depth(self):
        """GET /orgunits/ with a search based on refs"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","depth":"2"}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","depth":"1"}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 3)
        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","depth":"0"}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 0)
        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","depth":"3"}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 0)

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

    def test_org_unit_search_with_external_refs(self):
        """GET /orgunits/ with a search based on refs - real external & fake external (internal)"""
        # First, let's set a source ref on this orgunit, because there is none in the setup
        jedi_counsil_endor_source_ref = "sOuRcErEf"
        self.jedi_council_endor.source_ref = jedi_counsil_endor_source_ref
        self.jedi_council_endor.save()
        self.jedi_council_endor.refresh_from_db()

        invalid_external_ref = "iTsAMeMario"
        invalid_iaso_id = 12345678987654321

        # Let's add a mix of existing and non-existing refs, both external and fake external
        search_criteria = {
            "validation_status": "all",
            "version": self.sw_version_1.id,
            "search": f"refs: {self.jedi_council_corruscant.source_ref} iaso:{invalid_iaso_id} {self.jedi_council_endor.source_ref} iaso:{self.jedi_squad_endor.id} {invalid_external_ref}",
        }
        search_criteria_str = json.dumps(search_criteria)

        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{search_criteria_str}]&limit=50"
        )
        self.assertJSONResponse(response, 200)

        response_json = response.json()
        self.assertEqual(response_json["count"], 3)
        org_units = response_json["orgunits"]
        self.assertEqual(org_units[0]["id"], self.jedi_council_corruscant.id)
        self.assertEqual(org_units[0]["source_ref"], self.jedi_council_corruscant.source_ref)
        self.assertEqual(org_units[1]["id"], self.jedi_council_endor.id)
        self.assertEqual(org_units[1]["source_ref"], jedi_counsil_endor_source_ref)
        self.assertEqual(org_units[2]["id"], self.jedi_squad_endor.id)

    def test_org_unit_search_with_code(self):
        """GET /orgunits/ with a search based on codes"""
        search_criteria = {
            "validation_status": "all",
            "version": self.sw_version_1.id,
            "search": f"codes: {self.jedi_council_endor.code} {self.jedi_council_corruscant.code} unknown_code",
        }
        search_criteria_str = json.dumps(search_criteria)

        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{search_criteria_str}]&limit=50"
        )
        response_json = self.assertJSONResponse(response, 200)

        self.assertEqual(response_json["count"], 2)
        org_units = response_json["orgunits"]
        self.assertEqual(org_units[0]["id"], self.jedi_council_corruscant.id)
        self.assertEqual(org_units[1]["id"], self.jedi_council_endor.id)

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

    def test_org_unit_search_geography_any(self):
        """GET /orgunits/ filtered so only OUs with geolocation are returned.

        This is what happens when a dashboard user choose "Données géographiques - avec point ou territoire"

        With geolocation meaning:
            - the OU has a point location in the location field
            - OR the OU has a shape in the simplified_geom field
            - OR both

        Empty geometries (POINT EMPTY, ...) and NULL values are both considered as "no geolocation" (see IA-1141)
        """
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","geography":"any","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()

        # Without filters there would be 5 OU, but 2 are filtered because they lack geolocation: Corruscant jedi council
        # (null values) and Endor Jedi council: empty geometries
        self.assertEqual(json_response["count"], 3)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertNotIn(self.jedi_council_corruscant.id, returned_ou_ids)
        self.assertNotIn(self.jedi_council_endor.id, returned_ou_ids)

    def test_org_unit_search_geography_none(self):
        """GET /orgunits/ filtered so only OUs without geolocation are returned.

        This is what happens when a dashboard user choose "Données géographiques - Sans données géographiques".
        This tests the opposite than test_org_unit_search_geography_any()
        """
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","geography":"none","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()

        # Without filters there would be 5 OU, but 3 are filtered because they have geolocation: only Corruscant jedi
        # council and Endor Jedi council are kept
        self.assertEqual(json_response["count"], 2)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(
            returned_ou_ids,
            {self.jedi_council_corruscant.id, self.jedi_council_endor.id},
        )

    def test_org_unit_search_geography_location(self):
        """GET /orgunits/ filtered so only OUs with a point location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","geography":"location","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()

        # Only Endor Jedi Squad 1 have non-empty points inthe location field
        self.assertEqual(json_response["count"], 2)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(returned_ou_ids, {self.jedi_squad_endor.id, self.jedi_council_brussels.id})

    def test_org_unit_search_geography_shape(self):
        """GET /orgunits/ filtered so only OUs with a shape location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","geography":"shape","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()

        # Only Endor Jedi Squad 1 have non-empty points in the simplified_geom field
        self.assertEqual(json_response["count"], 2)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(returned_ou_ids, {self.jedi_squad_endor_2.id, self.jedi_council_brussels.id})

    def test_org_unit_search_geography_with_shape_true(self):
        """GET /orgunits/ filtered so only OUs with a shape location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","withShape":"true","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()

        # Only Endor Jedi Squad 1 have non-empty points in the simplified_geom field
        self.assertEqual(json_response["count"], 2)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(returned_ou_ids, {self.jedi_squad_endor_2.id, self.jedi_council_brussels.id})

    def test_org_unit_search_geography_with_shape_false(self):
        """GET /orgunits/ filtered so only OUs without a shape location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","withShape":"false","dateFrom":null,"dateTo":null}]&limit=50'
        )
        self.assertJSONResponse(response, 200)
        json_response = response.json()
        self.assertEqual(json_response["count"], 3)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(
            returned_ou_ids,
            {
                self.jedi_squad_endor.id,
                self.jedi_council_corruscant.id,
                self.jedi_council_endor.id,
            },
        )

    def test_org_unit_search_geography_with_location_true(self):
        """GET /orgunits/ filtered so only OUs with a point location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","withLocation":"true","dateFrom":null,"dateTo":null}]&limit=50'
        )

        self.assertJSONResponse(response, 200)
        json_response = response.json()
        self.assertEqual(json_response["count"], 2)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(returned_ou_ids, {self.jedi_squad_endor.id, self.jedi_council_brussels.id})

    def test_org_unit_search_geography_with_location_false(self):
        """GET /orgunits/ filtered so only OUs without a point location are returned"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"f4511e","withLocation":"false","dateFrom":null,"dateTo":null}]&limit=50'
        )

        self.assertJSONResponse(response, 200)
        json_response = response.json()
        self.assertEqual(json_response["count"], 3)
        returned_ou_ids = {ou["id"] for ou in json_response["orgunits"]}
        self.assertEqual(
            returned_ou_ids,
            {
                self.jedi_council_corruscant.id,
                self.jedi_council_endor.id,
                self.jedi_squad_endor_2.id,
            },
        )

    def test_org_units_tree_super_user(self):
        """Search orgunits tree when the user is a super user"""
        org_unit_country = m.OrgUnit.objects.create(
            name="Country",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        super_user = self.create_user_with_profile(
            username="superUser",
            is_superuser=True,
            account=self.star_wars,
            permissions=["iaso_org_units"],
        )
        super_user.iaso_profile.org_units.set([org_unit_country])
        super_user.save()
        super_user.refresh_from_db()
        self.client.force_authenticate(super_user)

        response = self.client.get(
            "/api/orgunits/treesearch/?&rootsForUser=true&defaultVersion=true&validation_status=all&ignoreEmptyNames=true"
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertEqual(len(jr["orgunits"]), 3)

    def test_org_units_tree_user_manager(self):
        """Search orgunits tree when the user is a user manager"""
        org_unit_country = m.OrgUnit.objects.create(
            name="Country",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )

        user_manager = self.create_user_with_profile(
            username="userManager",
            account=self.star_wars,
            permissions=["iaso_org_units"],
        )
        user_manager.iaso_profile.org_units.set([org_unit_country])
        user_manager.save()
        user_manager.refresh_from_db()
        self.client.force_authenticate(user_manager)

        response = self.client.get(
            "/api/orgunits/treesearch/?&rootsForUser=true&defaultVersion=true&validation_status=all&ignoreEmptyNames=true"
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertEqual(len(jr["orgunits"]), 1)

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

    def test_org_unit_list_without_auth_or_app_id(self):
        """GET /api/orgunits/ with no auth or app id -> 200 with 0 org unit"""

        response = self.client.get("/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=0)

    def test_org_unit_list_ok(self):
        """GET /api/orgunits/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=5)

    def test_org_unit_list_ok_user_has_org_unit_restrictions(self):
        """GET /api/orgunits/ happy path"""

        self.client.force_authenticate(self.luke)
        response = self.client.get("/api/orgunits/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=3)

    def test_org_unit_list_roots_ok_user_has_org_unit_restrictions(self):
        """GET /api/orgunits/?rootsForUser=true"""

        self.client.force_authenticate(self.luke)
        response = self.client.get("/api/orgunits/?rootsForUser=true")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=1)
        self.assertEqual(self.jedi_council_endor.pk, response_data["orgUnits"][0]["id"])

    def test_org_unit_list_roots_ok_user_no_org_unit_restrictions(self):
        """GET /api/orgunits/?rootsForUser=true"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?rootsForUser=true")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=3)
        for orgunit in response_data["orgUnits"]:
            self.assertEqual(orgunit["parent_id"], None)

    def test_org_unit_list_with_as_location_with_group(self):
        """
        Test that `build_org_units_queryset()` which sets `.distinct()` clauses
        when the `group` param is used doesn't cause `Paginator` to fail.
        """
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?asLocation=true&limit=1&group=1")
        self.assertJSONResponse(response, 200)

    def test_org_unit_list_without_as_location_with_group(self):
        """
        Test that `build_org_units_queryset()` which sets `.distinct()` clauses
        when the `group` param is used doesn't cause `Paginator` to fail.
        """
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?limit=1&group=1")
        self.assertJSONResponse(response, 200)

    def test_org_unit_retrieve_without_auth_or_app_id(self):
        """GET /orgunits/<org_unit_id>/ without auth or app id should result in a 200 empty response"""

        response = self.client.get(f"/api/orgunits/{self.jedi_council_corruscant.id}/")
        self.assertJSONResponse(response, 404)

    def test_org_unit_retrieve_wrong_user(self):
        """GET /orgunits/<org_unit_id>/ with user that does not have access to the org unit -> 404"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/{self.jedi_council_corruscant.id}/")
        self.assertJSONResponse(response, 404)

    def test_org_unit_retrieve_ok_1(self):
        """GET /orgunits/<org_unit_id>/ happy path (user has no restriction)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{self.jedi_squad_endor.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())
        self.assertEqual(response.data["reference_instances"], [])

    def test_org_unit_retrieve_ok_2(self):
        """GET /orgunits/<org_unit_id>/ happy path (user is restricted to a few org units)"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/{self.jedi_squad_endor.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())
        self.assertEqual(response.data["reference_instances"], [])

    def test_org_unit_retrieve_geo_json(self):
        org_unit = self.jedi_squad_endor

        user = self.luke
        self.client.force_authenticate(user)

        # `geo_json` should be `None` when there is no shape.
        response = self.client.get(f"/api/orgunits/{org_unit.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())
        self.assertEqual(response.data["geo_json"], None)

        org_unit.geom = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        org_unit.simplified_geom = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)]))
        org_unit.save()

        # `geo_json` should be the "simplified shape" in most cases.
        response = self.client.get(f"/api/orgunits/{org_unit.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())
        geo_json_coordinates = response.data["geo_json"]["features"][0]["geometry"]["coordinates"]
        expected_coordinates = [[[[0, 0], [0, 1], [1, 1], [0, 0]]]]
        self.assertEqual(geo_json_coordinates, expected_coordinates)

        allow_shape_edition_flag = m.AccountFeatureFlag.objects.get(code="ALLOW_SHAPE_EDITION")
        user.iaso_profile.account.feature_flags.add(allow_shape_edition_flag)

        # `geo_json` should be the "full shape" when `ALLOW_SHAPE_EDITION` is enabled.
        response = self.client.get(f"/api/orgunits/{org_unit.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())
        geo_json_coordinates = response.data["geo_json"]["features"][0]["geometry"]["coordinates"]
        expected_coordinates = [[[[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]]]
        self.assertEqual(geo_json_coordinates, expected_coordinates)

    def test_org_unit_retrieve_with_instances_count(self):
        self.client.force_authenticate(self.yoda)

        parent_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            name="Parent",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        descendant_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            name="Descendant",
            parent=parent_org_unit,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=descendant_org_unit,
            project=self.project,
            json={"name": "a", "age": 18, "gender": "M"},
        )

        self.create_form_instance(
            form=self.form_1,
            period="202001",
            org_unit=parent_org_unit,
            project=self.project,
            json={"name": "b", "age": 19, "gender": "F"},
        )
        # Test the descendant instances count
        response_descendant = self.client.get(f"/api/orgunits/{descendant_org_unit.id}/")
        self.assertJSONResponse(response_descendant, 200)
        descendant_instances_count = response_descendant.json()["instances_count"]
        self.assertEqual(descendant_instances_count, 1)

        # Test the parent instances count
        response_parent = self.client.get(f"/api/orgunits/{parent_org_unit.id}/")
        self.assertJSONResponse(response_parent, 200)
        parent_instances_count = response_parent.json()["instances_count"]
        self.assertEqual(parent_instances_count, 2)

    def test_can_retrieve_org_units_in_csv_format(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/orgunits/{self.jedi_squad_endor.id}/?format=csv",
            headers={"Content-Type": "text/csv"},
        )
        self.assertFileResponse(response, 200, "text/csv; charset=utf-8")

    def test_can_retrieve_org_units_list_in_csv_format(self):
        """It tests the csv org unit export data"""

        self.yoda.username = "yoda"
        self.yoda.last_name = "Da"
        self.yoda.first_name = "Yo"
        self.yoda.save()

        self.jedi_council_brussels.creator = self.yoda
        self.jedi_council_brussels.save()

        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/orgunits/?order=id&csv=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")

        response_csv = response.getvalue().decode("utf-8")

        response_string = "".join(s for s in response_csv)
        reader = csv.reader(io.StringIO(response_string), delimiter=",")
        data = list(reader)

        headers = data[0]
        self.assertEqual(
            headers,
            [
                "ID",
                "Nom",
                "Type",
                "Latitude",
                "Longitude",
                "Code",
                "Date d'ouverture",
                "Date de fermeture",
                "Date de création",
                "Date de modification",
                "Créé par",
                "Source",
                "Validé",
                "Référence externe",
                "parent 1",
                "parent 2",
                "parent 3",
                "parent 4",
                "Ref Ext parent 1",
                "Ref Ext parent 2",
                "Ref Ext parent 3",
                "Ref Ext parent 4",
                "Total de soumissions",
                self.elite_group.name,
            ],
        )

        first_row = data[1]
        first_row_name = first_row[1]
        self.assertEqual(first_row_name, self.jedi_council_corruscant.name)

        first_row_code = first_row[5]
        self.assertEqual(first_row_code, self.jedi_council_corruscant.code)

    def test_can_retrieve_org_units_list_in_xlsx_format(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?&order=id&xlsx=true")
        columns, excel_data = self.assertXlsxFileResponse(response)

        self.assertEqual(
            columns,
            [
                "ID",
                "Nom",
                "Type",
                "Latitude",
                "Longitude",
                "Code",
                "Date d'ouverture",
                "Date de fermeture",
                "Date de création",
                "Date de modification",
                "Créé par",
                "Source",
                "Validé",
                "Référence externe",
                "parent 1",
                "parent 2",
                "parent 3",
                "parent 4",
                "Ref Ext parent 1",
                "Ref Ext parent 2",
                "Ref Ext parent 3",
                "Ref Ext parent 4",
                "Total de soumissions",
                self.elite_group.name,
            ],
        )

        ids = excel_data["ID"]
        self.assertEqual(
            ids,
            {
                0: self.jedi_council_corruscant.id,
                1: self.jedi_council_endor.id,
                2: self.jedi_squad_endor.id,
                3: self.jedi_squad_endor_2.id,
                4: self.jedi_council_brussels.id,
            },
        )

        codes = excel_data["Code"]
        self.assertEqual(
            codes,
            {
                0: self.jedi_council_corruscant.code,
                1: self.jedi_council_endor.code,
                2: self.jedi_squad_endor.code,
                3: self.jedi_squad_endor_2.code,
                4: self.jedi_council_brussels.code,
            },
        )

    def set_up_org_unit_creation(self):
        return self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "id": None,
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
                "opening_date": "01-01-2024",
                "code": "very-nice",
            },
        )

    def test_create_org_unit_with_read_permission(self):
        """Check that we cannot create org unit with org units read only permission"""
        self.client.force_authenticate(self.user_read_permission)
        response = self.set_up_org_unit_creation()
        self.assertJSONResponse(response, 403)

    def test_create_org_unit_should_fail_with_restricted_editable_org_unit_types(self):
        """
        Check that we cannot create an org unit if writing rights are limited
        by a set of org unit types that we are allowed to modify.
        """
        self.yoda.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type are now writable.
            [self.jedi_squad]
        )
        self.client.force_authenticate(self.yoda)
        response = self.set_up_org_unit_creation()
        json_response = self.assertJSONResponse(response, 400)
        self.assertEqual(json_response[0]["errorKey"], "org_unit_type_id")
        self.assertEqual(
            json_response[0]["errorMessage"],
            "You cannot create or edit an Org unit of this type",
        )
        self.yoda.iaso_profile.editable_org_unit_types.clear()

    def test_create_org_unit(self):
        """Check that we can create org unit with only org units management permission"""
        self.client.force_authenticate(self.yoda)
        response = self.set_up_org_unit_creation()
        self.assertJSONResponse(response, 200)
        json = response.json()
        self.assertValidOrgUnitData(json)
        self.assertCreated(
            {
                m.OrgUnit: 1,
            }
        )

    def test_create_org_unit_opening_date_not_anterior_to_closed_date(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "id": None,
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
                "opening_date": "01-01-2024",
                "closed_date": "01-12-2023",
            },
        )
        self.assertJSONResponse(response, 400)

    def test_create_org_unit_minimal(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "opening_date": "01-01-2024",
            },
        )

        jr = self.assertJSONResponse(response, 200)

        self.assertValidOrgUnitData(jr)
        self.assertCreated(
            {
                m.OrgUnit: 1,
            }
        )
        ou = m.OrgUnit.objects.get(id=jr["id"])
        # Should have same version as the default version for the account
        self.assertEqual(ou.version, self.star_wars.default_version)

    def test_create_org_unit_fail_on_parent_not_found(self):
        # returning a 404 is strange, but it was the current behaviour
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "parent_id": 41867,
            },
        )
        self.assertJSONResponse(response, 404)
        # we didn't create any new orgunit
        self.assertNoCreation()

    def test_create_org_unit_fail_on_group_not_found(self):
        # returning a 404 is strange, but it was the current behaviour
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [34],
            },
        )
        self.assertJSONResponse(response, 404)
        # we didn't create any new orgunit
        self.assertNoCreation()

    def test_create_org_unit_group_not_in_same_version(self):
        group = m.Group.objects.create(name="bla")
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [group.pk],
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual(jr[0]["errorKey"], "groups")
        self.assertEqual(len(jr), 1)
        # we didn't create any new orgunit
        self.assertNoCreation()

    def test_create_org_unit_group_not_in_same_version_2(self):
        group = m.Group.objects.create(name="bla")
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [group.pk],
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual(jr[0]["errorKey"], "groups")
        self.assertEqual(len(jr), 1)
        # we didn't create any new orgunit
        self.assertNoCreation()

    def test_create_org_unit_group_ok_same_version(self):
        group_1 = m.Group.objects.create(name="bla", source_version=self.star_wars.default_version)
        group_2 = m.Group.objects.create(name="bla2", source_version=self.star_wars.default_version)
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
                "groups": [group_1.pk, group_2.pk],
                "opening_date": "01-01-2024",
            },
        )

        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        self.assertCreated(
            {
                m.OrgUnit: 1,
            }
        )
        ou = m.OrgUnit.objects.get(id=jr["id"])
        ou_groups = ou.groups.all().order_by("name")
        self.assertEqual(len(ou_groups), 2)
        self.assertEqual(ou_groups[0].name, group_1.name)
        self.assertEqual(ou_groups[1].name, group_2.name)

    def test_create_org_unit_with_reference_instance(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "id": None,
                "name": "Test ou with the reference instance",
                "org_unit_type_id": self.jedi_council.pk,
                "reference_instance_id": self.instance_related_to_reference_form.id,
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.reference_instances.count(), 1)

    def test_create_org_unit_with_not_linked_reference_instance(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "id": None,
                "name": "Test ou with no reference instance",
                "org_unit_type_id": self.jedi_council.pk,
                "reference_instances_ids": [self.instance_not_related_to_reference_form.id],
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.reference_instances.count(), 0)

    def test_create_org_unit_with_blank_code_valid_status(self):
        blank_code = ""
        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=blank_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_VALID,
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertEqual(new_org_unit.validation_status, existing_org_unit.validation_status)
        self.assertEqual(new_org_unit.code, existing_org_unit.code)
        self.assertEqual(new_org_unit.code, blank_code)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 existing + 1 new

    def test_create_org_unit_with_blank_code_other_status(self):
        blank_code = ""
        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=blank_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_NEW,  # Change here - status does not create any conflict
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertNotEqual(new_org_unit.validation_status, existing_org_unit.validation_status)
        self.assertEqual(new_org_unit.code, existing_org_unit.code)
        self.assertEqual(new_org_unit.code, blank_code)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 existing + 1 new

    def test_create_org_unit_with_new_code_valid_status(self):
        code = "code"
        new_code = "new code"

        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_VALID,
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
                "code": new_code,  # Change here - code does not create any conflict
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertEqual(new_org_unit.validation_status, existing_org_unit.validation_status)
        self.assertNotEqual(new_org_unit.code, existing_org_unit.code)
        self.assertEqual(new_org_unit.code, new_code)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 existing + 1 new

    def test_create_org_unit_with_new_code_other_status(self):
        old_code = "old code"
        new_code = "new code"

        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=old_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_NEW,  # Change here - status does not create any conflict
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
                "code": new_code,  # Change here - code does not create any conflict
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertNotEqual(new_org_unit.validation_status, existing_org_unit.validation_status)
        self.assertNotEqual(new_org_unit.code, existing_org_unit.code)
        self.assertEqual(new_org_unit.code, new_code)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 existing + 1 new

    def test_create_org_unit_with_existing_code_valid_status(self):
        existing_code = "*Gandalf vibing while listening to epic sax guy*"
        m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=existing_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_VALID,
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
                "code": existing_code,  # Change here - this will create a conflict
            },
        )
        json = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)[0]
        self.assertEqual(json["errorKey"], "code")
        self.assertEqual(
            json["errorMessage"],
            f"Another valid OrgUnit already exists with the code '{existing_code}' in this version",
        )
        self.assertEqual(m.OrgUnit.objects.count(), 6)  # 5 in setup + 1 existing (no new org unit created)

    def test_create_org_unit_with_existing_code_other_status(self):
        existing_code = "*Gandalf vibing while listening to epic sax guy*"
        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=existing_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_NEW,  # Change here - status does not create any conflict
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
                "code": existing_code,
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertNotEqual(new_org_unit.validation_status, existing_org_unit.validation_status)
        self.assertEqual(new_org_unit.code, existing_org_unit.code)
        self.assertEqual(new_org_unit.code, existing_code)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 existing + 1 new

    def test_create_org_unit_with_existing_code_from_another_version_valid_status(self):
        existing_code = "*Gandalf vibing while listening to epic sax guy*"
        other_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_2,  # version 2
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=existing_code,
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.post(  # this will create in version 1 (default version)
            self.ORG_UNIT_CREATE_URL,
            format="json",
            data={
                "name": "New org unit",
                "org_unit_type_id": self.jedi_council.pk,
                "validation_status": m.OrgUnit.VALIDATION_VALID,
                "parent_id": "",
                "source_ref": "",
                "opening_date": "01-01-2024",
                "code": existing_code,  # Change here - this will create a conflict
            },
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)
        new_org_unit = m.OrgUnit.objects.get(id=jr["id"])

        self.assertEqual(new_org_unit.validation_status, other_org_unit.validation_status)
        self.assertEqual(new_org_unit.code, other_org_unit.code)
        self.assertEqual(new_org_unit.code, existing_code)
        self.assertNotEqual(new_org_unit.version_id, other_org_unit.version_id)
        self.assertEqual(m.OrgUnit.objects.count(), 7)  # 5 in setup + 1 other + 1 new

    def test_edit_org_unit_retrieve_put(self):
        """Retrieve an orgunit data and then resend back mostly unmodified and ensure that nothing burn

        Note that a lot of the field we send will end up being unused"""
        old_ou = self.jedi_council_corruscant
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)
        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data=data,
        )

        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        self.assertEqual(response.data["reference_instances"], [])
        self.assertCreated({Modification: 1})
        ou = m.OrgUnit.objects.get(id=jr["id"])
        ou_groups = ou.groups.all().order_by("name")
        self.assertEqual(ou_groups.count(), 1)
        self.assertEqual(ou_groups.first().name, self.elite_group.name)
        self.assertEqual(ou_groups.first().source_version, self.sw_version_1)
        self.assertEqual(ou.id, old_ou.id)
        self.assertEqual(ou.name, old_ou.name)
        self.assertEqual(ou.parent, old_ou.parent)
        self.assertEqual(ou.created_at, old_ou.created_at)
        self.assertNotEqual(ou.updated_at, old_ou.updated_at)

    def set_up_edit_org_flag_reference_instance(self, user):
        org_unit = self.jedi_council_corruscant
        form = self.reference_form
        instance = self.instance_related_to_reference_form

        # Create a reference instance.
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, instance=instance, form=form)
        self.assertIn(instance, org_unit.reference_instances.all())

        # GET /api/orgunits/id.
        self.client.force_authenticate(user)
        response = self.client.get(f"/api/orgunits/{org_unit.id}/")
        data = self.assertJSONResponse(response, 200)

        # PATCH /api/orgunits/id.
        data.update(
            {
                "groups": [g["id"] for g in response.data["groups"]],
                "reference_instance_id": instance.id,
                "reference_instance_action": m.Instance.REFERENCE_UNFLAG_CODE,
            }
        )

        return org_unit, instance, data

    def test_edit_org_unit_unflag_reference_instance(self):
        org_unit, instance, data = self.set_up_edit_org_flag_reference_instance(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        self.assertJSONResponse(response, 200)
        self.assertNotIn(instance, org_unit.reference_instances.all())
        self.assertEqual(response.data["reference_instances"], [])

    def test_edit_org_unit_reference_instance_read_permission(self):
        org_unit, _, data = self.set_up_edit_org_flag_reference_instance(self.user_read_permission)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        self.assertJSONResponse(response, 403)

    def test_edit_org_unit_flag_reference_instance(self):
        """Retrieve an orgunit data and modify the reference_instance_id"""
        old_ou = self.jedi_council_corruscant
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)
        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        data["reference_instance_id"] = self.instance_related_to_reference_form.id
        data["reference_instance_action"] = m.Instance.REFERENCE_FLAG_CODE
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        self.assertCreated({Modification: 1})
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.id, old_ou.id)
        self.assertIn(self.instance_related_to_reference_form, ou.reference_instances.all())
        self.assertEqual(len(response.data["reference_instances"]), 1)

    def test_edit_org_unit_flag_wrong_reference_instance(self):
        """Retrieve an orgunit data and modify the reference_instance_id with a no reference form"""
        old_ou = self.jedi_council_corruscant
        old_modification_date = old_ou.updated_at
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)
        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        data["reference_instance_id"] = self.instance_not_related_to_reference_form.id
        data["reference_instance_action"] = m.Instance.REFERENCE_FLAG_CODE
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertTrue("reference_instances" in (error["errorKey"] for error in jr))
        old_ou.refresh_from_db()
        # check the orgunit has not beee modified
        self.assertEqual(old_modification_date, old_ou.updated_at)
        self.assertNotIn(
            self.instance_not_related_to_reference_form,
            old_ou.reference_instances.all(),
        )

    def set_up_org_unit_partial_update(self):
        ou = m.OrgUnit(version=self.sw_version_1)
        ou.name = "test ou"
        ou.source_ref = "b"
        group_a = m.Group.objects.create(name="test group a")
        group_b = m.Group.objects.create(name="test group b")
        ou.geom = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)]))
        ou.save()
        ou.groups.set([group_a, group_b])
        ou.save()
        old_modification_date = ou.updated_at
        data = {"source_ref": "new source ref", "opening_date": "01-01-2024"}

        return ou, group_a, group_b, old_modification_date, data

    def test_edit_org_unit_partial_update(self):
        """Test that partial updates correctly modify only the specified fields while preserving others"""

        # Setup initial org unit with some data
        org_unit, group_a, group_b, old_modification_date, initial_data = self.set_up_org_unit_partial_update()

        # Create a new group for testing group assignment
        new_group = m.Group.objects.create(name="New test group", source_version=self.sw_version_1)

        # Create test location data
        test_location = {"latitude": 4.4, "longitude": 5.5, "altitude": 100}

        # Create test geojson data
        geom = str(MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)])))

        # Store initial values for comparison
        initial_name = org_unit.name
        initial_source_ref = org_unit.source_ref
        initial_groups = list(org_unit.groups.all())

        # Prepare update data
        update_data = {
            "name": "Updated Name",
            "source_ref": "NEW_REF_123",
            "validation_status": "VALID",
            "latitude": test_location["latitude"],
            "longitude": test_location["longitude"],
            "altitude": test_location["altitude"],
            "geom": geom,
            "aliases": ["alias1", "alias2"],
            "groups": [new_group.id],
            "opening_date": "01-01-2023",
            "closed_date": "31-12-2023",
        }

        self.client.force_authenticate(self.yoda)

        # Perform partial update
        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=update_data, format="json")

        # Verify response
        self.assertEqual(response.status_code, 200)

        # Refresh org unit from database
        org_unit.refresh_from_db()

        # Verify basic field updates
        self.assertEqual(org_unit.name, "Updated Name")
        self.assertEqual(org_unit.source_ref, "NEW_REF_123")
        self.assertEqual(org_unit.validation_status, "VALID")

        # Verify location update
        self.assertIsNotNone(org_unit.location)
        self.assertEqual(org_unit.location.y, test_location["latitude"])
        self.assertEqual(org_unit.location.x, test_location["longitude"])
        self.assertEqual(org_unit.location.z, test_location["altitude"])

        # Verify geometry update.
        # `geom` and `simplified_geom` should have the same value here, because geom is too small to be simplified.
        expected_geom = "SRID=4326;MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))"
        self.assertEqual(org_unit.geom, expected_geom)
        self.assertEqual(org_unit.simplified_geom, expected_geom)

        # Verify aliases update
        self.assertEqual(set(org_unit.aliases), {"alias1", "alias2"})

        # Verify groups update
        self.assertEqual(list(org_unit.groups.all()), [new_group])

        # Verify dates update
        self.assertEqual(org_unit.opening_date.strftime("%d-%m-%Y"), "01-01-2023")
        self.assertEqual(org_unit.closed_date.strftime("%d-%m-%Y"), "31-12-2023")

        # Verify modification date was updated
        self.assertGreater(org_unit.updated_at, old_modification_date)

        # Test partial update with minimal data
        minimal_update = {"name": "Minimal Update"}

        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=minimal_update, format="json")

        # Verify minimal update
        self.assertEqual(response.status_code, 200)
        org_unit.refresh_from_db()
        self.assertEqual(org_unit.name, "Minimal Update")
        # Verify other fields remain unchanged from previous update
        self.assertEqual(org_unit.source_ref, "NEW_REF_123")
        self.assertEqual(org_unit.validation_status, "VALID")

    def test_edit_org_unit_partial_update_geo_json(self):
        user = self.yoda
        self.client.force_authenticate(user)

        org_unit = self.jedi_squad_endor
        org_unit.geom = None
        org_unit.simplified_geom = None
        org_unit.save()

        self.assertEqual(org_unit.geom, None)
        self.assertEqual(org_unit.simplified_geom, None)

        geo_json = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    # Note: those coordinates are too small to be simplified,
                    # so they will be used for both `geom` and `simplified_geom`.
                    "geometry": {"type": "MultiPolygon", "coordinates": [[[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]]},
                }
            ],
        }
        expected_geom = "SRID=4326;MULTIPOLYGON (((1 1, 1 2, 2 2, 2 1, 1 1)))"

        # You shouldn't be able to edit `geo_json` without `ALLOW_SHAPE_EDITION`.
        data = {"geo_json": geo_json}
        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        org_unit.refresh_from_db()
        self.assertEqual(org_unit.geom, None)
        self.assertEqual(org_unit.simplified_geom, None)

        allow_shape_edition_flag = m.AccountFeatureFlag.objects.get(code="ALLOW_SHAPE_EDITION")
        user.iaso_profile.account.feature_flags.add(allow_shape_edition_flag)

        # You should be able to edit `geo_json` with `ALLOW_SHAPE_EDITION`.
        data = {"geo_json": geo_json}
        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        org_unit.refresh_from_db()
        self.assertEqual(org_unit.geom, expected_geom)
        self.assertEqual(org_unit.simplified_geom, expected_geom)

        # Passing `geo_json = None` shouldn't delete the current shapes.
        data = {"geo_json": None}
        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        org_unit.refresh_from_db()
        self.assertEqual(org_unit.geom, expected_geom)
        self.assertEqual(org_unit.simplified_geom, expected_geom)

        # Passing invalid `geo_json` should return an error.
        data = {"geo_json": "Invalid"}
        response = self.client.patch(f"/api/orgunits/{org_unit.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data[0]["errorKey"], "geo_json")
        self.assertEqual(response.data[0]["errorMessage"], "Can't parse geo_json")

    def test_edit_org_unit_partial_update_for_opening_and_closed_dates(self):
        """
        Test the various date formats used by API clients.
        """
        self.client.force_authenticate(self.yoda)

        ou = m.OrgUnit(version=self.sw_version_1)
        ou.name = "test ou"
        ou.source_ref = "b"
        ou.opening_date = None
        ou.closed_date = None
        ou.save()

        data = {"opening_date": "01-01-2024", "closed_date": "01-01-2025"}
        response = self.client.patch(f"/api/orgunits/{ou.id}/", format="json", data=data)
        self.assertJSONResponse(response, 200)
        ou.refresh_from_db()
        self.assertEqual(ou.opening_date, datetime.date(2024, 1, 1))
        self.assertEqual(ou.closed_date, datetime.date(2025, 1, 1))

        data = {"opening_date": "10/02/2024", "closed_date": "12/12/2025"}
        response = self.client.patch(f"/api/orgunits/{ou.id}/", format="json", data=data)
        self.assertJSONResponse(response, 200)
        ou.refresh_from_db()
        self.assertEqual(ou.opening_date, datetime.date(2024, 2, 10))
        self.assertEqual(ou.closed_date, datetime.date(2025, 12, 12))

        data = {"opening_date": "2024-06-22", "closed_date": "2025-10-30"}
        response = self.client.patch(f"/api/orgunits/{ou.id}/", format="json", data=data)
        self.assertJSONResponse(response, 200)
        ou.refresh_from_db()
        self.assertEqual(ou.opening_date, datetime.date(2024, 6, 22))
        self.assertEqual(ou.closed_date, datetime.date(2025, 10, 30))

        data = {"opening_date": None, "closed_date": ""}
        response = self.client.patch(f"/api/orgunits/{ou.id}/", format="json", data=data)
        self.assertJSONResponse(response, 200)
        ou.refresh_from_db()
        self.assertEqual(ou.opening_date, None)
        self.assertEqual(ou.closed_date, None)

    def test_edit_org_unit_partial_update_remove_geojson_geom_simplified_geom_should_be_consistent(
        self,
    ):
        """
        Check that if we remove the `geom`, both `simplified_geom` and `geom` are empty.
        """
        polygon = Polygon([(0, 0), (0, 1), (1, 1), (0, 0)])

        ou = m.OrgUnit(version=self.sw_version_1)
        ou.name = "test ou"
        ou.source_ref = "b"
        ou.geom = MultiPolygon(polygon)
        ou.simplified_geom = simplify_geom(MultiPolygon(polygon))
        ou.save()

        old_modification_date = ou.updated_at

        self.client.force_authenticate(self.yoda)

        data = {"geom": None}
        response = self.client.patch(
            f"/api/orgunits/{ou.id}/",
            format="json",
            data=data,
        )
        self.assertJSONResponse(response, 200)

        ou.refresh_from_db()
        self.assertGreater(ou.updated_at, old_modification_date)
        self.assertEqual(ou.name, "test ou")
        self.assertIsNone(ou.geom)
        self.assertIsNone(ou.simplified_geom)

    def test_edit_org_unit_partial_update_read_permission(self):
        """Check that we can only modify a part of the file with org units read only permission"""
        ou, _, _, _, data = self.set_up_org_unit_partial_update()
        self.client.force_authenticate(self.user_read_permission)
        response = self.client.patch(
            f"/api/orgunits/{ou.id}/",
            format="json",
            data=data,
        )
        self.assertJSONResponse(response, 403)

    def test_edit_org_unit_should_fail_with_restricted_editable_org_unit_types(self):
        """
        Check that we cannot edit an org unit if writing rights are limited
        by a set of org unit types that we are allowed to modify.
        """
        org_unit = m.OrgUnit.objects.create(
            name="Foo",
            org_unit_type=self.jedi_council,
            version=self.star_wars.default_version,
        )
        self.yoda.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type are now writable.
            [self.jedi_squad]
        )
        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data={"name": "New name"},
        )
        json_response = self.assertJSONResponse(response, 400)
        self.assertEqual(json_response[0]["errorKey"], "org_unit_type_id")
        self.assertEqual(
            json_response[0]["errorMessage"],
            "You cannot create or edit an Org unit of this type",
        )
        self.yoda.iaso_profile.editable_org_unit_types.clear()

    def test_edit_org_unit_edit_bad_group_fail(self):
        """Check for a previous bug if an org unit is already member of a bad group
        it couldn't be  edited anymore from the interface
        """

        old_ou = m.OrgUnit.objects.create(
            name="hey",
            org_unit_type=self.jedi_squad,
            version=self.star_wars.default_version,
        )
        good_group = m.Group.objects.create(source_version=old_ou.version)
        # group on wrong version
        bad_group = m.Group.objects.create(name="bad")
        old_ou.groups.set([bad_group, good_group])
        old_modification_date = old_ou.updated_at

        self.old_counts = self.counts()

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)

        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        data["name"] = "new name"
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data=data,
        )
        self.assertJSONResponse(response, 200)
        self.assertCreated({Modification: 1})
        ou = m.OrgUnit.objects.get(id=old_ou.id)

        # Verify group was not modified but the rest was modified
        ou_groups = ou.groups.all().order_by("name")
        self.assertEqual(ou_groups.count(), 2)
        self.assertEqual(ou_groups[0].name, "")
        self.assertEqual(ou_groups[0].source_version.data_source.name, "Evil Empire")
        self.assertEqual(ou_groups[0].source_version.number, 1)
        self.assertEqual(ou_groups[1].name, "bad")
        self.assertEqual(ou_groups[1].source_version, None)

        self.assertEqual(ou.id, old_ou.id)
        self.assertEqual(ou.name, "new name")
        self.assertEqual(ou.parent, old_ou.parent)
        self.assertEqual(ou.created_at, old_ou.created_at)

        self.assertNotEqual(ou.updated_at, old_modification_date)

    def test_edit_with_apply_directly_instance_gps_into_org_unit(self):
        """Retrieve an orgunit data and push instance_gps_to_org_unit"""
        org_unit = self.jedi_council_corruscant
        org_unit.latitude = 8.32842671
        org_unit.longitude = -11.681191
        org_unit.altitude = 3
        org_unit.save()
        org_unit.refresh_from_db()
        self.client.force_authenticate(self.yoda)
        form_latitude = 8.21958686
        form_longitude = -11.50405884
        form_altitude = 1
        data = {}
        data["altitude"] = form_altitude
        data["latitude"] = form_latitude
        data["longitude"] = form_longitude
        data["opening_date"] = "01-01-2024"

        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.as_dict()["latitude"], form_latitude)
        self.assertEqual(ou.as_dict()["longitude"], form_longitude)
        self.assertEqual(ou.as_dict()["altitude"], form_altitude)

    def test_partial_update_org_unit_with_blank_code_valid_status(self):
        blank_code = ""
        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=blank_code,
        )

        org_unit = self.jedi_squad_endor
        org_unit.code = "old code"
        org_unit.save()

        new_name = "new name"
        data = {
            "code": blank_code,
            "name": new_name,
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.code, blank_code)
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(existing_org_unit.code, org_unit.code)
        self.assertEqual(existing_org_unit.version_id, org_unit.version_id)

    def test_partial_update_org_unit_with_blank_code_other_status(self):
        blank_code = ""
        existing_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=blank_code,
        )

        org_unit = self.jedi_squad_endor
        org_unit.code = "old code"
        org_unit.save()

        new_name = "new name"
        data = {
            "code": blank_code,
            "name": new_name,
            "validation_status": m.OrgUnit.VALIDATION_NEW,
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.code, blank_code)
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_NEW)
        self.assertEqual(existing_org_unit.code, org_unit.code)
        self.assertNotEqual(existing_org_unit.validation_status, org_unit.validation_status)
        self.assertEqual(existing_org_unit.version_id, org_unit.version_id)

    def test_partial_update_org_unit_with_new_code_valid_status(self):
        old_code = "old code"
        org_unit = self.jedi_squad_endor
        org_unit.code = old_code
        org_unit.save()

        new_name = "new name"
        new_code = "new code"
        data = {
            "code": new_code,
            "name": new_name,
            "validation_status": m.OrgUnit.VALIDATION_VALID,
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.code, new_code)
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_VALID)

    def test_partial_update_org_unit_with_new_code_other_status(self):
        old_code = "old code"
        org_unit = self.jedi_squad_endor
        org_unit.code = old_code
        org_unit.save()

        new_name = "new name"
        new_code = "new code"
        data = {
            "code": new_code,
            "name": new_name,
            "validation_status": m.OrgUnit.VALIDATION_NEW,
        }

        self.jedi_council_corruscant.code = new_code
        self.jedi_council_corruscant.save()
        self.jedi_council_corruscant.refresh_from_db()

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.code, new_code)
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_NEW)
        self.assertEqual(self.jedi_council_corruscant.code, org_unit.code)
        self.assertNotEqual(self.jedi_council_corruscant.validation_status, org_unit.validation_status)
        self.assertEqual(self.jedi_council_corruscant.version_id, org_unit.version_id)

    def test_partial_update_org_unit_with_existing_code_valid_status(self):
        new_name = "new name"
        new_code = "new code"
        data = {
            "code": new_code,
            "name": new_name,
        }

        self.jedi_council_corruscant.code = new_code
        self.jedi_council_corruscant.save()
        self.jedi_council_corruscant.refresh_from_db()

        self.client.force_authenticate(self.yoda)
        org_unit = self.jedi_squad_endor
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )

        json = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)[0]
        self.assertEqual(json["errorKey"], "code")
        self.assertEqual(
            json["errorMessage"], f"Another valid OrgUnit already exists with the code '{new_code}' in this version"
        )
        self.assertNotEqual(org_unit.name, new_name)
        self.assertNotEqual(org_unit.code, new_code)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_VALID)
        self.assertEqual(org_unit.validation_status, self.jedi_council_corruscant.validation_status)
        self.assertEqual(org_unit.version_id, self.jedi_council_corruscant.version_id)
        self.assertNotEqual(org_unit.code, self.jedi_council_corruscant.code)

    def test_partial_update_org_unit_with_existing_code_other_status(self):
        new_name = "new name"
        new_code = "new code"
        data = {
            "code": new_code,
            "name": new_name,
            "validation_status": m.OrgUnit.VALIDATION_NEW,
        }

        self.jedi_council_corruscant.code = new_code
        self.jedi_council_corruscant.save()
        self.jedi_council_corruscant.refresh_from_db()

        self.client.force_authenticate(self.yoda)
        org_unit = self.jedi_squad_endor
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )

        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(org_unit.code, new_code)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_NEW)
        self.assertNotEqual(org_unit.validation_status, self.jedi_council_corruscant.validation_status)
        self.assertEqual(org_unit.code, self.jedi_council_corruscant.code)
        self.assertEqual(org_unit.version_id, self.jedi_council_corruscant.version_id)

    def test_partial_update_org_unit_with_existing_code_from_other_version_valid_status(self):
        existing_code = "*Gandalf vibing while listening to epic sax guy*"
        other_org_unit = m.OrgUnit.objects.create(
            name="Existing org unit",
            org_unit_type=self.jedi_council,
            version=self.sw_version_2,  # version 2
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code=existing_code,
        )

        new_name = "new name"
        data = {
            "code": existing_code,
            "name": new_name,
            "validation_status": m.OrgUnit.VALIDATION_VALID,
        }
        self.client.force_authenticate(self.yoda)
        org_unit = self.jedi_squad_endor
        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitData(jr)

        org_unit.refresh_from_db()
        self.assertEqual(org_unit.name, new_name)
        self.assertEqual(org_unit.code, existing_code)
        self.assertEqual(org_unit.validation_status, m.OrgUnit.VALIDATION_VALID)
        self.assertEqual(org_unit.validation_status, other_org_unit.validation_status)
        self.assertEqual(org_unit.code, other_org_unit.code)
        self.assertNotEqual(org_unit.version_id, other_org_unit.version_id)

    def test_create_org_unit_from_different_level_from_mobile(self):
        self.client.force_authenticate(self.yoda)

        ou_type = OrgUnitType.objects.create(name="Test_type")
        org_unit_parent = OrgUnit.objects.create(name="A_new_OU")
        count_of_orgunits = OrgUnit.objects.all().count()

        data = [
            {
                "id": "26668d58-7604-40bb-b783-71c2a2b3e6d1",
                "name": "A",
                "time": 1675099612000,
                "accuracy": 1.5,
                "altitude": 115.0,
                "latitude": 50.82521833333333,
                "longitude": 4.353595,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099611.938,
                "updated_at": 1675099611.938,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "5738b6b9-88f7-49ee-a211-632030f68f46",
                "name": "Bluesquare",
                "time": 1674833629688,
                "accuracy": 15.67,
                "altitude": 127.80000305175781,
                "latitude": 50.8369448,
                "longitude": 4.3999539,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1674833640.146,
                "updated_at": 1674833640.146,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "76097602-92ed-45dd-a15a-a81c3fa44461",
                "name": "Saint+Luc",
                "time": 1675099739000,
                "accuracy": 2.2,
                "altitude": 113.6,
                "latitude": 50.825905,
                "longitude": 4.351918333333333,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099740.112,
                "updated_at": 1675099740.112,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "8818ed97-f238-4a9c-be90-19621af7edd5",
                "name": "Martin's place",
                "time": 1675099856000,
                "accuracy": 2.1,
                "altitude": 111.6,
                "latitude": 50.826703333333334,
                "longitude": 4.350505,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099855.568,
                "updated_at": 1675099855.568,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "8c646641-499d-4d65-aafb-5c98ef997e45",
                "name": "Delicelte",
                "time": 1675079431779,
                "accuracy": 11.483,
                "altitude": 110.5999984741211,
                "latitude": 50.8376697,
                "longitude": 4.3963584,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079445.755,
                "updated_at": 1675079445.755,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "98524cec-fc7d-4fcf-8353-b000786e765f",
                "name": "Crayon",
                "time": 1675099637000,
                "accuracy": 2.6,
                "altitude": 115.5,
                "latitude": 50.82513166666666,
                "longitude": 4.353408333333333,
                "parent_id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "created_at": 1675099637.062,
                "updated_at": 1675099637.062,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "b579bba1-622c-4001-90bb-62f85a4ffbd1",
                "name": "mevan",
                "time": 1675079921000,
                "accuracy": 2.1,
                "altitude": 115.30000000000001,
                "latitude": 50.8376,
                "longitude": 4.396518333333333,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079920.602,
                "updated_at": 1675079920.602,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "b779e108-8f2a-48af-aa9e-7f1642cfe5bc",
                "name": "Pizza Mniam Mniam",
                "time": 1675079730000,
                "accuracy": 1.5,
                "altitude": 115.5,
                "latitude": 50.837444999999995,
                "longitude": 4.396443333333334,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675079729.65,
                "updated_at": 1675079729.65,
                "org_unit_type_id": ou_type.pk,
            },
            {
                "id": "dd9360d0-3a2f-434d-a48f-298b3068b3a6",
                "name": "Some_New_STUF",
                "time": 1675099587000,
                "accuracy": 1.9,
                "altitude": 113.3,
                "latitude": 50.82527666666667,
                "longitude": 4.35383,
                "parent_id": str(org_unit_parent.pk),
                "created_at": 1675099586.754,
                "updated_at": 1675099586.755,
                "org_unit_type_id": ou_type.pk,
            },
        ]

        response = self.client.post(
            "/api/mobile/orgunits/?app_id=stars.empire.agriculture.hydroponics",
            data=data,
            format="json",
        )
        orgunits = OrgUnit.objects.all().count()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(orgunits, count_of_orgunits + 9)

    def test_org_unit_search_only_direct_children_false(self):
        self.client.force_authenticate(self.yoda)

        jedi_squad_endor_2_children = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            parent=self.jedi_squad_endor_2,
            version=self.sw_version_2,
            name="Endor Jedi Squad 2 Children",
            geom=self.mock_multipolygon,
            simplified_geom=self.mock_multipolygon,
            catchment=self.mock_multipolygon,
            location=self.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        jedi_squad_endor_2_children.save()

        response = self.client.get(
            f"/api/orgunits/?&orgUnitParentId={self.jedi_council_endor.pk}&limit=10&page=1&order=name&validation_status=all&onlyDirectChildren=false"
        )

        org_units = response.json()["orgunits"]

        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 3)

        ids_in_response = [ou["id"] for ou in org_units]

        # list of all the indirect children of the jedi_council_endor OU
        ou_ids_list = [
            self.jedi_squad_endor.pk,
            self.jedi_squad_endor_2.pk,
            jedi_squad_endor_2_children.pk,
        ]

        self.assertEqual(sorted(ids_in_response), sorted(ou_ids_list))

    def test_org_unit_search_only_direct_children_true(self):
        self.client.force_authenticate(self.yoda)

        # this ou in the children of the children of the parent so it must not appear in the response.

        jedi_squad_endor_2_children = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            parent=self.jedi_squad_endor_2,
            version=self.sw_version_2,
            name="Endor Jedi Squad 2 Children",
            geom=self.mock_multipolygon,
            simplified_geom=self.mock_multipolygon,
            catchment=self.mock_multipolygon,
            location=self.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        jedi_squad_endor_2_children.save()

        with self.assertNumQueries(7):
            response = self.client.get(
                f"/api/orgunits/?&parent_id={self.jedi_council_endor.pk}&limit=10&page=1&order=name&validation_status=all&onlyDirectChildren=true"
            )

        org_units = response.json()["orgunits"]

        self.assertJSONResponse(response, 200)
        self.assertEqual(response.json()["count"], 2)

        ids_in_response = [ou["id"] for ou in org_units]

        # list of all direct children of the jedi_council_endor OU
        ou_ids_list = [self.jedi_squad_endor.pk, self.jedi_squad_endor_2.pk]
        self.assertEqual(sorted(ids_in_response), sorted(ou_ids_list))

    def test_edit_org_unit_add_default_image(self):
        old_ou = self.jedi_council_corruscant
        self.client.force_authenticate(self.yoda)
        image = m.InstanceFile.objects.create(file="path/to/image.jpg")
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data={"default_image_id": image.id},
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.default_image.id, image.id)

    def test_edit_org_unit_remove_default_image(self):
        old_ou = self.jedi_council_corruscant
        image = m.InstanceFile.objects.create(file="path/to/image.jpg")
        old_ou.default_image = image
        old_ou.save()
        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data={"default_image_id": None},
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertIsNone(ou.default_image)

    def test_update_org_unit_with_default_image(self):
        """
        Test that OrgUnits with a default image can be updated without 500 error - IA-4111
        """
        default_image = m.InstanceFile.objects.create(file="path/to/image.jpg", name="default_image")
        ou = m.OrgUnit(version=self.sw_version_1)
        ou.name = "test ou"
        ou.source_ref = "b"
        ou.opening_date = None
        ou.closed_date = None
        ou.default_image = default_image
        ou.save()

        data = {
            "opening_date": "01-01-2024",
            "closed_date": "01-01-2025",
            "default_image_id": default_image.id,
        }
        self.client.force_authenticate(self.yoda)
        response = self.client.patch(f"/api/orgunits/{ou.id}/", format="json", data=data)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        ou.refresh_from_db()

        # Just checking that the update was successful, we don't care which fields were updated
        self.assertEqual(ou.opening_date, datetime.date(2024, 1, 1))
        self.assertEqual(ou.closed_date, datetime.date(2025, 1, 1))

    def test_search_org_unit_based_on_group_and_type(self):
        self.client.force_authenticate(self.yoda)
        self.jedi_council_corruscant.groups.set([self.elite_group, self.unofficial_group, self.another_group])
        self.jedi_council_corruscant.save()

        response = self.client.get(
            f'/api/orgunits/?limit=20&order=id&page=1&searches=[{{"validation_status":"all","group":"{self.elite_group.pk},{self.unofficial_group.pk},{self.another_group.pk}","orgUnitTypeId":"{self.jedi_council.pk}"}}]'
        )
        org_units = self.assertJSONResponse(response, 200)
        self.assertEqual(org_units["count"], 1)
        self.assertEqual(org_units["page"], 1)
        first_org_unit = org_units["orgunits"][0]
        self.assertEqual(first_org_unit["id"], self.jedi_council_corruscant.pk)

    def test_descending_order_without_as_location(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?limit=20&order=-name&page=1")
        self.assertEqual(response.status_code, 200)

    def test_descending_order_with_as_location(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/orgunits/?limit=20&order=-name&page=1&asLocation=true")
        self.assertEqual(response.status_code, 200)
