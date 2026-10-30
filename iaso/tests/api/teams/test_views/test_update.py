from typing import Any, Optional

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from hat.audit.models import Modification
from iaso.models import Account, Team
from iaso.models.team import TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamUpdateViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
        cls.superuser.iaso_profile.projects.set([cls.project1, cls.project2])

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

    def get_url(self, pk: Optional[int] = None) -> str:
        if not pk:
            pk = self.team.pk
        return reverse("teams-detail", kwargs={"pk": pk})

    def test_permissions(self):
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_with_perms)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def assertValidBody(self, data: Any):
        self.assertResponseCompliantToSwagger(data, "TeamUpdateRequest")

    def test_partial_update_rejects_parent_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.put(
            self.get_url(self.root_team.pk),
            {"parent": self.team_other_account.pk},
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "parent", f'Invalid pk "{self.team_other_account.pk}" - object does not exist.')

    def test_partial_update_rejects_sub_team_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {"sub_teams": [self.team_other_account.pk]},
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "sub_teams", f'Invalid pk "{self.team_other_account.pk}" - object does not exist.'
        )

    def test_partial_update_rejects_sub_team_from_another_project(self):
        self.client.force_authenticate(self.superuser)

        # The root and team are in project1; sub_team_4 belongs to project2.
        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {"sub_teams": [self.sub_team_4.pk]},
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, api_settings.NON_FIELD_ERRORS_KEY, "Sub teams must be in the same project")

    def test_partial_update_rejects_users_and_sub_teams_together(self):
        self.client.force_authenticate(self.superuser)

        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {
                "sub_teams": [self.team.pk],
                "users": [self.user_with_perms.pk],
            },
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, api_settings.NON_FIELD_ERRORS_KEY, "Teams cannot have both users and sub teams")

    def test_partial_update_rejects_parent_cycle(self):
        self.client.force_authenticate(self.superuser)

        # A descendant cannot become an ancestor of its own root.
        response = self.client.put(
            self.get_url(self.root_team.pk),
            {"parent": self.sub_team_1.pk},
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "parent", "Cannot create loop in teams tree")

    def test_partial_update_rejects_sub_team_cycle(self):
        self.client.force_authenticate(self.superuser)

        data = {"sub_teams": [self.team.pk]}

        response = self.client.patch(
            self.get_url(),
            data,
        )

        res_data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "sub_teams", "Cannot create loop in teams tree")

    def test_partial_update_recalculates_paths_when_sub_teams_change(self):
        self.client.force_authenticate(self.superuser)

        # Move sub_team_3 from team2 under root_team.
        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {"sub_teams": [self.team.pk, self.sub_team_3.pk]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.root_team.refresh_from_db()
        self.team.refresh_from_db()
        self.sub_team_3.refresh_from_db()

        self.assertEqual(
            set(self.root_team.sub_teams.values_list("id", flat=True)),
            {self.team.pk, self.sub_team_3.pk},
        )
        self.assertEqual(
            str(self.sub_team_3.path),
            f"{self.root_team.path}.{self.sub_team_3.pk}",
        )

    def test_partial_update_recalculates_paths_when_sub_team_is_removed(self):
        self.client.force_authenticate(self.superuser)
        self.assertEqual(str(self.team.path), f"{self.root_team.pk}.{self.team.pk}")

        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {"sub_teams": []},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.root_team.refresh_from_db()
        self.team.refresh_from_db()

        self.assertFalse(self.root_team.sub_teams.exists())
        self.assertIsNone(self.team.parent_id)
        self.assertEqual(str(self.team.path), str(self.team.pk))

    def test_partial_update_does_not_change_paths_when_sub_teams_are_omitted(self):
        self.client.force_authenticate(self.superuser)

        original_paths = {
            team.pk: team.path
            for team in Team.objects.filter(
                pk__in=[
                    self.root_team.pk,
                    self.team.pk,
                    self.sub_team_1.pk,
                    self.sub_team_2.pk,
                ]
            )
        }

        response = self.client.patch(
            self.get_url(self.root_team.pk),
            {"name": "Renamed root"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_paths = dict(Team.objects.filter(pk__in=original_paths).values_list("pk", "path"))
        self.assertEqual(updated_paths, original_paths)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)

        update_data = {
            "name": "updated team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "description": "Updated description",
            "type": TeamType.TEAM_OF_USERS,
            "color": "#00FFFF",
            "parent": self.root_team.pk,
            "sub_teams": [],
            "users": [self.user_with_perms.pk],
        }

        self.assertValidBody(update_data)
        ContentType.objects.clear_cache()

        with self.assertNumQueries(31):
            # 1 - 7: SELECT + SERIALIZER QUERYSETS
            # 8 - 10 SAVEPOINT - SELECT PARENT - SAVEPOINT
            # 11 - 17: UPDATE
            # 18 - 24: RECALCULATE PATH
            # 25 - 28 : RELEASE + SELECT CHILDREN
            # 29 - 31: AUDIT
            response = self.client.put(self.get_url(), update_data)

        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.team.refresh_from_db()

        self.assertEqual(self.team.name, update_data["name"])
        self.assertEqual(self.team.manager_id, update_data["manager"])
        self.assertEqual(self.team.project_id, update_data["project"])
        self.assertEqual(self.team.description, update_data["description"])
        self.assertEqual(self.team.type, update_data["type"])
        self.assertEqual(self.team.color, update_data["color"])
        self.assertEqual(self.team.parent_id, update_data["parent"])
        self.assertEqual(self.team.updated_by, self.superuser)

        self.assertEqual(
            list(self.team.users.values_list("id", flat=True)),
            update_data["users"],
        )
        self.assertFalse(self.team.sub_teams.exists())

        self.assertEqual(
            str(self.team.path),
            f"{self.root_team.path}.{self.team.pk}",
        )

    def test_cannot_update_soft_deleted_team(self):
        self.client.force_authenticate(self.superuser)

        self.assertIsNone(self.team.deleted_at)

        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.team.delete()
        self.team.refresh_from_db()
        self.assertIsNotNone(self.team.deleted_at)

        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_team_from_another_account(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.put(self.get_url(self.team_other_account.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_update(self):
        # checking the updated_by
        self.assertIsNone(self.team.updated_by)

        self.client.force_authenticate(self.superuser)

        update_data = {
            "name": "updated team",
            "manager": self.user_with_perms.pk,
            "project": self.project1.pk,
            "description": "Updated description",
            "type": TeamType.TEAM_OF_USERS,
            "color": "#00FFFF",
            "parent": self.root_team.pk,
            "sub_teams": [],
            "users": [self.user_with_perms.pk],
        }

        self.assertValidBody(update_data)

        response = self.client.put(self.get_url(), update_data)

        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.team.refresh_from_db()

        self.assertEqual(self.team.name, update_data["name"])
        self.assertEqual(self.team.manager_id, update_data["manager"])
        self.assertEqual(self.team.project_id, update_data["project"])
        self.assertEqual(self.team.description, update_data["description"])
        self.assertEqual(self.team.type, update_data["type"])
        self.assertEqual(self.team.color, update_data["color"])
        self.assertEqual(self.team.parent_id, update_data["parent"])
        self.assertEqual(self.team.updated_by, self.superuser)

        self.assertEqual(
            list(self.team.users.values_list("id", flat=True)),
            update_data["users"],
        )
        self.assertFalse(self.team.sub_teams.exists())

        self.assertEqual(
            str(self.team.path),
            f"{self.root_team.path}.{self.team.pk}",
        )

        # check modification
        self.assertTrue(
            Modification.objects.filter(
                user=self.superuser,
                source=f"API PUT /api/teams/{self.team.pk}/",
            ).exists()
        )

        # reupdating with another user to check the updated_by
        self.client.force_authenticate(self.user_with_perms)

        data = {
            "name": "updated team",
        }
        response = self.client.patch(self.get_url(), data=data)

        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.team.refresh_from_db()

        self.assertEqual(self.team.name, data["name"])
        self.assertEqual(self.team.updated_by, self.user_with_perms)

    def test_update_rejects_users_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "users": [self.user_other_account.pk],
        }

        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "users", f'Invalid pk "{self.user_other_account.pk}" - object does not exist.')

    def test_update_rejects_manager_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "manager": self.user_other_account.pk,
        }

        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "manager", f'Invalid pk "{self.user_other_account.pk}" - object does not exist.')

    def test_update_rejects_project_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "project": self.project_other_account.pk,
        }

        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "project", f'Invalid pk "{self.project_other_account.pk}" - object does not exist.'
        )

    def test_update_type(self):
        self.client.force_authenticate(self.superuser)

        self.assertEqual(self.team.type, TeamType.TEAM_OF_TEAMS)

        data = {"users": [self.superuser.pk], "sub_teams": []}
        res = self.client.patch(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, api_settings.NON_FIELD_ERRORS_KEY, f"Incorrect type: expected {TeamType.TEAM_OF_USERS.label}"
        )

        data = {"users": [self.superuser.pk], "sub_teams": [], "type": TeamType.TEAM_OF_USERS}
        res = self.client.patch(self.get_url(), data)
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.team.refresh_from_db()
        self.assertEqual(self.team.type, TeamType.TEAM_OF_USERS)
        self.assertEqual(list(self.team.users.values_list("id", flat=True)), [self.superuser.pk])

        self.sub_team_1.refresh_from_db()
        self.assertIsNone(self.sub_team_1.parent)
        self.assertEqual(str(self.sub_team_1.path), str(self.sub_team_1.pk))

        data = {"sub_teams": [self.sub_team_1.pk], "users": [], "type": TeamType.TEAM_OF_TEAMS}
        res = self.client.patch(self.get_url(), data)
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.team.refresh_from_db()
        self.assertEqual(self.team.type, TeamType.TEAM_OF_TEAMS)
        self.assertEqual(list(self.team.sub_teams.values_list("id", flat=True)), [self.sub_team_1.pk])

        self.sub_team_1.refresh_from_db()
        self.assertEqual(self.sub_team_1.parent, self.team)
