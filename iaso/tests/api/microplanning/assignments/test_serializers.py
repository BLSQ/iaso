from unittest import mock

from iaso.api.microplanning.assignments.serializers.bulk_delete import BulkDeleteAssignmentSerializer
from iaso.models import Form, MissionForm, MissionFormThroughForm, OrgUnit, OrgUnitType, Planning, Project, Team
from iaso.models.microplanning import PlanningSamplingResult
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


class AssignmentSerializesTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Preparing first account and setup - two projects
        cls.account_1, cls.data_source_1, cls.version_1, cls.project_1 = cls.create_account_datasource_version_project(
            "source 1", "account 1", "project 1"
        )
        cls.project_2 = Project.objects.create(name="project 2", account=cls.account_1)
        cls.account_1.project_set.add(cls.project_2)

        cls.user_1, cls.anon_1, cls.user_no_perms_1 = cls.create_base_users(
            cls.account_1, [CORE_PLANNING_WRITE_PERMISSION], "user_1"
        )
        cls.team_1 = Team.objects.create(project=cls.project_1, name="team_1", manager=cls.user_1)
        cls.team_2 = Team.objects.create(project=cls.project_2, name="team_2", manager=cls.user_1)

        cls.org_unit_type_parent = OrgUnitType.objects.create(name="type_parent")
        cls.org_unit_type_parent.projects.add(cls.project_1)
        cls.org_unit_type_child = OrgUnitType.objects.create(name="type_child")
        cls.org_unit_type_child.projects.add(cls.project_1)
        cls.org_unit_parent = OrgUnit.objects.create(
            version=cls.version_1, name="org_unit_parent", org_unit_type=cls.org_unit_type_parent
        )
        cls.org_unit_child = OrgUnit.objects.create(
            version=cls.version_1,
            name="org_unit_child",
            org_unit_type=cls.org_unit_type_child,
            parent=cls.org_unit_parent,
        )
        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.project_1.forms.set([cls.form_1, cls.form_2])
        cls.planning = Planning.objects.create(
            project=cls.project_1,
            name="planning_1",
            team=cls.team_1,
            org_unit=cls.org_unit_parent,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            description="A test planning",
            created_by=cls.user_1,
            pipeline_uuids=["111e4567-e89b-12d3-a456-426614174000", "222e4567-e89b-12d3-a456-426614174000"],
        )

        cls.mission_1 = MissionForm.objects.create(
            name="mission_form_1",
            account=cls.account_1,
            created_by=cls.user_1,
        )
        cls.mission_form_1 = MissionFormThroughForm.objects.create(
            mission_form=cls.mission_1, form=cls.form_1, min_cardinality=1, max_cardinality=1
        )
        cls.mission_2 = MissionForm.objects.create(
            name="mission_form_2",
            account=cls.account_1,
            created_by=cls.user_1,
        )
        cls.mission_form_2 = MissionFormThroughForm.objects.create(
            mission_form=cls.mission_2, form=cls.form_2, min_cardinality=1, max_cardinality=1
        )
        cls.planning.missions.set([cls.mission_1, cls.mission_2])

        cls.planning.target_org_unit_types.set([cls.org_unit_type_child])
        cls.planning_sampling_result = PlanningSamplingResult.objects.create(
            planning=cls.planning,
            pipeline_id="123e4567-e89b-12d3-a456-426614174000",
            pipeline_version="v1.0",
            pipeline_name="pipeline_1",
            parameters={"param1": "value1"},
            created_by=cls.user_1,
        )
        cls.planning.selected_sampling_result = cls.planning_sampling_result
        cls.planning.save()

        # Preparing second account and setup - 1 project
        cls.account_2, cls.data_source_2, cls.version_2, cls.project_3 = cls.create_account_datasource_version_project(
            "source 2", "account 2", "project 2"
        )
        cls.user_2, cls.anon_2, cls.user_no_perms_2 = cls.create_base_users(
            cls.account_2, [CORE_PLANNING_WRITE_PERMISSION], "user_2"
        )
        cls.team_3 = Team.objects.create(project=cls.project_3, name="team_3", manager=cls.user_2)
        cls.org_unit_type_account_2 = OrgUnitType.objects.create(name="type_account_2")
        cls.org_unit_type_account_2.projects.add(cls.project_3)
        cls.org_unit_account_2 = OrgUnit.objects.create(
            version=cls.version_2,
            name="org_unit_account_2",
            org_unit_type=cls.org_unit_type_account_2,
        )

        # Create planning in account_2
        cls.planning_account_2 = Planning.objects.create(
            project=cls.project_3,
            name="planning_account_2",
            team=cls.team_3,
            org_unit=cls.org_unit_account_2,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            created_by=cls.user_2,
        )

    def test_bulk_delete_planning_tenancy(self):
        """Test that user cannot use planning from different account"""
        # User from account_1 tries to use planning from account_2
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning_account_2.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("planning", serializer.errors)

    def test_bulk_delete_team_tenancy(self):
        """Test that user cannot use team from different account"""
        # team_3 is from account_2, user_1 is from account_1
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning.id, "team": self.team_3.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("team", serializer.errors)

    def test_bulk_delete_user_tenancy(self):
        """Test that user cannot use user from different account"""
        # user_2 is from account_2, user_1 is from account_1
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning.id, "user": self.user_2.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("user", serializer.errors)
