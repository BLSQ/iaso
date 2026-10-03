from unittest import mock

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework_simplejwt.tokens import AccessToken

from iaso import models as m
from iaso.graphql.common import MAX_IN_VALUES
from iaso.test import APITestCase


URL = "/api/graphql/"

DECLARATIONS = {"filters": "OrgUnitFilter", "order": "[OrgUnitOrder!]", "limit": "Int!", "offset": "Int!"}


def outer_query(sql: str) -> str:
    """Before the account scoping subquery (`version_id IN (SELECT ... JOIN ...)`)."""
    return sql.split(" WHERE ")[0]


def page_queries(context):
    """The org unit queries - leaving out authentication, `filter_for_user`'s own lookups (profile, account,
    `profile.org_units.exists()`) and the `statement_timeout`, which don't depend on the query."""
    return [
        query["sql"]
        for query in context.captured_queries
        if 'FROM "iaso_orgunit"' in query["sql"] and "iaso_profile" not in query["sql"]
    ]


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
        self.assertIn(response.status_code, (200, 400), response.content)
        return response.json()

    def data(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertNotIn("errors", body, body.get("errors"))
        return body["data"]

    def error(self, query, variables=None):
        body = self.execute(query, variables)
        self.assertIn("errors", body)
        return body["errors"][0]["message"]

    def page(self, selection="items { id }", filters=None, **arguments):
        variables = {"filters": filters or {}, **arguments}
        signature = ", ".join(f"${name}: {DECLARATIONS[name]}" for name in variables)
        call = ", ".join(f"{name}: ${name}" for name in variables)
        return self.data(f"query ({signature}) {{ orgUnits({call}) {{ {selection} }} }}", variables)["orgUnits"]

    def items(self, selection="id", filters=None, **arguments):
        return self.page(f"items {{ {selection} }}", filters, **arguments)["items"]

    def ids(self, filters=None, **arguments):
        return [row["id"] for row in self.items("id", filters, **arguments)]

    def assertIds(self, filters, org_units):
        self.assertEqual(sorted(self.ids(filters)), sorted(org_unit.id for org_unit in org_units))

    def row(self, org_unit, selection):
        query = f"query ($id: Int!) {{ orgUnit(id: $id) {{ {selection} }} }}"
        return self.data(query, {"id": org_unit.id})["orgUnit"]

    def capture(self, selection, filters=None):
        with CaptureQueriesContext(connection) as context:
            self.items(selection, filters)
        return page_queries(context)

    # -- authentication and scoping --

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertIn("not provided", self.error("{ orgUnits { items { id } } }"))

    def test_authentication_enforced_is_401(self):
        self.client.force_authenticate(None)
        with self.settings(AUTHENTICATION_ENFORCED=True):
            response = self.client.post(URL, {"query": "{ __typename }"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_jwt_authentication(self):
        self.client.force_authenticate(None)
        token = AccessToken.for_user(self.user)
        body = self.execute("{ orgUnits { items { id } } }", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(len(body["data"]["orgUnits"]["items"]), len(self.star_wars_org_units))

    def test_invalid_jwt_is_401(self):
        self.client.force_authenticate(None)
        response = self.client.post(
            URL, {"query": "{ orgUnits { items { id } } }"}, format="json", HTTP_AUTHORIZATION="Bearer nope"
        )
        self.assertEqual(response.status_code, 401)

    def test_only_the_users_account(self):
        self.assertIds({}, self.star_wars_org_units)
        self.client.force_authenticate(self.other_account_user)
        self.assertIds({}, [self.marvel_org_unit])

    def test_org_unit_by_id(self):
        self.assertEqual(self.row(self.region, "name"), {"name": "Theed"})
        # another account's org unit is just absent
        self.assertIsNone(self.row(self.marvel_org_unit, "name"))

    def test_statement_timeout(self):
        with CaptureQueriesContext(connection) as context:
            self.items("id")
        self.assertTrue(any("SET LOCAL statement_timeout" in q["sql"] for q in context.captured_queries))

    # -- fields: what is selected is what is loaded --

    def test_minimal_selection_loads_only_those_columns(self):
        (sql,) = self.capture("id name")
        select_clause = sql.split(" FROM ")[0]
        self.assertEqual(select_clause, 'SELECT "iaso_orgunit"."id", "iaso_orgunit"."name"')
        self.assertNotIn("JOIN", outer_query(sql))

    def test_typename_only(self):
        self.assertEqual(len(self.items("__typename")), 5)

    def test_geometries_are_geo_json(self):
        row = self.row(self.country, "geom simplifiedGeom catchment hasGeoJson hasGeometry location { latitude }")
        self.assertEqual(row["geom"]["type"], "MultiPolygon")
        self.assertEqual(row["geom"]["coordinates"][0][0][2], [10, 10])
        self.assertIsNone(row["simplifiedGeom"])
        self.assertTrue(row["hasGeoJson"])
        self.assertTrue(row["hasGeometry"])
        self.assertIsNone(row["location"])
        self.assertEqual(
            self.row(self.region, "location { latitude longitude altitude } geom"),
            {"location": {"latitude": 5.0, "longitude": 5.0, "altitude": 0.0}, "geom": None},
        )

    def test_coordinates_and_geometries_are_computed_by_postgis(self):
        (sql,) = self.capture("location { latitude } geom")
        self.assertIn("ST_Y(geometry(", sql)
        self.assertIn("ST_AsGeoJSON", sql)
        # the raw columns themselves never travel
        self.assertNotRegex(sql, r"(SELECT |, )\"iaso_orgunit\"\.\"(location|geom)\"(,| FROM)")

    def test_instance_count(self):
        # deleted and file-less instances aren't counted, same as the legacy instances_count
        self.assertEqual(self.row(self.region, "instanceCount")["instanceCount"], 2)
        self.assertEqual(self.row(self.country, "instanceCount")["instanceCount"], 0)
        self.assertEqual(len(self.capture("id instanceCount")), 1)
        self.assertNotIn("iaso_instance", self.capture("id name")[0])

    def test_scalars_and_computed_fields(self):
        row = self.row(
            self.region,
            "name validationStatus sourceRef code parentId orgUnitTypeId versionId depth hasChildren aliases "
            "createdAt openingDate uuid",
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
                "versionId": self.sw_version_1.id,
                "depth": 2,
                "hasChildren": True,
                "aliases": [],
                "createdAt": self.region.created_at.isoformat(),
                "openingDate": None,
                "uuid": None,
            },
        )
        self.assertEqual(self.row(self.cote, "aliases")["aliases"], ["CIV"])

    def test_relations_are_joined_in_one_query(self):
        selection = (
            "id parent { name } orgUnitType { name category } version { number dataSourceId dataSource { name } }"
        )
        (sql,) = self.capture(selection)
        self.assertEqual(outer_query(sql).count("JOIN"), 4)
        row = self.row(self.region, selection)
        self.assertEqual(row["parent"], {"name": "Naboo"})
        self.assertEqual(row["orgUnitType"], {"name": "Region", "category": None})
        self.assertEqual(
            row["version"], {"number": 1, "dataSourceId": self.sw_source.id, "dataSource": {"name": "Evil Empire"}}
        )
        self.assertIsNone(self.row(self.country, "parent { name }")["parent"])

    def test_created_by(self):
        self.assertIsNone(self.row(self.region, "createdBy { username }")["createdBy"])
        m.OrgUnit.objects.filter(pk=self.region.pk).update(creator=self.user)
        self.assertEqual(self.row(self.region, "createdBy { username }"), {"createdBy": {"username": "padme"}})

    def test_groups_and_ancestors(self):
        with CaptureQueriesContext(connection) as context:
            rows = self.items("name groups { name } ancestors { name orgUnitTypeId }")
        by_name = {row["name"]: row for row in rows}
        self.assertEqual(by_name["Theed"]["groups"], [{"name": "Elite councils"}])
        self.assertEqual(by_name["Naboo"]["groups"], [])
        self.assertEqual(
            by_name["Theed District"]["ancestors"],
            [
                {"name": "Naboo", "orgUnitTypeId": self.country_type.id},
                {"name": "Theed", "orgUnitTypeId": self.region_type.id},
            ],
        )
        self.assertEqual(by_name["Naboo"]["ancestors"], [])
        # the page and every ancestor of every row: one query; every group of the page: a second one
        (sql,) = page_queries(context)
        self.assertEqual(sum('FROM "iaso_group"' in q["sql"] for q in context.captured_queries), 1)
        # only the selected ancestor columns are built
        self.assertIn("'org_unit_type_id'", sql)
        self.assertNotIn("'source_ref'", sql)

    def test_no_query_per_row(self):
        """Whatever is selected, the number of queries doesn't grow with the page: no lazy loading in a resolver."""
        selection = (
            "id name uuid validationStatus sourceRef code aliases openingDate closedDate createdAt updatedAt "
            "sourceCreatedAt parentId orgUnitTypeId versionId depth location { latitude longitude altitude } "
            "hasGeoJson hasGeometry hasChildren instanceCount geom simplifiedGeom catchment "
            "parent { id name sourceRef validationStatus orgUnitTypeId parentId } "
            "ancestors { id name sourceRef validationStatus orgUnitTypeId parentId } "
            "orgUnitType { id name shortName category } version { id number dataSourceId dataSource { id name } } "
            "groups { id name } createdBy { id username firstName lastName email }"
        )
        counts = []
        for limit in (1, 5):
            with CaptureQueriesContext(connection) as context:
                self.assertEqual(len(self.items(selection, limit=limit)), limit)
            counts.append(len(context.captured_queries))
        self.assertEqual(counts[0], counts[1])

    def test_ancestors_through_a_fragment(self):
        query = (
            "{ orgUnits { items { ...withAncestors } } } fragment withAncestors on OrgUnit { name ancestors { id } }"
        )
        with CaptureQueriesContext(connection) as context:
            self.data(query)
        self.assertEqual(len(page_queries(context)), 1)

    def test_skip_and_include(self):
        query = "query ($geom: Boolean!) { orgUnits { items { id geom @include(if: $geom) } } }"
        with CaptureQueriesContext(connection) as context:
            self.data(query, {"geom": False})
        self.assertNotIn("ST_AsGeoJSON", page_queries(context)[0])

    def test_ancestors_of_a_single_org_unit(self):
        self.assertEqual(
            self.row(self.district, "ancestors { name }")["ancestors"], [{"name": "Naboo"}, {"name": "Theed"}]
        )

    # -- pagination --

    def test_total_count_only_when_selected(self):
        with CaptureQueriesContext(connection) as context:
            self.items("id")
        self.assertFalse(any("COUNT(*)" in q["sql"] for q in context.captured_queries))
        with CaptureQueriesContext(connection) as context:
            page = self.page("totalCount", limit=2)
        self.assertEqual(page, {"totalCount": 5})
        # no row fetched for a count alone
        self.assertEqual(len(page_queries(context)), 1)

    def test_has_next_page(self):
        self.assertTrue(self.page("hasNextPage", limit=4)["hasNextPage"])
        page = self.page("hasNextPage items { id }", limit=5)
        self.assertFalse(page["hasNextPage"])
        self.assertEqual(len(page["items"]), 5)

    def test_pagination(self):
        all_ids = self.ids()
        self.assertEqual(self.ids(offset=1, limit=2), all_ids[1:3])

    def test_limit_is_bounded(self):
        self.assertIn("between 1 and 10000", self.error("{ orgUnits(limit: 1000000) { items { id } } }"))
        self.assertIn("between 1 and 10000", self.error("{ orgUnits(limit: 0) { items { id } } }"))
        self.assertIn("offset", self.error("{ orgUnits(offset: -1) { items { id } } }"))
        self.assertIn("Int!", self.error("{ orgUnits(limit: null) { items { id } } }"))

    def test_expensive_fields_lower_the_limit(self):
        self.assertEqual(len(self.items("id", limit=5_000)), 5)
        message = self.error("{ orgUnits(limit: 5000) { items { id simplifiedGeom ancestors { id } } } }")
        self.assertIn("between 1 and 1000 when selecting ancestors, simplifiedGeom", message)

    def test_instance_count_has_the_lowest_cap(self):
        self.assertEqual(len(self.items("id instanceCount", limit=100)), 5)
        message = self.error("{ orgUnits(limit: 500) { items { id geom instanceCount } } }")
        self.assertIn("between 1 and 100 when selecting instanceCount", message)
        # a single org unit is a single count
        self.assertEqual(self.row(self.region, "instanceCount"), {"instanceCount": 2})

    def test_ordering(self):
        names = [row["name"] for row in self.items("name", order=["NAME_DESC"])]
        self.assertEqual(names, sorted(names, reverse=True))
        self.assertEqual(self.ids(), sorted(self.ids()))  # `id` by default
        self.assertEqual(self.ids(order=["ID_DESC"]), sorted(self.ids(), reverse=True))

    # -- filters: the v3 query params --

    def test_text_filters(self):
        self.assertIds({"nameIContains": "theed"}, [self.region, self.district])
        self.assertIds({"nameStartsWith": "Th"}, [self.region, self.district])
        self.assertIds({"name": "Naboo"}, [self.country])
        self.assertIds({"sourceRefIn": ["country-ref", "region-ref"]}, [self.country, self.region])
        self.assertIds({"sourceRefStartsWith": "coun"}, [self.country])
        self.assertIds({"code": "C3"}, [self.cote])
        self.assertIds({"codeIn": ["C1", "C3"]}, [self.country, self.cote])
        self.assertIds({"search": "CIV"}, [self.cote])
        self.assertIds({"idIn": [self.country.id, self.marvel_org_unit.id]}, [self.country])

    def test_nul_characters_are_refused(self):
        # postgres text can't hold them: a bad request, not a server error
        for filters in ({"code": "C\x001"}, {"sourceRefIn": ["ok", "\x00"]}):
            body = self.execute("query ($f: OrgUnitFilter) { orgUnits(filters: $f) { items { id } } }", {"f": filters})
            self.assertEqual(body["errors"][0]["extensions"]["code"], "BAD_USER_INPUT")
            self.assertIn("NUL", body["errors"][0]["message"])

    def test_in_lists_are_bounded(self):
        message = self.error(
            "query ($ids: [Int!]) { orgUnits(filters: {idIn: $ids}) { items { id } } }",
            {"ids": list(range(MAX_IN_VALUES + 1))},
        )
        self.assertIn(f"at most {MAX_IN_VALUES}", message)

    def test_enum_and_relation_filters(self):
        self.assertIds({"validationStatus": "NEW"}, [self.district])
        self.assertIds({"validationStatusIn": ["NEW", "REJECTED"]}, [self.district])
        self.assertIds({"orgUnitTypeCategory": "COUNTRY"}, [self.country, self.country_without_geom, self.cote])
        self.assertIds({"orgUnitTypeNameIContains": "regi"}, [self.region])
        self.assertIds({"orgUnitTypeId": self.district_type.id}, [self.district])
        self.assertIds({"parentNameIContains": "naboo"}, [self.region])
        self.assertIds({"parentSourceRef": "region-ref"}, [self.district])
        self.assertIds({"groupId": self.elite_group.id}, [self.region])
        self.assertIds({"sourceId": self.sw_source.id}, self.star_wars_org_units)
        self.assertIds({"versionId": self.sw_version_1.id}, self.star_wars_org_units)
        self.assertIds({"projectId": self.project.id}, self.star_wars_org_units)
        self.assertIds({"defaultVersion": True}, self.star_wars_org_units)
        self.assertIds({"rootsForUser": True}, [self.country, self.country_without_geom, self.cote])

    def test_hierarchy_filters(self):
        self.assertIds({"ancestorId": self.country.id}, [self.region, self.district])
        self.assertIds({"parentId": self.country.id}, [self.region])
        self.assertIds({"ancestorIdDirectChildren": self.country.id}, [self.region])
        self.assertIds({"depth": 3}, [self.district])
        self.assertIn(
            "does not exist",
            self.error(
                "query ($id: Int) { orgUnits(filters: {ancestorId: $id}) { items { id } } }",
                {"id": self.marvel_org_unit.id},
            ),
        )

    def test_spatial_filters(self):
        self.assertIds({"hasShape": True}, [self.country])
        self.assertIds({"hasShape": False}, [self.country_without_geom, self.region, self.district, self.cote])
        self.assertIds({"hasLocation": True}, [self.region])
        self.assertIds({"geomIsNull": False}, [self.country])
        self.assertIds({"geomWithinOrIntersectsBbox": {"minx": 8, "miny": 8, "maxx": 20, "maxy": 20}}, [self.country])
        self.assertIds({"geomOutsideBbox": {"minx": 8, "miny": 8, "maxx": 20, "maxy": 20}}, [])
        self.assertIds({"locationWithinBbox": {"minx": 4, "miny": 4, "maxx": 6, "maxy": 6}}, [self.region])
        self.assertIds({"locationOutsideBbox": {"minx": 4, "miny": 4, "maxx": 6, "maxy": 6}}, [])
        self.assertIds({"locationWithinOrgUnit": self.country.id}, [self.region])
        self.assertIds({"locationOutsideOrgUnit": self.country.id}, [])
        self.assertIn(
            "latitudes",
            self.error(
                "{ orgUnits(filters: {geomOutsideBbox: {minx: 0, miny: -100, maxx: 1, maxy: 1}}) { items { id } } }"
            ),
        )
        self.assertIn(
            "has no geom",
            self.error(
                "query ($id: Int) { orgUnits(filters: {geomWithinOrgUnit: $id}) { items { id } } }",
                {"id": self.country_without_geom.id},
            ),
        )

    def test_date_filters(self):
        self.assertIds({"createdAtGte": "2000-01-01T00:00:00Z"}, self.star_wars_org_units)
        self.assertIds({"createdAtLte": "2000-01-01T00:00:00Z"}, [])
        self.assertIds({"createdAtGte": "2000-01-01T00:00:00"}, self.star_wars_org_units)
        self.assertIds({"openingDateGte": "2000-01-01"}, [])
        self.assertIn(
            "16 hours",
            self.error('{ orgUnits(filters: {createdAtGte: "2000-01-01T00:00:00-16:01"}) { items { id } } }'),
        )
        self.assertIn(
            "Invalid date", self.error('{ orgUnits(filters: {openingDateGte: "yesterday"}) { items { id } } }')
        )

    def test_filters_are_and_ed(self):
        self.assertIds({"orgUnitTypeCategory": "COUNTRY", "hasShape": False}, [self.country_without_geom, self.cote])
        self.assertIds({"orgUnitTypeCategory": "COUNTRY", "nameStartsWith": "T"}, [self.country_without_geom])

    def test_explicit_null_is_not_filtered(self):
        self.assertIds({"name": None, "hasShape": None}, self.star_wars_org_units)

    # -- complexity: nothing v3 couldn't express --

    def test_no_boolean_operators(self):
        for operator in ("OR", "AND", "NOT"):
            message = self.error(
                f'{{ orgUnits(filters: {{code: "C1", {operator}: {{code: "C2"}}}}) {{ items {{ id }} }} }}'
            )
            self.assertIn(f"Field '{operator}' is not defined", message)

    def test_no_generic_lookups(self):
        self.assertIn(
            "sourceRefIContains", self.error('{ orgUnits(filters: {sourceRefIContains: "ref"}) { items { id } } }')
        )
        self.assertIn(
            "String cannot represent", self.error('{ orgUnits(filters: {name: {iContains: "a"}}) { items { id } } }')
        )

    def test_one_org_units_list_per_operation(self):
        message = self.error("{ a: orgUnits { items { id } } b: orgUnits { items { id } } }")
        self.assertIn("At most 1 `orgUnits` per operation, got 2", message)
        # hidden in fragments
        message = self.error(
            "{ ...a ...b } fragment a on Query { x: orgUnits { totalCount } } "
            "fragment b on Query { ... on Query { y: orgUnits { totalCount } } }"
        )
        self.assertIn("got 2", message)
        # the same response key twice is merged: one list
        self.assertEqual(self.data("{ orgUnits { totalCount } orgUnits { totalCount } }")["orgUnits"]["totalCount"], 5)

    def test_aliases_only_on_root_fields(self):
        aliases = " ".join(f"g{i}: geom" for i in range(3))
        self.assertIn("only allowed on root fields", self.error(f"{{ orgUnits {{ items {{ {aliases} }} }} }}"))
        query = "query ($a: Int!, $b: Int!) { a: orgUnit(id: $a) { name } b: orgUnit(id: $b) { name } }"
        data = self.data(query, {"a": self.country.id, "b": self.region.id})
        self.assertEqual(data, {"a": {"name": "Naboo"}, "b": {"name": "Theed"}})

    def test_root_fields_are_bounded(self):
        fields = " ".join(f"o{i}: orgUnit(id: {i}) {{ id }}" for i in range(11))
        self.assertIn("At most 10 root fields", self.error(f"{{ {fields} }}"))

    def test_token_limit(self):
        fields = " ".join(["id"] * 2_000)
        self.assertIn("more than 2000 tokens", self.error(f"{{ orgUnits {{ items {{ {fields} }} }} }}"))

    def test_unexpected_errors_are_hidden(self):
        with mock.patch("iaso.graphql.org_units.resolvers.apply_filters", side_effect=ValueError("SELECT secret")):
            body = self.execute("{ orgUnits { items { id } } }")
        self.assertEqual(body["errors"][0]["message"], "Internal server error")
        self.assertNotIn("secret", str(body))
        self.assertEqual(body["errors"][0]["extensions"]["code"], "INTERNAL_SERVER_ERROR")

    def test_error_codes(self):
        """Refused requests are told apart from failures by `extensions.code`, not by the message."""

        def code(query):
            return self.execute(query)["errors"][0]["extensions"]["code"]

        self.assertEqual(code("{ orgUnits { items { id } "), "GRAPHQL_PARSE_FAILED")
        self.assertEqual(code("{ orgUnits { items { nope } } }"), "GRAPHQL_VALIDATION_FAILED")
        self.assertEqual(code("{ a: orgUnits { totalCount } b: orgUnits { totalCount } }"), "GRAPHQL_VALIDATION_FAILED")
        self.assertEqual(code("{ orgUnits(limit: 0) { items { id } } }"), "BAD_USER_INPUT")
        # a literal the `Date` scalar rejects: the document itself is invalid
        self.assertEqual(
            code('{ orgUnits(filters: {openingDateGte: "yesterday"}) { items { id } } }'), "GRAPHQL_VALIDATION_FAILED"
        )
        self.assertEqual(code("{ orgUnits(filters: {ancestorId: 0}) { items { id } } }"), "BAD_USER_INPUT")
        self.client.force_authenticate(None)
        self.assertEqual(code("{ orgUnits { items { id } } }"), "UNAUTHENTICATED")
