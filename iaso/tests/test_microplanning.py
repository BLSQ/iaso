import mock
from django.contrib.auth.models import User
from django.test import TransactionTestCase
from django.utils.timezone import now

from iaso.api.microplanning import TeamSerializer, PlanningSerializer, AssignmentSerializer
from iaso.models import Account, DataSource, SourceVersion, OrgUnit, Form, OrgUnitType
from iaso.models.microplanning import TeamType, Team, Planning, Assignment
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
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        team = serializer.save()
        team1.refresh_from_db()
        team2.refresh_from_db()
        self.assertQuerysetEqual(team1.sub_teams.all(), [team2])
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
        self.assertFalse(serializer.is_valid(()), serializer.validated_data)
        self.assertIn("sub_teams", serializer.errors)

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
        self.assertFalse(serializer.is_valid(()), serializer.validated_data)
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
        self.assertTrue(serializer.is_valid(()), serializer.errors)
        new_team = serializer.save()
        self.assertEqual(new_team.type, TeamType.TEAM_OF_USERS)

        # update the team

        serializer = TeamSerializer(
            context={"request": request}, instance=new_team, data={"users": [user1.id]}, partial=True
        )
        self.assertTrue(serializer.is_valid(()), serializer.errors)
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
        self.assertFalse(serializer.is_valid(()), serializer.validated_data)
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
        self.assertFalse(serializer.is_valid(()), serializer.validated_data)
        self.assertIn("manager", serializer.errors)

    def test_serializer_invalid_project(self):
        account = Account.objects.get(name="test")
        user = User.objects.get(username="test")
        request = mock.Mock(user=user)
        project = account.project_set.create(name="project1")

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
        self.assertFalse(serializer.is_valid(()), serializer.validated_data)
        self.assertIn("project", serializer.errors)


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
                "team_details": {"id": self.team1.id, "name": self.team1.name},
                "project": self.project1.id,
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
                "team_details": {"id": self.team1.id, "name": self.team1.name},
                "project": self.project1.id,
                "started_at": "2022-02-02",
                "ended_at": "2022-03-03",
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
                "started_at": "2022-03-03",
                "ended_at": "2022-02-02",
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
                "started_at": "2022-02-02",
                "ended_at": "2022-03-03",
            },
        )
        self.assertFalse(failing_teams.is_valid(), failing_teams.errors)
        self.assertIn("team", failing_teams.errors)


class AssignmentAPITestCase(APITestCase):
    fixtures = ["user.yaml"]

    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.get(name="test")
        cls.user = user = User.objects.get(username="test")
        cls.project1 = project1 = account.project_set.create(name="project1")
        project2 = account.project_set.create(name="project2")
        cls.team1 = Team.objects.create(project=project1, name="team1", manager=user)

        source = DataSource.objects.create(name="Source de test")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        org_unit_type = OrgUnitType.objects.create(name="test type")
        cls.root_org_unit = root_org_unit = OrgUnit.objects.create(version=version, org_unit_type=org_unit_type)
        cls.child1 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child1", org_unit_type=org_unit_type
        )
        cls.child2 = OrgUnit.objects.create(
            version=version, parent=root_org_unit, name="child2", org_unit_type=org_unit_type
        )
        OrgUnit.objects.create(version=version, parent=root_org_unit, name="child2")

        cls.planning = Planning.objects.create(
            project=project1, name="planning1", team=cls.team1, org_unit=root_org_unit
        )
        assignment = Assignment.objects.create(
            planning=cls.planning,
            user=cls.user,
            org_unit=cls.child1,
        )

    def test_serializer(self):
        request = mock.Mock(user=self.user)
        serializer = AssignmentSerializer(
            context={"request": request},
            data=dict(
                planning=self.planning.id,
                user=self.user.id,
                org_unit=self.child2.id,
            ),
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        # cannot create a second Assignment for the same org unit in the same planning
        serializer = AssignmentSerializer(
            context={"request": request},
            data=dict(
                planning=self.planning.id,
                user=self.user.id,
                org_unit=self.child2.id,
            ),
        )
        self.assertFalse(serializer.is_valid(), serializer.validated_data)
        # errors should be : {'non_field_errors': [ErrorDetail(string='The fields planning, org_unit must make a unique set.', code='unique')]}
        self.assertIn("non_field_errors", serializer.errors)

    def test_query_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/microplanning/assignments/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

    def test_query_fail_no_auth(self):
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        r = self.assertJSONResponse(response, 403)

    def test_query_filtering(self):
        p = Planning.objects.create(
            project=self.project1, name="planning1", team=self.team1, org_unit=self.root_org_unit
        )
        p.assignment_set.create(org_unit=self.child1, user=self.user)
        p.assignment_set.create(org_unit=self.child2, user=self.user)
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/microplanning/assignments/?planning={self.planning.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 1)

        response = self.client.get(f"/api/microplanning/assignments/?planning={p.id}", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)

    def test_create(self):
        user_with_perms = self.create_user_with_profile(
            username="user_with_perms", account=self.account, permissions=["iaso_planning"]
        )
        self.client.force_authenticate(user_with_perms)
        data = {
            "planning": self.planning.id,
            "user": self.user.id,
            "org_unit": self.child2.id,
        }

        response = self.client.post("/api/microplanning/assignments/", data=data, format="json")
        r = self.assertJSONResponse(response, 201)
        self.assertTrue(Assignment.objects.filter(id=r["id"]).exists())
        a = Assignment.objects.get(id=r["id"])
        self.assertEqual(a.created_by, user_with_perms)
        self.assertEqual(a.planning, self.planning)
        self.assertEqual(a.user, self.user)
        self.assertEqual(a.org_unit, self.child2)

    def test_no_perm_create(self):
        self.client.force_authenticate(self.user)
        data = {
            "planning": self.planning.id,
            "user": self.user.id,
            "org_unit": self.child2.id,
        }

        response = self.client.post("/api/microplanning/assignments/", data=data, format="json")
        r = self.assertJSONResponse(response, 403)

    def test_query_mobile(self):
        p = Planning.objects.create(
            project=self.project1, name="planning2", team=self.team1, org_unit=self.root_org_unit
        )
        p.assignment_set.create(org_unit=self.child1, user=self.user)
        p.assignment_set.create(org_unit=self.child2, user=self.user)

        p = Planning.objects.create(
            project=self.project1, name="planning3", team=self.team1, org_unit=self.root_org_unit
        )

        plannings = Planning.objects.filter(assignment__user=self.user).distinct()
        Planning.objects.update(published_at=now())
        self.assertEqual(plannings.count(), 2)

        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/plannings/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 2)
        # planning 1
        p1 = r[0]
        self.assertEqual(r[0]["name"], "planning1")
        self.assertEqual(r[0]["assignments"], [{"org_unit": self.child1.id, "form_ids": []}])

        p2 = r[1]
        self.assertEqual(p2["name"], "planning2")
        self.assertEqual(
            p2["assignments"],
            [{"org_unit": self.child1.id, "form_ids": []}, {"org_unit": self.child2.id, "form_ids": []}],
        )

        # Response look like
        # [
        #     {
        #         "id": 161,
        #         "name": "planning1",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.029707Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}],
        #     },
        #     {
        #         "id": 162,
        #         "name": "planning2",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.034614Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}, {"org_unit": 3558, "form_ids": []}],
        #     },
        # ]

        # user without any assignement, should get no planning
        user = self.create_user_with_profile(username="user2", account=self.account)
        self.client.force_authenticate(user)

        response = self.client.get(f"/api/mobile/plannings/", format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 0)

    def test_query_mobile_get(self):
        self.client.force_authenticate(self.user)
        Planning.objects.update(published_at=now())
        response = self.client.get(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 200)

    def test_query_mobile_no_modification(self):
        self.user.is_superuser = True
        self.user.save()
        Planning.objects.update(published_at=now())

        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(f"/api/mobile/plannings/{self.planning.id}/", format="json")
        self.assertEqual(response.status_code, 403)

        response = self.client.post(f"/api/mobile/plannings/", data={}, format="json")
        self.assertEqual(response.status_code, 403)
