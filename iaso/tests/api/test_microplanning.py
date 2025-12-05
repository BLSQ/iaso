import uuid

from unittest import mock

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils.timezone import now

from hat.audit.models import Modification
from iaso.api.microplanning.serializers import AssignmentSerializer, PlanningSerializer
from iaso.models import Account, DataSource, Form, Group, OrgUnit, OrgUnitType, SourceVersion, Task
from iaso.models.microplanning import Assignment, Planning, PlanningSamplingResult
from iaso.models.team import Team
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


class PlanningTestCase(APITestCase):
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
        other_user = cls.create_user_with_profile(username="user", account=other_account)
        cls.other_project = other_account.project_set.create(name="other_project")
        cls.other_team = Team.objects.create(name="other team", project=cls.other_project, manager=other_user)
        source = DataSource.objects.create(name="Evil Empire")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit = org_unit = OrgUnit.objects.create(version=version)
        cls.form1 = Form.objects.create(name="form1")
        cls.form2 = Form.objects.create(name="form2")
        cls.form1.projects.add(project1)
        cls.form2.projects.add(project1)
        cls.planning = Planning.objects.create(
            project=project1,
            name="planning1",
            team=cls.team1,
            org_unit=org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(5):
            response = self.client.get("/api/microplanning/plannings/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

    def test_query_id(self):
        self.client.force_authenticate(self.user)
        id = self.planning.id
        response = self.client.get(f"/api/microplanning/plannings/{id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["name"], self.planning.name)
        self.assertEqual(
            r,
            {
                "id": self.planning.id,
                "name": "planning1",
                "team": self.planning.team_id,
                "team_details": {
                    "id": self.team1.id,
                    "name": self.team1.name,
                    "deleted_at": self.team1.deleted_at,
                    "color": self.team1.color,
                },
                "project": self.planning.project.id,
                "project_details": {
                    "id": self.planning.project.id,
                    "name": self.planning.project.name,
                    "color": self.planning.project.color,
                },
                "org_unit": self.planning.org_unit_id,
                "org_unit_details": {
                    "id": self.org_unit.id,
                    "name": self.org_unit.name,
                    "org_unit_type": self.org_unit.org_unit_type,
                },
                "forms": [],
                "description": "",
                "published_at": None,
                "started_at": "2025-01-01",
                "ended_at": "2025-01-10",
                "pipeline_uuids": [],
                "target_org_unit_type": None,
                "target_org_unit_type_details": None,
            },
            r,
        )

    def test_serializer(self):
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        org_unit = self.org_unit
        planning_serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
                "team": self.team1.id,
                "team_details": {"id": self.team1.id, "name": self.team1.name},
                "project": self.project1.id,
                "project_details": {"id": self.project1.id, "name": self.project1.name},
                "started_at": "2022-02-02",
                "ended_at": "2022-03-03",
            },
        )
        self.assertTrue(planning_serializer.is_valid(), planning_serializer.errors)
        failing_dates = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
                "team": self.team1.id,
                "project": self.project1.id,
                "project_details": {"id": self.project1.id, "name": self.project1.name},
                "started_at": "2022-03-03",
                "ended_at": "2022-02-02",
            },
        )
        self.assertFalse(failing_dates.is_valid(), failing_dates.errors)
        failing_teams = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
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
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "My Planning",
            "forms": [self.form1.id, self.form2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "started_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 200)
        planning_id = r["id"]
        self.assertTrue(Planning.objects.get(id=planning_id))
        self.assertEqual(Modification.objects.all().count(), 1)
        planning.refresh_from_db()
        self.assertEqual(planning.name, "My Planning")
        self.assertQuerySetEqual(planning.forms.all(), [self.form1, self.form2], ordered=False)

        mod = Modification.objects.last()
        self.assertEqual(mod.past_value[0]["forms"], [])
        self.assertEqual(mod.new_value[0]["forms"], [self.form1.id, self.form2.id])

    def test_patch_api__throw_error_if_published_and_no_started_date(self):
        planning = Planning.objects.create(
            name="Planning to modify",
            project=self.project1,
            org_unit=self.org_unit,
            team=self.team1,
        )
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "My Planning",
            "forms": [self.form1.id, self.form2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "published_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        print(r)
        self.assertIsNotNone(r["started_at"])
        self.assertEqual(r["started_at"][0], "publishedWithoutStartDate")

    def test_patch_api__throw_error_if_published_and_no_ended_date(self):
        planning = Planning.objects.create(
            name="Planning to modify",
            project=self.project1,
            org_unit=self.org_unit,
            team=self.team1,
        )
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "My Planning",
            "forms": [self.form1.id, self.form2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "published_at": "2022-02-02",
            "started_at": "2022-03-03",
        }
        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        print(r)
        self.assertIsNotNone(r["ended_at"])
        self.assertEqual(r["ended_at"][0], "publishedWithoutEndDate")

    def test_create_api(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "My Planning",
            "org_unit": self.org_unit.id,
            "forms": [self.form1.id, self.form2.id],
            "team": self.team1.id,
            "team_details": {"id": self.team1.id, "name": self.team1.name},
            "project": self.project1.id,
            "started_at": "2022-02-02",
            "ended_at": "2022-03-03",
        }
        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        planning_id = r["id"]
        self.assertTrue(Planning.objects.get(id=planning_id))
        self.assertEqual(Modification.objects.all().count(), 1)

    def test_planning_serializer_with_pipeline_uuids(self):
        """Test PlanningSerializer with pipeline_uuids field."""

        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        valid_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        # Test valid pipeline_uuids
        serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Pipelines",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "forms": [self.form1.id, self.form2.id],
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
        serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Invalid UUIDs",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "forms": [self.form1.id, self.form2.id],
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
        serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Non-List UUIDs",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "forms": [self.form1.id, self.form2.id],
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
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/microplanning/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 200)
        r = response.json()
        self.assertIn("pipeline_uuids", r)
        self.assertEqual(r["pipeline_uuids"], test_uuids)

    def test_planning_api_create_with_pipeline_uuids(self):
        """Test creating planning via API with pipeline_uuids."""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        test_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        data = {
            "name": "New Planning with Pipelines",
            "org_unit": self.org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "forms": [self.form1.id, self.form2.id],
            "pipeline_uuids": test_uuids,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        r = response.json()
        self.assertIn("pipeline_uuids", r)
        self.assertEqual(r["pipeline_uuids"], test_uuids)

        # Verify in database
        planning = Planning.objects.get(id=r["id"])
        self.assertEqual(planning.pipeline_uuids, test_uuids)

    def test_planning_api_patch_with_pipeline_uuids(self):
        """Test updating planning via API with pipeline_uuids."""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        test_uuids = ["60fcb048-a5f6-4a79-9529-1ccfa55e75d1", "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"]

        data = {
            "pipeline_uuids": test_uuids,
        }

        response = self.client.patch(f"/api/microplanning/plannings/{self.planning.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
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

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "Planning with Target Type",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "forms": [self.form1.id],
            "target_org_unit_type": org_unit_type.id,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        r = response.json()

        self.assertEqual(r["target_org_unit_type"], org_unit_type.id)
        self.assertIsNotNone(r["target_org_unit_type_details"])
        self.assertEqual(r["target_org_unit_type_details"]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["name"], "Health Post")

        planning = Planning.objects.get(id=r["id"])
        self.assertEqual(planning.target_org_unit_type, org_unit_type)

        response = self.client.get(f"/api/microplanning/plannings/{planning.id}/", format="json")
        self.assertEqual(response.status_code, 200)
        r = response.json()
        self.assertEqual(r["target_org_unit_type"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["name"], "Health Post")

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

        serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "Test Planning with Target Type",
                "org_unit": root_org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "forms": [self.form1.id],
                "target_org_unit_type": org_unit_type.id,
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        planning = serializer.save()
        self.assertEqual(planning.target_org_unit_type, org_unit_type)

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

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "target_org_unit_type": org_unit_type.id,
        }

        response = self.client.patch(f"/api/microplanning/plannings/{planning.id}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        r = response.json()
        self.assertEqual(r["target_org_unit_type"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["id"], org_unit_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["name"], "Clinic")

        planning.refresh_from_db()
        self.assertEqual(planning.target_org_unit_type, org_unit_type)

    def test_planning_with_target_org_unit_type_wrong_project(self):
        """Test that creating planning with target_org_unit_type from wrong project fails."""
        org_unit_type = OrgUnitType.objects.create(name="Wrong Project Type")
        org_unit_type.projects.add(self.project2)

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "Planning with Wrong Target Type",
            "org_unit": self.org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "forms": [self.form1.id],
            "target_org_unit_type": org_unit_type.id,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        self.assertIn("target_org_unit_type", r)
        self.assertEqual(r["target_org_unit_type"][0], "planningAndTargetOrgUnitType")

    def test_planning_sampling_results_list(self):
        self.client.force_authenticate(self.user)
        task = Task.objects.create(
            name="sampling",
            account=self.account,
            created_by=self.user,
        )
        sampling = PlanningSamplingResult.objects.create(
            planning=self.planning,
            task=task,
            pipeline_id="pipeline-1",
            pipeline_version="v1",
            parameters={"foo": "bar"},
            status="SUCCESS",
            created_by=self.user,
        )

        response = self.client.get(
            f"/api/microplanning/plannings/{self.planning.id}/samplings/?order=-id", format="json"
        )
        data = self.assertJSONResponse(response, 200)
        results = data["results"] if isinstance(data, dict) and "results" in data else data
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["id"], sampling.id)
        self.assertEqual(result["pipeline_id"], "pipeline-1")
        self.assertEqual(result["task"], task.id)

    def test_planning_sampling_results_create(self):
        user_with_perms = self.create_user_with_profile(
            username="sampling_user", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        task = Task.objects.create(
            name="sampling-create",
            account=self.account,
            created_by=user_with_perms,
        )
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)

        payload = {
            "task": task.id,
            "pipeline_id": "pipeline-2",
            "pipeline_version": "v2",
            "group": group.id,
            "parameters": {"limit": 10},
            "status": "SUCCESS",
        }

        response = self.client.post(
            f"/api/microplanning/plannings/{self.planning.id}/samplings/", data=payload, format="json"
        )
        data = self.assertJSONResponse(response, 201)
        sampling = PlanningSamplingResult.objects.get(id=data["id"])
        self.assertEqual(sampling.pipeline_id, "pipeline-2")
        self.assertEqual(sampling.created_by, user_with_perms)
        self.assertEqual(sampling.task, task)

    def test_planning_serializer_target_org_unit_type_wrong_project(self):
        """Test PlanningSerializer validation with target_org_unit_type from wrong project."""
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)

        org_unit_type = OrgUnitType.objects.create(name="Wrong Type")
        org_unit_type.projects.add(self.project2)

        serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "Test Planning Wrong Type",
                "org_unit": self.org_unit.id,
                "team": self.team1.id,
                "project": self.project1.id,
                "forms": [self.form1.id],
                "target_org_unit_type": org_unit_type.id,
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("target_org_unit_type", serializer.errors)

    def test_planning_patch_target_org_unit_type_wrong_project(self):
        """Test that patching planning with target_org_unit_type from wrong project fails."""
        org_unit_type = OrgUnitType.objects.create(name="Wrong Patch Type")
        org_unit_type.projects.add(self.project2)

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "target_org_unit_type": org_unit_type.id,
        }

        response = self.client.patch(f"/api/microplanning/plannings/{self.planning.id}/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        self.assertIn("target_org_unit_type", r)
        self.assertEqual(r["target_org_unit_type"][0], "planningAndTargetOrgUnitType")

    def test_planning_target_org_unit_type_no_descendants(self):
        """Test that creating planning with target_org_unit_type but no descendant org units fails."""
        source = DataSource.objects.create(name="Test Source")
        source.projects.add(self.project1)
        version = SourceVersion.objects.create(data_source=source, number=1)

        org_unit_type_no_descendants = OrgUnitType.objects.create(name="Type With No Descendants")
        org_unit_type_no_descendants.projects.add(self.project1)

        root_org_unit = OrgUnit.objects.create(version=version, name="Root", org_unit_type=self.org_unit.org_unit_type)

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "Planning with No Matching Descendants",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "forms": [self.form1.id],
            "target_org_unit_type": org_unit_type_no_descendants.id,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        self.assertIn("target_org_unit_type", r)
        self.assertEqual(r["target_org_unit_type"][0], "noOrgUnitsOfTypeInHierarchy")

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

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "Planning with Valid Descendants",
            "org_unit": root_org_unit.id,
            "team": self.team1.id,
            "project": self.project1.id,
            "forms": [self.form1.id],
            "target_org_unit_type": target_type.id,
        }

        response = self.client.post("/api/microplanning/plannings/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        r = response.json()
        self.assertEqual(r["target_org_unit_type"], target_type.id)
        self.assertEqual(r["target_org_unit_type_details"]["name"], "Health Post")


class AssignmentAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        account.project_set.create(name="project2")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)

        source = DataSource.objects.create(name="Source de test")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        org_unit_type = OrgUnitType.objects.create(name="test type")
        project = account.project_set.first()
        org_unit_type.projects.add(project)
        cls.root_org_unit = root_org_unit = OrgUnit.objects.create(version=version, org_unit_type=org_unit_type)
        cls.child1 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child1", org_unit_type=org_unit_type
        )
        cls.child2 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child2", org_unit_type=org_unit_type
        )
        cls.child3 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child3", org_unit_type=org_unit_type
        )
        cls.child4 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child4", org_unit_type=org_unit_type
        )
        cls.child5 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child4", org_unit_type=org_unit_type
        )
        OrgUnit.objects.create(version=version, parent=root_org_unit, name="child2")

        cls.planning = Planning.objects.create(
            project=project1,
            name="planning1",
            team=cls.team1,
            org_unit=root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )
        Assignment.objects.create(
            planning=cls.planning,
            user=cls.user,
            org_unit=cls.child1,
        )

    def test_serializer(self):
        request = mock.Mock(user=self.user)
        serializer = AssignmentSerializer(
            context={"request": request},
            data=dict(
                planning=self.planning.id,
                user=self.user.id,
                org_unit=self.child2.id,
            ),
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        serializer = AssignmentSerializer(
            context={"request": request},
            data=dict(
                planning=self.planning.id,
                user=self.user.id,
                org_unit=self.child2.id,
            ),
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(IntegrityError):
            serializer.save()

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/microplanning/assignments/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

    def test_query_fail_no_auth(self):
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        self.assertJSONResponse(response, 401)

    def test_query_filtering(self):
        p = Planning.objects.create(
            project=self.project1, name="planning1", team=self.team1, org_unit=self.root_org_unit
        )
        p.assignment_set.create(org_unit=self.child1, user=self.user)
        p.assignment_set.create(org_unit=self.child2, user=self.user)
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

        response = self.client.get(f"/api/microplanning/assignments/?planning={p.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

    def test_create(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "planning": self.planning.id,
            "user": self.user.id,
            "org_unit": self.child2.id,
        }

        response = self.client.post("/api/microplanning/assignments/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Assignment.objects.filter(id=r["id"]).exists())
        a = Assignment.objects.get(id=r["id"])
        self.assertEqual(a.created_by, user_with_perms)
        self.assertEqual(a.planning, self.planning)
        self.assertEqual(a.user, self.user)
        self.assertEqual(a.org_unit, self.child2)
        self.assertEqual(Modification.objects.all().count(), 1)

    def test_bulk_create(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        assignments = Assignment.objects.filter(planning=self.planning)
        self.assertEqual(assignments.count(), 1)
        self.client.force_authenticate(user_with_perms)
        data = {
            "planning": self.planning.id,
            "org_units": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        self.assertJSONResponse(response, 200)
        assignments = Assignment.objects.filter(planning=self.planning)
        self.assertEqual(assignments.count(), 3)
        self.assertQuerySetEqual(
            assignments, [self.child1, self.child3, self.child4], lambda x: x.org_unit, ordered=False
        )
        self.assertEqual(Modification.objects.count(), 2)

    def test_bulk_create_reject_no_perm(self):
        user_no_perms = self.create_user_with_profile(username="user_with_perms", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perms)
        data = {
            "planning": self.planning.id,
            "org_units": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        self.assertJSONResponse(response, 403)

    def test_bulk_no_access_planning(self):
        other_account = Account.objects.create(name="other_account")

        user = self.create_user_with_profile(
            username="user_with_perms", account=other_account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user)
        data = {
            "planning": self.planning.id,
            "org_units": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        r = self.assertJSONResponse(response, 400)
        self.assertIn("planning", r)

    def test_restore_deleted_assignment(self):
        """restore deleted assignment if we try to create a new assignment with a previously assigned OU"""

        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "planning": self.planning.id,
            "user": self.user.id,
            "org_unit": self.child2.id,
        }

        self.client.post("/api/microplanning/assignments/", data=data, format="json")

        deleted_assignment = Assignment.objects.last()
        self.assertEqual(deleted_assignment.deleted_at, None)
        self.assertEqual(Modification.objects.count(), 1)

        response = self.client.delete(f"/api/microplanning/assignments/{deleted_assignment.id}/")

        self.assertJSONResponse(response, 204)
        deleted_assignment.refresh_from_db()
        self.assertNotEqual(deleted_assignment.deleted_at, None)
        self.assertEqual(Modification.objects.count(), 2)
        data = {
            "planning": self.planning.id,
            "org_units": [self.child2.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")

        # Get the assignment for this specific planning and org_unit
        restored_assignment = Assignment.objects.filter(
            planning=self.planning, org_unit=self.child2, deleted_at__isnull=True
        ).first()

        self.assertJSONResponse(response, 200)
        # The serializer creates a new assignment, not restore the old one
        self.assertNotEqual(restored_assignment.id, deleted_assignment.id)
        self.assertEqual(Modification.objects.count(), 3)
        self.assertEqual(restored_assignment.deleted_at, None)
        self.assertEqual(restored_assignment.org_unit, self.child2)
        self.assertEqual(restored_assignment.team, self.team1)

    def test_bulk_delete_assignments(self):
        """Test successful bulk delete of all assignments for a planning"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create additional assignments for the planning
        data = {
            "planning": self.planning.id,
            "org_units": [self.child2.id, self.child3.id, self.child4.id],
            "team": self.team1.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")

        # Verify we have 4 assignments total (1 from setUp + 3 from bulk create)
        assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(assignments.count(), 4)

        # Bulk delete all assignments for this planning
        delete_data = {"planning": self.planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["deleted_count"], 4)
        self.assertEqual(r["planning_id"], self.planning.id)
        self.assertIn("Successfully deleted 4 assignments", r["message"])

        # Verify all assignments are soft deleted
        assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(assignments.count(), 0)

        # Verify assignments still exist but are marked as deleted
        all_assignments = Assignment.objects.filter(planning=self.planning)
        self.assertEqual(all_assignments.count(), 4)
        for assignment in all_assignments:
            self.assertIsNotNone(assignment.deleted_at)

    def test_bulk_delete_assignments_no_assignments(self):
        """Test bulk delete when no assignments exist for the planning"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create a new planning with no assignments
        new_planning = Planning.objects.create(
            project=self.project1,
            name="empty_planning",
            team=self.team1,
            org_unit=self.root_org_unit,
        )

        delete_data = {"planning": new_planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["deleted_count"], 0)
        self.assertEqual(r["planning_id"], new_planning.id)
        self.assertIn("No assignments to delete", r["message"])

    def test_bulk_delete_assignments_no_permission(self):
        """Test bulk delete without proper permissions"""
        user_no_perms = self.create_user_with_profile(username="user_no_perms", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perms)

        delete_data = {"planning": self.planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        self.assertJSONResponse(response, 403)

    def test_bulk_delete_assignments_invalid_planning(self):
        """Test bulk delete with planning that doesn't exist or user doesn't have access to"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Test with non-existent planning ID
        delete_data = {"planning": 99999}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 400)
        self.assertIn("planning", r)

        # Test with planning from different account
        other_account = Account.objects.create(name="other_account")
        other_user = self.create_user_with_profile(username="other_user", account=other_account)
        other_project = other_account.project_set.create(name="other_project")
        other_planning = Planning.objects.create(
            project=other_project,
            name="other_planning",
            team=self.team1,
            org_unit=self.root_org_unit,
        )

        delete_data = {"planning": other_planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 400)
        self.assertIn("planning", r)

    def test_bulk_delete_assignments_audit_trail(self):
        """Test that bulk delete creates proper audit trail"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create additional assignments
        data = {
            "planning": self.planning.id,
            "org_units": [self.child2.id, self.child3.id],
            "team": self.team1.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")

        # Count modifications after bulk create (should be 2 new ones for the created assignments)
        modifications_after_create = Modification.objects.count()

        # Bulk delete all assignments
        delete_data = {"planning": self.planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        self.assertJSONResponse(response, 200)

        # Verify audit entries were created for each deleted assignment
        final_modification_count = Modification.objects.count()
        # We should have 3 new audit entries (one for each of the 3 assignments: child1, child2, child3)
        self.assertEqual(final_modification_count, modifications_after_create + 3)

        # Verify audit entries have correct structure
        delete_modifications = Modification.objects.filter(
            user=user_with_perms, source__contains="bulk_delete_assignments"
        )
        self.assertEqual(delete_modifications.count(), 3)

        for mod in delete_modifications:
            self.assertEqual(mod.user, user_with_perms)
            self.assertIn("bulk_delete_assignments", mod.source)
            self.assertIsInstance(mod.past_value, list)
            self.assertIsInstance(mod.new_value, list)

    def test_bulk_delete_assignments_already_deleted(self):
        """Test bulk delete when some assignments are already deleted"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create additional assignments
        data = {
            "planning": self.planning.id,
            "org_units": [self.child2.id, self.child3.id],
            "team": self.team1.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")

        # Manually delete one assignment
        assignment_to_delete = Assignment.objects.filter(planning=self.planning, org_unit=self.child2).first()
        assignment_to_delete.deleted_at = now()
        assignment_to_delete.save()

        # Verify we have 2 active assignments (1 from setUp + 1 from bulk create, 1 already deleted)
        active_assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(active_assignments.count(), 2)

        # Bulk delete all assignments
        delete_data = {"planning": self.planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["deleted_count"], 2)  # Only 2 were actually deleted

        # Verify only 2 assignments were soft deleted (the one already deleted should remain unchanged)
        active_assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(active_assignments.count(), 0)

        # Verify the previously deleted assignment still has its original deleted_at timestamp
        assignment_to_delete.refresh_from_db()
        self.assertIsNotNone(assignment_to_delete.deleted_at)

    def test_bulk_delete_assignments_does_not_affect_other_plannings(self):
        """Test that bulk delete only affects assignments from the specified planning"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create a second planning with its own assignments
        other_planning = Planning.objects.create(
            project=self.project1,
            name="other_planning",
            team=self.team1,
            org_unit=self.root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )

        # Create assignments for the other planning
        other_data = {
            "planning": other_planning.id,
            "org_units": [self.child2.id, self.child3.id, self.child4.id],
            "team": self.team1.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=other_data, format="json")

        # Verify both plannings have their assignments
        original_planning_assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        other_planning_assignments = Assignment.objects.filter(planning=other_planning, deleted_at__isnull=True)

        self.assertEqual(original_planning_assignments.count(), 1)  # 1 from setUp
        self.assertEqual(other_planning_assignments.count(), 3)  # 3 from bulk create

        # Bulk delete assignments from the original planning only
        delete_data = {"planning": self.planning.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["deleted_count"], 1)  # Only 1 assignment from original planning
        self.assertEqual(r["planning_id"], self.planning.id)

        # Verify original planning assignments are deleted
        original_planning_assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(original_planning_assignments.count(), 0)

        # Verify other planning assignments are NOT affected
        other_planning_assignments = Assignment.objects.filter(planning=other_planning, deleted_at__isnull=True)
        self.assertEqual(other_planning_assignments.count(), 3)  # Still 3, unchanged

        # Verify the other planning's assignments are still active
        for assignment in other_planning_assignments:
            self.assertIsNone(assignment.deleted_at)
            self.assertEqual(assignment.planning, other_planning)

    def test_no_perm_create(self):
        self.client.force_authenticate(self.user)
        data = {
            "planning": self.planning.id,
            "user": self.user.id,
            "org_unit": self.child2.id,
        }

        response = self.client.post("/api/microplanning/assignments/", data=data, format="json")
        self.assertJSONResponse(response, 403)

    def test_query_mobile(self):
        p = Planning.objects.create(
            project=self.project1,
            name="planning2",
            team=self.team1,
            org_unit=self.root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            published_at="2025-01-01",
        )
        p.assignment_set.create(org_unit=self.child1, user=self.user)
        p.assignment_set.create(org_unit=self.child2, user=self.user)

        # This one should not be returned because started_at is None
        p4 = Planning.objects.create(
            project=self.project1,
            name="planning4",
            team=self.team1,
            org_unit=self.root_org_unit,
            started_at=None,
            ended_at="2025-01-10",
        )
        p4.assignment_set.create(org_unit=self.child3, user=self.user)
        p4.assignment_set.create(org_unit=self.child4, user=self.user)

        # This one should not be returned because ended_at is None
        p5 = Planning.objects.create(
            project=self.project1,
            name="planning5",
            team=self.team1,
            org_unit=self.root_org_unit,
            started_at="2025-01-10",
            ended_at=None,
        )
        p5.assignment_set.create(org_unit=self.child3, user=self.user)
        p5.assignment_set.create(org_unit=self.child4, user=self.user)

        plannings = Planning.objects.filter(assignment__user=self.user).distinct()
        Planning.objects.update(published_at=now())
        self.assertEqual(plannings.count(), 4)

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/mobile/plannings/", format="json")
        r = self.assertJSONResponse(response, 200)
        plannings = r["plannings"]
        self.assertEqual(len(plannings), 2)
        # planning 1
        p1 = plannings[0]
        self.assertEqual(p1["name"], "planning1")
        self.assertEqual(p1["assignments"], [{"org_unit_id": self.child1.id, "form_ids": []}])

        p2 = plannings[1]
        self.assertEqual(p2["name"], "planning2")
        self.assertEqual(
            p2["assignments"],
            [{"org_unit_id": self.child1.id, "form_ids": []}, {"org_unit_id": self.child2.id, "form_ids": []}],
        )

        # Response look like
        # [
        #     {
        #         "id": 161,
        #         "name": "planning1",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.029707Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}],
        #     },
        #     {
        #         "id": 162,
        #         "name": "planning2",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.034614Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}, {"org_unit": 3558, "form_ids": []}],
        #     },
        # ]

        # user without any assignment, should get no planning
        user = self.create_user_with_profile(username="user2", account=self.account)
        self.client.force_authenticate(user)

        response = self.client.get("/api/mobile/plannings/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["plannings"]), 0)

    def test_query_mobile_get(self):
        self.client.force_authenticate(self.user)
        Planning.objects.update(published_at=now())
        response = self.client.get(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 200)

    def test_query_mobile_no_modification(self):
        self.user.is_superuser = True
        self.user.save()
        Planning.objects.update(published_at=now())

        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 403)

        response = self.client.post("/api/mobile/plannings/", data={}, format="json")
        self.assertEqual(response.status_code, 403)
