from django.conf import settings

from iaso.test import IasoMigratorTestCase


class Test0390DirectMigration(IasoMigratorTestCase):
    migrate_from = ("iaso", "0389_alter_account_modules")
    migrate_to = ("iaso", "0390_create_mission_model")
    num_queries = 48

    def prepare(self):
        Account = self.old_state.apps.get_model("iaso", "Account")
        account = Account.objects.create(name="account")

        Planning = self.old_state.apps.get_model("iaso", "Planning")
        Project = self.old_state.apps.get_model("iaso", "Project")
        User = self.old_state.apps.get_model(settings.AUTH_USER_MODEL, require_ready=False)
        Team = self.old_state.apps.get_model("iaso", "Team")
        DataSource = self.old_state.apps.get_model("iaso", "DataSource")
        SourceVersion = self.old_state.apps.get_model("iaso", "SourceVersion")
        OrgUnit = self.old_state.apps.get_model("iaso", "OrgUnit")
        Form = self.old_state.apps.get_model("iaso", "Form")

        project = Project.objects.create(name="project", account=account)
        user = User.objects.create(username="user")
        team = Team.objects.create(name="team", project=project, manager=user)

        source = DataSource.objects.create(name="Source")
        source.projects.add(project)
        version = SourceVersion.objects.create(data_source=source, number=1)
        org_unit = OrgUnit.objects.create(version=version)

        form1 = Form.objects.create(name="form1")
        form2 = Form.objects.create(name="form2")
        form1.projects.add(project)
        form2.projects.add(project)

        # create Plannings
        planning_1 = Planning.objects.create(name="planning_1", project=project, team=team, org_unit=org_unit)
        planning_1.forms.set([form1, form2])

        planning_2 = Planning.objects.create(
            name="planning_2",
            project=project,
            team=team,
            org_unit=org_unit,
        )
        planning_2.forms.set([form2])

        Planning.objects.create(
            name="planning_3",
            project=project,
            team=team,
            org_unit=org_unit,
        )

    def test_migration(self):
        Planning = self.new_state.apps.get_model("iaso", "Planning")

        planning_1 = Planning.objects.get(name="planning_1")
        planning_2 = Planning.objects.get(name="planning_2")
        planning_3 = Planning.objects.get(name="planning_3")

        self.assertEqual(planning_1.missions.count(), 2)
        self.assertEqual(planning_2.missions.count(), 1)
        self.assertEqual(planning_3.missions.count(), 0)

        self.assertEqual(planning_1.missions.all()[0].forms.all()[0].name, "form1")
        self.assertEqual(planning_1.missions.all()[1].forms.all()[0].name, "form2")
        self.assertEqual(planning_2.missions.all()[0].forms.all()[0].name, "form2")


class Test0390ReverseMigration(IasoMigratorTestCase):
    num_queries = 37

    migrate_from = ("iaso", "0390_create_mission_model")
    migrate_to = ("iaso", "0389_alter_account_modules")

    def prepare(self):
        Account = self.old_state.apps.get_model("iaso", "Account")
        account = Account.objects.create(name="account")

        Planning = self.old_state.apps.get_model("iaso", "Planning")
        Project = self.old_state.apps.get_model("iaso", "Project")
        User = self.old_state.apps.get_model(settings.AUTH_USER_MODEL, require_ready=False)
        Team = self.old_state.apps.get_model("iaso", "Team")
        DataSource = self.old_state.apps.get_model("iaso", "DataSource")
        SourceVersion = self.old_state.apps.get_model("iaso", "SourceVersion")
        OrgUnit = self.old_state.apps.get_model("iaso", "OrgUnit")
        Form = self.old_state.apps.get_model("iaso", "Form")
        Mission = self.old_state.apps.get_model("iaso", "Mission")
        MissionForm = self.old_state.apps.get_model("iaso", "MissionForm")

        project = Project.objects.create(name="project", account=account)
        user = User.objects.create(username="user")
        team = Team.objects.create(name="team", project=project, manager=user)

        source = DataSource.objects.create(name="Source")
        source.projects.add(project)
        version = SourceVersion.objects.create(data_source=source, number=1)
        org_unit = OrgUnit.objects.create(version=version)

        form1 = Form.objects.create(name="form1")
        form2 = Form.objects.create(name="form2")
        form1.projects.add(project)
        form2.projects.add(project)

        # create Plannings
        planning_1 = Planning.objects.create(name="planning_1", project=project, team=team, org_unit=org_unit)
        mission_1 = Mission.objects.create(
            name="mission_1",
            account=account,
            mission_type="FORM_FILLING",
            created_by=user,
        )
        MissionForm.objects.create(
            mission=mission_1,
            form=form1,
            min_cardinality=1,
            max_cardinality=1,
        )
        MissionForm.objects.create(
            mission=mission_1,
            form=form2,
            min_cardinality=1,
            max_cardinality=1,
        )
        mission_2 = Mission.objects.create(
            name="mission_2",
            account=account,
            mission_type="FORM_FILLING",
            created_by=user,
        )
        MissionForm.objects.create(
            mission=mission_2,
            form=form2,
            min_cardinality=1,
            max_cardinality=1,
        )
        planning_1.missions.set([mission_1, mission_2])

        planning_2 = Planning.objects.create(
            name="planning_2",
            project=project,
            team=team,
            org_unit=org_unit,
        )
        mission_3 = Mission.objects.create(
            name="mission_3",
            account=account,
            mission_type="ORG_UNIT_AND_FORM",
            created_by=user,
        )
        MissionForm.objects.create(
            mission=mission_3,
            form=form2,
            min_cardinality=1,
            max_cardinality=1,
        )
        planning_2.missions.set([mission_2, mission_3])

        Planning.objects.create(
            name="planning_3",
            project=project,
            team=team,
            org_unit=org_unit,
        )

    def test_migration(self):
        Planning = self.new_state.apps.get_model("iaso", "Planning")

        planning_1 = Planning.objects.get(name="planning_1")
        planning_2 = Planning.objects.get(name="planning_2")
        planning_3 = Planning.objects.get(name="planning_3")

        self.assertEqual(planning_1.forms.count(), 2)
        self.assertEqual(planning_2.forms.count(), 1)
        self.assertEqual(planning_3.forms.count(), 0)

        self.assertEqual(planning_1.forms.all()[0].name, "form1")
        self.assertEqual(planning_1.forms.all()[1].name, "form2")
        self.assertEqual(planning_2.forms.all()[0].name, "form2")
