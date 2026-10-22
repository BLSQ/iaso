from unittest import mock

from django.contrib.auth import get_user_model

from iaso.api.teams.serializers.misc import TeamSerializer
from iaso.models import Account, Team
from iaso.models.team import TeamType
from iaso.test import APITestCase


class TeamSerializerTestCase(APITestCase):
    fixtures = ["user.yaml"]

    def test_serializer_team(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        data = {"name": "hello", "project": project.id, "users": [], "manager": user.id, "sub_teams": []}

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

    def test_serializer_subteam(self):
        "Edit teams to add subteams"
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        team1 = Team.objects.create(project=project, name="team1", manager=user)
        team2 = Team.objects.create(project=project, name="team2", manager=user)

        data = {
            "name": "team with subteams",
            "project": project.id,
            "users": [],
            "manager": user.id,
            "sub_teams": [team2.pk],
        }

        serializer = TeamSerializer(context={"request": request}, data=data, instance=team1)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        team1.refresh_from_db()
        team2.refresh_from_db()
        self.assertQuerySetEqual(team1.sub_teams.all(), [team2])
        self.assertEqual(team2.parent, team1)

    def test_serializer_invalid_because_subteam_loop(self):
        "Edit team 1 to add team2 as subteam. should fail since team1 is already a child of team2"
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        team1 = Team.objects.create(project=project, name="team1", manager=user)
        team2 = Team.objects.create(project=project, name="team2", manager=user)
        team2.sub_teams.add(team1)

        data = {
            "name": "team with subteams",
            "project": project.id,
            "users": [],
            "manager": user.id,
            "sub_teams": [team2.pk],
        }

        serializer = TeamSerializer(context={"request": request}, data=data, instance=team1)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("sub_teams", serializer.errors)

    def test_serializer_valid_parent_no_loop(self):
        "Try a loop via the parents"
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        grand_parent = Team.objects.create(project=project, name="grand_parent", manager=user)
        parent = Team.objects.create(project=project, name="parent", manager=user)
        team = Team.objects.create(project=project, name="team", manager=user)
        grand_parent.sub_teams.add(parent)

        data = {"parent": parent.id}

        serializer = TeamSerializer(context={"request": request}, data=data, instance=team, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

    def test_serializer_invalid_because_parent_loop(self):
        "Try a loop via the parents"
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        grand_parent = Team.objects.create(project=project, name="grand_parent", manager=user)
        parent = Team.objects.create(project=project, name="parent", manager=user)
        team = Team.objects.create(project=project, name="team", manager=user)
        grand_parent.sub_teams.add(parent)
        parent.sub_teams.add(team)

        data = {"name": "team with subteams", "project": project.id, "users": [], "manager": user.id, "parent": team.id}

        serializer = TeamSerializer(context={"request": request}, data=data, instance=grand_parent, partial=True)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("parent", serializer.errors)

    def test_serializer_invalid_because_parent_wrong_type(self):
        "Invalid because parent is of type TEAM_OF_USERS"
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        parent = Team.objects.create(project=project, name="parent", manager=user, type=TeamType.TEAM_OF_USERS)
        parent.users.set([user])
        team = Team.objects.create(project=project, name="team", manager=user)

        data = {"parent": parent.id}

        serializer = TeamSerializer(context={"request": request}, data=data, instance=team, partial=True)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("parent", serializer.errors)

    def test_serializer_invalid_because_subteam_loop2(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        root = Team.objects.create(project=project, name="root", manager=user)
        sub_team = Team.objects.create(project=project, name="child", manager=user)
        sub_team2 = Team.objects.create(project=project, name="child2", manager=user)
        sub_sub_team = Team.objects.create(project=project, name="grand child", manager=user)

        root.sub_teams.add(sub_team)
        root.sub_teams.add(sub_team2)
        sub_team2.sub_teams.add(sub_sub_team)

        data = {"sub_teams": [root.pk]}

        serializer = TeamSerializer(context={"request": request}, data=data, instance=sub_sub_team, partial=True)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("sub_teams", serializer.errors)

    def test_serializer_team_users(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)

        data = {
            "name": "hello",
            "project": project.id,
            "users": [user1.id, user2.id],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        new_team = serializer.save()
        self.assertEqual(new_team.type, TeamType.TEAM_OF_USERS)

        # update the team

        serializer = TeamSerializer(
            context={"request": request}, instance=new_team, data={"users": [user1.id]}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

    def test_serializer_invalid_user(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)
        other_account = Account.objects.create(name="other account")
        other_user = self.create_user_with_profile(username="bad user", account=other_account)

        data = {
            "name": "hello",
            "project": project.id,
            "users": [user1.id, user2.id, other_user.id],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("users", serializer.errors)

    def test_serializer_invalid_manager(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)
        other_account = Account.objects.create(name="other account")
        other_user = self.create_user_with_profile(username="user", account=other_account)

        data = {
            "name": "hello",
            "project": project.id,
            "users": [user1.id, user2.id],
            "manager": other_user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("manager", serializer.errors)

    def test_serializer_invalid_project(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        account.project_set.create(name="project1")

        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)
        other_account = Account.objects.create(name="other account")
        other_project = other_account.project_set.create(name="bad project")

        data = {
            "name": "hello",
            "project": other_project.id,
            "users": [user1.id, user2.id],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("project", serializer.errors)

    def test_serializer_members_count(self):
        account = Account.objects.get(name="test")
        user = get_user_model().objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")

        user1 = self.create_user_with_profile(username="user1", account=account)
        user2 = self.create_user_with_profile(username="user2", account=account)

        data_users = {
            "name": "team of users",
            "project": project.id,
            "users": [user1.id, user2.id],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer_users = TeamSerializer(context={"request": request}, data=data_users)
        self.assertTrue(serializer_users.is_valid(), serializer_users.errors)
        team_of_users = serializer_users.save()

        self.assertEqual(serializer_users.get_members_count(team_of_users), 2)

        sub_team1 = Team.objects.create(project=project, name="sub1", manager=user)
        sub_team2 = Team.objects.create(project=project, name="sub2", manager=user)
        sub_team3 = Team.objects.create(project=project, name="sub3", manager=user)

        data_teams = {
            "name": "team of teams",
            "project": project.id,
            "users": [],
            "manager": user.id,
            "sub_teams": [sub_team1.id, sub_team2.id, sub_team3.id],
        }

        serializer_teams = TeamSerializer(context={"request": request}, data=data_teams)
        self.assertTrue(serializer_teams.is_valid(), serializer_teams.errors)
        team_of_teams = serializer_teams.save()

        self.assertEqual(serializer_teams.get_members_count(team_of_teams), 3)

        data_empty = {
            "name": "empty team",
            "project": project.id,
            "users": [],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer_empty = TeamSerializer(context={"request": request}, data=data_empty)
        self.assertTrue(serializer_empty.is_valid(), serializer_empty.errors)
        empty_team = serializer_empty.save()

        self.assertEqual(serializer_empty.get_members_count(empty_team), 0)
