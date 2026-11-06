from typing import Any, Optional

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Team
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamRetrieveAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.account = account = Account.objects.create(name="test")
        cls.other_account = other_account = Account.objects.create(name="other_account")

        cls.user_no_perm = cls.create_user_with_profile(
            username="user_no_perm", account=account, permissions=[], first_name="user", last_name="no_perm"
        )
        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms",
            account=cls.account,
            permissions=[CORE_TEAMS_PERMISSION],
            first_name="user",
            last_name="with_perms",
        )
        cls.user_with_perms.iaso_profile.color = "#00FFFF"
        cls.user_with_perms.iaso_profile.save()
        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account, is_superuser=True, first_name="user", last_name="super"
        )
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=other_account, permissions=[CORE_TEAMS_PERMISSION]
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.project_other_account = other_account.project_set.create(name="project3")

        cls.root_team = Team.objects.create(
            project=project1, name="root_team", manager=cls.user_with_perms, color="#0000FF"
        )
        cls.team = Team.objects.create(
            project=project1, name="team1", manager=cls.user_with_perms, color="#0000FF", parent=cls.root_team
        )
        cls.team.users.set(
            [
                cls.user_with_perms,
                cls.superuser,
            ]
        )
        cls.team2 = Team.objects.create(project=project2, name="team2", manager=cls.user_with_perms)
        cls.team2.users.set(
            [
                cls.user_with_perms,
                cls.user_no_perm,
                cls.superuser,
            ]
        )

        cls.sub_team_1 = Team.objects.create(
            name="sub_team_1", parent=cls.team, manager=cls.user_with_perms, project=cls.project1
        )
        cls.sub_team_2 = Team.objects.create(
            name="sub_team_2", parent=cls.team, manager=cls.user_with_perms, project=cls.project1
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

    def get_url(self, pk: Optional[int] = None) -> str:
        if pk is None:
            pk = self.team.pk
        return reverse("teams-detail", kwargs={"pk": pk})

    def assertValidResponse(self, data: Any) -> None:
        self.assertResponseCompliantToSwagger(data, "TeamRetrieve")

    def test_permissions(self):
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # read only or has permission

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # read only or has permission

        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(3):
            # 1 SELECT OBJECT
            # 2 SELECT PREFETCH USERS
            # 3 SELECT PREFETCH SUB TEAMS
            res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

    def test_should_not_see_other_team_account(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.get_url(self.team_other_account.pk))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_should_not_see_soft_deleted(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.get_url())
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.team.delete()
        self.team.refresh_from_db()
        self.assertIsNotNone(self.team.deleted_at)

        res = self.client.get(self.get_url())
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_sub_teams_should_not_include_soft_deleted(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertCountEqual(
            res_data["sub_teams"],
            [
                {
                    "id": self.sub_team_1.id,
                    "name": self.sub_team_1.name,
                    "color": self.sub_team_1.color.upper(),
                },
                {
                    "id": self.sub_team_2.id,
                    "name": self.sub_team_2.name,
                    "color": self.sub_team_2.color.upper(),
                },
            ],
        )

        self.sub_team_1.delete()

        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertCountEqual(
            res_data["sub_teams"],
            [
                {
                    "id": self.sub_team_2.id,
                    "name": self.sub_team_2.name,
                    "color": self.sub_team_2.color.upper(),
                },
            ],
        )

    def test_retrieve(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertCountEqual(
            list(res_data.keys()),
            [
                "id",
                "name",
                "description",
                "created_at",
                "updated_at",
                "users",
                "project",
                "sub_teams",
                "manager",
                "type",
                "parent",
                "color",
            ],
        )

        self.assertEqual(res_data["id"], self.team.id)
        self.assertEqual(res_data["name"], "team1")
        self.assertEqual(res_data["description"], self.team.description)
        self.assertIsNotNone(res_data["created_at"])
        self.assertIsNotNone(res_data["updated_at"])
        self.assertEqual(res_data["type"], self.team.type)
        self.assertEqual(res_data["color"], self.team.color)

        self.assertCountEqual(
            res_data["users"],
            [
                {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "iaso_profile_id": user.iaso_profile.id,
                    "color": user.iaso_profile.color,
                }
                for user in [self.user_with_perms, self.superuser]
            ],
        )

        self.assertEqual(
            res_data["project"],
            {
                "id": self.project1.id,
                "name": self.project1.name,
                "color": self.project1.color,
            },
        )

        self.assertCountEqual(
            res_data["sub_teams"],
            [
                {
                    "id": self.sub_team_1.id,
                    "name": self.sub_team_1.name,
                    "color": self.sub_team_1.color.upper(),
                },
                {
                    "id": self.sub_team_2.id,
                    "name": self.sub_team_2.name,
                    "color": self.sub_team_2.color.upper(),
                },
            ],
        )

        self.assertEqual(
            res_data["manager"],
            {
                "id": self.user_with_perms.id,
                "username": self.user_with_perms.username,
                "first_name": self.user_with_perms.first_name,
                "last_name": self.user_with_perms.last_name,
                "iaso_profile_id": self.user_with_perms.iaso_profile.id,
                "color": self.user_with_perms.iaso_profile.color,
            },
        )

        self.assertEqual(res_data["parent"], self.root_team.id)
