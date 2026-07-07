from django.conf import settings
from django.utils.timezone import now

from iaso.test import IasoMigratorTestCase


class Test0390DirectMigration(IasoMigratorTestCase):
    migrate_from = ("iaso", "0394_remove_show_pages_feature_flag")
    migrate_to = ("iaso", "0395_mission_alter_corepermissionsupport_options_and_more")
    num_queries = 72

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

        form1 = self.form1 = Form.objects.create(name="form1")
        form2 = self.form2 = Form.objects.create(name="form2")
        form1.projects.add(project)
        form2.projects.add(project)

        # create Plannings
        planning_1 = Planning.objects.create(
            name="planning_1", project=project, team=team, org_unit=org_unit, created_by=user
        )
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
        MissionForm = self.new_state.apps.get_model("iaso", "MissionForm")

        planning_1 = Planning.objects.get(name="planning_1")
        planning_2 = Planning.objects.get(name="planning_2")
        planning_3 = Planning.objects.get(name="planning_3")

        self.assertEqual(planning_1.missions.count(), 2)
        self.assertEqual(planning_2.missions.count(), 1)
        self.assertEqual(planning_3.missions.count(), 0)

        self.assertEqual(MissionForm.objects.count(), 3)

        planning_1_first_mission = planning_1.missions.all()[0].missionform

        self.assertEqual(planning_1_first_mission.forms.count(), 1)
        self.assertEqual(planning_1_first_mission.forms.first().name, "form1")
        self.assertEqual(
            list(
                planning_1_first_mission.missionformthroughform_set.values_list(
                    "form_id", "min_cardinality", "max_cardinality"
                )
            ),
            [(self.form1.pk, 1, 1)],
        )

        planning_1_second_mission = planning_1.missions.all()[1].missionform

        self.assertEqual(planning_1_second_mission.forms.count(), 1)
        self.assertEqual(planning_1_second_mission.forms.first().name, "form2")
        self.assertEqual(
            list(
                planning_1_second_mission.missionformthroughform_set.values_list(
                    "form_id", "min_cardinality", "max_cardinality"
                )
            ),
            [(self.form2.pk, 1, 1)],
        )
        planning_2_first_mission = planning_2.missions.all()[0].missionform

        self.assertEqual(planning_2_first_mission.forms.count(), 1)
        self.assertEqual(planning_2_first_mission.forms.first().name, "form2")
        self.assertEqual(
            list(
                planning_2_first_mission.missionformthroughform_set.values_list(
                    "form_id", "min_cardinality", "max_cardinality"
                )
            ),
            [(self.form2.pk, 1, 1)],
        )


class Test0390ReverseMigration(IasoMigratorTestCase):
    num_queries = 44

    migrate_from = ("iaso", "0395_mission_alter_corepermissionsupport_options_and_more")
    migrate_to = ("iaso", "0394_remove_show_pages_feature_flag")

    def create_mission_form_with_form(self, name, account, user, *forms):
        Mission = self.old_state.apps.get_model("iaso", "Mission")
        MissionForm = self.old_state.apps.get_model("iaso", "MissionForm")
        MissionFormThroughForm = self.old_state.apps.get_model("iaso", "MissionFormThroughForm")
        ContentType = self.old_state.apps.get_model("contenttypes", "ContentType")
        mission_form_ct = ContentType.objects.get_for_model(MissionForm)

        mission_base = Mission.objects.create(
            name=name, account=account, mission_type="FORM_FILLING", created_by=user, polymorphic_ctype=mission_form_ct
        )

        mission_form = MissionForm.objects.create(
            mission_ptr=mission_base,
            created_at=now(),
            name=name,
            account=account,
            mission_type="FORM_FILLING",
            created_by=user,
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(mission_form_id=mission_form.id, form_id=form.id, min_cardinality=1)
                for form in forms
            ]
        )
        return mission_form

    def create_mission_out_with_form(self, name, account, user, *forms):
        Mission = self.old_state.apps.get_model("iaso", "Mission")
        MissionOrgUnitType = self.old_state.apps.get_model("iaso", "MissionOrgUnitType")
        MissionOrgUnitTypeThroughForm = self.old_state.apps.get_model("iaso", "MissionOrgUnitTypeThroughForm")
        ContentType = self.old_state.apps.get_model("contenttypes", "ContentType")
        mission_out_ct = ContentType.objects.get_for_model(MissionOrgUnitType)
        OrgUnitType = self.old_state.apps.get_model("iaso", "OrgUnitType")
        mission_base = Mission.objects.create(
            name=name, account=account, mission_type="FORM_FILLING", created_by=user, polymorphic_ctype=mission_out_ct
        )

        out = OrgUnitType.objects.create(name=name)

        mission_form = MissionOrgUnitType.objects.create(
            mission_ptr=mission_base,
            created_at=now(),
            name=name,
            account=account,
            mission_type="FORM_FILLING",
            created_by=user,
            org_unit_type=out,
        )

        MissionOrgUnitTypeThroughForm.objects.bulk_create(
            [
                MissionOrgUnitTypeThroughForm(
                    mission_org_unit_type_id=mission_form.id, form_id=form.id, min_cardinality=1
                )
                for form in forms
            ]
        )
        return mission_form

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

        self.form1 = form1 = Form.objects.create(name="form1")
        self.form2 = form2 = Form.objects.create(name="form2")
        form1.projects.add(project)
        form2.projects.add(project)

        # create Plannings
        planning_1 = Planning.objects.create(name="planning_1", project=project, team=team, org_unit=org_unit)

        mission_1 = self.create_mission_form_with_form("mission_1", account, user, form1, form2)
        mission_2 = self.create_mission_form_with_form("mission_2", account, user, form2)
        mission_3 = self.create_mission_out_with_form("mission_3", account, user, form2)

        planning_1.missions.set([mission_1, mission_2])

        planning_2 = Planning.objects.create(
            name="planning_2",
            project=project,
            team=team,
            org_unit=org_unit,
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
