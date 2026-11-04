from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.db import IntegrityError
from django.utils.timezone import now
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from hat.audit.models import Modification
from iaso.api.microplanning.assignments.serializers.misc import AssignmentSerializer
from iaso.api.microplanning.assignments.views import AssignmentViewSet
from iaso.models import (
    Account,
    DataSource,
    Form,
    MissionForm,
    OrgUnit,
    OrgUnitType,
    SourceVersion,
)
from iaso.models.microplanning import (
    Assignment,
    Planning,
)
from iaso.models.missions import MissionFormThroughForm
from iaso.models.team import Team
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


User = get_user_model()


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
        cls.org_unit_type = org_unit_type = OrgUnitType.objects.create(name="test type")
        project = account.project_set.first()
        org_unit_type.projects.add(project)
        cls.root_org_unit = root_org_unit = OrgUnit.objects.create(
            version=version,
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child1 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child1",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child2 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child2",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child3 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child3",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child4 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child4",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child5 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child4",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.form1 = Form.objects.create(name="form1")
        cls.form2 = Form.objects.create(name="form2")
        cls.form1.projects.add(project1)
        cls.form1.org_unit_types.add(org_unit_type)
        cls.form2.projects.add(project1)
        cls.form2.org_unit_types.add(org_unit_type)
        cls.mission1 = MissionForm.objects.create(
            name="mission1",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission1, form=cls.form1, min_cardinality=1, max_cardinality=1
        )
        cls.mission2 = MissionForm.objects.create(
            name="mission2",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission2, form=cls.form2, min_cardinality=1, max_cardinality=1
        )

        cls.planning = Planning.objects.create(
            project=project1,
            name="planning1",
            team=cls.team1,
            org_unit=root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )
        cls.planning.target_org_unit_types.set([org_unit_type])
        cls.assignment = Assignment.objects.create(
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)

    def test_query_fail_no_auth(self):
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_query_filtering(self):
        p = Planning.objects.create(
            project=self.project1, name="planning1", team=self.team1, org_unit=self.root_org_unit
        )
        p.assignment_set.create(org_unit=self.child1, user=self.user)
        p.assignment_set.create(org_unit=self.child2, user=self.user)
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)

        response = self.client.get(f"/api/microplanning/assignments/?planning={p.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        r = self.assertJSONResponse(response, status.HTTP_201_CREATED)
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
            "selected_ids": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)
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
            "selected_ids": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_bulk_no_access_planning(self):
        other_account = Account.objects.create(name="other_account")

        user = self.create_user_with_profile(
            username="user_with_perms", account=other_account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user)
        data = {
            "planning": self.planning.id,
            "selected_ids": [self.child3.id, self.child4.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
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

        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)
        deleted_assignment.refresh_from_db()
        self.assertNotEqual(deleted_assignment.deleted_at, None)
        self.assertEqual(Modification.objects.count(), 2)
        data = {
            "planning": self.planning.id,
            "selected_ids": [self.child2.id],
            "team": self.team1.id,
        }

        response = self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data, format="json")

        # Get the assignment for this specific planning and org_unit
        deleted_assignment.refresh_from_db()
        restored_assignment = Assignment.objects.filter(
            planning=self.planning, org_unit=self.child2, deleted_at__isnull=True
        ).first()
        self.assertJSONResponse(response, status.HTTP_200_OK)
        # The serializer creates a new assignment, not restore the old one
        self.assertNotEqual(restored_assignment.id, deleted_assignment.id)
        self.assertEqual(Modification.objects.count(), 3)
        self.assertEqual(restored_assignment.deleted_at, None)
        self.assertEqual(restored_assignment.org_unit, self.child2)
        self.assertEqual(restored_assignment.team, self.team1)

    def test_bulk_delete_assignments_whole_planning(self):
        """Test successful bulk delete of all assignments for a planning"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        # Create additional assignments for the planning
        data = {
            "planning": self.planning.id,
            "selected_ids": [self.child2.id, self.child3.id, self.child4.id],
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

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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

    def test_bulk_delete_assignments_for_team(self):
        """Test successful bulk delete of assignments for a specific team"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        initial_assignment = Assignment.objects.get(planning=self.planning, org_unit=self.child1)
        initial_assignment.team = self.team1
        initial_assignment.save()

        team2 = Team.objects.create(project=self.project1, name="team2", manager=self.user)

        data_team1 = {
            "planning": self.planning.id,
            "selected_ids": [self.child2.id, self.child3.id],
            "team": self.team1.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data_team1, format="json")

        data_team2 = {
            "planning": self.planning.id,
            "selected_ids": [self.child4.id, self.child5.id],
            "team": team2.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data_team2, format="json")

        # Expect 5 assignments total (1 from setUp + 2 from team1 + 2 from team2)
        assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(assignments.count(), 5)

        # Expect 3 assignments for team 1 (1 from setUp + 2 from bulk create)
        team1_assignments = Assignment.objects.filter(planning=self.planning, team=self.team1, deleted_at__isnull=True)
        self.assertEqual(team1_assignments.count(), 3)

        # Expect 2 assignments for team 2
        team2_assignments = Assignment.objects.filter(planning=self.planning, team=team2, deleted_at__isnull=True)
        self.assertEqual(team2_assignments.count(), 2)

        # Bulk delete assignments for team1
        delete_data = {"planning": self.planning.id, "team": self.team1.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(result["deleted_count"], 3)
        self.assertEqual(result["planning_id"], self.planning.id)
        self.assertIn("Successfully deleted 3 assignments", result["message"])

        # Team1 assignments are (soft) deleted
        team1_assignments = Assignment.objects.filter(planning=self.planning, team=self.team1, deleted_at__isnull=True)
        self.assertEqual(team1_assignments.count(), 0)
        all_team1_assignments = Assignment.objects.filter(planning=self.planning, team=self.team1)
        self.assertEqual(all_team1_assignments.count(), 3)
        for assignment in all_team1_assignments:
            self.assertIsNotNone(assignment.deleted_at)

        # Team2 assignments are not (soft) deleted
        team2_assignments = Assignment.objects.filter(planning=self.planning, team=team2, deleted_at__isnull=True)
        self.assertEqual(team2_assignments.count(), 2)

    def test_bulk_delete_assignments_for_user(self):
        """Test successful bulk delete of assignments for a specific user"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        user2 = self.create_user_with_profile(username="user2", account=self.account)

        data_user1 = {
            "planning": self.planning.id,
            "selected_ids": [self.child2.id, self.child3.id],
            "user": self.user.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data_user1, format="json")

        data_user2 = {
            "planning": self.planning.id,
            "selected_ids": [self.child4.id, self.child5.id],
            "user": user2.id,
        }
        self.client.post("/api/microplanning/assignments/bulk_create_assignments/", data=data_user2, format="json")

        # 5 assignments total (1 from setUp + 2 from user1 + 2 from user2)
        assignments = Assignment.objects.filter(planning=self.planning, deleted_at__isnull=True)
        self.assertEqual(assignments.count(), 5)

        # 3 assignments for user 1 (1 from setUp + 2 from bulk create)
        user1_assignments = Assignment.objects.filter(planning=self.planning, user=self.user, deleted_at__isnull=True)
        self.assertEqual(user1_assignments.count(), 3)

        # 2 assignments for user 2
        user2_assignments = Assignment.objects.filter(planning=self.planning, user=user2, deleted_at__isnull=True)
        self.assertEqual(user2_assignments.count(), 2)

        # Bulk delete assignments for user1
        delete_data = {"planning": self.planning.id, "user": self.user.id}
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/", data=delete_data, format="json"
        )

        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(result["deleted_count"], 3)
        self.assertEqual(result["planning_id"], self.planning.id)
        self.assertEqual(result["user"], self.user.id)
        self.assertIn("Successfully deleted 3 assignments", result["message"])

        # Verify user1 assignments are soft deleted
        user1_assignments = Assignment.objects.filter(planning=self.planning, user=self.user, deleted_at__isnull=True)
        self.assertEqual(user1_assignments.count(), 0)
        all_user1_assignments = Assignment.objects.filter(planning=self.planning, user=self.user)
        self.assertEqual(all_user1_assignments.count(), 3)
        for assignment in all_user1_assignments:
            self.assertIsNotNone(assignment.deleted_at)

        # Verify user2 assignments are NOT deleted
        user2_assignments = Assignment.objects.filter(planning=self.planning, user=user2, deleted_at__isnull=True)
        self.assertEqual(user2_assignments.count(), 2)

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

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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

        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

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

        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
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

        r = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
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
            "selected_ids": [self.child2.id, self.child3.id],
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

        self.assertJSONResponse(response, status.HTTP_200_OK)

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
            "selected_ids": [self.child2.id, self.child3.id],
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

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        other_planning.target_org_unit_types.set([self.root_org_unit.org_unit_type])

        # Create assignments for the other planning
        other_data = {
            "planning": other_planning.id,
            "selected_ids": [self.child2.id, self.child3.id, self.child4.id],
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

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_assignment_view_set_queryset_does_not_include_soft_deleted_plannings(self):
        rf = APIRequestFactory()
        request = rf.get("/api/microplanning/assignments/", format="json")
        force_authenticate(request, user=self.user)

        view = AssignmentViewSet()
        view.action_map = {"get": "list"}
        view.request = view.initialize_request(request)

        self.assertEqual(view.get_queryset().count(), 1)
        self.assertIn(self.assignment, view.get_queryset())

        self.assignment.planning.delete()
        self.assertSoftDeleted(self.assignment.planning)

        self.assertEqual(view.get_queryset().count(), 0)


class MicroplanningSwaggerTestCase(SwaggerTestCaseMixin, APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.get(name="test")
        cls.user = User.objects.get(username="test")
        cls.project1 = cls.account.project_set.create(name="swagger-project")
        cls.team1 = Team.objects.create(project=cls.project1, name="swagger-team", manager=cls.user)
        source = DataSource.objects.create(name="Swagger source")
        source.projects.add(cls.project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        parent_type = OrgUnitType.objects.create(name="Swagger parent type")
        parent_type.projects.add(cls.project1)
        child_type = OrgUnitType.objects.create(name="Swagger child type")
        child_type.projects.add(cls.project1)
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)
        cls.root = OrgUnit.objects.create(
            version=version,
            name="swagger-root",
            org_unit_type=parent_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        cls.child = OrgUnit.objects.create(
            version=version,
            name="swagger-child",
            parent=cls.root,
            org_unit_type=child_type,
            validation_status=OrgUnit.VALIDATION_VALID,
            simplified_geom=multipolygon,
        )
        cls.planning = Planning.objects.create(
            project=cls.project1,
            name="swagger-planning",
            team=cls.team1,
            org_unit=cls.root,
            started_at="2025-01-01",
            ended_at="2025-01-02",
        )
        cls.planning.target_org_unit_types.set([child_type])
        Assignment.objects.create(planning=cls.planning, org_unit=cls.child, user=cls.user, created_by=cls.user)

    def test_bulk_create_assignments_response_is_compliant(self):
        user_with_perms = self.create_user_with_profile(
            username="swagger_bulk_user",
            account=self.account,
            permissions=[CORE_PLANNING_WRITE_PERMISSION],
        )
        self.client.force_authenticate(user_with_perms)
        response = self.client.post(
            "/api/microplanning/assignments/bulk_create_assignments/",
            data={
                "planning": self.planning.id,
                "selected_ids": [self.child.id],
                "team": self.team1.id,
            },
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "Assignment", as_array=True)

    def test_bulk_delete_assignments_response_is_compliant(self):
        user_with_perms = self.create_user_with_profile(
            username="swagger_delete_user",
            account=self.account,
            permissions=[CORE_PLANNING_WRITE_PERMISSION],
        )
        self.client.force_authenticate(user_with_perms)
        response = self.client.post(
            "/api/microplanning/assignments/bulk_delete_assignments/",
            data={"planning": self.planning.id, "user": self.user.id},
            format="json",
        )
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "BulkDeleteAssignmentResponse")
