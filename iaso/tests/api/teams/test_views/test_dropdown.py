from typing import Any

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from iaso.models import Account, Team
from iaso.models.team import TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamDropdownAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = account = Account.objects.create(name="test")
        cls.other_account = other_account = Account.objects.create(name="other_account")

        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=account, permissions=[])
        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms", account=cls.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        cls.superuser = cls.create_user_with_profile(username="superuser", account=cls.account, is_superuser=True)
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=other_account, permissions=[CORE_TEAMS_PERMISSION]
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.project_other_account = other_account.project_set.create(name="project3")

        cls.team1 = Team.objects.create(project=project1, name="team1", manager=cls.user_with_perms)
        cls.team2 = Team.objects.create(project=project2, name="team2", manager=cls.user_with_perms)

        cls.sub_team_1 = Team.objects.create(
            name="sub_team_1", parent=cls.team1, manager=cls.user_with_perms, project=cls.project1
        )
        cls.sub_team_2 = Team.objects.create(
            name="sub_team_2", parent=cls.team1, manager=cls.user_with_perms, project=cls.project1
        )
        cls.sub_team_3 = Team.objects.create(
            name="sub_team_3", parent=cls.team2, manager=cls.user_with_perms, project=cls.project1
        )
        cls.sub_team_4 = Team.objects.create(
            name="sub_team_4", parent=cls.team2, manager=cls.user_with_perms, project=cls.project2
        )
        cls.sub_team_1_2 = Team.objects.create(
            name="sub_team_1_2", parent=cls.sub_team_1, manager=cls.user_with_perms, project=cls.project2
        )
        cls.sub_team_1_3 = Team.objects.create(
            name="sub_team_1_3", parent=cls.sub_team_1, manager=cls.user_with_perms, project=cls.project2
        )
        cls.sub_team_2_1 = Team.objects.create(
            name="sub_team_2_1", parent=cls.sub_team_2, manager=cls.user_with_perms, project=cls.project1
        )

        cls.team_other_account = Team.objects.create(
            name="team other account", manager=cls.user_other_account, project=cls.project_other_account
        )

        other_account = Account.objects.create(name="other account")
        cls.create_user_with_profile(username="user", account=other_account)
        account.project_set.create(name="other_project")

    @property
    def url(self) -> str:
        return reverse("teams-dropdown")

    def assertValidResponse(self, data: Any, expected_length: int):
        self.assertResponseCompliantToSwagger(data, "TeamDropdown", True)
        self.assertEqual(len(data), expected_length)

    def test_permissions(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # read only or has permission

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # read only or has permission

        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)

        with self.assertNumQueries(1):
            res = self.client.get(self.url)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidResponse(res_data, 9)

    def test_happy_path(self):
        """Test the dropdown endpoint returns minimal data"""
        self.client.force_authenticate(self.superuser)
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 9)

        # Check that only the expected fields are present
        team_data = r[0]
        expected_fields = {"id", "name", "color", "type", "project"}
        self.assertEqual(set(team_data.keys()), expected_fields)

        # Check that project is just an ID
        self.assertIn("project", team_data)
        self.assertIsInstance(team_data["project"], int)

        # Verify it doesn't include heavy fields from regular serializer
        self.assertNotIn("project_details", team_data)
        self.assertNotIn("users", team_data)
        self.assertNotIn("users_details", team_data)
        self.assertNotIn("sub_teams", team_data)
        self.assertNotIn("sub_teams_details", team_data)
        self.assertNotIn("manager", team_data)
        self.assertNotIn("description", team_data)

    def test_dropdown_endpoint_with_search(self):
        """Test dropdown endpoint works with search filter"""
        self.client.force_authenticate(self.superuser)

        Team.objects.create(project=self.project1, name="searchable_team", manager=self.superuser)
        Team.objects.create(project=self.project1, name="another_team", manager=self.superuser)

        response = self.client.get(self.url, data={"search": "searchable"})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 1)
        self.assertEqual(r[0]["name"], "searchable_team")

    def test_dropdown_endpoint_with_project_filter(self):
        """Test dropdown endpoint works with project filter"""
        self.client.force_authenticate(self.superuser)

        response = self.client.get(self.url, data={"projects": self.project1.id})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 5)
        self.assertTrue(all([ri["project"] == self.project1.id for ri in r]))

    def test_dropdown_endpoint_with_type_filter(self):
        """Test dropdown endpoint works with type filter"""
        ash_ketchum = self.create_user_with_profile(
            username="ash_ketchum", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_users = Team.objects.create(
            project=self.project1, name="team_users", manager=ash_ketchum, type=TeamType.TEAM_OF_USERS
        )
        team_teams = Team.objects.create(
            project=self.project1, name="team_teams", manager=ash_ketchum, type=TeamType.TEAM_OF_TEAMS
        )

        self.client.force_authenticate(self.superuser)

        response = self.client.get(self.url, data={"types": TeamType.TEAM_OF_USERS})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 1)

        # Should only return TEAM_OF_USERS
        team_ids = [team["id"] for team in r]
        self.assertIn(team_users.id, team_ids)
        self.assertNotIn(team_teams.id, team_ids)

    def test_dropdown_endpoint_with_manager_filter(self):
        """Test dropdown endpoint works with manager filter"""
        ash_ketchum = self.create_user_with_profile(
            username="ash_ketchum", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_ash = Team.objects.create(project=self.project1, name="team_ash", manager=ash_ketchum)

        self.client.force_authenticate(self.superuser)

        response = self.client.get(self.url, data={"managers": ash_ketchum.id})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 1)

        self.assertEqual(r[0]["id"], team_ash.id)

    def test_dropdown_endpoint_with_ancestor_filter(self):
        """Test dropdown endpoint works with ancestor filter"""
        self.client.force_authenticate(self.superuser)

        parent_team = Team.objects.create(project=self.project1, name="parent_team", manager=self.superuser)
        child_team = Team.objects.create(
            project=self.project1, name="child_team", manager=self.superuser, parent=parent_team
        )
        grandchild_team = Team.objects.create(
            project=self.project1, name="grandchild_team", manager=self.superuser, parent=child_team
        )
        other_team = Team.objects.create(project=self.project1, name="other_team", manager=self.superuser)

        response = self.client.get(self.url, data={"ancestor": parent_team.id})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 3)

        team_ids = sorted([team["id"] for team in r])
        expected_ids = sorted([parent_team.id, child_team.id, grandchild_team.id])
        self.assertEqual(team_ids, expected_ids)
        self.assertNotIn(other_team.id, team_ids)

    def test_dropdown_endpoint_respects_deletion_status(self):
        """Test dropdown endpoint respects soft delete"""

        self.client.force_authenticate(self.superuser)

        team = Team.objects.create(project=self.project1, name="deletable_team", manager=self.superuser)

        # Team should appear in dropdown
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)
        team_ids = [t["id"] for t in r]
        self.assertIn(team.id, team_ids)

        # Delete the team
        team.deleted_at = timezone.now()
        team.save(update_fields=["deleted_at"])

        # Team should not appear in dropdown by default
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 9)
        team_ids = [t["id"] for t in r]
        self.assertNotIn(team.id, team_ids)

        # Team should appear when using deletion_status=all
        response = self.client.get(self.url, data={"deletion_status": "all"})
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)
        team_ids = [t["id"] for t in r]
        self.assertIn(team.id, team_ids)

    def test_dropdown_endpoint_with_color(self):
        """Test dropdown endpoint includes color field"""
        team_with_color = Team.objects.create(
            project=self.project1, name="colored_team", manager=self.superuser, color="#FF5733"
        )

        self.client.force_authenticate(self.superuser)

        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)

        colored_team_data = next(team for team in r if team["id"] == team_with_color.id)
        self.assertEqual(colored_team_data["color"], "#FF5733")

    def test_should_not_see_other_account_teams(self):
        self.client.force_authenticate(self.user_other_account)

        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(res_data[0]["id"], self.team_other_account.id)
