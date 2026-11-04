from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from iaso.api.microplanning.planning_samplings.views import PlanningSamplingResultViewSet
from iaso.models import (
    Account,
    DataSource,
    Form,
    Group,
    MissionForm,
    MissionFormThroughForm,
    OrgUnit,
    Planning,
    SourceVersion,
    Task,
    Team,
)
from iaso.models.microplanning import PlanningSamplingResult
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


User = get_user_model()


class PlanningSamplingViewAPITestCase(APITestCase):
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

    def test_planning_sampling_results_list(self):
        self.client.force_authenticate(self.user)
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)
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
            group=group,
            parameters={"foo": "bar"},
            created_by=self.user,
        )

        response = self.client.get(
            f"/api/microplanning/samplings/?planning_id={self.planning.id}&order=-id", format="json"
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        results = data["results"] if isinstance(data, dict) and "results" in data else data
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["id"], sampling.id)
        self.assertEqual(result["pipeline_id"], "pipeline-1")
        self.assertEqual(result["task_id"], task.id)
        self.assertEqual(result["group_details"]["org_unit_count"], 1)
        self.assertIsInstance(result["created_at"], float)

    def test_planning_sampling_results_list_requires_auth(self):
        response = self.client.get(
            f"/api/microplanning/samplings/?planning_id={self.planning.id}&order=-id", format="json"
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_planning_sampling_results_create(self):
        self.client.force_authenticate(self.user_with_perms)
        task = Task.objects.create(
            name="sampling-create",
            account=self.account,
            created_by=self.user_with_perms,
        )
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)

        payload = {
            "planning_id": self.planning.id,
            "task_id": task.id,
            "pipeline_id": "pipeline-2",
            "pipeline_version": "v2",
            "group_id": group.id,
            "parameters": {"limit": 10},
        }

        response = self.client.post("/api/microplanning/samplings/", data=payload, format="json")
        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        sampling = PlanningSamplingResult.objects.get(id=data["id"])
        self.assertEqual(sampling.pipeline_id, "pipeline-2")
        self.assertEqual(sampling.created_by, self.user_with_perms)
        self.assertEqual(sampling.task, task)
        self.assertEqual(data["group_details"]["org_unit_count"], 1)
        self.assertIsInstance(data["created_at"], float)

    def test_planning_sampling_results_create_requires_auth(self):
        task = Task.objects.create(
            name="sampling-create-no-auth",
            account=self.account,
            created_by=self.user,
        )
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)

        payload = {
            "planning_id": self.planning.id,
            "task_id": task.id,
            "pipeline_id": "pipeline-unauth",
            "pipeline_version": "v1",
            "group_id": group.id,
            "parameters": {"limit": 5},
        }

        response = self.client.post("/api/microplanning/samplings/", data=payload, format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_planning_sampling_results_create_requires_permission(self):
        user_no_perms = self.create_user_with_profile(username="sampling_no_perm", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perms)
        task = Task.objects.create(
            name="sampling-create-no-perm",
            account=self.account,
            created_by=user_no_perms,
        )
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)

        payload = {
            "planning_id": self.planning.id,
            "task_id": task.id,
            "pipeline_id": "pipeline-no-perm",
            "pipeline_version": "v1",
            "group_id": group.id,
            "parameters": {"limit": 10},
        }

        response = self.client.post("/api/microplanning/samplings/", data=payload, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_planning_sampling_viewset_queryset_does_not_include_soft_deleted_plannings(self):
        group = Group.objects.create(name="Sampling group", source_version=self.org_unit.version)
        group.org_units.add(self.org_unit)
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
            group=group,
            parameters={"foo": "bar"},
            created_by=self.user,
        )

        rf = APIRequestFactory()
        request = rf.get("/api/microplanning/samplings/", format="json")
        force_authenticate(request, user=self.user)

        view = PlanningSamplingResultViewSet()
        view.action_map = {"get": "list"}
        view.request = view.initialize_request(request)

        self.assertEqual(view.get_queryset().count(), 1)
        self.assertIn(sampling, view.get_queryset())

        sampling.planning.delete()
        self.assertSoftDeleted(sampling.planning)

        self.assertEqual(view.get_queryset().count(), 0)
