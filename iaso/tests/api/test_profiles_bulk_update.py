import jsonschema

from django.contrib import auth
from django.contrib.auth.models import User
from django.db.models import Q

from beanstalk_worker.services import TestTaskService
from hat.audit import models as am
from hat.menupermissions import models as permission
from iaso import models as m
from iaso.models import QUEUED, Task
from iaso.models.microplanning import TeamType
from iaso.test import APITestCase
from iaso.tests.api.test_profiles import PROFILE_LOG_SCHEMA


def saveUserProfile(user):
    user.save()
    user.iaso_profile.save()


class ProfileBulkUpdateAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account1 = m.Account.objects.create(name="Star Stuff")
        cls.account2 = m.Account.objects.create(name="Comic books")
        cls.account3 = m.Account.objects.create(name="Video game")
        cls.project_0 = m.Project.objects.create(name="Project 0", app_id="account1.foo", account=cls.account1)
        cls.project_1 = m.Project.objects.create(name="Project 1", app_id="account1.bar", account=cls.account1)
        cls.project_2 = m.Project.objects.create(name="Project 2", app_id="account1.baz", account=cls.account1)
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="account2.qux", account=cls.account2)

        cls.group_1 = auth.models.Group.objects.create(name="group_1")
        cls.group_2 = auth.models.Group.objects.create(name="group_2")
        cls.group_3 = auth.models.Group.objects.create(name="group_3")
        cls.group_admin = auth.models.Group.objects.create(name="group_admin")
        cls.group_admin.permissions.set([auth.models.Permission.objects.get(codename=permission._USERS_ADMIN)])
        cls.group_4 = auth.models.Group.objects.create(name="group_4")
        cls.user_role = m.UserRole.objects.create(group=cls.group_1, account=cls.account1)
        cls.user_role_2 = m.UserRole.objects.create(group=cls.group_2, account=cls.account1)
        cls.user_role_3 = m.UserRole.objects.create(group=cls.group_3, account=cls.account2)
        cls.user_role_admin = m.UserRole.objects.create(group=cls.group_admin, account=cls.account1)
        cls.user_role_different_account = m.UserRole.objects.create(group=cls.group_4, account=cls.account2)

        source1 = m.DataSource.objects.create(name="Evil Empire")
        source1.projects.add(cls.project_0)
        cls.source1 = source1
        source1_version1 = m.SourceVersion.objects.create(data_source=source1, number=1)
        cls.account1.default_version = source1_version1
        cls.account1.save()
        cls.org_unit_type1 = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.org_unit1 = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type1,
            version=source1_version1,
            name="Corruscant Jedi Council",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit2 = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type1,
            version=source1_version1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account1, language="en", is_superuser=True
        )
        cls.user_admin = cls.create_user_with_profile(
            username="user_admin",
            account=cls.account1,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.user_admin)
        cls.user_managed = cls.create_user_with_profile(
            username="user_managed",
            account=cls.account1,
            permissions=[permission._USERS_MANAGED, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.user_admin)
        cls.user_admin_no_task = cls.create_user_with_profile(
            username="user_admin_no_task",
            account=cls.account1,
            permissions=[permission._USERS_ADMIN],
            org_units=[cls.org_unit2],
            projects=[cls.project_2],
            language="en",
            user_roles=[cls.user_role_2],
        )
        saveUserProfile(cls.user_admin_no_task)
        cls.user_admin_no_task2 = cls.create_user_with_profile(
            username="user_admin_no_task2",
            account=cls.account1,
            permissions=[permission._USERS_ADMIN],
            projects=[cls.project_2],
            org_units=[cls.org_unit2],
            language="en",
            user_roles=[cls.user_role_2],
        )
        saveUserProfile(cls.user_admin_no_task2)
        cls.user_with_user_role1 = cls.create_user_with_profile(
            username="user_with_user_role1",
            account=cls.account1,
            permissions=[permission._USERS_ADMIN],
            projects=[cls.project_2],
            org_units=[cls.org_unit2],
            language="en",
            user_roles=[cls.user_role],
        )
        saveUserProfile(cls.user_with_user_role1)

        cls.user_admin_account2 = cls.create_user_with_profile(
            username="user_admin_account2",
            account=cls.account2,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            language="en",
        )
        saveUserProfile(cls.user_admin_account2)
        cls.user_admin_no_task_account2 = cls.create_user_with_profile(
            username="user_admin_no_task_account2",
            account=cls.account2,
            permissions=[permission._USERS_ADMIN],
            org_units=None,
            language="en",
        )
        saveUserProfile(cls.user_admin_no_task_account2)
        cls.user_admin_account3 = cls.create_user_with_profile(
            username="user_admin_account3",
            account=cls.account3,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS],
            org_units=None,
            language="en",
        )
        saveUserProfile(cls.user_admin_account3)

        cls.user_with_no_users_permission = cls.create_user_with_profile(
            username="userNoUsersPermission",
            account=cls.account1,
            permissions=["iaso_data_tasks"],
            language="en",
        )
        saveUserProfile(cls.user_with_no_users_permission)

        cls.add_users_team_launcher_1 = cls.create_user_with_profile(
            username="add_users_team_launcher_1",
            account=cls.account1,
            permissions=[permission._USERS_ADMIN, permission._DATA_TASKS, permission._TEAMS],
            language="en",
        )
        saveUserProfile(cls.add_users_team_launcher_1)

        cls.team_1 = m.Team.objects.create(
            name="Team 1", manager=cls.user_admin, project=cls.project_0, type=TeamType.TEAM_OF_USERS
        )
        cls.team_2 = m.Team.objects.create(
            name="Team 2", manager=cls.user_admin, project=cls.project_0, type=TeamType.TEAM_OF_USERS
        )
        cls.team_3 = m.Team.objects.create(
            name="Team 3", manager=cls.user_admin, project=cls.project_0, type=TeamType.TEAM_OF_USERS
        )
        cls.team_of_teams = m.Team.objects.create(
            name="Team of Teams", manager=cls.user_admin, project=cls.project_0, type=TeamType.TEAM_OF_TEAMS
        )

    def refresh_all_users_from_db(self):
        self.superuser.refresh_from_db()
        self.user_admin.refresh_from_db()
        self.user_managed.refresh_from_db()
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.user_admin_account2.refresh_from_db()
        self.user_admin_no_task_account2.refresh_from_db()
        self.user_admin_account3.refresh_from_db()
        self.user_with_no_users_permission.refresh_from_db()
        self.add_users_team_launcher_1.refresh_from_db()
        self.user_with_user_role1.refresh_from_db()

    def test_profile_bulkupdate_not_authenticated(self):
        """POST /api/tasks/create/profilesbulkupdate/, no auth -> 401"""

        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={"select_all": True, "language": "fr"},
            format="json",
        )
        self.assertJSONResponse(response, 401)

        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_profile_bulkupdate_with_profil_without_users_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/, no users permissin -> 403"""
        self.client.force_authenticate(self.user_with_no_users_permission)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.user_admin_no_task.iaso_profile.pk, self.user_admin_no_task2.iaso_profile.pk],
            "language": "fr",
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 403)
        data = response.json()
        self.assertEqual(data["detail"], "You do not have permission to perform this action.")

    def test_profile_bulkupdate_select_some_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access to specified profiles)"""

        self.client.force_authenticate(self.user_admin)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [
                    self.user_admin_account2.iaso_profile.pk,
                    self.user_admin_no_task_account2.iaso_profile.pk,
                ],
                "language": "fr",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        task = self.runAndValidateTask(task, "ERRORED")
        self.assertEqual(task.result["message"], "No matching profile found")
        self.user_admin_account2.refresh_from_db()
        self.user_admin_no_task_account2.refresh_from_db()
        self.assertEqual(self.user_admin_account2.iaso_profile.language, "en")
        self.assertEqual(self.user_admin_no_task_account2.iaso_profile.language, "en")

    def test_profile_bulkupdate_select_all_wrong_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ (authenticated user, but no access any profile)"""

        self.client.force_authenticate(self.user_admin_account3)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={"select_all": True, "language": "fr"},
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin_account3)

        # Run the task
        task = self.runAndValidateTask(task, "SUCCESS")
        self.assertEqual(task.result["message"], "1 modified")  # himself only
        self.user_admin_account2.refresh_from_db()
        self.assertEqual(self.user_admin_account2.iaso_profile.language, "en")
        self.user_admin_no_task_account2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task_account2.iaso_profile.language, "en")
        self.user_admin_no_task.refresh_from_db()
        self.assertEqual(self.user_admin_no_task.iaso_profile.language, "en")
        self.user_admin.refresh_from_db()
        self.assertEqual(self.user_admin.iaso_profile.language, "en")

    def test_profile_bulkupdate_select_some(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path"""
        self.client.force_authenticate(self.user_admin)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.user_admin_no_task.iaso_profile.pk, self.user_admin_no_task2.iaso_profile.pk],
            "unselected_ids": None,
            "projects_ids_added": [
                self.project_0.pk,
                self.project_3.pk,
            ],  # self.project_3 should not be saved, not from the same account
            "projects_ids_removed": [self.project_2.pk],
            "roles_id_added": [self.user_role.pk],
            "roles_id_removed": [self.user_role_2.pk],
            "location_ids_added": [self.org_unit1.pk],
            "location_ids_removed": [self.org_unit2.pk],
            "language": "fr",
            "teams_id_added": None,
            "teams_id_removed": None,
            "organization": "Bluesquare",
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task.iaso_profile.language, "fr")
        self.assertEqual(self.user_admin_no_task2.iaso_profile.language, "fr")
        self.assertEqual(self.user_admin_no_task.iaso_profile.organization, "Bluesquare")
        self.assertEqual(self.user_admin_no_task2.iaso_profile.organization, "Bluesquare")
        self.assertIn(
            self.org_unit1,
            self.user_admin_no_task.iaso_profile.org_units.all(),
        )
        self.assertIn(
            self.org_unit1,
            self.user_admin_no_task2.iaso_profile.org_units.all(),
        )
        self.assertNotIn(
            self.org_unit2,
            self.user_admin_no_task.iaso_profile.org_units.all(),
        )
        self.assertNotIn(
            self.org_unit2,
            self.user_admin_no_task2.iaso_profile.org_units.all(),
        )
        self.assertIn(
            self.project_0,
            self.user_admin_no_task.iaso_profile.projects.all(),
        )
        self.assertIn(
            self.project_0,
            self.user_admin_no_task2.iaso_profile.projects.all(),
        )
        self.assertNotIn(
            self.project_3,
            self.user_admin_no_task.iaso_profile.projects.all(),
        )
        self.assertNotIn(
            self.project_3,
            self.user_admin_no_task2.iaso_profile.projects.all(),
        )
        self.assertIn(
            self.user_role,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertIn(
            self.user_role,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_3,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_3,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )

    def test_profile_bulkupdate_for_user_with_restricted_projects(self):
        user = self.user_admin
        user.iaso_profile.projects.set([self.project_1.pk, self.project_2.pk])
        self.assertTrue(user.has_perm(permission.USERS_ADMIN))

        user_to_update = self.user_admin_no_task
        user_to_update.iaso_profile.projects.set([self.project_2.pk])

        self.client.force_authenticate(user)

        operation_payload = {
            "select_all": False,
            "selected_ids": [user_to_update.iaso_profile.pk],
            "unselected_ids": None,
            "projects_ids_added": [
                self.project_0.pk,  # `user` has no rights on this project.
                self.project_1.pk,  # `user` should be able to add this project.
            ],
            "projects_ids_removed": [
                self.project_0.pk,  # `user` has no rights on this project.
                self.project_2.pk,  # `user` should be able to remove this project.
            ],
            "roles_id_added": [],
            "roles_id_removed": [],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": "fr",
            "teams_id_added": None,
            "teams_id_removed": None,
            "organization": "Bluesquare",
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, user)

        self.runAndValidateTask(task, "SUCCESS")

        user_to_update.refresh_from_db()
        self.assertEqual(1, user_to_update.iaso_profile.projects.count())
        self.assertEqual(user_to_update.iaso_profile.projects.first(), self.project_1)

    def test_profile_bulkupdate_user_managed_cannot_add_projects(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot add projects as user manager"""
        self.client.force_authenticate(self.user_managed)
        operation_payload = {
            "select_all": True,
            "projects_ids_added": [
                self.project_0.pk,
                self.project_3.pk,
            ],
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_managed)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")

    def test_profile_bulkupdate_user_managed_cannot_remove_projects(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot remove projects as user manager"""
        self.client.force_authenticate(self.user_managed)
        operation_payload = {
            "select_all": True,
            "projects_ids_removed": [
                self.project_0.pk,
                self.project_3.pk,
            ],
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_managed)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")

    def test_profile_bulkupdate_user_managed_can_add_role(self):
        """POST /api/tasks/create/profilesbulkupdate/ add role as a user manager"""
        self.client.force_authenticate(self.user_managed)
        operation_payload = {
            "select_all": True,
            "selected_ids": [],
            "unselected_ids": [],
            "projects_ids_added": [],
            "projects_ids_removed": [],
            "roles_id_added": [self.user_role.pk],
            "roles_id_removed": [],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": None,
            "teams_id_added": [],
            "teams_id_removed": [],
            "organization": None,
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_managed)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertIn(
            self.user_role,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertIn(
            self.user_role,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )

    def test_profile_bulkupdate_user_managed_cannot_add_role_with_admin_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/ cannot add role with admin permission as a user manager"""
        self.client.force_authenticate(self.user_managed)
        operation_payload = {
            "select_all": True,
            "selected_ids": [],
            "unselected_ids": [],
            "projects_ids_added": [],
            "projects_ids_removed": [],
            "roles_id_added": [self.user_role_admin.pk],
            "roles_id_removed": [],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": None,
            "teams_id_added": [],
            "teams_id_removed": [],
            "organization": None,
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_managed)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertNotIn(
            self.user_role_admin,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_admin,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )

    def test_profile_bulkupdate_user_managed_can_remove_role(self):
        """POST /api/tasks/create/profilesbulkupdate/ remove role as a user manager"""
        self.client.force_authenticate(self.user_managed)
        operation_payload = {
            "select_all": True,
            "selected_ids": [],
            "unselected_ids": [],
            "projects_ids_added": [],
            "projects_ids_removed": [],
            "roles_id_added": [],
            "roles_id_removed": [self.user_role_2.pk],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": None,
            "teams_id_added": [],
            "teams_id_removed": [],
            "organization": None,
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_managed)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertNotIn(
            self.user_role_2,
            self.user_admin_no_task.iaso_profile.user_roles.all(),
        )
        self.assertNotIn(
            self.user_role_2,
            self.user_admin_no_task2.iaso_profile.user_roles.all(),
        )

    def test_profile_bulkupdate_add_user_role_with_not_connected_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ try to add a user role using a not connected account"""

        self.client.force_authenticate(self.user_admin)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.user_admin_no_task.iaso_profile.pk, self.user_admin_no_task2.iaso_profile.pk],
            "unselected_ids": [],
            "projects_ids_added": [],
            "projects_ids_removed": [],
            "roles_id_added": [self.user_role_different_account.pk],
            "roles_id_removed": [],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": "fr",
            "teams_id_added": [],
            "teams_id_removed": [],
            "organization": None,
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertNotEqual(self.user_admin_no_task.iaso_profile.language, "fr")
        self.assertNotEqual(self.user_admin_no_task2.iaso_profile.language, "fr")

    def test_profile_bulkupdate_remove_user_role_with_not_connected_account(self):
        """POST /api/tasks/create/profilesbulkupdate/ try to remove a user role using a not connected account"""

        self.client.force_authenticate(self.user_admin)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.user_admin_no_task.iaso_profile.pk, self.user_admin_no_task2.iaso_profile.pk],
            "unselected_ids": [],
            "projects_ids_added": [],
            "projects_ids_removed": [],
            "roles_id_added": [],
            "roles_id_removed": [
                self.user_role_different_account.pk,
            ],
            "location_ids_added": [],
            "location_ids_removed": [],
            "language": "fr",
            "teams_id_added": [],
            "teams_id_removed": [],
            "organization": None,
            "search": None,
            "perms": None,
            "location": None,
            "org_unit_type": None,
            "parent_ou": None,
            "children_ou": None,
            "projects": None,
            "user_roles": None,
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.user_admin_no_task.refresh_from_db()
        self.user_admin_no_task2.refresh_from_db()
        self.assertNotEqual(self.user_admin_no_task.iaso_profile.language, "fr")
        self.assertNotEqual(self.user_admin_no_task2.iaso_profile.language, "fr")

    def test_profile_bulkupdate_select_all(self):
        """POST //api/tasks/create/profilesbulkupdate/ happy path (select all)"""

        self.client.force_authenticate(self.user_admin)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "selected_ids": None,
                "unselected_ids": None,
                "projects_ids_added": None,
                "projects_ids_removed": None,
                "roles_id_added": None,
                "roles_id_removed": None,
                "location_ids_added": None,
                "location_ids_removed": None,
                "language": "fr",
                "teams_id_added": None,
                "teams_id_removed": None,
                "organization": None,
                "search": None,
                "perms": None,
                "location": None,
                "org_unit_type": None,
                "parent_ou": None,
                "children_ou": None,
                "projects": None,
                "user_roles": None,
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.user_admin_account2.refresh_from_db()
        self.assertEqual(self.user_admin_account2.iaso_profile.language, "en")
        self.user_admin_no_task_account2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task_account2.iaso_profile.language, "en")
        self.user_admin_account3.refresh_from_db()
        self.assertEqual(self.user_admin_account3.iaso_profile.language, "en")
        self.user_admin_no_task2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task2.iaso_profile.language, "fr")
        self.user_admin_no_task.refresh_from_db()
        self.assertEqual(self.user_admin_no_task.iaso_profile.language, "fr")
        self.user_admin.refresh_from_db()
        self.assertEqual(self.user_admin.iaso_profile.language, "fr")
        self.assertEqual(8, am.Modification.objects.count())
        self.user_managed.refresh_from_db()
        self.assertEqual(self.user_managed.iaso_profile.language, "fr")
        self.assertEqual(8, am.Modification.objects.count())

    def test_org_unit_bulkupdate_select_all_with_search(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all, but with search)"""

        self.client.force_authenticate(self.user_admin)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "search": "user_admin_no_task2",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.user_admin_account2.refresh_from_db()
        self.assertEqual(self.user_admin_account2.iaso_profile.language, "en")
        self.user_admin_no_task_account2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task_account2.iaso_profile.language, "en")
        self.user_admin_account3.refresh_from_db()
        self.assertEqual(self.user_admin_account3.iaso_profile.language, "en")
        self.user_admin_no_task2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task2.iaso_profile.language, "fr")
        self.user_admin_no_task.refresh_from_db()
        self.assertEqual(self.user_admin_no_task.iaso_profile.language, "en")
        self.user_admin.refresh_from_db()
        self.assertEqual(self.user_admin.iaso_profile.language, "en")

        self.assertEqual(1, am.Modification.objects.count())
        # TODO assert log content

    def test_bulk_update_with_user_roles_filters(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all, but with filters)"""
        self.client.force_authenticate(self.user_admin)

        # test user roles
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "user_roles": f"{self.user_role.pk},{self.user_role_3.pk}",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.refresh_all_users_from_db()
        users_by_group = m.Profile.objects.filter(account=self.account1).values("id", "language", "user_roles")
        users_for_user_group = users_by_group.filter(
            Q(user_roles=self.user_role.pk) | Q(user_roles=self.user_role_3.pk)
        )
        users_not_in_user_group = users_by_group.exclude(
            Q(user_roles=self.user_role.pk) | Q(user_roles=self.user_role_3.pk)
        )
        for user in users_for_user_group:
            self.assertEqual(user["language"], "fr")
        for user in users_not_in_user_group:
            self.assertNotEqual(user["language"], "fr")

    def test_bulk_update_with_teams_filters(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all, but with filters)"""
        self.client.force_authenticate(self.user_admin)
        self.team_2.users.set([self.user_admin_no_task])
        self.team_3.users.set([self.user_admin_no_task2])
        self.team_2.save()
        self.team_3.save()

        # test user roles
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "teams": f"{self.team_2.pk},{self.team_3.pk}",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.refresh_all_users_from_db()
        users_by_group = User.objects.filter(iaso_profile__account=self.account1).values(
            "id", "username", "iaso_profile__language", "teams"
        )
        users_for_teams = users_by_group.filter(Q(teams=self.team_2.pk) | Q(teams=self.team_3.pk))
        users_not_in_teams = users_by_group.exclude(Q(teams=self.team_2.pk) | Q(teams=self.team_3.pk))
        for user in users_for_teams:
            self.assertEqual(user["iaso_profile__language"], "fr")
        for user in users_not_in_teams:
            self.assertNotEqual(user["iaso_profile__language"], "fr")

    def test_profile_bulkupdate_task_select_all_but_some(self):
        """POST /api/tasks/create/profilesbulkupdate/ happy path (select all except some)"""

        self.client.force_authenticate(self.user_admin)
        self.user_admin_no_task.iaso_profile.language = "en"
        self.user_admin_no_task.iaso_profile.save()
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": True,
                "language": "fr",
                "unselected_ids": [
                    self.user_admin_no_task.iaso_profile.pk,
                    self.user_admin_no_task2.iaso_profile.pk,
                    self.user_with_no_users_permission.iaso_profile.pk,
                ],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.user_admin)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.user_admin_account2.refresh_from_db()
        self.assertEqual(self.user_admin_account2.iaso_profile.language, "en")
        self.user_admin_no_task_account2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task_account2.iaso_profile.language, "en")
        self.user_admin_account3.refresh_from_db()
        self.assertEqual(self.user_admin_account3.iaso_profile.language, "en")
        self.user_admin_no_task2.refresh_from_db()
        self.assertEqual(self.user_admin_no_task2.iaso_profile.language, "en")
        self.user_admin_no_task.refresh_from_db()
        self.assertEqual(self.user_admin_no_task.iaso_profile.language, "en")
        self.user_admin.refresh_from_db()
        self.assertEqual(self.user_admin.iaso_profile.language, "fr")

        self.assertEqual(5, am.Modification.objects.count())

    def test_profile_bulkupdate_user_without_iaso_team_permission(self):
        """POST /api/tasks/create/profilesbulkupdate/ a user without permission menupermissions.iaso_teams cannot add users to team"""
        user = self.user_managed
        self.assertFalse(user.has_perm(permission.TEAMS))

        self.client.force_authenticate(user)

        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_1.pk,
            ],
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, user)

        # Run the task
        self.runAndValidateTask(task, "ERRORED")
        self.team_1.refresh_from_db()

        self.assertNotIn(
            self.user_admin_no_task,
            self.team_1.users.all(),
        )
        self.assertNotIn(
            self.user_admin_no_task2,
            self.team_1.users.all(),
        )
        # TODO assert no log for teams

    def test_profile_bulkupdate_add_users_to_team(self):
        """POST /api/tasks/create/profilesbulkupdate/ can add users to a team and the users must have same account as the launcher"""
        self.client.force_authenticate(self.add_users_team_launcher_1)
        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_1.pk,
            ],
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.add_users_team_launcher_1)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.team_1.refresh_from_db()
        # check if users with same account as the launcher has been added
        self.assertIn(
            self.user_admin_no_task,
            self.team_1.users.all(),
        )
        self.assertIn(
            self.user_admin_no_task2,
            self.team_1.users.all(),
        )
        # check if users with different account as the launcher has been added
        self.assertNotIn(
            self.user_admin_account2,
            self.team_1.users.all(),
        )
        self.assertNotIn(
            self.user_admin_account3,
            self.team_1.users.all(),
        )
        # TODO assert team logs

    def test_profile_bulkupdate_add_users_to_no_team_of_users(self):
        """POST /api/tasks/create/profilesbulkupdate/ can not add users to a team with no team_of_users type"""
        self.client.force_authenticate(self.add_users_team_launcher_1)
        operation_payload = {
            "select_all": True,
            "teams_id_added": [
                self.team_of_teams.pk,
            ],
        }
        response = self.client.post("/api/tasks/create/profilesbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="profiles_bulk_update")
        self.assertEqual(task.launcher, self.add_users_team_launcher_1)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.team_of_teams.refresh_from_db()
        self.assertNotIn(
            self.user_admin_no_task,
            self.team_of_teams.users.all(),
        )
        self.assertNotIn(
            self.user_admin_no_task2,
            self.team_of_teams.users.all(),
        )

    def test_task_kill(self):
        """Launch the task and then kill it
        Note this actually doesn't work if it's killwed while in the transaction part.
        """

        self.client.force_authenticate(self.user_admin)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
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

        self.client.force_authenticate(self.superuser)
        response = self.client.post(
            "/api/tasks/create/profilesbulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [self.user_admin_no_task.iaso_profile.pk, self.user_admin_no_task2.iaso_profile.pk],
                "language": "fr",
                "location_ids_added": [self.org_unit1.pk],
                "location_ids_removed": [self.org_unit2.pk],
                "projects_ids_added": [
                    self.project_0.pk,
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
        self.assertEqual(task.launcher, self.superuser)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")
        self.assertEqual(4, am.Modification.objects.count())  # 2 users and 2 times team 1
        # Check that user_admin_no_task profile is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={self.user_admin_no_task.iaso_profile.id}"
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
        self.assertEqual(past_value["user"], self.user_admin_no_task.id)
        self.assertEqual(past_value["username"], self.user_admin_no_task.username)
        self.assertEqual(past_value["first_name"], self.user_admin_no_task.first_name)
        self.assertEqual(past_value["last_name"], self.user_admin_no_task.last_name)
        self.assertEqual(past_value["email"], self.user_admin_no_task.email)
        self.assertEqual(len(past_value["user_permissions"]), 1)

        self.assertEqual(past_value["dhis2_id"], self.user_admin_no_task.iaso_profile.dhis2_id)
        self.assertEqual(past_value["language"], "en")
        self.assertEqual(past_value["home_page"], self.user_admin_no_task.iaso_profile.home_page)
        self.assertEqual(
            past_value["phone_number"], self.user_admin_no_task.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEqual(len(past_value["org_units"]), 1)
        self.assertIn(self.org_unit2.id, past_value["org_units"])
        self.assertEqual(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role_2.id, past_value["user_roles"])
        self.assertEqual(len(past_value["projects"]), 1)
        self.assertIn(self.project_2.id, past_value["projects"])
        # New value
        new_value = log["new_value"][0]["fields"]
        self.assertEqual(new_value["user"], self.user_admin_no_task.id)
        self.assertEqual(new_value["username"], self.user_admin_no_task.username)
        self.assertEqual(new_value["first_name"], self.user_admin_no_task.first_name)
        self.assertEqual(new_value["last_name"], self.user_admin_no_task.last_name)
        self.assertEqual(new_value["email"], self.user_admin_no_task.email)
        self.assertEqual(len(new_value["user_permissions"]), 1)

        self.assertEqual(new_value["dhis2_id"], self.user_admin_no_task.iaso_profile.dhis2_id)
        self.assertEqual(new_value["language"], "fr")
        self.assertEqual(new_value["home_page"], self.user_admin_no_task.iaso_profile.home_page)
        self.assertEqual(
            past_value["phone_number"], self.user_admin_no_task.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEqual(len(new_value["org_units"]), 1)
        self.assertIn(self.org_unit1.id, new_value["org_units"])
        self.assertEqual(len(new_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_value["user_roles"])
        self.assertEqual(len(new_value["projects"]), 1)
        self.assertIn(self.project_0.id, new_value["projects"])

        # Check that user_admin_no_task2 profile is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.profile&fields=past_value,new_value&objectId={self.user_admin_no_task2.iaso_profile.id}"
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
        self.assertEqual(past_value["user"], self.user_admin_no_task2.id)
        self.assertEqual(past_value["username"], self.user_admin_no_task2.username)
        self.assertEqual(past_value["first_name"], self.user_admin_no_task2.first_name)
        self.assertEqual(past_value["last_name"], self.user_admin_no_task2.last_name)
        self.assertEqual(past_value["email"], self.user_admin_no_task2.email)
        self.assertEqual(len(past_value["user_permissions"]), 1)
        self.assertNotIn("password", past_value.keys())

        self.assertEqual(past_value["dhis2_id"], self.user_admin_no_task2.iaso_profile.dhis2_id)
        self.assertEqual(past_value["language"], "en")
        self.assertEqual(past_value["home_page"], self.user_admin_no_task2.iaso_profile.home_page)
        self.assertEqual(
            past_value["phone_number"], self.user_admin_no_task2.iaso_profile.phone_number
        )  # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEqual(len(past_value["org_units"]), 1)
        self.assertIn(self.org_unit2.id, past_value["org_units"])
        self.assertEqual(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role_2.id, past_value["user_roles"])
        self.assertEqual(len(past_value["projects"]), 1)
        self.assertIn(self.project_2.id, past_value["projects"])
        # New value
        new_value = log["new_value"][0]["fields"]
        self.assertEqual(new_value["user"], self.user_admin_no_task2.id)
        self.assertEqual(new_value["username"], self.user_admin_no_task2.username)
        self.assertEqual(new_value["first_name"], self.user_admin_no_task2.first_name)
        self.assertEqual(new_value["last_name"], self.user_admin_no_task2.last_name)
        self.assertEqual(new_value["email"], self.user_admin_no_task2.email)
        self.assertEqual(len(new_value["user_permissions"]), 1)
        self.assertNotIn("password", new_value.keys())

        self.assertEqual(new_value["dhis2_id"], self.user_admin_no_task2.iaso_profile.dhis2_id)
        self.assertEqual(new_value["language"], "fr")
        self.assertEqual(new_value["home_page"], self.user_admin_no_task2.iaso_profile.home_page)
        # expected to be null/empty. If there was a value we should add a plus for the value logged
        self.assertEqual(past_value["phone_number"], self.user_admin_no_task2.iaso_profile.phone_number)
        self.assertEqual(len(new_value["org_units"]), 1)
        self.assertIn(self.org_unit1.id, new_value["org_units"])
        self.assertEqual(len(new_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_value["user_roles"])
        self.assertEqual(len(new_value["projects"]), 1)
        self.assertIn(self.project_0.id, new_value["projects"])
        # Check that team 1 is updated
        response = self.client.get(
            f"/api/logs/?contentType=iaso.team&fields=past_value,new_value&objectId={self.team_1.pk}"
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        self.assertEqual(len(logs), 2)
        # Last log should contain both user_admin_no_task and user_admin_no_task2 id
        log = logs[0]
        self.assertIn(self.user_admin_no_task2.pk, log["new_value"][0]["users"])
        self.assertIn(self.user_admin_no_task.pk, log["new_value"][0]["users"])
        # Penultimate log should have neither nor user_admin_no_task2 in past_value
        self.assertNotIn(logs[1]["past_value"][0]["users"], [self.user_admin_no_task.pk, self.user_admin_no_task2.pk])

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
