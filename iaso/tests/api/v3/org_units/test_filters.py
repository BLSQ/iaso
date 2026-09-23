from iaso import models as m
from iaso.tests.api.v3.org_units.base import OrgUnitV3TestCase


class OrgUnitV3FiltersTestCase(OrgUnitV3TestCase):
    def assert_ids(self, params, expected_org_units):
        self.assertCountEqual(
            self.get_ids({"fields": "id", **params}), [org_unit.id for org_unit in expected_org_units]
        )

    # -- ids --

    def test_id(self):
        self.assert_ids({"id": self.region.id}, [self.region])

    def test_id_in_loads_several_org_units_by_id(self):
        self.assert_ids({"id__in": f"{self.region.id},{self.district.id}"}, [self.region, self.district])

    def test_id_in_rejects_a_non_numeric_token_instead_of_500(self):
        # `BaseInFilter` alone doesn't validate each value - hence `NumberInFilter` (`iaso/api/common/filters.py`)
        self.get_error({"id__in": f"{self.region.id},not-a-number"})

    def test_integer_filters_reject_non_integer_values(self):
        for params in ({"parent_id": "1.5"}, {"depth": "2.5"}, {"org_unit_type_id": "abc"}):
            with self.subTest(params=params):
                self.get_error(params)

    # -- text --

    def test_name(self):
        self.assert_ids({"name": self.region.name}, [self.region])

    def test_name_icontains(self):
        self.assert_ids({"name__icontains": self.region.name[:3].lower()}, [self.region, self.district])

    def test_name_startswith(self):
        self.assert_ids({"name__startswith": self.region.name}, [self.region, self.district])

    def test_name_icontains_is_case_insensitive_but_not_accent_insensitive(self):
        # accent-folding would need the postgres `unaccent` extension (a migration), deliberately deferred
        for term in ("côte", "CÔTE"):
            with self.subTest(term=term):
                self.assert_ids({"name__icontains": term}, [self.cote])
        self.assert_ids({"name__icontains": "cote"}, [])

    def test_source_ref_and_code(self):
        self.assert_ids({"source_ref": self.region.source_ref}, [self.region])
        self.assert_ids(
            {"source_ref__in": f"{self.region.source_ref},{self.country.source_ref}"}, [self.region, self.country]
        )
        self.assert_ids({"source_ref__startswith": "country"}, [self.country])
        self.assert_ids({"code": self.cote.code}, [self.cote])
        self.assert_ids({"code__in": f"{self.cote.code},{self.region.code}"}, [self.cote, self.region])

    def test_validation_status(self):
        self.assert_ids({"validation_status": m.OrgUnit.VALIDATION_NEW}, [self.district])
        self.assert_ids({"validation_status__in": m.OrgUnit.VALIDATION_NEW}, [self.district])

    def test_invalid_validation_status_is_bad_request(self):
        self.get_error({"validation_status": "NOPE"})

    # -- relations --

    def test_org_unit_type(self):
        self.assert_ids({"org_unit_type_id": self.region_type.id}, [self.region])
        self.assert_ids({"org_unit_type__category": "COUNTRY"}, [self.country, self.country_without_geom, self.cote])
        self.assert_ids({"org_unit_type__name__icontains": self.district_type.name.upper()}, [self.district])

    def test_parent(self):
        self.assert_ids({"parent_id": self.region.id}, [self.district])
        self.assert_ids({"parent__name__icontains": self.country.name.lower()}, [self.region])
        self.assert_ids({"parent__source_ref": self.region.source_ref}, [self.district])

    def test_group(self):
        self.assert_ids({"group_id": self.elite_group.id}, [self.region])

    def test_source_version_and_project(self):
        self.assert_ids({"source_id": self.sw_source.id}, self.star_wars_org_units)
        self.assert_ids({"version_id": self.sw_version_1.id}, self.star_wars_org_units)
        self.assert_ids({"project_id": self.project.id}, self.star_wars_org_units)

    # -- hierarchy --

    def test_ancestor_id_returns_every_descendant_but_not_itself(self):
        self.assert_ids({"ancestor_id": self.country.id}, [self.region, self.district])

    def test_ancestor_id_direct_children(self):
        self.assert_ids({"ancestor_id__direct_children": self.country.id}, [self.region])

    def test_depth(self):
        self.assert_ids({"depth": 1}, [self.country, self.country_without_geom, self.cote])
        self.assert_ids({"depth": 3}, [self.district])

    def test_depth_filter_matches_the_returned_depth_field(self):
        (row,) = self.get_results({"depth": 2, "fields": "id,depth"})
        self.assertEqual(row, {"id": self.region.id, "depth": 2})

    # -- dates --

    def test_source_created_at_range(self):
        m.OrgUnit.objects.filter(id=self.region.id).update(source_created_at="2024-05-10T12:00:00Z")
        m.OrgUnit.objects.filter(id=self.district.id).update(source_created_at="2024-06-10T12:00:00Z")
        cases = [
            ({"source_created_at__gte": "2024-05-10T12:00:00Z"}, [self.region, self.district]),
            ({"source_created_at__gte": "2024-06-01T00:00:00Z"}, [self.district]),
            ({"source_created_at__lte": "2024-06-01T00:00:00+02:00"}, [self.region]),
            (
                {"source_created_at__gte": "2024-05-01T00:00:00Z", "source_created_at__lte": "2024-05-31T00:00:00Z"},
                [self.region],
            ),
        ]
        for params, expected in cases:
            with self.subTest(params=params):
                self.assert_ids(params, expected)

    def test_date_ranges(self):
        m.OrgUnit.objects.filter(id=self.region.id).update(opening_date="2020-01-01", closed_date="2022-01-01")
        self.assert_ids({"opening_date__gte": "2019-12-31", "opening_date__lte": "2020-01-01"}, [self.region])
        self.assert_ids({"closed_date__lte": "2022-01-01"}, [self.region])
        self.assert_ids({"closed_date__gte": "2022-01-02"}, [])
        self.assert_ids({"created_at__gte": "2000-01-01T00:00:00Z"}, self.star_wars_org_units)
        self.assert_ids({"updated_at__lte": "2000-01-01T00:00:00Z"}, [])

    def test_datetime_filters_reject_an_out_of_range_timezone_offset(self):
        # postgres' `timestamptz` rejects an offset of 16 hours or more - an uncaught `DataError` (500) without
        # `SafeIsoDateTimeFilter`
        for param in ("created_at__gte", "updated_at__lte", "source_created_at__gte"):
            with self.subTest(param=param):
                data = self.get_error({param: "2020-01-01T00:00:00-16:01"})
                field_name = param.rsplit("__", 1)[0]
                self.assertEqual(data["error"], f"Invalid value for {field_name!r}")
                self.assertEqual(
                    data["detail"], "Time zone offset in '2020-01-01T00:00:00-16:01' must be within 16 hours of UTC."
                )

    def test_datetime_filter_accepts_a_normal_timezone_offset(self):
        self.assert_ids({"created_at__gte": "2020-01-01T00:00:00+02:00"}, self.star_wars_org_units)

    # -- geometry presence --

    def test_has_shape_and_has_location(self):
        self.assert_ids({"has_shape": "true"}, [self.country])
        self.assert_ids({"has_location": "true"}, [self.region])
        self.assert_ids({"has_location": "false"}, [self.country, self.country_without_geom, self.district, self.cote])

    def test_geometry_isnull(self):
        # `country` only has `geom`: `has_shape` includes it, `simplified_geom__isnull=false` doesn't
        self.assert_ids({"geom__isnull": "false"}, [self.country])
        self.assert_ids({"simplified_geom__isnull": "false"}, [])
        self.assert_ids({"simplified_geom__isnull": "true"}, self.star_wars_org_units)
        self.assert_ids({"catchment__isnull": "false"}, [])
        self.assert_ids({"location__isnull": "false"}, [self.region])

    # -- spatial --

    def test_bbox(self):
        self.assert_ids({"geom__bbox": "-1,-1,11,11"}, [self.country])
        self.assert_ids({"geom__bbox": "100,100,200,200"}, [])
        self.assert_ids({"simplified_geom__bbox": "-1,-1,11,11"}, [])
        self.assert_ids({"location__bbox": "0,0,10,10"}, [self.region])

    def test_outside_bbox_excludes_org_units_without_that_geometry(self):
        misplaced = self.create_misplaced_facility(parent=self.region)
        # `region` is inside the box, `district` has no location at all - neither is "outside"
        self.assert_ids({"location__outside_bbox": "0,0,10,10"}, [misplaced])
        self.assert_ids({"geom__outside_bbox": "-1,-1,11,11"}, [])
        self.assert_ids({"geom__outside_bbox": "100,100,200,200"}, [self.country])

    def test_invalid_bbox(self):
        cases = {
            "not-a-bbox": "Expected 'minx,miny,maxx,maxy'",
            "0,0,1,x": "All 4 values must be numbers",
            "nan,0,1,1": "All 4 values must be finite numbers",  # used to be a 500
        }
        for param in ("geom__bbox", "location__outside_bbox"):
            for value, detail in cases.items():
                with self.subTest(param=param, value=value):
                    data = self.get_error({param: value})
                    self.assertEqual(data["error"], f"Invalid bbox value {value!r}")
                    self.assertEqual(data["detail"], detail)

    def test_within_org_unit(self):
        self.assert_ids({"location__within_org_unit": self.country.id}, [self.region])
        self.assert_ids({"geom__within_org_unit": self.country.id}, [self.country])  # a shape is within itself

    def test_outside_org_unit_excludes_org_units_without_that_geometry(self):
        misplaced = self.create_misplaced_facility(parent=self.region)
        self.assert_ids({"location__outside_org_unit": self.country.id}, [misplaced])
        self.assert_ids({"geom__outside_org_unit": self.country.id}, [])

    def test_within_or_outside_an_org_unit_without_geometry(self):
        for param in ("location__within_org_unit", "location__outside_org_unit"):
            with self.subTest(param=param):
                data = self.get_error({param: self.country_without_geom.id})
                self.assertEqual(data["error"], f"Org unit {self.country_without_geom.id} has no geometry")

    def test_descendants_with_a_location_outside_their_ancestors_shape(self):
        # the data-quality query behind the shape QA page: descendants (`ancestor_id`) whose point falls
        # outside that same ancestor's shape (`location__outside_org_unit`), or outside a known bbox
        misplaced = self.create_misplaced_facility(parent=self.district)
        for spatial_param in ({"location__outside_org_unit": self.country.id}, {"location__outside_bbox": "0,0,10,10"}):
            with self.subTest(**spatial_param):
                params = {"ancestor_id": self.country.id, "fields": "id,latitude,ancestors(name)", **spatial_param}
                (row,) = self.get_results(params)
                self.assertEqual(row["id"], misplaced.id)
                self.assertEqual(row["latitude"], misplaced.location.y)
                self.assertEqual(
                    [ancestor["name"] for ancestor in row["ancestors"]],
                    [self.country.name, self.region.name, self.district.name],
                )

    # -- view-level shortcuts --

    def test_search_matches_name_case_insensitively(self):
        self.assert_ids({"search": "CÔTE"}, [self.cote])

    def test_search_matches_a_whole_alias_case_insensitively(self):
        # `aliases` has a case-insensitive collation; an alias only matches as a whole, not as a substring
        self.assert_ids({"search": self.cote.aliases[0]}, [self.cote])
        self.assert_ids({"search": self.cote.aliases[0].lower()}, [self.cote])
        self.assert_ids({"search": self.cote.aliases[0][:2]}, [])

    def test_default_version_restricts_to_the_accounts_default_version(self):
        sw_version_2 = m.SourceVersion.objects.create(data_source=self.sw_source, number=2)
        other_version_unit = m.OrgUnit.objects.create(
            org_unit_type=self.country_type, version=sw_version_2, name="Other version"
        )
        self.assert_ids({}, [*self.star_wars_org_units, other_version_unit])
        self.assert_ids({"default_version": "true"}, self.star_wars_org_units)

    def test_roots_for_user_without_assigned_org_units_returns_the_roots(self):
        self.assert_ids({"roots_for_user": "true"}, [self.country, self.country_without_geom, self.cote])

    def test_roots_for_user_returns_the_users_assigned_org_units(self):
        self.user.iaso_profile.org_units.set([self.region])
        self.assert_ids({"roots_for_user": "true"}, [self.region])

    # -- strict param validation --

    def test_unknown_query_param_is_rejected_with_suggestions(self):
        data = self.get_error({"source_reff": "abc"})
        self.assertEqual(data["error"], "Unsupported query parameter(s): source_reff")
        self.assertEqual(data["suggestions"]["source_reff"][0], "source_ref")
        self.assertEqual(data["detail"], "'source_reff': did you mean 'source_ref'?")

    def test_unknown_query_param_without_close_match_has_no_suggestions(self):
        # `difflib` catches typos, not a vocabulary change like the legacy `dateFrom` -> `created_at__gte`
        data = self.get_error({"dateFrom": "2020-01-01"})
        self.assertEqual(data["error"], "Unsupported query parameter(s): dateFrom")
        self.assertEqual(data["suggestions"], {})
        self.assertEqual(data["detail"], "No close match found among the known query parameters.")
