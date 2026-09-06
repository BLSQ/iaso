import csv
import io
import json

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework import status

from iaso import models as m
from iaso.api.v3.org_units.serializers import ANCESTOR_DEFAULT_SUBFIELDS
from iaso.test import APITestCase
from iaso.tests.utils_parquet import BaseAPITransactionTestCase, write_response_to_file


BASE_URL = "/api/v3/orgunits/"


class OrgUnitV3APITestCase(APITestCase):
    """Covers `/api/v3/orgunits/`: default fields, FilterSet fields, hierarchy/spatial filters, the
    `fields=` selector, pagination and permissions. CSV/XLSX exports are smoke-tested here; the parquet
    export (which needs committed data visible to DuckDB) is covered by `OrgUnitV3ParquetTestCase` below."""

    @classmethod
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        cls.marvel = marvel = m.Account.objects.create(name="MCU")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.country_type = country_type = m.OrgUnitType.objects.create(
            name="Country", short_name="Cnt", category="COUNTRY"
        )
        country_type.projects.add(project)
        cls.region_type = region_type = m.OrgUnitType.objects.create(name="Region", short_name="Rgn")
        region_type.projects.add(project)
        cls.district_type = district_type = m.OrgUnitType.objects.create(name="District", short_name="Dst")
        district_type.projects.add(project)

        cls.elite_group = elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)

        # A simple square so bbox/within_org_unit tests have unambiguous geometry.
        cls.country_geom = country_geom = MultiPolygon(Polygon(((0, 0), (0, 10), (10, 10), (10, 0), (0, 0))))
        cls.region_location = region_location = Point(x=5, y=5, z=0)

        cls.country = country = m.OrgUnit.objects.create(
            org_unit_type=country_type,
            version=sw_version_1,
            name="Naboo",
            geom=country_geom,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="country-ref",
            code="C1",
        )
        cls.country_without_geom = m.OrgUnit.objects.create(
            org_unit_type=country_type,
            version=sw_version_1,
            name="Tatooine",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C2",
        )
        cls.region = region = m.OrgUnit.objects.create(
            org_unit_type=region_type,
            version=sw_version_1,
            parent=country,
            name="Theed",
            location=region_location,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="region-ref",
            code="R1",
        )
        region.groups.set([elite_group])
        cls.district = m.OrgUnit.objects.create(
            org_unit_type=district_type,
            version=sw_version_1,
            parent=region,
            name="Theed District",
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        # accented name, so `name__icontains`/`search` can be checked for accent-insensitivity
        # ("cote" should match this even without typing the "ô").
        cls.cote = m.OrgUnit.objects.create(
            org_unit_type=country_type,
            version=sw_version_1,
            name="Côte d'Ivoire",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="C3",
            aliases=["CIV"],
        )

        cls.user = cls.create_user_with_profile(
            username="padme", account=star_wars, first_name="Padme", last_name="Amidala", email="padme@naboo.example"
        )
        cls.other_account_user = cls.create_user_with_profile(username="tchalla", account=marvel)
        region.creator = cls.user
        region.save()

    def setUp(self):
        self.client.force_authenticate(self.user)

    # -- permissions / scoping --

    def test_anonymous_user_is_rejected(self):
        self.client.force_authenticate(None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_from_another_account_sees_nothing(self):
        self.client.force_authenticate(self.other_account_user)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["results"], [])

    # -- default shape / retrieve --

    def test_default_ordering_is_by_id_not_name(self):
        # `name` has no database index - ordering by it by default (as the gist this endpoint is based on
        # suggested) would force a full unindexed sort on every request, including unbounded exports.
        response = self.client.get(BASE_URL)
        ids = [r["id"] for r in response.json()["results"]]
        self.assertEqual(ids, sorted(ids))

    def test_list_default_fields(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["has_next"], False)
        self.assertIsNone(data["count"])  # no `with_count` => count is not computed
        by_id = {row["id"]: row for row in data["results"]}
        region_row = by_id[self.region.id]
        self.assertEqual(region_row["name"], "Theed")
        self.assertEqual(region_row["parent_id"], self.country.id)
        self.assertEqual(region_row["latitude"], 5.0)
        self.assertEqual(region_row["longitude"], 5.0)
        self.assertEqual(region_row["groups"], [{"id": self.elite_group.id, "name": "Elite councils"}])
        self.assertEqual(region_row["depth"], 2)
        self.assertNotIn("geom", region_row)
        self.assertNotIn("ancestors", region_row)
        country_row = by_id[self.country.id]
        self.assertEqual(country_row["has_geo_json"], True)
        self.assertEqual(country_row["depth"], 1)
        self.assertEqual(by_id[self.district.id]["depth"], 3)
        self.assertEqual(by_id[self.region.id]["has_geo_json"], False)

    def test_filter_depth_matches_returned_depth_field(self):
        response = self.client.get(BASE_URL, {"depth": 2})
        results = response.json()["results"]
        self.assertEqual([r["id"] for r in results], [self.region.id])
        self.assertEqual(results[0]["depth"], 2)

    def test_retrieve(self):
        response = self.client.get(f"{BASE_URL}{self.region.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["name"], "Theed")

    def test_schema_action_returns_fields_metadata(self):
        # a plain GET, reachable straight from a browser - and proof `schema/` doesn't get swallowed by
        # the `<pk>/` detail route (that'd 404 trying to look up an org unit with pk="schema").
        response = self.client.get(f"{BASE_URL}schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["default_fields"][0], "id")
        self.assertIn("name", data["default_fields"])
        self.assertNotIn("geom", data["default_fields"])
        self.assertEqual(data["fields"]["name"], {"default": True})
        self.assertEqual(data["fields"]["geom"], {"default": False, "shape": "GeoJSON"})
        ancestors_schema = data["fields"]["ancestors"]
        self.assertEqual(ancestors_schema["default"], False)
        self.assertEqual(ancestors_schema["sub_selector"], True)
        self.assertIn("source_ref", ancestors_schema["allowed_subfields"])

    # -- FilterSet fields --

    def test_filter_name_exact(self):
        response = self.client.get(BASE_URL, {"name": "Theed"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_name_icontains(self):
        response = self.client.get(BASE_URL, {"name__icontains": "the"})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.region.id, self.district.id})

    def test_filter_name_icontains_is_case_insensitive_but_not_accent_insensitive(self):
        # case-folding works ("côte"/"CÔTE" both match), but accent-folding doesn't ("cote" without the
        # "ô" does not) - accent-insensitivity would need the postgres `unaccent` extension, i.e. a
        # migration, deliberately deferred for now.
        for search_term in ("côte", "CÔTE"):
            with self.subTest(search_term=search_term):
                response = self.client.get(BASE_URL, {"name__icontains": search_term})
                self.assertEqual([r["id"] for r in response.json()["results"]], [self.cote.id])
        response = self.client.get(BASE_URL, {"name__icontains": "cote"})
        self.assertEqual(response.json()["results"], [])

    def test_search_param_matches_name_case_insensitively(self):
        response = self.client.get(BASE_URL, {"search": "côte"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.cote.id])

    def test_search_param_still_matches_aliases_exactly(self):
        response = self.client.get(BASE_URL, {"search": "CIV"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.cote.id])

    def test_filter_validation_status_in(self):
        response = self.client.get(BASE_URL, {"validation_status__in": "NEW"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.district.id])

    def test_filter_org_unit_type_id(self):
        response = self.client.get(BASE_URL, {"org_unit_type_id": self.region_type.id})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_org_unit_type_category(self):
        response = self.client.get(BASE_URL, {"org_unit_type__category": "COUNTRY"})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.country.id, self.country_without_geom.id, self.cote.id})

    def test_filter_group_id(self):
        response = self.client.get(BASE_URL, {"group_id": self.elite_group.id})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_has_shape(self):
        response = self.client.get(BASE_URL, {"has_shape": "true"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.country.id])

    def test_filter_has_location(self):
        response = self.client.get(BASE_URL, {"has_location": "true"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_simplified_geom_isnull(self):
        # `country` only has `geom` set (no `simplified_geom`), so `has_shape=true` includes it but
        # `simplified_geom__isnull=false` should not.
        response = self.client.get(BASE_URL, {"simplified_geom__isnull": "false"})
        self.assertEqual(response.json()["results"], [])
        response = self.client.get(BASE_URL, {"simplified_geom__isnull": "true"})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertIn(self.country.id, ids)

    # -- hierarchy --

    def test_filter_ancestor_id_excludes_self(self):
        response = self.client.get(BASE_URL, {"ancestor_id": self.country.id})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.region.id, self.district.id})
        self.assertNotIn(self.country.id, ids)

    def test_filter_depth(self):
        response = self.client.get(BASE_URL, {"depth": 1})
        ids = {r["id"] for r in response.json()["results"]}
        self.assertEqual(ids, {self.country.id, self.country_without_geom.id, self.cote.id})

    # -- spatial (core subset) --

    def test_filter_geom_bbox_matches(self):
        response = self.client.get(BASE_URL, {"geom__bbox": "-1,-1,11,11"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.country.id])

    def test_filter_geom_bbox_no_match(self):
        response = self.client.get(BASE_URL, {"geom__bbox": "100,100,200,200"})
        self.assertEqual(response.json()["results"], [])

    def test_filter_location_bbox_matches(self):
        response = self.client.get(BASE_URL, {"location__bbox": "0,0,10,10"})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_invalid_bbox(self):
        response = self.client.get(BASE_URL, {"geom__bbox": "not-a-bbox"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_within_org_unit(self):
        response = self.client.get(BASE_URL, {"location__within_org_unit": self.country.id})
        self.assertEqual([r["id"] for r in response.json()["results"]], [self.region.id])

    def test_filter_within_org_unit_missing_geometry(self):
        response = self.client.get(BASE_URL, {"location__within_org_unit": self.country_without_geom.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("has no geometry", response.json()["error"])

    def test_filter_outside_org_unit(self):
        misplaced = m.OrgUnit.objects.create(
            org_unit_type=self.region_type,
            version=self.sw_version_1,
            parent=self.region,
            name="Misplaced Facility",
            location=Point(x=50, y=50, z=0),  # well outside the country's 0..10 square
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        response = self.client.get(BASE_URL, {"location__outside_org_unit": self.country.id})
        self.assertEqual([r["id"] for r in response.json()["results"]], [misplaced.id])
        # `region`'s location IS inside the country -> not "outside"; `district` has no location at all
        # -> excluded rather than counted as "outside".

    def test_filter_outside_org_unit_missing_geometry(self):
        response = self.client.get(BASE_URL, {"location__outside_org_unit": self.country_without_geom.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("has no geometry", response.json()["error"])

    def test_find_descendants_with_location_outside_their_own_ancestors_shape(self):
        # a data-quality query: find descendants of an org unit whose recorded point falls outside that
        # same org unit's own shape - combine `ancestor_id` (restrict to descendants) with
        # `outside_org_unit` referencing the *same* id (the shape to check against).
        misplaced = m.OrgUnit.objects.create(
            org_unit_type=self.district_type,
            version=self.sw_version_1,
            parent=self.district,
            name="CAVALLY child with a misplaced point",
            location=Point(x=50, y=50, z=0),
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        response = self.client.get(
            BASE_URL,
            {
                "ancestor_id": self.country.id,
                "location__outside_org_unit": self.country.id,
                "fields": "id,name,latitude,longitude,ancestors(id,name)",
            },
        )
        results = response.json()["results"]
        self.assertEqual([r["id"] for r in results], [misplaced.id])
        self.assertEqual(results[0]["latitude"], 50.0)
        self.assertEqual([a["name"] for a in results[0]["ancestors"]], ["Naboo", "Theed", "Theed District"])

    # -- strict param validation --

    def test_unknown_query_param_is_rejected_with_suggestions(self):
        # difflib (a plain edit-distance match, no dependency) catches typo-level near-misses well
        # (`source_reff` -> `source_ref`) but isn't meant to bridge a full vocabulary change like the
        # legacy `dateFrom` -> `created_at__gte`; see the plan/PR description for that trade-off.
        response = self.client.get(BASE_URL, {"source_reff": "abc"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("source_reff", data["error"])
        self.assertIn("source_ref", data["suggestions"]["source_reff"])

    def test_unknown_query_param_without_close_match_has_no_suggestions(self):
        response = self.client.get(BASE_URL, {"dateFrom": "2020-01-01"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("dateFrom", data["error"])
        self.assertEqual(data["suggestions"], {})

    # -- fields= selector --

    def test_fields_param_flat_subset(self):
        response = self.client.get(BASE_URL, {"fields": "id,name"})
        row = response.json()["results"][0]
        self.assertEqual(set(row.keys()), {"id", "name"})

    def test_fields_param_allows_whitespace_around_commas_and_parens(self):
        response = self.client.get(BASE_URL, {"fields": "id, name, ancestors( id, name )", "name": "Theed District"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.json()["results"][0]
        self.assertEqual(set(row.keys()), {"id", "name", "ancestors"})
        self.assertEqual(set(row["ancestors"][0].keys()), {"id", "name"})

    def test_fields_param_whitespace_separated_full_field_list(self):
        # every field name at once, comma-space separated - a real query someone tried.
        fields = (
            "aliases, altitude, ancestors, catchment, closed_date, code, created_at, depth, geom, "
            "group_ids, groups, has_geo_json, id, latitude, longitude, name, opening_date, "
            "org_unit_type, org_unit_type_id, parent, parent_id, simplified_geom, source_ref, "
            "updated_at, uuid, validation_status"
        )
        response = self.client.get(BASE_URL, {"fields": fields})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_fields_param_bracket_typo_suggests_parenthesis(self):
        # a common mistake: `ancestors[id,name]` instead of `ancestors(id,name)`
        response = self.client.get(BASE_URL, {"fields": "id,name,ancestors[id,name]"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        detail = response.json()["detail"]
        self.assertIn("instead of", detail)
        self.assertIn("ancestors(id,name)", detail)

    def test_fields_param_ancestors(self):
        response = self.client.get(
            BASE_URL, {"fields": "id,name,ancestors(id,name,source_ref)", "name": "Theed District"}
        )
        row = response.json()["results"][0]
        ancestors = row["ancestors"]
        self.assertEqual([a["name"] for a in ancestors], ["Naboo", "Theed"])
        self.assertEqual(set(ancestors[0].keys()), {"id", "name", "source_ref"})

    def test_fields_param_unknown_field(self):
        response = self.client.get(BASE_URL, {"fields": "id,not_a_real_field"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_groups_returns_id_and_name(self):
        response = self.client.get(BASE_URL, {"fields": "id,groups", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(row["groups"], [{"id": self.elite_group.id, "name": "Elite councils"}])

    def test_fields_param_group_ids_is_the_lightweight_alternative(self):
        response = self.client.get(BASE_URL, {"fields": "id,group_ids", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(row["group_ids"], [self.elite_group.id])

    def test_fields_param_org_unit_type_returns_fixed_shape(self):
        response = self.client.get(BASE_URL, {"fields": "id,org_unit_type", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(
            row["org_unit_type"],
            {"id": self.region_type.id, "name": "Region", "short_name": "Rgn", "category": None},
        )

    def test_fields_param_org_unit_type_rejects_sub_selector(self):
        response = self.client.get(BASE_URL, {"fields": "id,org_unit_type(name)"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_creator_returns_fixed_shape(self):
        response = self.client.get(BASE_URL, {"fields": "id,creator", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(
            row["creator"],
            {
                "id": self.user.id,
                "username": "padme",
                "first_name": "Padme",
                "last_name": "Amidala",
                "email": "padme@naboo.example",
            },
        )

    def test_fields_param_creator_is_null_when_not_recorded(self):
        response = self.client.get(BASE_URL, {"fields": "id,creator", "name": "Naboo"})
        row = response.json()["results"][0]
        self.assertIsNone(row["creator"])

    def test_fields_param_creator_rejects_sub_selector(self):
        response = self.client.get(BASE_URL, {"fields": "id,creator(username)"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_version_default_subfields(self):
        response = self.client.get(BASE_URL, {"fields": "id,version", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(
            row["version"],
            {"id": self.sw_version_1.id, "number": 1, "data_source_id": self.sw_version_1.data_source_id},
        )

    def test_fields_param_version_with_data_source(self):
        response = self.client.get(BASE_URL, {"fields": "id,version(data_source)", "name": "Theed"})
        row = response.json()["results"][0]
        self.assertEqual(
            row["version"],
            {
                "id": self.sw_version_1.id,
                "data_source": {"id": self.sw_version_1.data_source_id, "name": "Evil Empire"},
            },
        )

    def test_fields_param_version_data_source_rejects_further_sub_selector(self):
        response = self.client.get(BASE_URL, {"fields": "id,version(data_source(name))"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_version_unknown_subfield(self):
        response = self.client.get(BASE_URL, {"fields": "id,version(not_a_real_field)"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_parent_default_subfields(self):
        response = self.client.get(BASE_URL, {"fields": "id,parent", "name": "Theed District"})
        row = response.json()["results"][0]
        self.assertEqual(row["parent"]["name"], "Theed")
        self.assertEqual(set(row["parent"].keys()), set(ANCESTOR_DEFAULT_SUBFIELDS))

    def test_fields_param_parent_custom_subfields(self):
        response = self.client.get(BASE_URL, {"fields": "id,parent(id,name)", "name": "Theed District"})
        row = response.json()["results"][0]
        self.assertEqual(row["parent"], {"id": self.region.id, "name": "Theed"})

    def test_fields_param_parent_is_null_for_root(self):
        response = self.client.get(BASE_URL, {"fields": "id,parent", "name": "Naboo"})
        row = response.json()["results"][0]
        self.assertIsNone(row["parent"])

    def test_fields_param_unknown_ancestor_subfield(self):
        response = self.client.get(BASE_URL, {"fields": "id,ancestors(not_a_real_field)"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fields_param_geometry_is_opt_in(self):
        response = self.client.get(
            BASE_URL,
            {"fields": "id,geom"},
        )
        row = next(r for r in response.json()["results"] if r["id"] == self.country.id)
        self.assertIsNotNone(row["geom"])
        self.assertEqual(row["geom"]["type"], "MultiPolygon")

    # -- pagination --

    def test_pagination_default_has_no_count(self):
        response = self.client.get(BASE_URL, {"page_size": 2})
        data = response.json()
        self.assertIsNone(data["count"])
        self.assertIsNone(data["pages"])
        self.assertEqual(len(data["results"]), 2)
        self.assertTrue(data["has_next"])

    def test_pagination_with_count(self):
        response = self.client.get(BASE_URL, {"page_size": 2, "with_count": "true"})
        data = response.json()
        self.assertEqual(data["count"], 5)
        self.assertEqual(data["pages"], 3)

    def test_pagination_page_size_is_clamped_to_max(self):
        response = self.client.get(BASE_URL, {"page_size": 999999})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["page_size"], 10_000)

    def test_pagination_out_of_range_page_is_404(self):
        response = self.client.get(BASE_URL, {"page_size": 2, "page": 999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- exports --

    def test_format_typo_is_a_clear_400_not_drfs_bare_404(self):
        # DRF's own content negotiation reacts to an unrecognized `?format=` value with a bare
        # `Http404("Not Found")` - confusing for "you typoed a query param value". Caught in
        # `OrgUnitViewSetV3.initial()` instead.
        response = self.client.get(BASE_URL, {"format": "parqet"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("parqet", data["error"])
        self.assertIn("parquet", data["detail"])

    def test_format_csv(self):
        response = self.client.get(BASE_URL, {"format": "csv"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        content = b"".join(response.streaming_content).decode("utf-8")
        self.assertIn("Theed", content)

    def test_format_xlsx(self):
        response = self.client.get(BASE_URL, {"format": "xlsx"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("spreadsheetml", response["Content-Type"])

    def test_format_csv_expands_ancestors_into_indexed_columns(self):
        response = self.client.get(
            BASE_URL,
            {"format": "csv", "fields": "id,name,ancestors(id,name,validation_status)", "name": "Theed District"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        header = reader.fieldnames
        self.assertEqual(
            header,
            [
                "id",
                "name",
                "ancestors[0].id",
                "ancestors[0].name",
                "ancestors[0].validation_status",
                "ancestors[1].id",
                "ancestors[1].name",
                "ancestors[1].validation_status",
            ],
        )
        row = next(reader)
        self.assertEqual(row["name"], "Theed District")
        self.assertEqual(row["ancestors[0].name"], "Naboo")  # root
        self.assertEqual(row["ancestors[1].name"], "Theed")  # immediate parent

    def test_format_csv_ancestors_present_when_combined_with_depth_filter_and_geometry(self):
        # combining a `depth=` filter (so every returned row has the *same* number of ancestors) with
        # `ancestors(...)` and a geometry field in the same `fields=` list, all at once.
        response = self.client.get(
            BASE_URL,
            {
                "format": "csv",
                "fields": "id,name,depth,ancestors(id,name,validation_status),simplified_geom",
                "depth": 2,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        self.assertIn("ancestors[0].name", reader.fieldnames)
        row = next(reader)
        self.assertEqual(row["name"], "Theed")
        self.assertEqual(row["depth"], "2")
        self.assertEqual(row["ancestors[0].name"], "Naboo")

    def test_format_csv_renders_geometry_as_geojson(self):
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,geom"})
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = {row["name"]: row for row in reader}
        self.assertEqual(json.loads(rows["Naboo"]["geom"])["type"], "MultiPolygon")
        self.assertEqual(rows["Theed"]["geom"], "")  # no geom set on this one -> empty cell

    def test_format_csv_groups_split_into_one_column_pair_per_distinct_group(self):
        # `groups` is an unordered membership set, not a positional list like `ancestors` - a `groups[0]`
        # column wouldn't mean the same group from one row to the next, so it's keyed by group id instead.
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,groups"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        group_col_id = f"group-{self.elite_group.id}.id"
        group_col_name = f"group-{self.elite_group.id}.name"
        self.assertEqual(reader.fieldnames, ["id", "name", group_col_id, group_col_name])
        rows = {row["name"]: row for row in reader}
        self.assertEqual(rows["Theed"][group_col_id], str(self.elite_group.id))
        self.assertEqual(rows["Theed"][group_col_name], "Elite councils")
        # not a member -> empty cells, not a missing/omitted row
        self.assertEqual(rows["Naboo"][group_col_id], "")
        self.assertEqual(rows["Naboo"][group_col_name], "")

    def test_format_csv_org_unit_type_and_parent_are_split_into_columns(self):
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,org_unit_type,parent"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        self.assertEqual(
            reader.fieldnames,
            [
                "id",
                "name",
                "org_unit_type.id",
                "org_unit_type.name",
                "org_unit_type.short_name",
                "org_unit_type.category",
                "parent.id",
                "parent.name",
                "parent.source_ref",
                "parent.org_unit_type_id",
            ],
        )
        rows = {row["name"]: row for row in reader}
        theed = rows["Theed"]
        self.assertEqual(theed["org_unit_type.id"], str(self.region_type.id))
        self.assertEqual(theed["org_unit_type.name"], "Region")
        self.assertEqual(theed["org_unit_type.short_name"], "Rgn")
        self.assertEqual(theed["parent.name"], "Naboo")
        self.assertEqual(theed["parent.source_ref"], "country-ref")
        naboo = rows["Naboo"]
        self.assertEqual(naboo["parent.id"], "")  # root -> no parent -> empty cells
        self.assertEqual(naboo["parent.name"], "")

    def test_format_csv_creator_is_split_into_columns(self):
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,creator"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        self.assertEqual(
            reader.fieldnames,
            [
                "id",
                "name",
                "creator.id",
                "creator.username",
                "creator.first_name",
                "creator.last_name",
                "creator.email",
            ],
        )
        rows = {row["name"]: row for row in reader}
        theed = rows["Theed"]
        self.assertEqual(theed["creator.id"], str(self.user.id))
        self.assertEqual(theed["creator.username"], "padme")
        self.assertEqual(theed["creator.email"], "padme@naboo.example")
        naboo = rows["Naboo"]
        self.assertEqual(naboo["creator.id"], "")  # no recorded creator -> empty cells
        self.assertEqual(naboo["creator.username"], "")

    def test_format_csv_version_with_data_source_adds_nested_columns(self):
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,version(id,number,data_source)"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        self.assertEqual(
            reader.fieldnames,
            ["id", "name", "version.id", "version.number", "version.data_source.id", "version.data_source.name"],
        )
        rows = {row["name"]: row for row in reader}
        theed = rows["Theed"]
        self.assertEqual(theed["version.id"], str(self.sw_version_1.id))
        self.assertEqual(theed["version.number"], "1")
        self.assertEqual(theed["version.data_source.name"], "Evil Empire")

    def test_format_csv_parent_custom_subfields_narrow_the_columns(self):
        response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,parent(id,name)"})
        content = b"".join(response.streaming_content).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        self.assertEqual(reader.fieldnames, ["id", "name", "parent.id", "parent.name"])

    # -- query counts (regression guard for N+1s) --
    #
    # These pin down the *shape* of the query count (fixed, independent of how many org units are
    # returned) rather than an exact number that would need updating on every unrelated change - see the
    # docstrings on `serialize_org_units`/`build_export_row_getter` in serializers.py for what each query
    # actually is. The specific counts below were established once by measuring against the endpoint
    # (never guessed), so a change to any of them should be a deliberate, understood one.

    def test_list_default_fields_query_count(self):
        # 1 SELECT for `iaso_profile.org_units.exists()` (account/hierarchy scoping) + 1 page fetch (the
        # `page_size + 1` trick, no COUNT) + 1 batch query for the default `groups` field.
        with self.assertNumQueries(3):
            response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_main_queryset_has_no_unconditional_joins(self):
        # `get_queryset()` must NOT `select_related` `org_unit_type`/`version`/`version__data_source` -
        # those are batch-loaded separately (see `build_export_row_getter`/`serialize_org_units`) only
        # when actually requested. An unconditional `select_related` here would silently add 2-3 JOINs to
        # *every* request regardless of `fields=` - this happened once already (see git history) and
        # made CSV exports slower than they needed to be.
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(BASE_URL, {"fields": "id,name,depth,org_unit_type"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # the main org unit page-fetch query specifically - not the `org_unit_type` batch query (which
        # legitimately selects FROM iaso_orgunittype, with an `iaso_orgunit` subquery) or any other one.
        main_query = next(
            q["sql"] for q in ctx.captured_queries if q["sql"].strip().startswith('SELECT "iaso_orgunit".')
        )
        # `LEFT OUTER JOIN` is what `select_related` would add; the account-scoping subquery
        # (`filter_for_account`) legitimately uses `INNER JOIN` in its own nested SELECT, which is fine.
        self.assertNotIn("LEFT OUTER JOIN", main_query)

    def test_format_csv_streams_values_not_full_model_instances(self):
        # `_export` projects only `required_row_columns(...)` via `.values()` instead of materializing a
        # full `OrgUnit` per row (GEOS/ltree wrapping, every column parsed) - assert a couple of columns
        # nothing in `fields=id,name` needs (a heavy JSON column, and one only needed when geometry/depth
        # are requested) are absent from the actual SELECT.
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name"})
            b"".join(response.streaming_content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # `queryset.iterator()` (used for CSV/XLSX streaming) wraps the row-fetch query in a server-side
        # cursor (`DECLARE ... CURSOR ... FOR SELECT ...`), unlike the plain `SELECT ...` the JSON/paginated
        # path uses - match on the substring so both shapes are covered.
        main_query = next(q["sql"] for q in ctx.captured_queries if 'SELECT "iaso_orgunit".' in q["sql"])
        self.assertNotIn("extra_fields", main_query)
        self.assertNotIn("path", main_query)
        self.assertNotIn("location", main_query)

    def test_list_with_ancestors_query_count(self):
        # same as above, but `groups` isn't requested and `ancestors(...)` is: 1 page fetch + 1 bulk
        # ancestor-org-unit fetch (no query for the ancestor *ids* themselves - they come from each
        # already-fetched row's `path` column).
        with self.assertNumQueries(3):
            response = self.client.get(BASE_URL, {"fields": "id,name,ancestors(id,name)"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_with_org_unit_type_and_parent_query_count(self):
        # 1 page fetch + 1 batch for `org_unit_type` + 1 batch for `parent` (no `groups`/`ancestors`
        # requested here).
        with self.assertNumQueries(4):
            response = self.client.get(BASE_URL, {"fields": "id,name,org_unit_type,parent"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_query_count(self):
        with self.assertNumQueries(3):
            response = self.client.get(f"{BASE_URL}{self.region.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_format_csv_default_fields_query_count(self):
        # This is the one that used to N+1: `groups` (the default field) was being batch-queried once
        # *per row* by re-running `serialize_org_units` on a 1-item list for every row instead of once
        # for the whole export queryset - so this count must NOT grow with the number of org units.
        # 4 queries: account/hierarchy scoping + group membership batch + distinct-groups-for-columns
        # (`collect_distinct_groups_for_queryset`) + the main streaming query.
        with self.assertNumQueries(4):
            response = self.client.get(BASE_URL, {"format": "csv"})
            b"".join(response.streaming_content)  # force the streaming response to actually execute
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_format_csv_with_ancestors_query_count(self):
        with self.assertNumQueries(4):
            response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name,ancestors(id,name)"})
            b"".join(response.streaming_content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class OrgUnitV3ParquetTestCase(BaseAPITransactionTestCase):
    """`format=parquet` needs the org units committed so DuckDB (a separate connection) can see them."""

    def setUp(self):
        self.star_wars = m.Account.objects.create(name="Star Wars")
        self.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=self.star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(self.project)
        self.sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        self.star_wars.default_version = self.sw_version_1
        self.star_wars.save()
        self.country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt")
        self.country_type.projects.add(self.project)
        m.OrgUnit.objects.create(
            org_unit_type=self.country_type,
            version=self.sw_version_1,
            name="Naboo",
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        self.user = self.create_user_with_profile(username="padme", account=self.star_wars)
        self.client.force_authenticate(self.user)

    def test_format_parquet(self):
        response = self.client.get(BASE_URL, {"format": "parquet"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_parquet_content_type(response)
        with open("/tmp/v3_orgunits_test.parquet", "wb") as f:
            write_response_to_file(response, f)
