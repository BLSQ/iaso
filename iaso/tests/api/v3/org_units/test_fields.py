from iaso.tests.api.v3.org_units.base import OrgUnitV3TestCase


class OrgUnitV3FieldsTestCase(OrgUnitV3TestCase):
    def test_flat_subset_in_the_requested_order(self):
        self.assertEqual(
            self.get_row(self.region, {"fields": "name,id"}), {"name": self.region.name, "id": self.region.id}
        )
        self.assertEqual(list(self.get_row(self.region, {"fields": "name,id"})), ["name", "id"])

    def test_whitespace_around_commas_and_parens_is_allowed(self):
        row = self.get_row(self.district, {"fields": "id, name, ancestors( id, name )"})
        self.assertEqual(list(row), ["id", "name", "ancestors"])
        self.assertEqual(list(row["ancestors"][0]), ["id", "name"])

    def test_every_field_at_once(self):
        # every top-level field, comma-space separated - a real query someone tried
        fields = self.get_json(url="/api/v3/orgunits/schema/")["fields"]
        row = self.get_row(self.region, {"fields": ", ".join(fields)})
        self.assertEqual(list(row), list(fields))

    def test_unknown_field(self):
        data = self.get_error({"fields": "id,not_a_real_field"})
        self.assertEqual(data["error"], "Unknown field(s) in fields=: not_a_real_field")
        self.assertIn("ancestors", data["detail"])

    def test_bracket_typo_suggests_parenthesis(self):
        data = self.get_error({"fields": "id,name,ancestors[id,name]"})
        self.assertEqual(data["error"], "Invalid fields= parameter")
        self.assertIn("Did you mean '(' instead of '['?", data["detail"])
        self.assertIn("ancestors(id,name)", data["detail"])

    # -- geometry --

    def test_geometry_is_opt_in_geojson(self):
        self.assertNotIn("geom", self.get_row(self.country))
        row = self.get_row(self.country, {"fields": "id,geom,simplified_geom,catchment"})
        self.assertEqual(row["geom"]["type"], "MultiPolygon")
        self.assertEqual(row["geom"]["coordinates"], [[[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]])
        self.assertIsNone(row["simplified_geom"])
        self.assertIsNone(row["catchment"])

    # -- groups --

    def test_groups_returns_id_and_name(self):
        row = self.get_row(self.region, {"fields": "id,groups"})
        self.assertEqual(row["groups"], [{"id": self.elite_group.id, "name": self.elite_group.name}])

    def test_group_ids_is_the_lightweight_alternative(self):
        self.assertEqual(self.get_row(self.region, {"fields": "group_ids"}), {"group_ids": [self.elite_group.id]})

    def test_groups_reject_a_sub_selector(self):
        data = self.get_error({"fields": "groups(name)"})
        self.assertEqual(data["error"], "groups doesn't support a sub-selector")

    # -- ancestors / parent --

    def test_ancestors_root_first(self):
        row = self.get_row(self.district, {"fields": "id,ancestors(id,name,source_ref)"})
        self.assertEqual(
            row["ancestors"],
            [
                {"id": self.country.id, "name": self.country.name, "source_ref": self.country.source_ref},
                {"id": self.region.id, "name": self.region.name, "source_ref": self.region.source_ref},
            ],
        )

    def test_ancestors_default_sub_fields_always_include_the_id(self):
        row = self.get_row(self.region, {"fields": "ancestors"})
        self.assertEqual(
            row["ancestors"],
            [
                {
                    "id": self.country.id,
                    "name": self.country.name,
                    "source_ref": self.country.source_ref,
                    "org_unit_type_id": self.country_type.id,
                }
            ],
        )
        self.assertEqual(
            self.get_row(self.region, {"fields": "ancestors(name)"})["ancestors"][0]["id"], self.country.id
        )

    def test_root_has_no_ancestors(self):
        self.assertEqual(self.get_row(self.country, {"fields": "ancestors"}), {"ancestors": []})

    def test_unknown_ancestor_sub_field(self):
        data = self.get_error({"fields": "id,ancestors(not_a_real_field)"})
        self.assertEqual(data["error"], "Unknown field(s) in fields=: ancestors.not_a_real_field")

    def test_parent_default_sub_fields(self):
        row = self.get_row(self.district, {"fields": "parent"})
        self.assertEqual(
            row["parent"],
            {
                "id": self.region.id,
                "name": self.region.name,
                "source_ref": self.region.source_ref,
                "org_unit_type_id": self.region_type.id,
            },
        )

    def test_parent_custom_sub_fields(self):
        row = self.get_row(self.district, {"fields": "parent(name,validation_status)"})
        self.assertEqual(
            row["parent"],
            {"id": self.region.id, "name": self.region.name, "validation_status": self.region.validation_status},
        )

    def test_parent_is_null_for_a_root(self):
        self.assertEqual(self.get_row(self.country, {"fields": "parent"}), {"parent": None})

    # -- fixed-shape relations --

    def test_org_unit_type_returns_a_fixed_shape(self):
        row = self.get_row(self.region, {"fields": "org_unit_type"})
        self.assertEqual(
            row["org_unit_type"],
            {
                "id": self.region_type.id,
                "name": self.region_type.name,
                "short_name": self.region_type.short_name,
                "category": self.region_type.category,
            },
        )

    def test_creator_returns_a_fixed_shape(self):
        row = self.get_row(self.region, {"fields": "creator"})
        self.assertEqual(
            row["creator"],
            {
                "id": self.user.id,
                "username": self.user.username,
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "email": self.user.email,
            },
        )

    def test_creator_is_null_when_not_recorded(self):
        self.assertEqual(self.get_row(self.country, {"fields": "creator"}), {"creator": None})

    def test_fixed_shape_relations_reject_a_sub_selector(self):
        for field in ("org_unit_type", "creator"):
            with self.subTest(field=field):
                data = self.get_error({"fields": f"id,{field}(name)"})
                self.assertEqual(data["error"], f"{field} doesn't support a sub-selector")

    # -- version --

    def test_version_default_sub_fields(self):
        row = self.get_row(self.region, {"fields": "version"})
        self.assertEqual(
            row["version"],
            {"id": self.sw_version_1.id, "number": self.sw_version_1.number, "data_source_id": self.sw_source.id},
        )

    def test_version_with_data_source(self):
        row = self.get_row(self.region, {"fields": "version(data_source)"})
        self.assertEqual(
            row["version"],
            {"id": self.sw_version_1.id, "data_source": {"id": self.sw_source.id, "name": self.sw_source.name}},
        )

    def test_version_sub_selector_errors(self):
        cases = {
            "version(data_source(name))": "version.data_source doesn't support a sub-selector",
            "version(not_a_real_field)": "Unknown field(s) in fields=: version.not_a_real_field",
        }
        for fields, error in cases.items():
            with self.subTest(fields=fields):
                self.assertEqual(self.get_error({"fields": fields})["error"], error)
