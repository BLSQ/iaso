from django.contrib.gis.geos import Polygon, Point, MultiPolygon, GEOSGeometry
import typing

from django.db import connection

from hat.audit.models import Modification
from iaso import models as m
from iaso.test import APITestCase


class OrgUnitAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.reference_form = m.Form.objects.create(name="Reference form", period_type=m.MONTH, single_per_period=True)
        cls.not_a_reference_form = m.Form.objects.create(
            name="Not a reference form", period_type=m.MONTH, single_per_period=True
        )
        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc", reference_form=cls.reference_form
        )
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.mock_point = Point(x=4, y=50, z=100)
        cls.mock_multipolygon_empty = GEOSGeometry("MULTIPOLYGON EMPTY", srid=4326)

        cls.elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.instance_related_to_reference_form = cls.create_form_instance(
            form=cls.reference_form, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.instance_not_related_to_reference_form = cls.create_form_instance(
            form=cls.not_a_reference_form, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=cls.mock_multipolygon_empty,
            simplified_geom=cls.mock_multipolygon_empty,
            catchment=cls.mock_multipolygon_empty,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        # I am really sorry to have to rely on this ugly hack to set the location field to an empty point, but
        # unfortunately GEOS doesn't seem to support empty 3D geometries yet:
        # see: https://trac.osgeo.org/geos/ticket/1129, https://trac.osgeo.org/geos/ticket/1005 and
        # https://code.djangoproject.com/ticket/33787 for example
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE iaso_orgunit SET location=ST_GeomFromText('POINT Z EMPTY') WHERE id = %s",
                [cls.jedi_council_endor.pk],
            )

        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
        )
        cls.jedi_squad_endor_2 = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 2",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
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

    def test_org_unit_search_with_ids(self):
        """GET /orgunits/ with a search based on refs"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(
            '/api/orgunits/?&order=id&page=1&searchTabIndex=0&searches=[{"validation_status":"all","color":"4dd0e1","search":"refs%3AF9w3VW1cQmb%2CPvtAI4RUMkr","orgUnitParentId":null}]&limit=50'
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
        self.assertEqual(returned_ou_ids, {self.jedi_council_corruscant.id, self.jedi_council_endor.id})

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
            returned_ou_ids, {self.jedi_squad_endor.id, self.jedi_council_corruscant.id, self.jedi_council_endor.id}
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
            returned_ou_ids, {self.jedi_council_corruscant.id, self.jedi_council_endor.id, self.jedi_squad_endor_2.id}
        )

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

    def test_org_unit_list_roots_ok_user_has_org_unit_restrictions(self):
        """GET /api/orgunits/?rootsForUser=true"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/?rootsForUser=true")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=1)
        self.assertEqual(self.jedi_council_endor.pk, response_data["orgUnits"][0]["id"])

    def test_org_unit_list_roots_ok_user_no_org_unit_restrictions(self):
        """GET /api/orgunits/?rootsForUser=true"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/?rootsForUser=true")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitListData(list_data=response_data, expected_length=3)
        for orgunit in response_data["orgUnits"]:
            self.assertEqual(orgunit["parent_id"], None)

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

    def test_org_unit_retrieve_ok_2(self):
        """GET /orgunits/<org_unit_id>/ happy path (user is restricted to a few org units)"""

        self.client.force_authenticate(self.luke)
        response = self.client.get(f"/api/orgunits/{self.jedi_squad_endor.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(response.json())

    def test_can_retrieve_org_units_in_csv_format(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/orgunits/{self.jedi_squad_endor.id}/?format=csv", headers={"Content-Type": "text/csv"}
        )
        self.assertFileResponse(response, 200, "text/csv; charset=utf-8")

    def assertValidOrgUnitListData(self, *, list_data: typing.Mapping, expected_length: int):
        self.assertValidListData(list_data=list_data, results_key="orgUnits", expected_length=expected_length)
        for org_unit_data in list_data["orgUnits"]:
            self.assertValidOrgUnitData(org_unit_data)

    def assertValidOrgUnitData(self, org_unit_data: typing.Mapping):
        self.assertHasField(org_unit_data, "id", int)
        self.assertHasField(org_unit_data, "name", str)

    def setUp(self):
        self.old_counts = self.counts()

    def counts(self) -> dict:
        return {
            m.OrgUnit: m.OrgUnit.objects.count(),
            m.OrgUnitType: m.OrgUnitType.objects.count(),
            Modification: Modification.objects.count(),
        }

    def assertNoCreation(self):
        self.assertEqual(self.old_counts, self.counts())

    def assertCreated(self, createds: dict):
        new_counts = self.counts()
        diff = {}

        for model in new_counts.keys():
            diff[model] = new_counts[model] - self.old_counts[model]

        self.assertDictContainsSubset(createds, diff)

    def test_create_org_unit(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
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
            },
        )
        self.assertJSONResponse(response, 200)
        json = response.json()
        self.assertValidOrgUnitData(json)
        self.assertCreated(
            {
                m.OrgUnit: 1,
            }
        )

    def test_create_org_unit_minimal(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={
                "name": "Test ou",
                "org_unit_type_id": self.jedi_council.pk,
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
        # returning a 404 is strange but it was the current behaviour
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
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
        # returning a 404 is strange but it was the current behaviour
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={"name": "Test ou", "org_unit_type_id": self.jedi_council.pk, "groups": [34]},
        )
        self.assertJSONResponse(response, 404)
        # we didn't create any new orgunit
        self.assertNoCreation()

    def test_create_org_unit_group_not_in_same_version(self):
        group = m.Group.objects.create(name="bla")
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={"name": "Test ou", "org_unit_type_id": self.jedi_council.pk, "groups": [group.pk]},
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
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={"name": "Test ou", "org_unit_type_id": self.jedi_council.pk, "groups": [group.pk]},
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
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={"name": "Test ou", "org_unit_type_id": self.jedi_council.pk, "groups": [group_1.pk, group_2.pk]},
        )

        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        self.assertCreated(
            {
                m.OrgUnit: 1,
            }
        )
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertQuerysetEqual(
            ou.groups.all().order_by("name"), ["<Group: bla | Evil Empire  1 >", "<Group: bla2 | Evil Empire  1 >"]
        )

    def test_create_org_unit_with_reference_instance(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
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
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.reference_instance, self.instance_related_to_reference_form)

    def test_create_org_unit_with_not_linked_reference_instance(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/orgunits/create_org_unit/",
            format="json",
            data={
                "id": None,
                "name": "Test ou with no reference instance",
                "org_unit_type_id": self.jedi_council.pk,
                "reference_instance_id": self.instance_not_related_to_reference_form.id,
                "groups": [],
                "sub_source": "",
                "status": False,
                "aliases": ["my alias"],
                "validation_status": "NEW",
                "parent_id": "",
                "source_ref": "",
                "creation_source": "dashboard",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.reference_instance, None)

    def test_edit_org_unit_retrieve_put(self):
        """Retrieve a orgunit data and then resend back mostly unmodified and ensure that nothing burn

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
        self.assertCreated({Modification: 1})
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertQuerysetEqual(ou.groups.all().order_by("name"), ["<Group: Elite councils | Evil Empire  1 >"])
        self.assertEqual(ou.id, old_ou.id)
        self.assertEqual(ou.name, old_ou.name)
        self.assertEqual(ou.parent, old_ou.parent)
        self.assertEqual(ou.created_at, old_ou.created_at)
        self.assertNotEqual(ou.updated_at, old_ou.updated_at)

    def test_edit_org_unit_link_to_reference_instance(self):
        """Retrieve a orgunit data and modify the reference_instance_id"""
        old_ou = self.jedi_council_corruscant
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)
        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        data["reference_instance_id"] = self.instance_related_to_reference_form.id
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
        self.assertEqual(ou.reference_instance, self.instance_related_to_reference_form)

    def test_edit_org_unit_not_link_to_reference_instance(self):
        """Retrieve a orgunit data and modify the reference_instance_id with a no reference form"""
        old_ou = self.jedi_council_corruscant
        old_modification_date = old_ou.updated_at
        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/orgunits/{old_ou.id}/")
        data = self.assertJSONResponse(response, 200)
        group_ids = [g["id"] for g in data["groups"]]
        data["groups"] = group_ids
        data["reference_instance_id"] = self.instance_not_related_to_reference_form.id
        response = self.client.patch(
            f"/api/orgunits/{old_ou.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertTrue("reference_form" in (error["errorKey"] for error in jr))
        old_ou.refresh_from_db()
        # check the orgunit has not beee modified
        self.assertEqual(old_modification_date, old_ou.updated_at)

    def test_edit_org_unit_partial_update(self):
        """Check tha we can only modify a part of the fille"""
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
        self.client.force_authenticate(self.yoda)
        data = {"source_ref": "new source ref"}
        response = self.client.patch(
            f"/api/orgunits/{ou.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 200)
        ou.refresh_from_db()
        # check the orgunit has not beee modified
        self.assertGreater(ou.updated_at, old_modification_date)
        self.assertEqual(ou.name, "test ou")
        self.assertEqual(ou.source_ref, "new source ref")
        self.assertQuerysetEqual(ou.groups.all().order_by("name"), [group_a, group_b])
        self.assertEqual(ou.geom.wkt, MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)])).wkt)

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
        self.assertQuerysetEqual(
            ou.groups.all().order_by("name"), ["<Group:  | Evil Empire  1 >", "<Group: bad | None >"]
        )
        self.assertEqual(ou.id, old_ou.id)
        self.assertEqual(ou.name, "new name")
        self.assertEqual(ou.parent, old_ou.parent)
        self.assertEqual(ou.created_at, old_ou.created_at)

        self.assertNotEqual(ou.updated_at, old_modification_date)

    def test_edit_with_apply_directly_instance_gps_into_org_unit(self):
        """Retrieve a orgunit data and push instance_gps_to_org_unit"""
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

        response = self.client.patch(
            f"/api/orgunits/{org_unit.id}/",
            format="json",
            data=data,
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitData(jr)
        self.assertCreated({Modification: 1})
        ou = m.OrgUnit.objects.get(id=jr["id"])
        self.assertEqual(ou.as_dict()["latitude"], form_latitude)
        self.assertEqual(ou.as_dict()["longitude"], form_longitude)
        self.assertEqual(ou.as_dict()["altitude"], form_altitude)
