import mock
from django.contrib.auth.models import User
from django.test import TransactionTestCase

from iaso.api.microplanning import TeamSerializer
from iaso.models import Account
from iaso.models.microplanning import TeamType, Team
from iaso.test import IasoTestCaseMixin, APITestCase


class TeamTestCase(TransactionTestCase, IasoTestCaseMixin):
    fixtures = ["user.yaml"]

    def test_simple_team_model(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        project1 = account.project_set.create(name="project1")
        project2 = account.project_set.create(name="project2")
        team1 = Team.objects.create(project=project1, name="team1", manager=user)
        team2 = Team.objects.create(project=project2, name="team2", manager=user)
        teams = Team.objects.filter(project__account=user.iaso_profile.account)
        self.assertQuerysetEqual(teams.order_by("name"), [team1, team2])

        teams = Team.objects.filter_for_user(user)
        self.assertQuerysetEqual(teams, [team1, team2])

    def test_serializer_team(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        data = {"name": "hello", "project": project.id, "users_ids": [], "manager": user.id, "sub_teams_ids": []}

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        team = serializer.save()

    def test_serializer_team_users(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)

        data = {
            "name": "hello",
            "project": project.id,
            "users_ids": [user1.id, user2.id],
            "manager": user.id,
            "sub_teams_ids": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        new_team = serializer.save()
        self.assertEqual(new_team.type, TeamType.TEAM_OF_USERS)

        # update the team

        serializer = TeamSerializer(
            context={"request": request}, instance=new_team, data={"users_ids": [user1.id]}, partial=True
        )
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        serializer.save()

    def test_serializer_other_users(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)
        other_account = Account.objects.create(name="other account")
        other_user = self.create_user_with_profile(username="user", account=other_account)

        data = {
            "name": "hello",
            "project": project.id,
            "users_ids": [user1.id, user2.id, other_user.id],
            "manager": user.id,
            "sub_teams_ids": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertFalse(serializer.is_valid(()), serializer.errors)


class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        project2 = account.project_set.create(name="project2")
        team1 = Team.objects.create(project=project1, name="team1", manager=user)
        team2 = Team.objects.create(project=project2, name="team2", manager=user)
        other_account = Account.objects.create(name="other account")
        other_user = cls.create_user_with_profile(username="user", account=other_account)
        other_project = account.project_set.create(name="other_project")

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/microplanning/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

    def test_create(self):
        self.client.force_authenticate(self.user)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "manager": self.user.id,
        }

        response = self.client.post("/api/microplanning/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())

    def test_patch(self):
        self.client.force_authenticate(self.user)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "users_ids": [],
            "manager": self.user.id,
            "sub_teams_ids": [],
        }

        response = self.client.post("/api/microplanning/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team_id = r["id"]

        sub_team1 = Team.objects.create(manager=self.user, project=self.project1, name="subteam")

        update_data = {"sub_teams_ids": [sub_team1.pk]}

        response = self.client.patch(f"/api/microplanning/teams/{team_id}/", data=update_data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        self.assertQuerysetEqual(Team.objects.get(name="hello").sub_teams.all(), [sub_team1])

        team_member = self.create_user_with_profile(account=self.account, username="t")

        update_data = {"sub_teams_ids": [], "users_ids": [team_member.pk]}

        response = self.client.patch(f"/api/microplanning/teams/{team_id}/", data=update_data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team = Team.objects.get(name="hello")
        self.assertQuerysetEqual(team.sub_teams.all(), [])
        self.assertQuerysetEqual(team.users.all(), [team_member])
