from django.test import tag
from django.contrib import auth
import jsonschema

from beanstalk_worker.services import TestTaskService
from hat.audit import models as am
from iaso import models as m
from iaso.models import Task, QUEUED
from iaso.models.microplanning import TeamType
from iaso.test import APITestCase
from hat.menupermissions import models as permission
from iaso.tests.api.test_profiles import PROFILE_LOG_SCHEMA


def saveUserProfile(user):
    user.save()
    user.iaso_profile.save()


class OrgUnitsBulkUpdateAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        zelda = m.Account.objects.create(name="Nintendo")
        cls.project = m.Project.objects.create(
            name="Project 1", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.project_2 = m.Project.objects.create(
            name="Project 2", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="marvel.app_id", account=marvel)

        cls.group_1 = auth.models.Group.objects.create(name="group_1")
        cls.group_2 = auth.models.Group.objects.create(name="group_2")
        cls.group_3 = auth.models.Group.objects.create(name="group_3")
        cls.group_admin = auth.models.Group.objects.create(name="group_admin")
        cls.group_admin.permissions.set([auth.models.Permission.objects.get(codename=permission._USERS_ADMIN)])
        cls.group_4 = auth.models.Group.objects.create(name="group_4")
        cls.user_role = m.UserRole.objects.create(group=cls.group_1, account=star_wars)
        cls.user_role_2 = m.UserRole.objects.create(group=cls.group_2, account=star_wars)
        cls.user_role_3 = m.UserRole.objects.create(group=cls.group_3, account=marvel)
        cls.user_role_admin = m.UserRole.objects.create(group=cls.group_admin, account=star_wars)
        cls.user_role_different_account = m.UserRole.objects.create(group=cls.group_4, account=marvel)

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        # sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.jabba = cls.create_user_with_profile(username="jabba", account=star_wars, language="en", is_superuser=True)
        cls.yoda = cls.create_user_with_profile(
            username="yoda",
            account=star_wars,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.yoda)
        cls.obi_wan = cls.create_user_with_profile(
            username="obi_wan",
            account=star_wars,
            permissions=[permission._USERS_MANAGED, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.yoda)
        cls.luke = cls.create_user_with_profile(
            username="luke",
            account=star_wars,
            permissions=[permission._USERS_ADMIN],
            org_units=[cls.jedi_council_endor],
            projects=[cls.project_2],
            language="en",
            user_roles=[cls.user_role_2],
        )
        saveUserProfile(cls.luke)
        cls.chewie = cls.create_user_with_profile(
            username="chewie",
            account=star_wars,
            permissions=[permission._USERS_ADMIN],
            projects=[cls.project_2],
            org_units=[cls.jedi_council_endor],
            language="en",
            user_roles=[cls.user_role_2],
        )
        saveUserProfile(cls.chewie)
        cls.raccoon = cls.create_user_with_profile(
            username="raccoon",
            account=marvel,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.raccoon)
        cls.root = cls.create_user_with_profile(
            username="root", account=marvel, permissions=[permission._USERS_ADMIN], org_units=None, language="en"
        )
        saveUserProfile(cls.root)
        cls.wolverine = cls.create_user_with_profile(
            username="wolverine",
            account=zelda,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            org_units=None,
            language="en",
        )
        saveUserProfile(cls.wolverine)

        cls.user_with_no_users_permission = cls.create_user_with_profile(
            username="userNoUsersPermission",
            account=star_wars,
            permissions=["iaso_data_tasks"],
            language="en",
        )
        saveUserProfile(cls.user_with_no_users_permission)

        cls.add_users_team_launcher_1 = cls.create_user_with_profile(
            username="add_users_team_launcher_1",
            account=star_wars,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS, permission._TEAMS],
            language="en",
        )
        saveUserProfile(cls.add_users_team_launcher_1)

        cls.team_1 = m.Team.objects.create(
            name="Team 1", manager=cls.yoda, project=cls.project, type=TeamType.TEAM_OF_USERS
        )
        cls.team_2 = m.Team.objects.create(name="Team 2", manager=cls.yoda, project=cls.project)

    @tag("iaso_only")
    def test_profile_bulkupdate_not_authenticated(self):
        """POST /api/tasks/create/profilesbulkupdate/, no auth -> 401"""

        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={"select_all": True, "language": "fr"},
            format="json",
        )
        self.assertJSONResponse(response, 401)

        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    @tag("iaso_only")
    def test_profile_bulkupdate_with_profil_without_users_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/, no users permissin -> 403"""
        self.client.force_authenticate(self.user_with_no_users_permission)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.luke.iaso_profile.pk, self.chewie.iaso_profile.pk],
            "language": "fr",
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 403)
        data = response.json()
        self.assertEqual(data["detail"], "You do not have permission to perform this action.")

    @tag("iaso_only")
    def test_profile_bulkupdate_select_some_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access to specified profiles)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [self.raccoon.iaso_profile.pk, self.root.iaso_profile.pk],
                "language": "fr",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        task = self.runAndValidateTask(task, "ERRORED")
        self.assertEqual(task.result["message"], "No matching profile found")
        self.raccoon.refresh_from_db()
        self.root.refresh_from_db()
        self.assertEqual(self.raccoon.iaso_profile.language, "en")
        self.assertEqual(self.root.iaso_profile.language, "en")

    @tag("iaso_only")
    def test_profile_bulkupdate_select_all_wrong_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ (authenticated user, but no access any profile)"""

        self.client.force_authenticate(self.wolverine)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={"select_all": True, "language": "fr"},
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.wolverine)

        # Run the task
        task = self.runAndValidateTask(task, "SUCCESS")
        self.assertEqual(task.result["message"], "1 modified")  # himself only
        self.raccoon.refresh_from_db()
        self.assertEqual(self.raccoon.iaso_profile.language, "en")
        self.root.refresh_from_db()
        self.assertEqual(self.root.iaso_profile.language, "en")
        self.luke.refresh_from_db()
        self.assertEqual(self.luke.iaso_profile.language, "en")
        self.yoda.refresh_from_db()
        self.assertEqual(self.yoda.iaso_profile.language, "en")

    @tag("iaso_only")
    def test_profile_bulkupdate_select_some(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path"""
        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.luke.iaso_profile.pk, self.chewie.iaso_profile.pk],
            "language": "fr",
            "location_ids_added": [self.jedi_council_corruscant.pk],
            "location_ids_removed": [self.jedi_council_endor.pk],
            "projects_ids_added": [
                self.project.pk,
                self.project_3.pk,
            ],  # self.project_3 should not be saved, not from the same account
            "projects_ids_removed": [self.project_2.pk],
            "roles_id_added": [self.user_role.pk],
            "roles_id_removed": [self.user_role_2.pk],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertEqual(self.luke.iaso_profile.language, "fr")
        self.assertEqual(self.chewie.iaso_profile.language, "fr")
        self.assertIn(
            self.jedi_council_corruscant,
            self.luke.iaso_profile.org_units.all(),
        )
        self.assertIn(
            self.jedi_council_corruscant,
            self.chewie.iaso_profile.org_units.all(),
        )
        self.assertNotIn(
            self.jedi_council_endor,
            self.luke.iaso_profile.org_units.all(),
        )
        self.assertNotIn(
            self.jedi_council_endor,
            self.chewie.iaso_profile.org_units.all(),
        )
        self.assertIn(
            self.project,
            self.luke.iaso_profile.projects.all(),
        )
        self.assertIn(
            self.project,
            self.chewie.iaso_profile.projects.all(),
        )
        self.assertNotIn(
            self.project_3,
            self.luke.iaso_profile.projects.all(),
        )
        self.assertNotIn(
            self.project_3,
            self.chewie.iaso_profile.projects.all(),
        )
        self.assertIn(
            self.user_role,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertIn(
            self.user_role,
            self.chewie.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.chewie.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_3,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_3,
            self.chewie.iaso_profile.user_roles.all(),
        )

    @tag("iaso_only")
    def test_profile_bulkupdate_user_managed_cannot_add_projects(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot add projects as user manager"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "projects_ids_added": [
                self.project.pk,
                self.project_3.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")

    @tag("iaso_only")
    def test_profile_bulkupdate_user_managed_cannot_remove_projects(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot remove projects as user manager"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "projects_ids_removed": [
                self.project.pk,
                self.project_3.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")

    @tag("iaso_only")
    def test_profile_bulkupdate_user_managed_can_add_role(self):
        """POST /api/tasks/create/profilesbulkupdate/ add role as a user manager"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "roles_id_added": [
                self.user_role.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertIn(
            self.user_role,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertIn(
            self.user_role,
            self.chewie.iaso_profile.user_roles.all(),
        )

    @tag("iaso_only")
    def test_profile_bulkupdate_user_managed_cannot_add_role_with_admin_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot add role with admin permission as a user manager"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "roles_id_added": [
                self.user_role_admin.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertNotIn(
            self.user_role_admin,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_admin,
            self.chewie.iaso_profile.user_roles.all(),
        )

    @tag("iaso_only")
    def test_profile_bulkupdate_user_managed_can_remove_role(self):
        """POST /api/tasks/create/profilesbulkupdate/ remove role as a user manager"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "roles_id_removed": [
                self.user_role_2.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertNotIn(
            self.user_role_2,
            self.luke.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.chewie.iaso_profile.user_roles.all(),
        )

    @tag("iaso_only")
    def test_profile_bulkupdate_add_user_role_with_not_connected_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ try to add a user role using a not connected account"""

        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.luke.iaso_profile.pk, self.chewie.iaso_profile.pk],
            "language": "fr",
            "roles_id_added": [
                self.user_role_different_account.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertNotEqual(self.luke.iaso_profile.language, "fr")
        self.assertNotEqual(self.chewie.iaso_profile.language, "fr")

    @tag("iaso_only")
    def test_profile_bulkupdate_remove_user_role_with_not_connected_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ try to remove a user role using a not connected account"""

        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.luke.iaso_profile.pk, self.chewie.iaso_profile.pk],
            "language": "fr",
            "roles_id_removed": [
                self.user_role_different_account.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.luke.refresh_from_db()
        self.chewie.refresh_from_db()
        self.assertNotEqual(self.luke.iaso_profile.language, "fr")
        self.assertNotEqual(self.chewie.iaso_profile.language, "fr")

    @tag("iaso_only")
    def test_profile_bulkupdate_select_all(self):
        """POST //api/tasks/create/profilesbulkupdate/ happy path (select all)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={"select_all": True, "language": "fr"},
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.raccoon.refresh_from_db()
        self.assertEqual(self.raccoon.iaso_profile.language, "en")
        self.root.refresh_from_db()
        self.assertEqual(self.root.iaso_profile.language, "en")
        self.wolverine.refresh_from_db()
        self.assertEqual(self.wolverine.iaso_profile.language, "en")
        self.chewie.refresh_from_db()
        self.assertEqual(self.chewie.iaso_profile.language, "fr")
        self.luke.refresh_from_db()
        self.assertEqual(self.luke.iaso_profile.language, "fr")
        self.yoda.refresh_from_db()
        self.assertEqual(self.yoda.iaso_profile.language, "fr")
        self.assertEqual(7, am.Modification.objects.count())
        self.obi_wan.refresh_from_db()
        self.assertEqual(self.obi_wan.iaso_profile.language, "fr")
        self.assertEqual(7, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_with_search(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all, but with search)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "search": "luke",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.raccoon.refresh_from_db()
        self.assertEqual(self.raccoon.iaso_profile.language, "en")
        self.root.refresh_from_db()
        self.assertEqual(self.root.iaso_profile.language, "en")
        self.wolverine.refresh_from_db()
        self.assertEqual(self.wolverine.iaso_profile.language, "en")
        self.chewie.refresh_from_db()
        self.assertEqual(self.chewie.iaso_profile.language, "en")
        self.luke.refresh_from_db()
        self.assertEqual(self.luke.iaso_profile.language, "fr")
        self.yoda.refresh_from_db()
        self.assertEqual(self.yoda.iaso_profile.language, "en")

        self.assertEqual(1, am.Modification.objects.count())
        # TODO assert log content

    @tag("iaso_only")
    def test_profile_bulkupdate_task_select_all_but_some(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all except some)"""

        self.client.force_authenticate(self.yoda)
        self.luke.iaso_profile.language = "en"
        self.luke.iaso_profile.save()
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "unselected_ids": [
                    self.luke.iaso_profile.pk,
                    self.chewie.iaso_profile.pk,
                    self.user_with_no_users_permission.iaso_profile.pk,
                ],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.raccoon.refresh_from_db()
        self.assertEqual(self.raccoon.iaso_profile.language, "en")
        self.root.refresh_from_db()
        self.assertEqual(self.root.iaso_profile.language, "en")
        self.wolverine.refresh_from_db()
        self.assertEqual(self.wolverine.iaso_profile.language, "en")
        self.chewie.refresh_from_db()
        self.assertEqual(self.chewie.iaso_profile.language, "en")
        self.luke.refresh_from_db()
        self.assertEqual(self.luke.iaso_profile.language, "en")
        self.yoda.refresh_from_db()
        self.assertEqual(self.yoda.iaso_profile.language, "fr")

        self.assertEqual(4, am.Modification.objects.count())

    @tag("iaso_only")
    def test_profile_bulkupdate_user_without_iaso_team_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/ a user without permission menupermissions.iaso_teams cannot add users to team"""
        self.client.force_authenticate(self.obi_wan)
        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_1.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.obi_wan)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.team_1.refresh_from_db()

        self.assertNotIn(
            self.luke,
            self.team_1.users.all(),
        )
        self.assertNotIn(
            self.chewie,
            self.team_1.users.all(),
        )
        # TODO assert no log for teams

    @tag("iaso_only")
    def test_profile_bulkupdate_add_users_to_team(self):
        """POST /api/tasks/create/profilesbulkupdate/ can add users to a team and the users must have same account as the launcher"""
        self.client.force_authenticate(self.add_users_team_launcher_1)
        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_1.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.add_users_team_launcher_1)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.team_1.refresh_from_db()
        # check if users with same account as the launcher has been added
        self.assertIn(
            self.luke,
            self.team_1.users.all(),
        )
        self.assertIn(
            self.chewie,
            self.team_1.users.all(),
        )
        # check if users with different account as the launcher has been added
        self.assertNotIn(
            self.raccoon,
            self.team_1.users.all(),
        )
        self.assertNotIn(
            self.wolverine,
            self.team_1.users.all(),
        )
        # TODO assert team logs

    @tag("iaso_only")
    def test_profile_bulkupdate_add_users_to_no_team_of_users(self):
        """POST /api/tasks/create/profilesbulkupdate/ can not add users to a team with no team_of_users type"""
        self.client.force_authenticate(self.add_users_team_launcher_1)
        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_2.pk,
            ],
        }
        response = self.client.post(f"/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.add_users_team_launcher_1)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.team_2.refresh_from_db()
        self.assertNotIn(
            self.luke,
            self.team_2.users.all(),
        )
        self.assertNotIn(
            self.chewie,
            self.team_2.users.all(),
        )

    def test_task_kill(self):
        """Launch the task and then kill it
        Note this actually doesn't work if it's killwed while in the transaction part.
        """

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        self.assertValidTaskAndInDB(data["task"])

        task = Task.objects.get(id=data["task"]["id"])
        task.should_be_killed = True
        task.save()

        self.runAndValidateTask(task, "KILLED")

    def test_audit_log_on_save(self):
        """POST //api/tasks/create/profilesbulkupdate/ happy path (select all)
        There should be an audit log for each user updated and a log for each user added or removed from a team (1 per operation)
        """

        self.client.force_authenticate(self.jabba)
        response = self.client.post(
            f"/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [self.luke.iaso_profile.pk, self.chewie.iaso_profile.pk],
                "language": "fr",
                "location_ids_added": [self.jedi_council_corruscant.pk],
                "location_ids_removed": [self.jedi_council_endor.pk],
                "projects_ids_added": [
                    self.project.pk,
                ],
                "teams_id_added": [self.team_1.pk],
                "projects_ids_removed": [self.project_2.pk],
                "roles_id_added": [self.user_role.pk],
                "roles_id_removed": [self.user_role_2.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.jabba)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.assertEqual(4, am.Modification.objects.count())  # 2 users and 2 times team 1
        # Check that luke profile is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={self.luke.iaso_profile.id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))
        # past value
        past_value = log["past_value"][0]["fields"]
        self.assertEquals(past_value["user"], self.luke.id)
        self.assertEquals(past_value["username"], self.luke.username)
        self.assertEquals(past_value["first_name"], self.luke.first_name)
        self.assertEquals(past_value["last_name"], self.luke.last_name)
        self.assertEquals(past_value["email"], self.luke.email)
        self.assertEquals(len(past_value["user_permissions"]), 1)

        self.assertEquals(past_value["dhis2_id"], self.luke.iaso_profile.dhis2_id)
        self.assertEquals(past_value["language"], "en")
        self.assertEquals(past_value["home_page"], self.luke.iaso_profile.home_page)
        self.assertEquals(
            past_value["phone_number"], self.luke.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEquals(len(past_value["org_units"]), 1)
        self.assertIn(self.jedi_council_endor.id, past_value["org_units"])
        self.assertEquals(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role_2.id, past_value["user_roles"])
        self.assertEquals(len(past_value["projects"]), 1)
        self.assertIn(self.project_2.id, past_value["projects"])
        # New value
        new_value = log["new_value"][0]["fields"]
        self.assertEquals(new_value["user"], self.luke.id)
        self.assertEquals(new_value["username"], self.luke.username)
        self.assertEquals(new_value["first_name"], self.luke.first_name)
        self.assertEquals(new_value["last_name"], self.luke.last_name)
        self.assertEquals(new_value["email"], self.luke.email)
        self.assertEquals(len(new_value["user_permissions"]), 1)

        self.assertEquals(new_value["dhis2_id"], self.luke.iaso_profile.dhis2_id)
        self.assertEquals(new_value["language"], "fr")
        self.assertEquals(new_value["home_page"], self.luke.iaso_profile.home_page)
        self.assertEquals(
            past_value["phone_number"], self.luke.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEquals(len(new_value["org_units"]), 1)
        self.assertIn(self.jedi_council_corruscant.id, new_value["org_units"])
        self.assertEquals(len(new_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_value["user_roles"])
        self.assertEquals(len(new_value["projects"]), 1)
        self.assertIn(self.project.id, new_value["projects"])

        # Check that chewie profile is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={self.chewie.iaso_profile.id}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))
        # past value
        past_value = log["past_value"][0]["fields"]
        self.assertEquals(past_value["user"], self.chewie.id)
        self.assertEquals(past_value["username"], self.chewie.username)
        self.assertEquals(past_value["first_name"], self.chewie.first_name)
        self.assertEquals(past_value["last_name"], self.chewie.last_name)
        self.assertEquals(past_value["email"], self.chewie.email)
        self.assertEquals(len(past_value["user_permissions"]), 1)

        self.assertEquals(past_value["dhis2_id"], self.chewie.iaso_profile.dhis2_id)
        self.assertEquals(past_value["language"], "en")
        self.assertEquals(past_value["home_page"], self.chewie.iaso_profile.home_page)
        self.assertEquals(
            past_value["phone_number"], self.chewie.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEquals(len(past_value["org_units"]), 1)
        self.assertIn(self.jedi_council_endor.id, past_value["org_units"])
        self.assertEquals(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role_2.id, past_value["user_roles"])
        self.assertEquals(len(past_value["projects"]), 1)
        self.assertIn(self.project_2.id, past_value["projects"])
        # New value
        new_value = log["new_value"][0]["fields"]
        self.assertEquals(new_value["user"], self.chewie.id)
        self.assertEquals(new_value["username"], self.chewie.username)
        self.assertEquals(new_value["first_name"], self.chewie.first_name)
        self.assertEquals(new_value["last_name"], self.chewie.last_name)
        self.assertEquals(new_value["email"], self.chewie.email)
        self.assertEquals(len(new_value["user_permissions"]), 1)

        self.assertEquals(new_value["dhis2_id"], self.chewie.iaso_profile.dhis2_id)
        self.assertEquals(new_value["language"], "fr")
        self.assertEquals(new_value["home_page"], self.chewie.iaso_profile.home_page)
        self.assertEquals(
            past_value["phone_number"], self.chewie.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEquals(len(new_value["org_units"]), 1)
        self.assertIn(self.jedi_council_corruscant.id, new_value["org_units"])
        self.assertEquals(len(new_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_value["user_roles"])
        self.assertEquals(len(new_value["projects"]), 1)
        self.assertIn(self.project.id, new_value["projects"])
        # Check that team 1 is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.team&fields=past_value,new_value&objectId={self.team_1.pk}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        self.assertEquals(len(logs), 2)
        # Last log should contain both luke and chewie id
        log = logs[0]
        self.assertIn(self.chewie.pk, log["new_value"][0]["users"])
        self.assertIn(self.luke.pk, log["new_value"][0]["users"])
        # Penultimate log should have neither nor chewie in past_value
        self.assertNotIn(logs[1]["past_value"][0]["users"], [self.luke.pk, self.chewie.pk])

    def runAndValidateTask(self, task, new_status):
        "Run all task in queue and validate that task is run"
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 1)
        task_service = TestTaskService()
        task_service.run_all()
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

        response = self.client.get("/api/tasks/%d/" % task.id)

        self.assertEqual(response.status_code, 200)
        # Task completion status
        return self.assertValidTaskAndInDB(response.json(), new_status)

    def assertValidTaskAndInDB(self, task_dict, status="QUEUED", name=None):
        self.assertEqual(task_dict["status"], status, task_dict)

        task = Task.objects.get(id=task_dict["id"])
        self.assertTrue(task)
        if name:
            self.assertEqual(task.name, name)

        return task
