from typing import Any

from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Project
from iaso.models.team import Team, TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamListViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
            project=project1, name="root_team", manager=cls.user_no_perm, color="#0000FF"
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
            name="sub_team_2_1",
            parent=cls.sub_team_2,
            manager=cls.user_with_perms,
            project=cls.project1,
            type=TeamType.TEAM_OF_USERS,
        )
        cls.sub_team_2_1.users.set([cls.user_with_perms, cls.user_no_perm])

        cls.team_other_account = Team.objects.create(
            name="team other account", manager=cls.user_other_account, project=cls.project_other_account
        )

    def assertValidResponse(self, data: Any, expected_length: int):
        self.assertResponseCompliantToSwagger(data, "PaginatedTeamListList")
        self.assertEqual(len(data["results"]), expected_length)

    @property
    def url(self) -> str:
        return reverse("teams-list")

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(2):
            res = self.client.get(
                self.url,
                data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE},
            )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

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

    def test_filters_projects(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        res = self.client.get(
            self.url,
            data={
                "projects": ",".join(map(str, [self.project1.pk, self.project2.pk])),
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        res = self.client.get(
            self.url,
            data={
                "projects": ",".join(map(str, [self.project1.pk])),
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 6)
        self.assertCountEqual(
            [x["id"] for x in res_data["results"]],
            [
                self.root_team.pk,
                self.team.pk,
                self.sub_team_1.pk,
                self.sub_team_2.pk,
                self.sub_team_3.pk,
                self.sub_team_2_1.pk,
            ],
        )

        res = self.client.get(
            self.url,
            data={
                "projects": ",".join([str(Project.objects.order_by("-id").first().pk + 1)]),
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filters_type(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        res = self.client.get(
            self.url,
            data={
                "types": [TeamType.TEAM_OF_USERS, TeamType.TEAM_OF_TEAMS],
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 6)
        self.assertCountEqual(
            [x["id"] for x in res_data["results"]],
            [
                self.root_team.pk,
                self.team.pk,
                self.team2.pk,
                self.sub_team_1.pk,
                self.sub_team_2.pk,
                self.sub_team_2_1.pk,
            ],
        )

        res = self.client.get(
            self.url,
            data={
                "types": TeamType.TEAM_OF_USERS,
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertCountEqual(
            [x["id"] for x in res_data["results"]],
            [self.sub_team_2_1.pk],
        )

        res = self.client.get(
            self.url,
            data={
                "types": "WRONG_TYPE",
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "types")

    def test_filters_search(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        res = self.client.get(
            self.url,
            data={
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
                "search": "root",
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(res_data["results"][0]["id"], self.root_team.pk)

        res = self.client.get(
            self.url,
            data={
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
                "search": "ROOT",
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(res_data["results"][0]["id"], self.root_team.pk)

        res = self.client.get(
            self.url,
            data={
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
                "search": "wrong",
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filters_managers(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        res = self.client.get(
            self.url,
            data={
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
                "managers": self.user_no_perm.id,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(res_data["results"][0]["id"], self.root_team.pk)

        res = self.client.get(
            self.url,
            data={
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
                "managers": self.user_with_perms.id,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)
        self.assertNotIn(self.root_team.pk, [x["id"] for x in res_data["results"]])

    def test_ordering(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)

        # check the default ordering
        self.assertEqual(
            [x["id"] for x in r["results"]],
            list(Team.objects.filter_for_user(self.superuser).order_by("name").values_list("id", flat=True)),
        )

        response = self.client.get(
            self.url,
            data={
                api_settings.ORDERING_PARAM: "id",
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidResponse(r, 10)

        self.assertEqual(
            [x["id"] for x in r["results"]],
            list(Team.objects.filter_for_user(self.superuser).order_by("id").values_list("id", flat=True)),
        )

    def test_should_not_see_teams_in_other_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertNotIn(self.team_other_account.pk, [x["id"] for x in res_data["results"]])

    def test_should_not_see_soft_deleted_teams(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)
        self.assertIn(self.root_team.pk, [x["id"] for x in res_data["results"]])

        self.root_team.delete()
        self.root_team.refresh_from_db()
        self.assertIsNotNone(self.root_team.deleted_at)

        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)
        self.assertNotIn(self.root_team.pk, [x["id"] for x in res_data["results"]])

    def test_member_count_field_excluded_by_default(self):
        members_count_field = "members_count"
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.url)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        # self.assertValidResponse(res_data, 10) will fail cause members_count is not there, dynamic field is anti-swagger
        self.assertEqual(len(res_data["results"]), 10)
        self.assertTrue(all(members_count_field not in x for x in res_data["results"]))

        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            self.url, data={settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)
        self.assertTrue(all(members_count_field in x for x in res_data["results"]))

    def test_members_count_include_soft_deleted_sub_teams(self):
        self.team.delete()
        self.team.refresh_from_db()

        self.assertIsNotNone(self.team.deleted_at)
        self.assertEqual(self.root_team.type, TeamType.TEAM_OF_TEAMS)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            self.url,
            data={
                api_settings.ORDERING_PARAM: "id",
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 9)

        root_team = res_data["results"][0]
        self.assertEqual(root_team["id"], self.root_team.pk)

        self.assertEqual(root_team["members_count"], 1)

    def test_response(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            self.url,
            data={
                api_settings.ORDERING_PARAM: "id",
                settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME: settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 10)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.root_team.pk,
                    "name": "root_team",
                    "color": "#0000FF",
                    "type": "TEAM_OF_TEAMS",
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 1,
                },
                {
                    "id": self.team.pk,
                    "name": "team1",
                    "color": "#0000FF",
                    "type": "TEAM_OF_TEAMS",
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 2,
                },
                {
                    "id": self.team2.pk,
                    "name": "team2",
                    "color": "#EF5350",
                    "type": "TEAM_OF_TEAMS",
                    "project": {"id": self.project2.pk, "name": "project2", "color": "#1976D2"},
                    "members_count": 2,
                },
                {
                    "id": self.sub_team_1.pk,
                    "name": "sub_team_1",
                    "color": "#EF5350",
                    "type": "TEAM_OF_TEAMS",
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 2,
                },
                {
                    "id": self.sub_team_2.pk,
                    "name": "sub_team_2",
                    "color": "#EF5350",
                    "type": "TEAM_OF_TEAMS",
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 1,
                },
                {
                    "id": self.sub_team_3.pk,
                    "name": "sub_team_3",
                    "color": "#EF5350",
                    "type": None,
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 0,
                },
                {
                    "id": self.sub_team_4.pk,
                    "name": "sub_team_4",
                    "color": "#EF5350",
                    "type": None,
                    "project": {"id": self.project2.pk, "name": "project2", "color": "#1976D2"},
                    "members_count": 0,
                },
                {
                    "id": self.sub_team_1_2.pk,
                    "name": "sub_team_1_2",
                    "color": "#EF5350",
                    "type": None,
                    "project": {"id": self.project2.pk, "name": "project2", "color": "#1976D2"},
                    "members_count": 0,
                },
                {
                    "id": self.sub_team_1_3.pk,
                    "name": "sub_team_1_3",
                    "color": "#EF5350",
                    "type": None,
                    "project": {"id": self.project2.pk, "name": "project2", "color": "#1976D2"},
                    "members_count": 0,
                },
                {
                    "id": self.sub_team_2_1.pk,
                    "name": "sub_team_2_1",
                    "color": "#EF5350",
                    "type": "TEAM_OF_USERS",
                    "project": {"id": self.project1.pk, "name": "project1", "color": "#1976D2"},
                    "members_count": 2,
                },
            ],
        )
