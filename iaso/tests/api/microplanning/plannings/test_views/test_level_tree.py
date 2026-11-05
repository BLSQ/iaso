from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from rest_framework import status

from iaso.models import Group, OrgUnit, Planning, PlanningConfig, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION
from iaso.test import APITestCase


SQUARE = MultiPolygon(Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0))))


class PlanningLevelTreeAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.source, cls.version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_PLANNING_READ_PERMISSION]
        )
        other_account, _, _, other_project = cls.create_account_datasource_version_project(
            "other source", "other account", "other project"
        )
        cls.other_user = cls.create_user_with_profile(
            username="other", account=other_account, permissions=[CORE_PLANNING_READ_PERMISSION]
        )

        country_type = cls.create_org_unit_type("Country", [cls.project])
        cls.region_type = cls.create_org_unit_type("Region", [cls.project])
        district_type = cls.create_org_unit_type("District", [cls.project])
        cls.facility_type = cls.create_org_unit_type("Facility", [cls.project])

        def create_org_unit(name, org_unit_type, parent=None, **kwargs):
            return OrgUnit.objects.create(
                name=name,
                org_unit_type=org_unit_type,
                parent=parent,
                version=cls.version,
                validation_status=kwargs.pop("validation_status", OrgUnit.VALIDATION_VALID),
                **kwargs,
            )

        cls.country = create_org_unit("Country", country_type, simplified_geom=SQUARE)
        cls.region_a = create_org_unit("Region A", cls.region_type, cls.country, simplified_geom=SQUARE)
        cls.region_b = create_org_unit("Region B", cls.region_type, cls.country)
        district_a = create_org_unit("District A", district_type, cls.region_a)
        district_b = create_org_unit("District B", district_type, cls.region_b)
        cls.facility_a = create_org_unit("Facility A", cls.facility_type, district_a, location=Point(2, 3, 0))
        cls.facility_b = create_org_unit("Facility B", cls.facility_type, district_b)
        create_org_unit(
            "Rejected facility", cls.facility_type, district_a, validation_status=OrgUnit.VALIDATION_REJECTED
        )
        cls.region_group = Group.objects.create(name="Selected regions", source_version=cls.version)
        cls.region_group.org_units.add(cls.region_a)

        team = Team.objects.create(name="team", project=cls.project, manager=cls.user)
        cls.planning = Planning.objects.create(name="planning", project=cls.project, team=team, org_unit=cls.country)
        cls.regions_level = PlanningConfig.objects.create(planning=cls.planning, level=1)
        cls.regions_level.org_unit_types.set([cls.region_type])
        facilities_level = PlanningConfig.objects.create(planning=cls.planning, level=2)
        facilities_level.org_unit_types.set([cls.facility_type])

        other_team = Team.objects.create(name="other team", project=other_project, manager=cls.other_user)
        cls.other_planning = Planning.objects.create(
            name="other planning", project=other_project, team=other_team, org_unit=cls.country
        )

    def get_level_tree(self, planning=None, user=None):
        self.client.force_authenticate(user or self.user)
        return self.client.get(f"/api/microplanning/plannings/{(planning or self.planning).id}/orgunits/level-tree/")

    def get_level_geometry(self, level, user=None):
        self.client.force_authenticate(user or self.user)
        return self.client.get(
            f"/api/microplanning/plannings/{self.planning.id}/orgunits/level-tree/geometry/", {"level": level}
        )

    def test_level_tree_lists_each_level_with_its_closest_ancestor_in_the_level_above(self):
        """Facilities point to their region, skipping the districts that are not a planning level."""
        response = self.get_level_tree()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nodes = {node["id"]: node for node in response.json()}
        self.assertEqual(
            {node_id: (node["level"], node["parent_id"]) for node_id, node in nodes.items()},
            {
                self.country.id: (0, None),
                self.region_a.id: (1, self.country.id),
                self.region_b.id: (1, self.country.id),
                self.facility_a.id: (2, self.region_a.id),
                self.facility_b.id: (2, self.region_b.id),
            },
        )
        self.assertEqual(
            nodes[self.facility_a.id],
            {
                "id": self.facility_a.id,
                "name": "Facility A",
                "org_unit_type_id": self.facility_type.id,
                "level": 2,
                "parent_id": self.region_a.id,
                "has_geo_json": False,
                "has_location": True,
            },
        )

    def test_level_tree_restricts_a_level_to_org_units_below_the_level_above_groups(self):
        """When regions are limited to a group, only facilities below those regions are kept."""
        self.regions_level.org_unit_groups.set([self.region_group])

        response = self.get_level_tree()

        self.assertEqual(
            {node["id"] for node in response.json()},
            {self.country.id, self.region_a.id, self.facility_a.id},
        )

    def test_level_tree_stops_at_a_level_without_org_unit_types(self):
        self.regions_level.org_unit_types.clear()

        response = self.get_level_tree()

        self.assertEqual([node["id"] for node in response.json()], [self.country.id])

    def test_level_tree_renders_in_the_browsable_api_without_target_types(self):
        """The browsable API calls get_queryset, which must not require the v1 target types or sampling."""
        self.client.force_authenticate(self.user)

        response = self.client.get(
            f"/api/microplanning/plannings/{self.planning.id}/orgunits/level-tree/", HTTP_ACCEPT="text/html"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_level_tree_of_another_account_planning_is_not_found(self):
        response = self.get_level_tree(planning=self.other_planning)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_level_geometry_returns_shapes_and_locations_of_the_level(self):
        """Org units without shape fall back to their location; those with neither are left out."""
        regions = self.get_level_geometry(1).json()
        facilities = self.get_level_geometry(2).json()

        self.assertEqual(regions["type"], "FeatureCollection")
        self.assertEqual([feature["id"] for feature in regions["features"]], [self.region_a.id])
        self.assertEqual(regions["features"][0]["geometry"]["type"], "MultiPolygon")
        self.assertEqual(regions["features"][0]["properties"], {"id": self.region_a.id, "name": "Region A"})
        self.assertEqual(
            facilities["features"],
            [
                {
                    "type": "Feature",
                    "id": self.facility_a.id,
                    "geometry": {"type": "Point", "coordinates": [2.0, 3.0]},
                    "properties": {"id": self.facility_a.id, "name": "Facility A"},
                }
            ],
        )

    def test_level_geometry_of_a_level_limited_to_groups(self):
        """An org unit in several of the level groups is returned once."""
        other_group = Group.objects.create(name="Other regions", source_version=self.version)
        other_group.org_units.add(self.region_a)
        self.regions_level.org_unit_groups.set([self.region_group, other_group])

        response = self.get_level_geometry(1)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([feature["id"] for feature in response.json()["features"]], [self.region_a.id])

    def test_level_geometry_of_the_target_geography_and_unknown_level(self):
        self.assertEqual(
            [feature["id"] for feature in self.get_level_geometry(0).json()["features"]], [self.country.id]
        )
        self.assertEqual(self.get_level_geometry(5).json()["features"], [])

    def test_level_geometry_requires_a_positive_level(self):
        self.assertEqual(self.get_level_geometry(-1).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.get_level_geometry("abc").status_code, status.HTTP_400_BAD_REQUEST)
