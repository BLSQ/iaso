import mock
from django.contrib.auth.models import User
from django.test import TransactionTestCase

from iaso.api.microplanning import TeamSerializer, PlanningSerializer
from iaso.models import Account, DataSource, SourceVersion, OrgUnit, Form
from iaso.models.microplanning import TeamType, Team, Planning
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
        data = {"name": "hello", "project": project.id, "users": [], "manager": user.id, "sub_teams": []}

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
            "users": [user1.id, user2.id],
            "manager": user.id,
            "sub_teams": [],
        }

        serializer = TeamSerializer(context={"request": request}, data=data)
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        new_team = serializer.save()
        self.assertEqual(new_team.type, TeamType.TEAM_OF_USERS)

        # update the team

        serializer = TeamSerializer(
            context={"request": request}, instance=new_team, data={"users": [user1.id]}, partial=True
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
            "users": [user1.id, user2.id, other_user.id],
            "manager": user.id,
            "sub_teams": [],
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
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)
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
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=["iaso_teams"]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "manager": self.user.id,
            "sub_teams": [],
        }

        response = self.client.post("/api/microplanning/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team = Team.objects.get(name="hello")
        self.assertEqual(team.created_by, user_with_perms)

    def test_create_no_perms(self):
        self.client.force_authenticate(self.user)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "manager": self.user.id,
        }

        response = self.client.post("/api/microplanning/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 403)
        self.assertFalse(Team.objects.filter(name="hello").exists())

    def test_patch(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=["iaso_teams"]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "name": "hello",
            "project": self.project1.id,
            "users": [],
            "manager": self.user.id,
            "sub_teams": [],
        }

        response = self.client.post("/api/microplanning/teams/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team_id = r["id"]

        sub_team1 = Team.objects.create(manager=self.user, project=self.project1, name="subteam")

        update_data = {"sub_teams": [sub_team1.pk]}

        response = self.client.patch(f"/api/microplanning/teams/{team_id}/", data=update_data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        self.assertQuerysetEqual(Team.objects.get(name="hello").sub_teams.all(), [sub_team1])

        team_member = self.create_user_with_profile(account=self.account, username="t")

        update_data = {"sub_teams": [], "users": [team_member.pk]}

        response = self.client.patch(f"/api/microplanning/teams/{team_id}/", data=update_data, format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertTrue(Team.objects.filter(name="hello").exists())
        team = Team.objects.get(name="hello")
        self.assertQuerysetEqual(team.sub_teams.all(), [])
        self.assertQuerysetEqual(team.users.all(), [team_member])

    def test_patch_no_perms(self):
        def test_query_happy_path(self):
            self.client.force_authenticate(self.user)
            # can read
            response = self.client.get(f"/api/microplanning/teams/{self.team1.pk}/", format="json")
            r = self.assertJSONResponse(response, 200)
            data = {"name": "test2"}
            # cannot edit
            response = self.client.patch(f"/api/microplanning/teams/{self.team1.pk}/", data=data, format="json")
            r = self.assertJSONResponse(response, 403)

    def test_soft_delete(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=["iaso_teams"]
        )
        self.client.force_authenticate(user_with_perms)
        team = self.team1
        response = self.client.get("/api/microplanning/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

        # DELETE IT
        response = self.client.delete(f"/api/microplanning/teams/{team.id}/", format="json")
        r = self.assertJSONResponse(response, 204)

        team.refresh_from_db()
        self.assertIsNotNone(team.deleted_at)

        # we don't see it anymore
        response = self.client.get("/api/microplanning/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

        # we see deleted and not deleted
        response = self.client.get("/api/microplanning/teams/?deletion_status=all", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

        # see with deletion status
        response = self.client.get("/api/microplanning/teams/?deletion_status=deleted", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["id"], team.id)

        # Undelete
        response = self.client.patch(f"/api/microplanning/teams/{team.id}/", format="json", data={"deleted_at": None})
        r = self.assertJSONResponse(response, 200)
        team.refresh_from_db()
        team = Team.objects.get(id=team.id)
        self.assertIsNone(team.deleted_at)

        # we see it again from the API
        response = self.client.get("/api/microplanning/teams/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)


class PlanningTestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        project2 = account.project_set.create(name="project2")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)
        team2 = Team.objects.create(project=project2, name="team2", manager=user)
        other_account = Account.objects.create(name="other account")
        other_user = cls.create_user_with_profile(username="user", account=other_account)
        cls.other_project = other_account.project_set.create(name="other_project")
        cls.other_team = Team.objects.create(name="other team", project=cls.other_project, manager=other_user)
        source = DataSource.objects.create(name="Evil Empire")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit = org_unit = OrgUnit.objects.create(version=version)
        cls.form1 = Form.objects.create(name="form1")
        cls.form2 = Form.objects.create(name="form2")
        cls.form1.projects.add(project1)
        cls.form2.projects.add(project1)
        cls.planning = Planning.objects.create(project=project1, name="planning1", team=cls.team1, org_unit=org_unit)

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/microplanning/planning/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

    def test_query_id(self):
        self.client.force_authenticate(self.user)
        id = self.planning.id
        response = self.client.get(f"/api/microplanning/planning/{id}/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["name"], self.planning.name)
        self.assertEqual(
            r,
            {
                "id": self.planning.id,
                "name": "planning1",
                "team": self.planning.team_id,
                "project": self.planning.project.id,
                "org_unit": self.planning.org_unit_id,
                "forms": [],
                "description": "",
                "published_at": None,
                "started_at": None,
                "ended_at": None,
            },
            r,
        )

    def test_serializer(self):
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        org_unit = self.org_unit
        planning_serializer = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
                "team": self.team1.id,
                "project": self.project1.id,
                "started_at": "2022-02-02 02:02:02",
                "ended_at": "2022-03-03 03:03:03",
            },
        )
        self.assertTrue(planning_serializer.is_valid(), planning_serializer.errors)
        failing_dates = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
                "team": self.team1.id,
                "project": self.project1.id,
                "started_at": "2022-03-03 03:03:03",
                "ended_at": "2022-02-02 02:02:02",
            },
        )
        self.assertFalse(failing_dates.is_valid(), failing_dates.errors)
        failing_teams = PlanningSerializer(
            context={"request": request},
            data={
                "name": "My Planning",
                "org_unit": org_unit.id,
                "forms": [self.form1.id, self.form2.id],
                "team": self.other_team.id,
                "project": self.project1.id,
                "started_at": "2022-02-02 02:02:02",
                "ended_at": "2022-03-03 03:03:03",
            },
        )
        self.assertFalse(failing_teams.is_valid(), failing_teams.errors)
        self.assertIn("team", failing_teams.errors)
