from unittest import mock

from django.contrib.auth.models import User
from django_ltree.fields import PathValue  # type: ignore

from hat.audit.models import Modification
from iaso.api.teams.serializers import TeamSerializer
from iaso.models import Account
from iaso.models.team import Team, TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase, IasoTestCaseMixin


class TeamTestCase(APITestCase, IasoTestCaseMixin):
    fixtures = ["user.yaml"]

    def test_simple_team_model(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        project1 = account.project_set.create(name="project1")
        project2 = account.project_set.create(name="project2")
        team1 = Team.objects.create(project=project1, name="team1", manager=user)
        team2 = Team.objects.create(project=project2, name="team2", manager=user)
        teams = Team.objects.filter(project__account=user.iaso_profile.account)
        self.assertQuerySetEqual(teams.order_by("name"), [team1, team2])

        teams = Team.objects.filter_for_user(user)
        self.assertQuerySetEqual(teams, [team1, team2])

    def test_serializer_team(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")
        data = {"name": "hello", "project": project.id, "users": [], "manager": user.id, "sub_teams": []}

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

    def test_serializer_subteam(self):
        "Edit teams to add subteams"
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
        user = User.objects.get(username="test")
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
            "users": [user1.id, user2.id],
            "manager": other_user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        self.assertIn("manager", serializer.errors)

    def test_serializer_invalid_project(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
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


class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.project2 = project2 = account.project_set.create(name="project2")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)
        cls.team2 = Team.objects.create(project=project2, name="team2", manager=user)
        other_account = Account.objects.create(name="other account")
        cls.create_user_with_profile(username="user", account=other_account)
        account.project_set.create(name="other_project")

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(5):
            response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

    def test_query_ancestor(self):
        self.client.force_authenticate(self.user)

        team_a = Team.objects.create(project=self.project1, name="team a", manager=self.user)
        team_b = Team.objects.create(project=self.project1, name="team b", manager=self.user)
        team_b_c = Team.objects.create(project=self.project1, name="team b_c", manager=self.user, parent=team_b)
        team_b_d = Team.objects.create(project=self.project1, name="team b_d", manager=self.user, parent=team_b)
        team_b_c_e = Team.objects.create(project=self.project1, name="team b_c_e", manager=self.user, parent=team_b_c)
        team_b_c_f = Team.objects.create(
            project=self.project1, name="team b_c_f hello", manager=self.user, parent=team_b_c
        )

        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 8)

        response = self.client.get(f"/api/teams/?ancestor={team_a.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        response = self.client.get(f"/api/teams/?ancestor={team_b.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 5)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b.id, team_b_c.id, team_b_d.id, team_b_c_e.id, team_b_c_f.id])
        response = self.client.get(f"/api/teams/?ancestor={team_b.id}&search=hello", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b_c_f.id])
        response = self.client.get(f"/api/teams/?ancestor={team_b_c.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 3)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b_c.id, team_b_c_e.id, team_b_c_f.id])

    def test_create(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "manager": self.user.id,
            "sub_teams": [],
            "users": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team = Team.objects.get(name="hello")
        self.assertEqual(team.created_by, user_with_perms)
        self.assertEqual(Modification.objects.all().count(), 1)
        mod = Modification.objects.first()
        self.assertEqual(mod.past_value, [])
        self.assertEqual(mod.user, user_with_perms)
        self.assertEqual(mod.new_value[0]["name"], "hello")
        self.assertEqual(mod.source, "API POST/api/teams/")

    def test_create_no_perms(self):
        self.client.force_authenticate(self.user)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "manager": self.user.id,
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        self.assertJSONResponse(response, 403)
        self.assertFalse(Team.objects.filter(name="hello").exists())

    def test_patch(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "users": [],
            "manager": self.user.id,
            "sub_teams": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team_id = r["id"]
        self.assertEqual(Team.objects.get(id=team_id).path, PathValue((team_id,)))

        sub_team1 = Team.objects.create(manager=self.user, project=self.project1, name="subteam")

        update_data = {"sub_teams": [sub_team1.pk]}

        response = self.client.patch(f"/api/teams/{team_id}/", data=update_data, format="json")
        self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        self.assertQuerySetEqual(Team.objects.get(name="hello").sub_teams.all(), [sub_team1])
        sub_team1.refresh_from_db()
        self.assertEqual(sub_team1.path, PathValue((team_id, sub_team1.id)))

        team_member = self.create_user_with_profile(account=self.account, username="t")

        update_data = {"sub_teams": [], "users": [team_member.pk]}

        response = self.client.patch(f"/api/teams/{team_id}/", data=update_data, format="json")

        self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team = Team.objects.get(name="hello")
        self.assertQuerySetEqual(team.sub_teams.all(), [])
        self.assertQuerySetEqual(team.users.all(), [team_member])
        self.assertEqual(Modification.objects.count(), 3)
        mod = Modification.objects.last()
        self.assertEqual(mod.user, user_with_perms)

        sub_team1.refresh_from_db()
        self.assertEqual(sub_team1.parent, None)
        self.assertEqual(sub_team1.path, PathValue((sub_team1.id,)))

    def test_patch_no_perms(self):
        self.client.force_authenticate(self.user)
        # can read
        response = self.client.get(f"/api/teams/{self.team1.pk}/", format="json")
        self.assertJSONResponse(response, 200)
        data = {"name": "test2"}
        # cannot edit
        response = self.client.patch(f"/api/teams/{self.team1.pk}/", data=data, format="json")
        self.assertJSONResponse(response, 403)

    def test_soft_delete(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        team = self.team1
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

        # DELETE IT
        response = self.client.delete(f"/api/teams/{team.id}/", format="json")
        self.assertJSONResponse(response, 204)

        team.refresh_from_db()
        self.assertIsNotNone(team.deleted_at)

        m = Modification.objects.filter(object_id=team.id, content_type__model="team").first()
        self.assertEqual(m.past_value[0]["deleted_at"], None)
        self.assertNotEqual(m.new_value[0]["deleted_at"], None)

        # we don't see it anymore
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

        # we see deleted and not deleted
        response = self.client.get("/api/teams/?deletion_status=all", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

        # see with deletion status
        response = self.client.get("/api/teams/?deletion_status=deleted", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["id"], team.id)

        # Undelete
        response = self.client.patch(f"/api/teams/{team.id}/", format="json", data={"deleted_at": None})
        self.assertJSONResponse(response, 200)
        team.refresh_from_db()
        team = Team.objects.get(id=team.id)
        self.assertIsNone(team.deleted_at)

        # we see it again from the API
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        # one for delete, one for undelete
        self.assertEqual(Modification.objects.count(), 2)

    def test_list_filter_by_manager(self):
        # Set up new team and new user who'll be the new manager
        ash_ketchum = self.create_user_with_profile(
            username="ash_ketchum", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_fire_pokemons = Team.objects.create(project=self.project1, name="team_fire_pokemons", manager=ash_ketchum)
        team_electric_pokemons = Team.objects.create(
            project=self.project1, name="team_electric_pokemons", manager=ash_ketchum
        )

        misty = self.create_user_with_profile(
            username="misty", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_water_pokemons = Team.objects.create(project=self.project1, name="team_water_pokemons", manager=misty)

        self.client.force_authenticate(ash_ketchum)

        # Fetch the list of teams with a filter on a single manager
        response = self.client.get(f"/api/teams/?order=id&managers={ash_ketchum.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        self.assertEqual(r[0]["name"], team_fire_pokemons.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)

        # Fetch the list of teams with a filter on multiple managers
        response = self.client.get(f"/api/teams/?managers={ash_ketchum.id},{misty.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 3)

    def test_list_filter_by_type(self):
        # Set up teams of various types
        ash_ketchum = self.create_user_with_profile(
            username="ash_ketchum", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_fire_pokemons = Team.objects.create(
            project=self.project1, name="team_fire_pokemons", manager=ash_ketchum, type=TeamType.TEAM_OF_USERS
        )
        team_electric_pokemons = Team.objects.create(
            project=self.project1, name="team_electric_pokemons", manager=ash_ketchum, type=TeamType.TEAM_OF_USERS
        )
        team_water_pokemons = Team.objects.create(
            project=self.project1, name="team_water_pokemons", manager=ash_ketchum, type=TeamType.TEAM_OF_USERS
        )
        team_pokemons = Team.objects.create(
            project=self.project1, name="team_pokemons", manager=ash_ketchum, type=TeamType.TEAM_OF_TEAMS
        )
        self.client.force_authenticate(ash_ketchum)

        # Fetch the list of teams without any type filter
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 6)  # 2 from happy path (set up) + 4 new ones

        # Fetch the list of teams with a single type
        response = self.client.get(f"/api/teams/?order=id&types={TeamType.TEAM_OF_USERS}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 3)
        self.assertEqual(r[0]["name"], team_fire_pokemons.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)
        self.assertEqual(r[2]["name"], team_water_pokemons.name)

        response = self.client.get(f"/api/teams/?order=id&types={TeamType.TEAM_OF_TEAMS}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["name"], team_pokemons.name)

        # Fetch the list of teams with a filter on multiple types
        response = self.client.get(
            f"/api/teams/?types={TeamType.TEAM_OF_TEAMS},{TeamType.TEAM_OF_USERS}", format="json"
        )
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 4)

    def test_list_filter_by_project(self):
        ash_ketchum = self.create_user_with_profile(
            username="ash_ketchum", account=self.account, permissions=[CORE_TEAMS_PERMISSION], projects=[self.project1]
        )
        team_electric_pokemons = Team.objects.create(
            project=self.project1, name="team_electric_pokemons", manager=ash_ketchum, type=TeamType.TEAM_OF_USERS
        )

        self.client.force_authenticate(self.user)
        # Fetch the list of teams without any project filter
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 3)  # 2 from happy path (set up) + 1 new one

        # Fetch the list of teams with a single project
        response = self.client.get(f"/api/teams/?order=id&projects={self.project1.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        self.assertEqual(r[0]["name"], self.team1.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)

        response = self.client.get(f"/api/teams/?order=id&projects={self.project2.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["name"], self.team2.name)

        # Fetch the list of teams with a filter on multiple projects
        response = self.client.get(
            f"/api/teams/?projects={self.project2.id},{self.project1.id}", format="json"
        )
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 3)

