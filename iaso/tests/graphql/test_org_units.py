from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework_simplejwt.tokens import AccessToken

from iaso import models as m
from iaso.test import APITestCase


URL = "/api/graphql/"


def page_queries(context):
    """The org unit queries - leaving out authentication and `filter_for_user`'s own lookups (profile,
    account, `profile.org_units.exists()`), which don't depend on the selection."""
    return [query["sql"] for query in context.captured_queries if query["sql"].startswith('SELECT "iaso_orgunit"')]


class OrgUnitGraphQLTestCase(APITestCase):
    """Same Star Wars pyramid as the v3 REST tests (country > region > district, plus two other countries) the
    requesting user can see, and a Marvel account whose org units they must never see."""

    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.sw_source = sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt", category="COUNTRY")
        cls.region_type = m.OrgUnitType.objects.create(name="Region", short_name="Rgn")
        cls.district_type = m.OrgUnitType.objects.create(name="District", short_name="Dst")
        for org_unit_type in (cls.country_type, cls.region_type, cls.district_type):
            org_unit_type.projects.add(project)

        cls.elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)

        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Naboo",
            geom=MultiPolygon(Polygon(((0, 0), (0, 10), (10, 10), (10, 0), (0, 0)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="country-ref",
            code="C1",
        )
        cls.country_without_geom = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Tatooine",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C2",
        )
        cls.region = m.OrgUnit.objects.create(
            org_unit_type=cls.region_type,
            version=sw_version_1,
            parent=cls.country,
            name="Theed",
            location=Point(x=5, y=5, z=0),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="region-ref",
            code="R1",
        )
        cls.region.groups.set([cls.elite_group])
        cls.district = m.OrgUnit.objects.create(
            org_unit_type=cls.district_type,
            version=sw_version_1,
            parent=cls.region,
            name="Theed District",
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        cls.cote = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=sw_version_1,
            name="Côte d'Ivoire",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C3",
            aliases=["CIV"],
        )
        cls.star_wars_org_units = [cls.country, cls.country_without_geom, cls.region, cls.district, cls.cote]

        cls.user = cls.create_user_with_profile(username="padme", account=star_wars)

        form = m.Form.objects.create(name="Census")
        for file, deleted in (("census.xml", False), ("census-2.xml", False), ("deleted.xml", True), ("", False)):
            m.Instance.objects.create(org_unit=cls.region, form=form, project=project, file=file, deleted=deleted)

        cls.marvel = marvel = m.Account.objects.create(name="MCU")
        cls.other_account_user = cls.create_user_with_profile(username="tchalla", account=marvel)
        marvel_project = m.Project.objects.create(name="Wakanda outreach", app_id="marvel.app", account=marvel)
        marvel_source = m.DataSource.objects.create(name="Wakandan registry")
        marvel_source.projects.add(marvel_project)
        marvel_version = m.SourceVersion.objects.create(data_source=marvel_source, number=1)
        cls.marvel_org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.country_type,
            version=marvel_version,
            name="Wakanda",
            geom=MultiPolygon(Polygon(((20, 20), (20, 30), (30, 30), (30, 20), (20, 20)))),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    # -- helpers --

    def execute(self, query, variables=None, **extra):
        response = self.client.post(URL, {"query": query, "variables": variables or {}}, format="json", **extra)
        return self.assertJSONResponse(response, 200)

    def data(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]

    def error(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertIn("errors", body)
        return body["errors"][0]["message"]

    def results(self, selection="id", filters=None, **arguments):
        variables = {"filters": filters or {}, **arguments}
        declarations = {
            "filters": "OrgUnitFilter",
            "ordering": "[OrgUnitOrder!]",
            "pagination": "OffsetPaginationInput",
        }
        signature = ", ".join(f"${name}: {declarations[name]}" for name in variables)
        call = ", ".join(f"{name}: ${name}" for name in variables)
        query = f"query ({signature}) {{ orgUnits({call}) {{ results {{ {selection} }} }} }}"
        return self.data(query, variables)["orgUnits"]["results"]

    def ids(self, filters=None, **arguments):
        return [int(row["id"]) for row in self.results("id", filters, **arguments)]

    def row(self, org_unit, selection):
        (row,) = self.results(selection, {"id": {"exact": org_unit.id}})
        return row

    def assertIds(self, filters, expected):
        self.assertCountEqual(self.ids(filters), [org_unit.id for org_unit in expected])

    def capture(self, selection, filters=None):
        with CaptureQueriesContext(connection) as context:
            self.results(selection, filters)
        return page_queries(context)

    # -- authentication and scoping --

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertIn("not authenticated", self.error("{ orgUnits { results { id } } }").lower())

    def test_authentication_enforced_is_401(self):
        self.client.force_authenticate(None)
        with self.settings(AUTHENTICATION_ENFORCED=True):
            response = self.client.post(URL, {"query": "{ __typename }"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_jwt_authentication(self):
        self.client.force_authenticate(None)
        token = AccessToken.for_user(self.user)
        body = self.execute("{ orgUnits { results { id } } }", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(len(body["data"]["orgUnits"]["results"]), len(self.star_wars_org_units))

    def test_invalid_jwt_is_401(self):
        self.client.force_authenticate(None)
        response = self.client.post(
            URL, {"query": "{ orgUnits { results { id } } }"}, format="json", HTTP_AUTHORIZATION="Bearer nope"
        )
        self.assertEqual(response.status_code, 401)

    def test_only_the_users_account(self):
        self.assertIds({}, self.star_wars_org_units)
        self.client.force_authenticate(self.other_account_user)
        self.assertIds({}, [self.marvel_org_unit])

    def test_org_unit_by_id(self):
        query = "query ($id: ID!) { orgUnit(id: $id) { name } }"
        self.assertEqual(self.data(query, {"id": self.region.id})["orgUnit"], {"name": "Theed"})
        # another account's org unit is just absent
        self.assertIsNone(self.data(query, {"id": self.marvel_org_unit.id})["orgUnit"])

    def test_get_queries(self):
        response = self.client.get(URL, {"query": "{ orgUnits { results { id } } }"}, HTTP_ACCEPT="application/json")
        self.assertEqual(len(self.assertJSONResponse(response, 200)["data"]["orgUnits"]["results"]), 5)

    # -- fields: what is selected is what is loaded --

    def test_minimal_selection_loads_only_those_columns(self):
        (sql,) = self.capture("id name")
        select_clause = sql.split(" FROM ")[0]
        self.assertIn('"iaso_orgunit"."name"', select_clause)
        for absent in ("geom", "location", "catchment", "AsGeoJSON", "COUNT", "aliases", "path", "iaso_instance"):
            self.assertNotIn(absent, select_clause)

    def test_geometries_are_geo_json(self):
        row = self.row(self.country, "geom simplifiedGeom catchment hasGeoJson latitude")
        self.assertEqual(row["geom"]["type"], "MultiPolygon")
        self.assertEqual(row["geom"]["coordinates"][0][0][2], [10, 10])
        self.assertIsNone(row["simplifiedGeom"])
        self.assertTrue(row["hasGeoJson"])
        self.assertEqual(
            self.row(self.region, "latitude longitude altitude geom"),
            {
                "latitude": 5.0,
                "longitude": 5.0,
                "altitude": 0.0,
                "geom": None,
            },
        )

    def test_geometry_is_serialized_by_postgis_in_the_same_query(self):
        (sql,) = self.capture("id geom")
        self.assertIn("ST_AsGeoJSON", sql)

    def test_instance_count(self):
        # deleted and file-less instances aren't counted, same as the legacy instances_count
        self.assertEqual(self.row(self.region, "instanceCount")["instanceCount"], 2)
        self.assertEqual(self.row(self.country, "instanceCount")["instanceCount"], 0)
        self.assertEqual(len(self.capture("id instanceCount")), 1)

    def test_scalars_and_computed_fields(self):
        row = self.row(
            self.region,
            "name validationStatus sourceRef code parentId orgUnitTypeId depth hasChildren aliases",
        )
        self.assertEqual(
            row,
            {
                "name": "Theed",
                "validationStatus": "VALID",
                "sourceRef": "region-ref",
                "code": "R1",
                "parentId": self.country.id,
                "orgUnitTypeId": self.region_type.id,
                "depth": 2,
                "hasChildren": True,
                "aliases": [],
            },
        )

    def test_relations_are_joined_in_one_query(self):
        selection = (
            "id parent { name } orgUnitType { name category } version { number dataSourceId dataSource { name } }"
        )
        (sql,) = self.capture(selection)
        self.assertIn("JOIN", sql)
        row = self.row(self.region, selection)
        self.assertEqual(row["parent"], {"name": "Naboo"})
        self.assertEqual(row["orgUnitType"], {"name": "Region", "category": None})
        self.assertEqual(
            row["version"], {"number": 1, "dataSourceId": self.sw_source.id, "dataSource": {"name": "Evil Empire"}}
        )
        self.assertIsNone(self.row(self.country, "parent { name }")["parent"])

    def test_groups_are_prefetched(self):
        with CaptureQueriesContext(connection) as context:
            rows = self.results("name groups { name }")
        self.assertEqual({row["name"]: row["groups"] for row in rows}["Theed"], [{"name": "Elite councils"}])
        group_queries = [q["sql"] for q in context.captured_queries if '"iaso_group"' in q["sql"]]
        self.assertEqual(len(group_queries), 1)

    def test_ancestors_are_loaded_with_the_page(self):
        with CaptureQueriesContext(connection) as context:
            rows = self.results("name ancestors { name }")
        self.assertEqual(
            {row["name"]: [a["name"] for a in row["ancestors"]] for row in rows}["Theed District"], ["Naboo", "Theed"]
        )
        self.assertEqual(len(page_queries(context)), 1)  # the page and every ancestor of every row at once

    def test_ancestors_through_a_fragment(self):
        query = (
            "{ orgUnits { results { ...withAncestors } } } fragment withAncestors on OrgUnit { name ancestors { id } }"
        )
        with CaptureQueriesContext(connection) as context:
            self.data(query)
        self.assertEqual(len(page_queries(context)), 1)

    def test_ancestors_of_a_single_org_unit(self):
        query = "query ($id: ID!) { orgUnit(id: $id) { ancestors { name } } }"
        self.assertEqual(
            self.data(query, {"id": self.district.id})["orgUnit"]["ancestors"], [{"name": "Naboo"}, {"name": "Theed"}]
        )

    # -- pagination --

    def test_total_count_only_when_selected(self):
        with CaptureQueriesContext(connection) as context:
            self.data("{ orgUnits { results { id } } }")
        self.assertFalse(any("COUNT(" in q["sql"] for q in context.captured_queries))
        body = self.data("{ orgUnits(pagination: {limit: 2}) { totalCount results { id } } }")
        self.assertEqual(body["orgUnits"]["totalCount"], 5)
        self.assertEqual(len(body["orgUnits"]["results"]), 2)

    def test_pagination(self):
        all_ids = self.ids()
        self.assertEqual(self.ids(pagination={"offset": 1, "limit": 2}), all_ids[1:3])

    def test_limit_is_bounded(self):
        self.assertIn(
            "limit must be between", self.error("{ orgUnits(pagination: {limit: 1000000}) { results { id } } }")
        )

    def test_ordering(self):
        names = [row["name"] for row in self.results("name", ordering=[{"name": "DESC"}])]
        self.assertEqual(names, sorted(names, reverse=True))
        self.assertEqual(self.ids(), sorted(self.ids()))  # `id` by default

    # -- filters --

    def test_text_filters(self):
        self.assertIds({"name": {"iContains": "theed"}}, [self.region, self.district])
        self.assertIds({"name": {"startsWith": "Th"}}, [self.region, self.district])
        self.assertIds({"sourceRef": {"inList": ["country-ref", "region-ref"]}}, [self.country, self.region])
        self.assertIds({"code": {"exact": "C3"}}, [self.cote])
        self.assertIds({"search": "CIV"}, [self.cote])

    def test_generic_lookups_are_not_exposed(self):
        self.assertIn(
            "iContains", self.error('{ orgUnits(filters: {sourceRef: {iContains: "ref"}}) { results { id } } }')
        )

    def test_enum_and_relation_filters(self):
        self.assertIds({"validationStatus": {"exact": "NEW"}}, [self.district])
        self.assertIds({"orgUnitType": {"category": "COUNTRY"}}, [self.country, self.country_without_geom, self.cote])
        self.assertIds({"parent": {"name": {"iContains": "naboo"}}}, [self.region])
        self.assertIds({"groupId": self.elite_group.id}, [self.region])
        self.assertIds({"sourceId": self.sw_source.id}, self.star_wars_org_units)

    def test_hierarchy_filters(self):
        self.assertIds({"ancestorId": self.country.id}, [self.region, self.district])
        self.assertIds({"parentId": self.country.id}, [self.region])
        self.assertIds({"depth": 3}, [self.district])
        self.assertIn(
            "does not exist",
            self.error(
                "query ($id: Int) { orgUnits(filters: {ancestorId: $id}) { results { id } } }",
                {"id": self.marvel_org_unit.id},
            ),
        )

    def test_spatial_filters(self):
        self.assertIds({"hasShape": True}, [self.country])
        self.assertIds({"hasLocation": True}, [self.region])
        self.assertIds(
            {"geom": {"withinOrIntersectsBbox": {"minx": 8, "miny": 8, "maxx": 20, "maxy": 20}}}, [self.country]
        )
        self.assertIds({"location": {"withinOrgUnit": self.country.id}}, [self.region])
        self.assertIds({"location": {"outsideOrgUnit": self.country.id}}, [])
        self.assertIn(
            "latitudes",
            self.error(
                "{ orgUnits(filters: {geom: {outsideBbox: {minx: 0, miny: -100, maxx: 1, maxy: 1}}}) { results { id } } }"
            ),
        )

    def test_date_filters(self):
        self.assertIds({"createdAt": {"gte": "2000-01-01T00:00:00Z"}}, self.star_wars_org_units)
        self.assertIds({"createdAt": {"lte": "2000-01-01T00:00:00Z"}}, [])
        self.assertIn(
            "16 hours",
            self.error('{ orgUnits(filters: {createdAt: {gte: "2000-01-01T00:00:00-16:01"}}) { results { id } } }'),
        )

    def test_boolean_combinations(self):
        self.assertIds(
            {"code": {"exact": "C1"}, "OR": {"code": {"exact": "C2"}}}, [self.country, self.country_without_geom]
        )
        self.assertIds(
            {"orgUnitType": {"category": "COUNTRY"}, "NOT": {"hasShape": True}}, [self.country_without_geom, self.cote]
        )

    # -- abuse limits --

    def test_alias_limit(self):
        aliases = " ".join(f"g{i}: geom" for i in range(20))
        self.assertIn("aliases", self.error(f"{{ orgUnits {{ results {{ {aliases} }} }} }}"))
