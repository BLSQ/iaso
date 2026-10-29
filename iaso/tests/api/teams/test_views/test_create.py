from typing import Any

from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from hat.audit.models import Modification
from iaso.models import Account, Team
from iaso.models.team import TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamCreateViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
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

        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=other_account, permissions=[CORE_TEAMS_PERMISSION]
        )

        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.project_other_account = other_account.project_set.create(name="project3")

        cls.superuser = cls.create_user_with_profile(
            username="superuser",
            account=cls.account,
            is_superuser=True,
            first_name="user",
            last_name="super",
            projects=[project1, project2],
        )
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

    @property
    def url(self) -> str:
        return reverse("teams-list")

    def assertValidBody(self, data: Any):
        self.assertResponseCompliantToSwagger(data, "TeamCreateRequest")

    def assertValidResponse(self, data: Any):
        self.assertResponseCompliantToSwagger(data, "TeamCreate")

    def test_permissions(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_with_perms)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)

        create_data = {
            "name": "new team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "description": "New team description",
            "type": TeamType.TEAM_OF_USERS,
            "color": "#00FFFF",
            "parent": self.root_team.pk,
            "users": [self.user_with_perms.pk],
        }

        self.assertValidBody(create_data)

        with self.assertNumQueries(17):
            # 1-4: PERMISSION + SERIALIZER VALIDATION QUERYSETS
            # 5-10: TRANSACTION, TEAM INSERT AND PATH RECALCULATE
            # 11-15: M2M ASSIGNEMENTS + AUDIT SERIALIZATION
            # 16-17: AUDIT MODIFICATION CREATE
            response = self.client.post(self.url, create_data)

        response_data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidResponse(response_data)

        team = Team.objects.get(pk=response_data["id"])

        self.assertEqual(team.name, create_data["name"])

    def test_create(self):
        self.client.force_authenticate(self.superuser)

        create_data = {
            "name": "new team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "description": "New team description",
            "type": TeamType.TEAM_OF_USERS,
            "color": "#00FFFF",
            "parent": self.root_team.pk,
            "users": [self.user_with_perms.pk],
        }

        self.assertValidBody(create_data)

        response = self.client.post(self.url, create_data)

        response_data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidResponse(response_data)
        team = Team.objects.get(pk=response_data["id"])

        self.assertEqual(team.name, create_data["name"])
        self.assertEqual(team.manager_id, create_data["manager"])
        self.assertEqual(team.project_id, create_data["project"])
        self.assertEqual(team.description, create_data["description"])
        self.assertEqual(team.type, create_data["type"])
        self.assertEqual(team.color, create_data["color"])
        self.assertEqual(team.parent_id, create_data["parent"])
        self.assertEqual(team.created_by, self.superuser)
        self.assertEqual(
            list(team.users.values_list("id", flat=True)),
            create_data["users"],
        )
        self.assertEqual(str(team.path), f"{self.root_team.path}.{team.pk}")

        self.assertTrue(Modification.objects.filter(user=self.superuser, source="API POST /api/teams/").exists())

    def test_create_root_team(self):
        self.client.force_authenticate(self.superuser)

        create_data = {
            "name": "new root team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
        }

        response = self.client.post(self.url, create_data)

        response_data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidResponse(response_data)
        team = Team.objects.get(pk=response_data["id"])

        self.assertIsNone(team.parent_id)
        self.assertEqual(str(team.path), str(team.pk))
        self.assertIsNone(team.type)

    def test_create_team_with_sub_teams_recalculates_paths(self):
        self.client.force_authenticate(self.superuser)

        create_data = {
            "name": "new parent team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "sub_teams": [self.sub_team_1.pk, self.sub_team_2.pk],
        }

        response = self.client.post(self.url, create_data)

        response_data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidResponse(response_data)
        team = Team.objects.get(pk=response_data["id"])

        self.sub_team_1.refresh_from_db()
        self.sub_team_2.refresh_from_db()

        self.assertEqual(team.type, TeamType.TEAM_OF_TEAMS)
        self.assertEqual(self.sub_team_1.parent_id, team.pk)
        self.assertEqual(self.sub_team_2.parent_id, team.pk)
        self.assertEqual(str(self.sub_team_1.path), f"{team.path}.{self.sub_team_1.pk}")
        self.assertEqual(str(self.sub_team_2.path), f"{team.path}.{self.sub_team_2.pk}")

    def test_create_rejects_parent_from_another_account(self):
        self.client.force_authenticate(self.superuser)

        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "parent": self.team_other_account.pk,
        }

        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            "parent",
            f'Invalid pk "{self.team_other_account.pk}" - object does not exist.',
        )

    def test_create_rejects_users_from_another_account(self):
        self.client.force_authenticate(self.superuser)

        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "users": [self.user_other_account.pk],
        }

        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            "users",
            f'Invalid pk "{self.user_other_account.pk}" - object does not exist.',
        )

    def test_create_rejects_sub_team_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "sub_teams": [self.team_other_account.pk],
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            "sub_teams",
            f'Invalid pk "{self.team_other_account.pk}" - object does not exist.',
        )

    def test_create_rejects_sub_team_from_another_project(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "sub_teams": [self.sub_team_4.pk],
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "Sub teams must be in the same project",
        )

    def test_create_rejects_users_and_sub_teams_together(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "sub_teams": [self.sub_team_1.pk],
            "users": [self.user_with_perms.pk],
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "Teams cannot have both users and sub teams",
        )

    def test_create_rejects_incorrect_type_for_users(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "type": TeamType.TEAM_OF_TEAMS,
            "users": [self.user_with_perms.pk],
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            f"Incorrect type: expected {TeamType.TEAM_OF_USERS.label}",
        )

    def test_create_rejects_manager_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_other_account.pk,
            "project": self.project1.pk,
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            "manager",
            f'Invalid pk "{self.user_other_account.pk}" - object does not exist.',
        )

    def test_create_rejects_project_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "name": "invalid team",
            "manager": self.user_with_perms.pk,
            "project": self.project_other_account.pk,
        }
        response = self.client.post(
            self.url,
            data,
        )

        response_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            response_data,
            "project",
            f'Invalid pk "{self.project_other_account.pk}" - object does not exist.',
        )

    def test_create_kidnap_team(self):
        """
        Allowing to create new team and specify a children could mean we could kidnap a child team from another one

        """

        self.client.force_authenticate(self.superuser)

        original_parent = self.sub_team_1.parent

        self.assertEqual(original_parent, self.team)

        data = {
            "name": "new parent team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "sub_teams": [self.sub_team_1.pk],
        }

        response = self.client.post(self.url, data)

        response_data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidResponse(response_data)

        new_parent = Team.objects.get(pk=response_data["id"])
        self.sub_team_1.refresh_from_db()
        original_parent.refresh_from_db()

        # The existing team has been moved away from its original parent.
        self.assertEqual(self.sub_team_1.parent_id, new_parent.pk)
        self.assertNotEqual(self.sub_team_1.parent_id, original_parent.pk)

        # The original parent's children no longer include the moved team.
        self.assertNotIn(
            self.sub_team_1.pk,
            list(original_parent.sub_teams.values_list("id", flat=True)),
        )

        # The moved team's path has been recalculated.
        self.assertEqual(
            str(self.sub_team_1.path),
            f"{new_parent.path}.{self.sub_team_1.pk}",
        )

        # The new parent has the expected type.
        self.assertEqual(new_parent.type, TeamType.TEAM_OF_TEAMS)
