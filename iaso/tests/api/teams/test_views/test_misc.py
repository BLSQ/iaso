from django.contrib.auth.models import User
from django_ltree.fields import PathValue
from rest_framework import status

from hat.audit.models import Modification
from iaso.models import Account
from iaso.models.team import Team, TeamType
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION
from iaso.test import APITestCase


class TeamAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 8)

        response = self.client.get(f"/api/teams/?ancestor={team_a.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)
        response = self.client.get(f"/api/teams/?ancestor={team_b.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 5)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b.id, team_b_c.id, team_b_d.id, team_b_c_e.id, team_b_c_f.id])
        response = self.client.get(f"/api/teams/?ancestor={team_b.id}&search=hello", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b_c_f.id])
        response = self.client.get(f"/api/teams/?ancestor={team_b_c.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 3)
        ids = sorted([row["id"] for row in r])
        self.assertEqual(ids, [team_b_c.id, team_b_c_e.id, team_b_c_f.id])

    def test_members_count_in_view(self):
        self.client.force_authenticate(self.user)

        user1 = self.create_user_with_profile(username="member1", account=self.account)
        user2 = self.create_user_with_profile(username="member2", account=self.account)

        team_of_users = Team.objects.create(
            project=self.project1, name="Team of Users API", manager=self.user, type=TeamType.TEAM_OF_USERS
        )
        team_of_users.users.set([user1, user2])

        sub_team = Team.objects.create(project=self.project1, name="Sub Team API", manager=self.user)

        team_of_teams = Team.objects.create(
            project=self.project1, name="Team of Teams API", manager=self.user, type=TeamType.TEAM_OF_TEAMS
        )
        team_of_teams.sub_teams.set([sub_team])

        response = self.client.get("/api/teams/?fields=id,members_count", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)

        team_of_users_data = next(t for t in r if t["id"] == team_of_users.id)
        team_of_teams_data = next(t for t in r if t["id"] == team_of_teams.id)
        team1_data = next(t for t in r if t["id"] == self.team1.id)

        self.assertIn("members_count", team_of_users_data)
        self.assertEqual(team_of_users_data["members_count"], 2)

        self.assertIn("members_count", team_of_teams_data)
        self.assertEqual(team_of_teams_data["members_count"], 1)

        self.assertEqual(team1_data["members_count"], 0)

        response_default = self.client.get("/api/teams/", format="json")
        r_default = self.assertJSONResponse(response_default, status.HTTP_200_OK)

        default_team_data = next(t for t in r_default if t["id"] == team_of_users.id)

        self.assertNotIn("members_count", default_team_data)

        self.assertIn("name", default_team_data)
        self.assertEqual(default_team_data["name"], "Team of Users API")

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
        self.assertJSONResponse(response, status.HTTP_201_CREATED)
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
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
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
        r = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team_id = r["id"]
        self.assertEqual(Team.objects.get(id=team_id).path, PathValue((team_id,)))

        sub_team1 = Team.objects.create(manager=self.user, project=self.project1, name="subteam")

        update_data = {"sub_teams": [sub_team1.pk]}

        response = self.client.patch(f"/api/teams/{team_id}/", data=update_data, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        self.assertQuerySetEqual(Team.objects.get(name="hello").sub_teams.all(), [sub_team1])
        sub_team1.refresh_from_db()
        self.assertEqual(sub_team1.path, PathValue((team_id, sub_team1.id)))

        team_member = self.create_user_with_profile(account=self.account, username="t")

        update_data = {"sub_teams": [], "users": [team_member.pk]}

        response = self.client.patch(f"/api/teams/{team_id}/", data=update_data, format="json")

        self.assertJSONResponse(response, status.HTTP_200_OK)
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
        self.assertJSONResponse(response, status.HTTP_200_OK)
        data = {"name": "test2"}
        # cannot edit
        response = self.client.patch(f"/api/teams/{self.team1.pk}/", data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_soft_delete(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)
        team = self.team1
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 2)

        # DELETE IT
        response = self.client.delete(f"/api/teams/{team.id}/", format="json")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        team.refresh_from_db()
        self.assertIsNotNone(team.deleted_at)

        m = Modification.objects.filter(object_id=team.id, content_type__model="team").first()
        self.assertEqual(m.past_value[0]["deleted_at"], None)
        self.assertNotEqual(m.new_value[0]["deleted_at"], None)

        # we don't see it anymore
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)

        # we see deleted and not deleted
        response = self.client.get("/api/teams/?deletion_status=all", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 2)

        # see with deletion status
        response = self.client.get("/api/teams/?deletion_status=deleted", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["id"], team.id)

        # Undelete
        response = self.client.patch(f"/api/teams/{team.id}/", format="json", data={"deleted_at": None})
        self.assertJSONResponse(response, status.HTTP_200_OK)
        team.refresh_from_db()
        team = Team.objects.get(id=team.id)
        self.assertIsNone(team.deleted_at)

        # we see it again from the API
        response = self.client.get("/api/teams/", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 2)
        self.assertEqual(r[0]["name"], team_fire_pokemons.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)

        # Fetch the list of teams with a filter on multiple managers
        response = self.client.get(f"/api/teams/?managers={ash_ketchum.id},{misty.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 6)  # 2 from happy path (set up) + 4 new ones

        # Fetch the list of teams with a single type
        response = self.client.get(f"/api/teams/?order=id&types={TeamType.TEAM_OF_USERS}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 3)
        self.assertEqual(r[0]["name"], team_fire_pokemons.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)
        self.assertEqual(r[2]["name"], team_water_pokemons.name)

        response = self.client.get(f"/api/teams/?order=id&types={TeamType.TEAM_OF_TEAMS}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["name"], team_pokemons.name)

        # Fetch the list of teams with a filter on multiple types
        response = self.client.get(
            f"/api/teams/?types={TeamType.TEAM_OF_TEAMS},{TeamType.TEAM_OF_USERS}", format="json"
        )
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
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
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 3)  # 2 from happy path (set up) + 1 new one

        # Fetch the list of teams with a single project
        response = self.client.get(f"/api/teams/?order=id&projects={self.project1.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 2)
        self.assertEqual(r[0]["name"], self.team1.name)
        self.assertEqual(r[1]["name"], team_electric_pokemons.name)

        response = self.client.get(f"/api/teams/?order=id&projects={self.project2.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["name"], self.team2.name)

        # Fetch the list of teams with a filter on multiple projects
        response = self.client.get(f"/api/teams/?projects={self.project2.id},{self.project1.id}", format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r), 3)

    def test_create_team_with_valid_color(self):
        """Test creating a team with a valid hex color"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "colored_team",
            "project": self.project1.id,
            "manager": self.user.id,
            "color": "#ff5733",
            "sub_teams": [],
            "users": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual(r["color"], "#FF5733")  # Normalized to uppercase

    def test_create_team_with_invalid_color_no_hash(self):
        """Test that creating a team without # in color fails"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "bad_color_team",
            "project": self.project1.id,
            "manager": self.user.id,
            "color": "ff5733",  # Missing #
            "sub_teams": [],
            "users": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("color", response.json())

    def test_create_team_with_invalid_color_wrong_length(self):
        """Test that creating a team with wrong color length fails"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "bad_color_team",
            "project": self.project1.id,
            "manager": self.user.id,
            "color": "#fff",  # Too short
            "sub_teams": [],
            "users": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("color", response.json())

    def test_create_team_with_invalid_color_characters(self):
        """Test that creating a team with invalid hex characters fails"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        data = {
            "name": "bad_color_team",
            "project": self.project1.id,
            "manager": self.user.id,
            "color": "#gghhii",  # Invalid hex characters
            "sub_teams": [],
            "users": [],
        }

        response = self.client.post("/api/teams/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("color", response.json())

    def test_patch_team_color(self):
        """Test updating a team's color"""
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=[CORE_TEAMS_PERMISSION]
        )
        self.client.force_authenticate(user_with_perms)

        update_data = {"color": "#00ff00"}
        response = self.client.patch(f"/api/teams/{self.team1.id}/", data=update_data, format="json")
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["color"], "#00FF00")  # Normalized to uppercase
