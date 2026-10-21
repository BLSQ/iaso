from typing import Any

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Team
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamTreeAPITestCase(SwaggerTestCaseMixin, APITestCase):
    maxDiff = None

    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = account = Account.objects.create(name="test")
        cls.other_account = other_account = Account.objects.create(name="other_account")

        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=account, permissions=[])
        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms",
            account=cls.account,
            permissions=[CORE_TEAMS_PERMISSION],
        )
        cls.user_with_perms.iaso_profile.color = "#00FFFF"
        cls.user_with_perms.iaso_profile.save()
        cls.superuser = cls.create_user_with_profile(username="superuser", account=cls.account, is_superuser=True)
        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=other_account, permissions=[CORE_TEAMS_PERMISSION]
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.project_other_account = other_account.project_set.create(name="project3")

        cls.team1 = Team.objects.create(project=project1, name="team1", manager=cls.user_with_perms, color="#0000FF")
        cls.team1.users.set(
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
        return reverse("teams-tree")

    def assertValidResponse(self, data: Any, expected_length: int = 1):
        self.assertResponseCompliantToSwagger(data, "TeamTree", True)
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

        with self.assertNumQueries(2):
            # 1. SELECT
            # 2. SELECT PREFETCH RELATED
            res = self.client.get(self.url)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

    def test_response(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.url)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)
        self.assertEqual(
            res_data,
            [
                {
                    "id": self.team1.pk,
                    "name": "team1",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#0000FF",
                    "users": [
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [
                        {
                            "id": self.sub_team_1.pk,
                            "name": "sub_team_1",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [
                                {
                                    "id": self.sub_team_1_2.pk,
                                    "name": "sub_team_1_2",
                                    "type": None,
                                    "parent": self.sub_team_1.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                },
                                {
                                    "id": self.sub_team_1_3.pk,
                                    "name": "sub_team_1_3",
                                    "type": None,
                                    "parent": self.sub_team_1.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                },
                            ],
                        },
                        {
                            "id": self.sub_team_2.pk,
                            "name": "sub_team_2",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [
                                {
                                    "id": self.sub_team_2_1.pk,
                                    "name": "sub_team_2_1",
                                    "type": None,
                                    "parent": self.sub_team_2.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                }
                            ],
                        },
                    ],
                },
                {
                    "id": self.team2.pk,
                    "name": "team2",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#EF5350",
                    "users": [
                        {
                            "id": self.user_no_perm.pk,
                            "iaso_profile_id": self.user_no_perm.iaso_profile.pk,
                            "username": "user_no_perm",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [
                        {
                            "id": self.sub_team_3.pk,
                            "name": "sub_team_3",
                            "type": None,
                            "parent": self.team2.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                        {
                            "id": self.sub_team_4.pk,
                            "name": "sub_team_4",
                            "type": None,
                            "parent": self.team2.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                    ],
                },
            ],
        )

    def test_parent_filter_param(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.url, data={"root": self.team1.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(
            res_data,
            [
                {
                    "id": self.team1.pk,
                    "name": "team1",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#0000FF",
                    "users": [
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [
                        {
                            "id": self.sub_team_1.pk,
                            "name": "sub_team_1",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [
                                {
                                    "id": self.sub_team_1_2.pk,
                                    "name": "sub_team_1_2",
                                    "type": None,
                                    "parent": self.sub_team_1.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                },
                                {
                                    "id": self.sub_team_1_3.pk,
                                    "name": "sub_team_1_3",
                                    "type": None,
                                    "parent": self.sub_team_1.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                },
                            ],
                        },
                        {
                            "id": self.sub_team_2.pk,
                            "name": "sub_team_2",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [
                                {
                                    "id": self.sub_team_2_1.pk,
                                    "name": "sub_team_2_1",
                                    "type": None,
                                    "parent": self.sub_team_2.pk,
                                    "depth": 3,
                                    "color": "#EF5350",
                                    "users": [],
                                    "children": [],
                                }
                            ],
                        },
                    ],
                },
            ],
        )

        res = self.client.get(self.url, data={"root": self.sub_team_1.pk})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(
            res_data,
            [
                {
                    "id": self.sub_team_1.pk,
                    "name": "sub_team_1",
                    "type": "TEAM_OF_TEAMS",
                    "parent": self.team1.pk,
                    "depth": 2,
                    "color": "#EF5350",
                    "users": [],
                    "children": [
                        {
                            "id": self.sub_team_1_2.pk,
                            "name": "sub_team_1_2",
                            "type": None,
                            "parent": self.sub_team_1.pk,
                            "depth": 3,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                        {
                            "id": self.sub_team_1_3.pk,
                            "name": "sub_team_1_3",
                            "type": None,
                            "parent": self.sub_team_1.pk,
                            "depth": 3,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                    ],
                }
            ],
        )

    def test_max_depth_filter_param(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.url, data={"max_depth": 1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)
        self.assertEqual(
            res_data,
            [
                {
                    "id": self.team1.pk,
                    "name": "team1",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#0000FF",
                    "users": [
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [],
                },
                {
                    "id": self.team2.pk,
                    "name": "team2",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#EF5350",
                    "users": [
                        {
                            "id": self.user_no_perm.pk,
                            "iaso_profile_id": self.user_no_perm.iaso_profile.pk,
                            "username": "user_no_perm",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [],
                },
            ],
        )

        res = self.client.get(self.url, data={"max_depth": 2})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data,
            [
                {
                    "id": self.team1.pk,
                    "name": "team1",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#0000FF",
                    "users": [
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [
                        {
                            "id": self.sub_team_1.pk,
                            "name": "sub_team_1",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                        {
                            "id": self.sub_team_2.pk,
                            "name": "sub_team_2",
                            "type": "TEAM_OF_TEAMS",
                            "parent": self.team1.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                    ],
                },
                {
                    "id": self.team2.pk,
                    "name": "team2",
                    "type": "TEAM_OF_TEAMS",
                    "parent": None,
                    "depth": 1,
                    "color": "#EF5350",
                    "users": [
                        {
                            "id": self.user_no_perm.pk,
                            "iaso_profile_id": self.user_no_perm.iaso_profile.pk,
                            "username": "user_no_perm",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                        {
                            "id": self.user_with_perms.pk,
                            "iaso_profile_id": self.user_with_perms.iaso_profile.pk,
                            "username": "user_with_perms",
                            "first_name": "",
                            "last_name": "",
                            "color": "#00FFFF",
                        },
                        {
                            "id": self.superuser.pk,
                            "iaso_profile_id": self.superuser.iaso_profile.pk,
                            "username": "superuser",
                            "first_name": "",
                            "last_name": "",
                            "color": "#1976D2",
                        },
                    ],
                    "children": [
                        {
                            "id": self.sub_team_3.pk,
                            "name": "sub_team_3",
                            "type": None,
                            "parent": self.team2.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                        {
                            "id": self.sub_team_4.pk,
                            "name": "sub_team_4",
                            "type": None,
                            "parent": self.team2.pk,
                            "depth": 2,
                            "color": "#EF5350",
                            "users": [],
                            "children": [],
                        },
                    ],
                },
            ],
        )
