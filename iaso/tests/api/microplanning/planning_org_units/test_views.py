from django.contrib.auth.models import User
from django.contrib.gis.geos import MultiPolygon, Polygon
from rest_framework import status

from iaso.api.microplanning.org_units.serializers.org_unit_table import (
    PlanningOrgUnitTableAssignmentTeamSerializer,
    PlanningOrgUnitTableAssignmentUserSerializer,
)
from iaso.models import (
    Account,
    DataSource,
    Form,
    Group,
    MissionForm,
    OrgUnit,
    OrgUnitType,
    SourceVersion,
)
from iaso.models.microplanning import (
    Assignment,
    Planning,
    PlanningSamplingResult,
)
from iaso.models.missions import MissionFormThroughForm
from iaso.models.team import Team
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


class PlanningOrgUnitsViewAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)
        Team.objects.create(project=project2, name="team2", manager=user)
        other_account = Account.objects.create(name="other account")
        cls.other_user = cls.create_user_with_profile(username="user", account=other_account)
        cls.other_project = other_account.project_set.create(name="other_project")
        cls.other_team = Team.objects.create(name="other team", project=cls.other_project, manager=cls.other_user)
        source = DataSource.objects.create(name="Evil Empire")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit = org_unit = OrgUnit.objects.create(version=version)
        cls.form1 = Form.objects.create(name="form1")
        cls.form2 = Form.objects.create(name="form2")
        cls.form1.projects.add(project1)
        cls.form2.projects.add(project1)
        cls.mission1 = MissionForm.objects.create(
            name="mission1",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission1, form=cls.form1, min_cardinality=1, max_cardinality=1
        )
        cls.mission2 = MissionForm.objects.create(
            name="mission2",
            description="description2",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission2, form=cls.form2, min_cardinality=1, max_cardinality=1
        )
        cls.planning = Planning.objects.create(
            project=project1,
            name="planning1",
            team=cls.team1,
            org_unit=org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )

        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )

    def test_planning_orgunits_children_unknown_planning_returns_404(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/microplanning/plannings/999999999/orgunits/children/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_planning_orgunits_children_missing_scope_raises_error(self):
        """A planning without sampling group or target org unit type should error."""
        self.client.force_authenticate(self.user)
        planning = Planning.objects.create(
            project=self.project1,
            name="planning-missing-scope",
            team=self.team1,
            org_unit=self.org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/children/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("planning", r)
        self.assertEqual(r["planning"][0], "Planning is missing sampling group or target org unit scope")

    def test_planning_orgunits_children_with_target_org_unit_type(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-ou",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/children/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        ids = [ou["id"] for ou in r]
        self.assertEqual(ids, [child.id])
        self.assertTrue(r[0]["has_geo_json"])

    def test_planning_orgunits_children_filter_by_org_unit_parent_id(self):
        """orgUnitParentId returns planning org units that are direct or indirect descendants of the parent."""
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Region type")
        parent_type.projects.add(self.project1)
        district_type = OrgUnitType.objects.create(name="District type")
        district_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Health post type")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-ou",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        district_a = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="district-a",
            parent=root,
            org_unit_type=district_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        district_b = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="district-b",
            parent=root,
            org_unit_type=district_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_a1 = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-a1",
            parent=district_a,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_a2 = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-a2",
            parent=district_a,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_b1 = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-b1",
            parent=district_b,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits-parent-filter",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        base = f"/api/microplanning/plannings/{planning.id}/orgunits/children/"
        unfiltered = self.assertJSONResponse(self.client.get(base, format="json"), status.HTTP_200_OK)
        self.assertCountEqual(
            [ou["id"] for ou in unfiltered],
            [child_a1.id, child_a2.id, child_b1.id],
        )

        filtered_a = self.assertJSONResponse(
            self.client.get(f"{base}?orgUnitParentId={district_a.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertCountEqual([ou["id"] for ou in filtered_a], [child_a1.id, child_a2.id])

        filtered_b = self.assertJSONResponse(
            self.client.get(f"{base}?orgUnitParentId={district_b.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual([ou["id"] for ou in filtered_b], [child_b1.id])

        paginated_url = (
            f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/"
            f"?limit=50&page=1&orgUnitParentId={district_a.id}"
        )
        paginated = self.assertJSONResponse(self.client.get(paginated_url, format="json"), status.HTTP_200_OK)
        self.assertCountEqual(
            [ou["id"] for ou in paginated["results"]],
            [child_a1.id, child_a2.id],
        )

    def test_planning_orgunits_children_filter_by_org_unit_type_ids(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Region type multi")
        parent_type.projects.add(self.project1)
        aire_type = OrgUnitType.objects.create(name="Aire type")
        aire_type.projects.add(self.project1)
        centre_type = OrgUnitType.objects.create(name="Centre type")
        centre_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-multi-type",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        aire = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="aire-1",
            parent=root,
            org_unit_type=aire_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        centre = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="centre-1",
            parent=aire,
            org_unit_type=centre_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits-type-filter",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([aire_type, centre_type])

        base = f"/api/microplanning/plannings/{planning.id}/orgunits/children/"
        unfiltered = self.assertJSONResponse(self.client.get(base, format="json"), status.HTTP_200_OK)
        self.assertCountEqual([ou["id"] for ou in unfiltered], [aire.id, centre.id])

        aires_only = self.assertJSONResponse(
            self.client.get(f"{base}?orgUnitTypeIds={aire_type.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual([ou["id"] for ou in aires_only], [aire.id])

        centres_only = self.assertJSONResponse(
            self.client.get(f"{base}?orgUnitTypeIds={centre_type.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual([ou["id"] for ou in centres_only], [centre.id])

        both_types = self.assertJSONResponse(
            self.client.get(f"{base}?orgUnitTypeIds={aire_type.id},{centre_type.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertCountEqual([ou["id"] for ou in both_types], [aire.id, centre.id])

        paginated_base = f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/?limit=50&page=1"
        paginated_all = self.assertJSONResponse(self.client.get(paginated_base, format="json"), status.HTTP_200_OK)
        self.assertEqual(paginated_all["count"], 2)

        paginated_aires = self.assertJSONResponse(
            self.client.get(f"{paginated_base}&orgUnitTypeIds={aire_type.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual(paginated_aires["count"], 1)
        self.assertEqual(paginated_aires["results"][0]["id"], aire.id)

        paginated_centres = self.assertJSONResponse(
            self.client.get(f"{paginated_base}&orgUnitTypeIds={centre_type.id}", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual(paginated_centres["count"], 1)
        self.assertEqual(paginated_centres["results"][0]["id"], centre.id)

        paginated_centres_under_aire = self.assertJSONResponse(
            self.client.get(
                f"{paginated_base}&orgUnitParentId={aire.id}&orgUnitTypeIds={centre_type.id}",
                format="json",
            ),
            status.HTTP_200_OK,
        )
        self.assertEqual(paginated_centres_under_aire["count"], 1)
        self.assertEqual(paginated_centres_under_aire["results"][0]["id"], centre.id)

    def test_planning_orgunits_children_search_by_name(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type search")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type search")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-search",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_alpha = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="alpha-clinic",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_beta = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="beta-clinic",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits-search",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        base = f"/api/microplanning/plannings/{planning.id}/orgunits/children/"
        unfiltered = self.assertJSONResponse(self.client.get(base, format="json"), status.HTTP_200_OK)
        self.assertCountEqual(
            [ou["id"] for ou in unfiltered],
            [child_alpha.id, child_beta.id],
            msg="without ?search=, both descendant org units must be returned (SearchFilter must not hide all rows)",
        )

        response = self.client.get(f"{base}?search=alpha", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual([ou["id"] for ou in r], [child_alpha.id])

    def test_planning_orgunits_children_only_validation_valid_descendants(self):
        """children and children-paginated must not return NEW or REJECTED org units (descendants scope)."""
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent validation filter")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child validation filter")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-validation",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_valid = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-valid",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-new",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_NEW,
            simplified_geom=multipolygon,
        )
        OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-rejected",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_REJECTED,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-validation-filter",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        r_map = self.assertJSONResponse(
            self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/children/", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual([ou["id"] for ou in r_map], [child_valid.id])

        r_page = self.assertJSONResponse(
            self.client.get(
                f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/?limit=50&page=1",
                format="json",
            ),
            status.HTTP_200_OK,
        )
        self.assertEqual(r_page["count"], 1)
        self.assertEqual([ou["id"] for ou in r_page["results"]], [child_valid.id])

    def test_planning_orgunits_children_only_validation_valid_sampling_group(self):
        """children and children-paginated must not return NEW org units linked via sampling group."""
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent sampling validation")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child sampling validation")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-sampling-val",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        sampled_valid = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="sampled-valid",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        sampled_new = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="sampled-new",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_NEW,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-sampling-validation",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        group = Group.objects.create(name="sampling-group-validation", source_version=self.org_unit.version)
        group.org_units.add(sampled_valid, sampled_new)
        sampling = PlanningSamplingResult.objects.create(
            planning=planning,
            pipeline_id="pipeline",
            pipeline_version="v1",
            group=group,
            parameters={},
            created_by=self.user,
        )
        planning.selected_sampling_result = sampling
        planning.save()

        r_map = self.assertJSONResponse(
            self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/children/", format="json"),
            status.HTTP_200_OK,
        )
        self.assertEqual([ou["id"] for ou in r_map], [sampled_valid.id])

        r_page = self.assertJSONResponse(
            self.client.get(
                f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/?limit=50&page=1",
                format="json",
            ),
            status.HTTP_200_OK,
        )
        self.assertEqual(r_page["count"], 1)
        self.assertEqual([ou["id"] for ou in r_page["results"]], [sampled_valid.id])

    def test_planning_orgunits_children_with_sampling_group(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type sampling")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type sampling")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-sampling",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        sampled_ou = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="sampled-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-sampling",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )

        group = Group.objects.create(name="sampling-group", source_version=self.org_unit.version)
        group.org_units.add(sampled_ou)
        sampling = PlanningSamplingResult.objects.create(
            planning=planning,
            pipeline_id="pipeline-geo",
            pipeline_version="v1",
            group=group,
            parameters={"foo": "bar"},
            created_by=self.user,
        )
        planning.selected_sampling_result = sampling
        planning.save()

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/children/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        ids = [ou["id"] for ou in r]
        self.assertEqual(ids, [sampled_ou.id])
        self.assertTrue(r[0]["has_geo_json"])

    def test_planning_orgunits_children_paginated(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type paginated")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type paginated")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-paginated",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-paginated-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child_team = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-paginated-team-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits-paginated",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        Assignment.objects.create(planning=planning, org_unit=child, user=self.user, created_by=self.user)
        Assignment.objects.create(planning=planning, org_unit=child_team, team=self.team1, created_by=self.user)

        url = f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/?limit=10&page=1"
        response = self.client.get(url, format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["count"], 2)
        rows = {ou["id"]: ou for ou in r["results"]}
        # Expected payloads must use DB-round-tripped rows like the view does; class-level
        # self.user / self.team1 can otherwise differ on ColorField casing vs JSON.
        user_from_db = User.objects.select_related("iaso_profile").get(pk=self.user.pk)
        team_from_db = Team.objects.get(pk=self.team1.pk)
        self.assertEqual(rows[child.id]["assignment"]["assignment_type"], "user")
        self.assertEqual(rows[child.id]["org_unit_type"], {"id": child_type.id, "name": child_type.name})
        self.assertEqual(
            rows[child.id]["assignment"]["user"],
            PlanningOrgUnitTableAssignmentUserSerializer(user_from_db).data,
        )
        self.assertIsNone(rows[child.id]["assignment"]["team"])
        self.assertEqual(rows[child_team.id]["assignment"]["assignment_type"], "team")
        self.assertEqual(
            rows[child_team.id]["assignment"]["team"],
            PlanningOrgUnitTableAssignmentTeamSerializer(team_from_db).data,
        )
        self.assertIsNone(rows[child_team.id]["assignment"]["user"])

        filtered = self.client.get(
            f"/api/microplanning/plannings/{planning.id}/orgunits/children-paginated/?search=child-paginated-ou",
            format="json",
        )
        rf = self.assertJSONResponse(filtered, status.HTTP_200_OK)
        self.assertEqual(rf["count"], 1)
        self.assertEqual(rf["results"][0]["id"], child.id)

    def test_planning_orgunits_root_unknown_planning_returns_404(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/microplanning/plannings/999999999/orgunits/root/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_planning_orgunits_root_missing_scope_doesnt_raise_error(self):
        """A planning without sampling group or target org unit type should error."""
        self.client.force_authenticate(self.user)
        planning = Planning.objects.create(
            project=self.project1,
            name="planning-missing-scope",
            team=self.team1,
            org_unit=self.org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/root/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["id"], self.org_unit.id)

    def test_planning_orgunits_root_with_target_org_unit_type(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-ou",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        child = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="child-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-orgunits",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        planning.target_org_unit_types.set([child_type])

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/root/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["id"], root.id)
        self.assertTrue(r["has_geo_json"])

    def test_planning_orgunits_root_with_sampling_group(self):
        self.client.force_authenticate(self.user)
        parent_type = OrgUnitType.objects.create(name="Parent type sampling")
        parent_type.projects.add(self.project1)
        child_type = OrgUnitType.objects.create(name="Child type sampling")
        child_type.projects.add(self.project1)

        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)

        root = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="root-sampling",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        sampled_ou = OrgUnit.objects.create(
            version=self.org_unit.version,
            name="sampled-ou",
            parent=root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )

        planning = Planning.objects.create(
            project=self.project1,
            name="planning-sampling",
            team=self.team1,
            org_unit=root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )

        group = Group.objects.create(name="sampling-group", source_version=self.org_unit.version)
        group.org_units.add(sampled_ou)
        sampling = PlanningSamplingResult.objects.create(
            planning=planning,
            pipeline_id="pipeline-geo",
            pipeline_version="v1",
            group=group,
            parameters={"foo": "bar"},
            created_by=self.user,
        )
        planning.selected_sampling_result = sampling
        planning.save()

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/orgunits/root/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["id"], root.id)
        self.assertTrue(r["has_geo_json"])
