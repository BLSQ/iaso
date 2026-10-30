from typing import Any

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from iaso.models import Account, Project, Team
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

        cls.team1 = Team.objects.create(
            project=project1, name="team1", manager=cls.user_with_perms, type=TeamType.TEAM_OF_TEAMS
        )
        cls.team2 = Team.objects.create(
            project=project2, name="team2", manager=cls.user_with_perms, color="#FF5733", type=TeamType.TEAM_OF_TEAMS
        )

        cls.sub_team_1 = Team.objects.create(
            name="sub_team_1",
            parent=cls.team1,
            manager=cls.user_with_perms,
            project=cls.project1,
            type=TeamType.TEAM_OF_TEAMS,
        )
        cls.sub_team_2 = Team.objects.create(
            name="sub_team_2",
            parent=cls.team1,
            manager=cls.user_with_perms,
            project=cls.project1,
            type=TeamType.TEAM_OF_TEAMS,
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
            name="sub_team_2_1",
            parent=cls.sub_team_2,
            manager=cls.user_with_perms,
            project=cls.project1,
            type=TeamType.TEAM_OF_USERS,
        )
        cls.sub_team_2_1.users.set([cls.superuser])

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
            # SELECT
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
        team_data = next(iter([i for i in r if i["value"] == self.team1.pk]))
        expected_fields = {"label", "value", "color", "type"}
        self.assertEqual(set(team_data.keys()), expected_fields)

        # check some fields
        self.assertEqual(
            team_data,
            {
                "value": self.team1.pk,
                "label": self.team1.name,
                "color": self.team1.color.upper(),
                "type": TeamType.TEAM_OF_TEAMS,
            },
        )

        second_team = next(iter([i for i in r if i["value"] == self.team2.pk]))
        self.assertEqual(
            second_team,
            {"value": self.team2.pk, "label": self.team2.name, "color": "#FF5733", "type": TeamType.TEAM_OF_TEAMS},
        )

    def test_filters_ids(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"ids": ",".join(map(str, [self.team1.pk, self.team2.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)
        self.assertCountEqual([x["value"] for x in res_data], [self.team1.pk, self.team2.pk])

        data = {"ids": ",".join([str(Team.objects.order_by("-id").first().pk + 1)])}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filters_exclude_ids(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"exclude_ids": ",".join(map(str, [self.team1.pk, self.team2.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 7)
        self.assertNotIn(self.team1.pk, [x["value"] for x in res_data])
        self.assertNotIn(self.team2.pk, [x["value"] for x in res_data])

        data = {"exclude_ids": ",".join([str(Team.objects.order_by("-id").first().pk + 1)])}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

    def test_filters_projects(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"projects": ",".join(map(str, [self.project1.pk, self.project2.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"projects": ",".join(map(str, [self.project1.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 5)
        self.assertCountEqual(
            [x["value"] for x in res_data],
            [self.team1.pk, self.sub_team_1.pk, self.sub_team_2.pk, self.sub_team_3.pk, self.sub_team_2_1.pk],
        )

        data = {"projects": ",".join([str(Project.objects.order_by("-id").first().pk + 1)])}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filters_users(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"users": ",".join(map(str, [self.superuser.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertCountEqual(
            [x["value"] for x in res_data],
            [self.sub_team_2_1.pk],
        )

        data = {"users": ",".join(map(str, [self.user_with_perms.pk]))}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filters_type(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        data = {"types": [TeamType.TEAM_OF_USERS, TeamType.TEAM_OF_TEAMS]}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 5)
        self.assertCountEqual(
            [x["value"] for x in res_data],
            [self.team1.pk, self.team2.pk, self.sub_team_1.pk, self.sub_team_2.pk, self.sub_team_2_1.pk],
        )

        data = {"types": TeamType.TEAM_OF_USERS}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertCountEqual(
            [x["value"] for x in res_data],
            [self.sub_team_2_1.pk],
        )

        data = {"types": "WRONG_TYPE"}
        res = self.client.get(self.url, data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "types")

    def test_ordering(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 9)

        # check the default ordering
        self.assertEqual(
            [x["value"] for x in r],
            list(Team.objects.filter_for_user(self.superuser).order_by("name").values_list("id", flat=True)),
        )

        data = {"order": "id"}
        response = self.client.get(self.url, data=data)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 9)

        self.assertEqual(
            [x["value"] for x in r],
            list(Team.objects.filter_for_user(self.superuser).order_by("id").values_list("id", flat=True)),
        )

    def test_dropdown_endpoint_does_not_include_soft_deleted(self):
        """Test dropdown endpoint respects soft delete"""

        self.client.force_authenticate(self.superuser)

        team = Team.objects.create(project=self.project1, name="deletable_team", manager=self.superuser)

        # Team should appear in dropdown
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)
        team_ids = [t["value"] for t in r]
        self.assertIn(team.id, team_ids)

        # Delete the team
        team.deleted_at = timezone.now()
        team.save(update_fields=["deleted_at"])

        # Team should not appear in dropdown by default
        response = self.client.get(self.url)
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 9)
        team_ids = [t["value"] for t in r]
        self.assertNotIn(team.id, team_ids)

    def test_should_not_see_other_account_teams(self):
        self.client.force_authenticate(self.user_other_account)

        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(res_data[0]["value"], self.team_other_account.id)
