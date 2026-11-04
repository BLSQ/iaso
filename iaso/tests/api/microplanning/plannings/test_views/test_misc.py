import uuid

from unittest import mock

from django.contrib.auth.models import User
from rest_framework import status

from hat.audit.models import Modification
from iaso.api.microplanning.plannings.serializers.misc import PlanningWriteSerializer
from iaso.models import (
    Account,
    DataSource,
    Form,
    Group,
    MissionForm,
    OrgUnit,
    OrgUnitType,
    SourceVersion,
    Task,
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


class PlanningTestCase(APITestCase):
    # TODO: refactor this test case and move the serializer tests to the test_serializers.py file
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

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user_with_perms)
        with self.assertNumQueries(5):
            response = self.client.get("/api/microplanning/plannings/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)

    def test_cannot_update_a_deprecated_planning(self):
        self.planning.deprecated = True
        self.planning.save()

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.patch(f"/api/microplanning/plannings/{self.planning.pk}/", data={"name": "test"})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_can_destroy_a_deprecated_planning(self):
        self.planning.deprecated = True
        self.planning.save()

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.delete(f"/api/microplanning/plannings/{self.planning.pk}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_permissions(self):
        res = self.client.get("/api/microplanning/plannings/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.other_user)
        res = self.client.get("/api/microplanning/plannings/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_query_id(self):
        self.client.force_authenticate(self.user_with_perms)
        id = self.planning.id
        self.planning.deprecated = True
        self.planning.save()
        response = self.client.get(f"/api/microplanning/plannings/{id}/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["name"], self.planning.name)
        self.assertEqual(
            r,
            {
                "id": self.planning.id,
                "name": "planning1",
                "deprecated": True,
                "team_details": {
                    "id": self.team1.id,
                    "name": self.team1.name,
                    "deleted_at": self.team1.deleted_at,
                    "color": self.team1.color.upper(),
                },
                "project_details": {
                    "id": self.planning.project.id,
                    "name": self.planning.project.name,
                    "color": self.planning.project.color,
                },
                "org_unit_details": {
                    "id": self.org_unit.id,
                    "name": self.org_unit.name,
                    "org_unit_type": self.org_unit.org_unit_type,
                },
                "missions": [],
                "description": "",
                "published_at": None,
                "started_at": "2025-01-01",
                "ended_at": "2025-01-10",
                "pipeline_uuids": [],
                "target_org_unit_type_details": [],
                "selected_sampling_result": None,
                "assignments_count": 0,
            },
            r,
        )

    def test_query_id_includes_assignments_count(self):
        """Test that planning detail response includes assignments_count."""
        self.client.force_authenticate(self.user_with_perms)
        # Planning has no assignments by default
        response = self.client.get(f"/api/microplanning/plannings/{self.planning.id}/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertIn("assignments_count", r)
        self.assertEqual(r["assignments_count"], 0)

        # Create assignments
        Assignment.objects.create(planning=self.planning, user=self.user, org_unit=self.org_unit)
        child_ou = OrgUnit.objects.create(version=self.org_unit.version, name="child", parent=self.org_unit)
        Assignment.objects.create(planning=self.planning, user=self.user, org_unit=child_ou)

        response = self.client.get(f"/api/microplanning/plannings/{self.planning.id}/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["assignments_count"], 2)

    def test_serializer(self):
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        org_unit = self.org_unit
        planning_serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "missions": [self.mission1.id, self.mission2.id],
                "team": self.team1.id,
                "team_details": {"id": self.team1.id, "name": self.team1.name},
                "project": self.project1.id,
                "project_details": {"id": self.project1.id, "name": self.project1.name},
                "started_at": "2022-02-02",
                "ended_at": "2022-03-03",
            },
        )
        self.assertTrue(planning_serializer.is_valid(), planning_serializer.errors)
        failing_dates = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "missions": [self.mission1.id, self.mission2.id],
                "team": self.team1.id,
                "project": self.project1.id,
                "project_details": {"id": self.project1.id, "name": self.project1.name},
                "started_at": "2022-03-03",
                "ended_at": "2022-02-02",
            },
        )
        self.assertFalse(failing_dates.is_valid(), failing_dates.errors)
        failing_teams = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "missions": [self.mission1.id, self.mission2.id],
                "team": self.other_team.id,
                "project": self.project1.id,
                "project_details": {"id": self.project1.id, "name": self.project1.name},
                "started_at": "2022-02-02",
                "ended_at": "2022-03-03",
            },
        )
        self.assertFalse(failing_teams.is_valid(), failing_teams.errors)
        self.assertIn("team", failing_teams.errors)

    def test_patch_api(self):
        planning = Planning.objects.create(
            name="Planning to modify",
            project=self.project1,
            org_unit=self.org_unit,
            team=self.team1,
        )

        self.client.force_authenticate(self.user_with_perms)
        data = {
            "name": "My Planning",
            "missions": [self.mission1.id, self.mission2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "started_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        planning_id = r["id"]
        self.assertTrue(Planning.objects.get(id=planning_id))
        self.assertEqual(Modification.objects.all().count(), 1)
        planning.refresh_from_db()
        self.assertEqual(planning.name, "My Planning")
        self.assertQuerySetEqual(planning.missions.all(), [self.mission1, self.mission2], ordered=False)

        mod = Modification.objects.last()
        self.assertEqual(mod.past_value[0]["missions"], [])
        self.assertEqual(sorted(mod.new_value[0]["missions"]), sorted([self.mission1.id, self.mission2.id]))

    def test_patch_api__throw_error_if_published_and_no_started_date(self):
        planning = Planning.objects.create(
            name="Planning to modify",
            project=self.project1,
            org_unit=self.org_unit,
            team=self.team1,
        )
        self.client.force_authenticate(self.user_with_perms)
        data = {
            "name": "My Planning",
            "missions": [self.mission1.id, self.mission2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "published_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIsNotNone(r["started_at"])
        self.assertEqual(r["started_at"][0], "publishedWithoutStartDate")

    def test_patch_api__throw_error_if_published_and_no_ended_date(self):
        planning = Planning.objects.create(
            name="Planning to modify",
            project=self.project1,
            org_unit=self.org_unit,
            team=self.team1,
        )
        self.client.force_authenticate(self.user_with_perms)
        data = {
            "name": "My Planning",
            "missions": [self.mission1.id, self.mission2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "published_at": "2022-02-02",
            "started_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIsNotNone(r["ended_at"])
        self.assertEqual(r["ended_at"][0], "publishedWithoutEndDate")

    def test_create_api(self):
        self.client.force_authenticate(self.user_with_perms)
        data = {
            "name": "My Planning",
            "org_unit": self.org_unit.id,
            "missions": [self.mission1.id, self.mission2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "project": self.project1.id,
            "started_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        planning_id = r["id"]
        self.assertTrue(Planning.objects.get(id=planning_id))
        self.assertEqual(Modification.objects.all().count(), 1)

    def test_planning_serializer_with_pipeline_uuids(self):
        """Test PlanningSerializer with pipeline_uuids field."""

        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        valid_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        # Test valid pipeline_uuids
        serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Pipelines",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "missions": [self.mission1.id, self.mission2.id],
                "pipeline_uuids": valid_uuids,
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        planning = serializer.save()

        # DRF UUIDField converts strings to UUID objects, so we expect UUID objects
        expected_uuids = [uuid.UUID(uuid_str) for uuid_str in valid_uuids]
        self.assertEqual(planning.pipeline_uuids, expected_uuids)

    def test_planning_serializer_invalid_pipeline_uuids(self):
        """Test PlanningSerializer validation with invalid pipeline_uuids."""

        user = User.objects.get(username="test")
        request = mock.Mock(user=user)

        # Test invalid UUID format
        serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Invalid UUIDs",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "missions": [self.mission1.id, self.mission2.id],
                "pipeline_uuids": ["invalid-uuid", "not-a-uuid"],
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("pipeline_uuids", serializer.errors)

    def test_planning_serializer_pipeline_uuids_not_list(self):
        """Test PlanningSerializer validation when pipeline_uuids is not a list."""

        user = User.objects.get(username="test")
        request = mock.Mock(user=user)

        # Test non-list value
        serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Non-List UUIDs",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "missions": [self.mission1.id, self.mission2.id],
                "pipeline_uuids": "not-a-list",
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("pipeline_uuids", serializer.errors)

    def test_planning_api_response_includes_pipeline_uuids(self):
        """Test that API response includes pipeline_uuids field."""
        # Add some pipeline UUIDs to the planning
        test_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]
        self.planning.pipeline_uuids = test_uuids
        self.planning.save()

        # Authenticate user and test GET request
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get(f"/api/microplanning/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        r = response.json()
        self.assertIn("pipeline_uuids", r)
        self.assertEqual(r["pipeline_uuids"], test_uuids)

    def test_planning_api_create_with_pipeline_uuids(self):
        """Test creating planning via API with pipeline_uuids."""
        self.client.force_authenticate(self.user_with_perms)

        test_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        data = {
            "name": "New Planning with Pipelines",
            "org_unit": self.org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "missions": [self.mission1.id, self.mission2.id],
            "pipeline_uuids": test_uuids,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        r = response.json()
        self.assertIn("pipeline_uuids", r)
        self.assertEqual(r["pipeline_uuids"], test_uuids)

        # Verify in database
        planning = Planning.objects.get(id=r["id"])
        self.assertEqual(planning.pipeline_uuids, test_uuids)

    def test_planning_api_patch_with_pipeline_uuids(self):
        """Test updating planning via API with pipeline_uuids."""
        self.client.force_authenticate(self.user_with_perms)

        test_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        data = {
            "pipeline_uuids": test_uuids,
        }

        response = self.client.patch(f"/api/microplanning/plannings/{self.planning.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        r = response.json()
        self.assertIn("pipeline_uuids", r)
        self.assertEqual(r["pipeline_uuids"], test_uuids)

        self.planning.refresh_from_db()
        self.assertEqual(self.planning.pipeline_uuids, test_uuids)

    def test_planning_with_target_org_unit_type(self):
        """Test creating and retrieving planning with target_org_unit_type."""
        source = DataSource.objects.create(name="Test Source")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=1)

        org_unit_type = OrgUnitType.objects.create(name="Health Post")
        org_unit_type.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="Root")
        OrgUnit.objects.create(
            version=version, name="Child Health Post", org_unit_type=org_unit_type, parent=root_org_unit
        )

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "name": "Planning with Target Type",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "missions": [self.mission1.id],
            "target_org_unit_types": [org_unit_type.id],
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        r = response.json()

        self.assertIsNotNone(r["target_org_unit_type_details"])
        self.assertEqual(len(r["target_org_unit_type_details"]), 1)
        self.assertEqual(r["target_org_unit_type_details"][0]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"][0]["name"], "Health Post")

        planning = Planning.objects.get(id=r["id"])
        self.assertIn(org_unit_type, planning.target_org_unit_types.all())

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        r = response.json()
        self.assertEqual(r["target_org_unit_type_details"][0]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"][0]["name"], "Health Post")

    def test_planning_serializer_with_target_org_unit_type(self):
        """Test PlanningSerializer with target_org_unit_type field."""
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)

        source = DataSource.objects.create(name="Test Source 2")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=2)

        org_unit_type = OrgUnitType.objects.create(name="Health Center")
        org_unit_type.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="Root 2")
        OrgUnit.objects.create(
            version=version, name="Child Health Center", org_unit_type=org_unit_type, parent=root_org_unit
        )

        serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Target Type",
                "org_unit": root_org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "missions": [self.mission1.id],
                "target_org_unit_types": [org_unit_type.id],
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        planning = serializer.save()
        self.assertIn(org_unit_type, planning.target_org_unit_types.all())

    def test_planning_api_patch_with_target_org_unit_type(self):
        """Test updating planning with target_org_unit_type via API."""
        source = DataSource.objects.create(name="Test Source 3")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=3)

        org_unit_type = OrgUnitType.objects.create(name="Clinic")
        org_unit_type.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="Root 3")
        OrgUnit.objects.create(version=version, name="Child Clinic", org_unit_type=org_unit_type, parent=root_org_unit)

        planning = Planning.objects.create(
            project=self.project1,
            name="Planning for patch test",
            team=self.team1,
            org_unit=root_org_unit,
        )

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "target_org_unit_types": [org_unit_type.id],
        }

        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        r = response.json()
        self.assertEqual(r["target_org_unit_type_details"][0]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"][0]["name"], "Clinic")

        planning.refresh_from_db()
        self.assertIn(org_unit_type, planning.target_org_unit_types.all())

    def test_planning_with_target_org_unit_type_wrong_project(self):
        """Test that creating planning with target_org_unit_type from wrong project fails."""
        org_unit_type = OrgUnitType.objects.create(name="Wrong Project Type")
        org_unit_type.projects.add(self.project2)

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "name": "Planning with Wrong Target Type",
            "org_unit": self.org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "missions": [self.mission1.id],
            "target_org_unit_types": [org_unit_type.id],
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("target_org_unit_types", r)
        self.assertEqual(r["target_org_unit_types"][0], "planningAndTargetOrgUnitType")

    def test_planning_patch_sets_selected_sampling_result(self):
        self.client.force_authenticate(self.user_with_perms)
        sampling = PlanningSamplingResult.objects.create(
            planning=self.planning,
            pipeline_id="pipeline-detail",
            pipeline_version="v1",
            pipeline_name="detail run",
            parameters={"limit": 5},
            created_by=self.user_with_perms,
        )

        response = self.client.patch(
            f"/api/microplanning/plannings/{self.planning.id}/",
            data={"selected_sampling_result": sampling.id},
            format="json",
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.planning.refresh_from_db()

        self.assertEqual(self.planning.selected_sampling_result, sampling)
        self.assertEqual(r["selected_sampling_result"]["id"], sampling.id)
        self.assertEqual(r["selected_sampling_result"]["pipeline_id"], "pipeline-detail")

    def test_planning_patch_keeps_selected_sampling_result_when_field_absent(self):
        self.client.force_authenticate(self.user_with_perms)
        sampling = PlanningSamplingResult.objects.create(
            planning=self.planning,
            pipeline_id="pipeline-keep",
            pipeline_version="v1",
            pipeline_name="keep run",
            parameters={"limit": 1},
            created_by=self.user_with_perms,
        )
        self.planning.selected_sampling_result = sampling
        self.planning.save()

        response = self.client.patch(
            f"/api/microplanning/plannings/{self.planning.id}/",
            data={"name": "updated name"},
            format="json",
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.planning.refresh_from_db()

        self.assertEqual(self.planning.selected_sampling_result, sampling)
        self.assertEqual(r["selected_sampling_result"]["id"], sampling.id)

    def test_planning_patch_unsets_selected_sampling_result_with_null(self):
        self.client.force_authenticate(self.user_with_perms)
        sampling = PlanningSamplingResult.objects.create(
            planning=self.planning,
            pipeline_id="pipeline-clear",
            pipeline_version="v1",
            pipeline_name="clear run",
            parameters={"limit": 2},
            created_by=self.user_with_perms,
        )
        self.planning.selected_sampling_result = sampling
        self.planning.save()

        response = self.client.patch(
            f"/api/microplanning/plannings/{self.planning.id}/",
            data={"selected_sampling_result": None},
            format="json",
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.planning.refresh_from_db()

        self.assertIsNone(self.planning.selected_sampling_result)
        self.assertIsNone(r["selected_sampling_result"])

    def test_planning_patch_selected_sampling_result_wrong_planning(self):
        self.client.force_authenticate(self.user_with_perms)
        other_planning = Planning.objects.create(
            project=self.project1, name="other", team=self.team1, org_unit=self.org_unit
        )
        sampling = PlanningSamplingResult.objects.create(
            planning=other_planning,
            pipeline_id="pipeline-wrong",
            pipeline_version="v1",
            pipeline_name="wrong run",
            parameters={"limit": 1},
            created_by=self.user_with_perms,
        )

        response = self.client.patch(
            f"/api/microplanning/plannings/{self.planning.id}/",
            data={"selected_sampling_result": sampling.id},
            format="json",
        )
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("selected_sampling_result", r)
        self.assertEqual(r["selected_sampling_result"][0], "samplingNotForPlanning")

    def test_planning_detail_includes_selected_sampling_result(self):
        self.client.force_authenticate(self.user_with_perms)
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)
        task = Task.objects.create(name="sampling-detail", account=self.account, created_by=self.user)
        sampling = PlanningSamplingResult.objects.create(
            planning=self.planning,
            task=task,
            pipeline_id="pipeline-detail",
            pipeline_version="v1",
            pipeline_name="detail run",
            group=group,
            parameters={"limit": 5},
            created_by=self.user,
        )
        self.planning.selected_sampling_result = sampling
        self.planning.save()

        response = self.client.get(f"/api/microplanning/plannings/{self.planning.id}/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        selected = r["selected_sampling_result"]
        self.assertEqual(selected["id"], sampling.id)
        self.assertEqual(selected["pipeline_id"], "pipeline-detail")
        self.assertEqual(selected["pipeline_version"], "v1")
        self.assertEqual(selected["pipeline_name"], "detail run")
        self.assertEqual(selected["group_id"], group.id)
        self.assertEqual(selected["task_id"], task.id)

    def test_planning_serializer_target_org_unit_type_wrong_project(self):
        """Test PlanningSerializer validation with target_org_unit_type from wrong project."""
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)

        org_unit_type = OrgUnitType.objects.create(name="Wrong Type")
        org_unit_type.projects.add(self.project2)

        serializer = PlanningWriteSerializer(
            context={"request": request},
            data={
                "name": "Test Planning Wrong Type",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "missions": [self.mission1.id],
                "target_org_unit_types": [org_unit_type.id],
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("target_org_unit_types", serializer.errors)

    def test_planning_patch_target_org_unit_type_wrong_project(self):
        """Test that patching planning with target_org_unit_type from wrong project fails."""
        org_unit_type = OrgUnitType.objects.create(name="Wrong Patch Type")
        org_unit_type.projects.add(self.project2)

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "target_org_unit_types": [org_unit_type.id],
        }

        response = self.client.patch(f"/api/microplanning/plannings/{self.planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("target_org_unit_types", r)
        self.assertEqual(r["target_org_unit_types"][0], "planningAndTargetOrgUnitType")

    def test_planning_target_org_unit_type_no_descendants(self):
        """Test that creating planning with target_org_unit_type but no descendant org units fails."""
        source = DataSource.objects.create(name="Test Source")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=1)

        org_unit_type_no_descendants = OrgUnitType.objects.create(name="Type With No Descendants")
        org_unit_type_no_descendants.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="Root", org_unit_type=self.org_unit.org_unit_type)

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "name": "Planning with No Matching Descendants",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "missions": [self.mission1.id],
            "target_org_unit_types": [org_unit_type_no_descendants.id],
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("target_org_unit_types", r)
        self.assertEqual(r["target_org_unit_types"][0], "noOrgUnitsOfTypeInHierarchy")

    def test_planning_target_org_unit_type_with_valid_descendants(self):
        """Test that creating planning with target_org_unit_type and valid descendants succeeds."""
        source = DataSource.objects.create(name="Test Source 2")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=2)

        target_type = OrgUnitType.objects.create(name="Health Post")
        target_type.projects.add(self.project1)

        parent_type = OrgUnitType.objects.create(name="District")
        parent_type.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="District 1", org_unit_type=parent_type)
        OrgUnit.objects.create(version=version, name="Health Post 1", org_unit_type=target_type, parent=root_org_unit)

        self.client.force_authenticate(self.user_with_perms)

        data = {
            "name": "Planning with Valid Descendants",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "missions": [self.mission1.id],
            "target_org_unit_types": [target_type.id],
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        r = response.json()
        self.assertEqual(len(r["target_org_unit_type_details"]), 1)
        self.assertEqual(r["target_org_unit_type_details"][0]["id"], target_type.id)
        self.assertEqual(r["target_org_unit_type_details"][0]["name"], "Health Post")


# TODO: reorganize this, and add tests about the fact that soft deleted planning should not be visible/raise a 404
