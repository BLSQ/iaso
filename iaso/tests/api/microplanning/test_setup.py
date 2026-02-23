from iaso.models import Form, OrgUnit, OrgUnitType, Planning, Project, Team
from iaso.models.microplanning import PlanningSamplingResult
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


class PlanningSerializersTestBase(APITestCase):
    def setUp(self):
        # Preparing first account and setup - two projects
        self.account_1, self.data_source_1, self.version_1, self.project_1 = (
            self.create_account_datasource_version_project("source 1", "account 1", "project 1")
        )
        self.project_2 = Project.objects.create(name="project 2", account=self.account_1)
        self.account_1.project_set.add(self.project_2)

        self.user_1, self.anon_1, self.user_no_perms_1 = self.create_base_users(
            self.account_1, [CORE_PLANNING_WRITE_PERMISSION], "user_1"
        )
        self.team_1 = Team.objects.create(project=self.project_1, name="team_1", manager=self.user_1)
        self.team_2 = Team.objects.create(project=self.project_2, name="team_2", manager=self.user_1)

        self.org_unit_type_parent = OrgUnitType.objects.create(name="type_parent")
        self.org_unit_type_parent.projects.add(self.project_1)
        self.org_unit_type_child = OrgUnitType.objects.create(name="type_child")
        self.org_unit_type_child.projects.add(self.project_1)
        self.org_unit_parent = OrgUnit.objects.create(
            version=self.version_1, name="org_unit_parent", org_unit_type=self.org_unit_type_parent
        )
        self.org_unit_child = OrgUnit.objects.create(
            version=self.version_1,
            name="org_unit_child",
            org_unit_type=self.org_unit_type_child,
            parent=self.org_unit_parent,
        )
        self.form_1 = Form.objects.create(name="form_1")
        self.form_2 = Form.objects.create(name="form_2")
        self.project_1.forms.set([self.form_1, self.form_2])
        self.planning = Planning.objects.create(
            project=self.project_1,
            name="planning_1",
            team=self.team_1,
            org_unit=self.org_unit_parent,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            description="A test planning",
            target_org_unit_type=self.org_unit_type_child,
            created_by=self.user_1,
            pipeline_uuids=["111e4567-e89b-12d3-a456-426614174000", "222e4567-e89b-12d3-a456-426614174000"],
        )
        self.planning.forms.set([self.form_1, self.form_2])
        self.planning_sampling_result = PlanningSamplingResult.objects.create(
            planning=self.planning,
            pipeline_id="123e4567-e89b-12d3-a456-426614174000",
            pipeline_version="v1.0",
            pipeline_name="pipeline_1",
            parameters={"param1": "value1"},
            created_by=self.user_1,
        )
        self.planning.selected_sampling_result = self.planning_sampling_result
        self.planning.save()

        # Preparing second account and setup - 1 project
        self.account_2, self.data_source_2, self.version_2, self.project_3 = (
            self.create_account_datasource_version_project("source 2", "account 2", "project 2")
        )
        self.user_2, self.anon_2, self.user_no_perms_2 = self.create_base_users(
            self.account_2, [CORE_PLANNING_WRITE_PERMISSION], "user_2"
        )
        self.team_3 = Team.objects.create(project=self.project_3, name="team_3", manager=self.user_2)
        self.org_unit_type_account_2 = OrgUnitType.objects.create(name="type_account_2")
        self.org_unit_type_account_2.projects.add(self.project_3)
        self.org_unit_account_2 = OrgUnit.objects.create(
            version=self.version_2,
            name="org_unit_account_2",
            org_unit_type=self.org_unit_type_account_2,
        )

        # Create planning in account_2
        self.planning_account_2 = Planning.objects.create(
            project=self.project_3,
            name="planning_account_2",
            team=self.team_3,
            org_unit=self.org_unit_account_2,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            created_by=self.user_2,
        )
