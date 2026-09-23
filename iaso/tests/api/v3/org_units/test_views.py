from iaso.tests.api.v3.org_units.base import BASE_URL, OrgUnitV3TestCase


class OrgUnitV3ListTestCase(OrgUnitV3TestCase):
    def test_default_fields(self):
        data = self.get_json()
        self.assertFalse(data["has_next"])
        self.assertIsNone(data["count"])  # no `with_count` => not computed
        rows = {row["id"]: row for row in data["results"]}

        region = rows[self.region.id]
        self.assertEqual(
            list(region),
            [
                "id",
                "name",
                "uuid",
                "validation_status",
                "parent_id",
                "source_ref",
                "code",
                "aliases",
                "opening_date",
                "closed_date",
                "created_at",
                "updated_at",
                "has_geo_json",
                "latitude",
                "longitude",
                "altitude",
                "org_unit_type_id",
                "groups",
                "depth",
            ],
        )
        self.assertEqual(region["name"], self.region.name)
        self.assertEqual(region["parent_id"], self.country.id)
        self.assertEqual(region["source_ref"], self.region.source_ref)
        self.assertEqual(region["org_unit_type_id"], self.region_type.id)
        self.assertEqual((region["longitude"], region["latitude"], region["altitude"]), self.region.location.coords)
        self.assertEqual(region["groups"], [{"id": self.elite_group.id, "name": self.elite_group.name}])
        self.assertFalse(region["has_geo_json"])
        self.assertEqual(rows[self.cote.id]["aliases"], self.cote.aliases)

        self.assertTrue(rows[self.country.id]["has_geo_json"])
        self.assertIsNone(rows[self.country.id]["latitude"])  # no location
        self.assertEqual(rows[self.country.id]["aliases"], [])  # null in the database

    def test_depth_is_the_ltree_level(self):
        rows = {row["id"]: row for row in self.get_results({"fields": "id,depth"})}
        self.assertEqual(rows[self.country.id]["depth"], 1)
        self.assertEqual(rows[self.region.id]["depth"], 2)
        self.assertEqual(rows[self.district.id]["depth"], 3)

    def test_default_ordering_is_by_id_not_name(self):
        # `name` has no database index - ordering by it by default would force a full unindexed sort on every
        # request, including unbounded exports
        ids = self.get_ids()
        self.assertEqual(ids, sorted(ids))

    def test_order_param(self):
        names = [org_unit.name for org_unit in self.star_wars_org_units]
        self.assertEqual([row["name"] for row in self.get_results({"order": "name"})], sorted(names))
        self.assertEqual([row["name"] for row in self.get_results({"order": "-name"})], sorted(names, reverse=True))

    def test_browsable_api_still_renders(self):
        response = self.client.get(BASE_URL, {"format": "api"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])

    def test_format_typo_is_a_400_with_a_suggestion_not_drfs_bare_404(self):
        # DRF's content negotiation answers an unknown `?format=` with a bare 404 - caught in `initial()`
        data = self.get_error({"format": "parqet"})
        self.assertEqual(data["error"], "Unsupported format: 'parqet'")
        self.assertEqual(data["detail"], "Allowed values: csv, json, parquet, xlsx. Did you mean 'parquet'?")

    def test_unknown_format_without_close_match_has_no_suggestion(self):
        data = self.get_error({"format": "docx"})
        self.assertEqual(data["detail"], "Allowed values: csv, json, parquet, xlsx.")


class OrgUnitV3RetrieveTestCase(OrgUnitV3TestCase):
    def url(self, org_unit):
        return f"{BASE_URL}{org_unit.id}/"

    def test_retrieve_default_fields(self):
        data = self.get_json(url=self.url(self.region))
        self.assertEqual(data["id"], self.region.id)
        self.assertEqual(data["name"], self.region.name)
        self.assertEqual(data["groups"], [{"id": self.elite_group.id, "name": self.elite_group.name}])

    def test_retrieve_with_fields(self):
        data = self.get_json({"fields": "id,ancestors(name)"}, url=self.url(self.district))
        self.assertEqual(
            data,
            {
                "id": self.district.id,
                "ancestors": [
                    {"id": self.country.id, "name": self.country.name},
                    {"id": self.region.id, "name": self.region.name},
                ],
            },
        )

    def test_retrieve_rejects_invalid_fields(self):
        data = self.get_error({"fields": "id,nope"}, url=self.url(self.region))
        self.assertEqual(data["error"], "Unknown field(s) in fields=: nope")

    def test_retrieve_unknown_id_is_not_found(self):
        self.get_error({}, status_code=404, url=f"{BASE_URL}999999999/")


class OrgUnitV3FieldsSchemaTestCase(OrgUnitV3TestCase):
    def test_schema_action_describes_fields(self):
        # a plain GET, and proof `schema/` isn't swallowed by the `<pk>/` detail route
        data = self.get_json(url=f"{BASE_URL}schema/")
        self.assertEqual(data["default_fields"][:2], ["id", "name"])
        self.assertNotIn("geom", data["default_fields"])
        self.assertEqual(data["fields"]["name"], {"default": True})
        self.assertEqual(data["fields"]["geom"], {"default": False, "shape": "GeoJSON"})
        ancestors = data["fields"]["ancestors"]
        self.assertFalse(ancestors["default"])
        self.assertTrue(ancestors["many"])
        self.assertTrue(ancestors["sub_selector"])
        self.assertEqual(ancestors["default_subfields"], ["id", "name", "source_ref", "org_unit_type_id"])
        self.assertIn("validation_status", ancestors["allowed_subfields"])
        self.assertFalse(data["fields"]["org_unit_type"]["sub_selector"])
