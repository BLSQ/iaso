from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from rest_framework import status

from hat.menupermissions import models as am
from iaso import models as m
from iaso.models import QUEUED, Task
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class InstanceBulkPushGpsAPITestCase(TaskAPITestCase):
    BASE_URL = "/api/tasks/create/instancebulkgpspush/"

    @classmethod
    def setUpTestData(cls):
        # Preparing account, data source, project, users...
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.user, cls.anon_user, cls.user_no_perms = cls.create_base_users(
            cls.account, ["iaso_submissions", "iaso_org_units"]
        )

        # Preparing org units & locations
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type", short_name="OUT")
        cls.org_unit_type.projects.add(cls.project)
        cls.org_unit_no_location = m.OrgUnit.objects.create(
            name="No location",
            source_ref="org unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
            org_unit_type=cls.org_unit_type,
        )
        cls.default_location = Point(x=4, y=50, z=100, srid=4326)
        cls.other_location = Point(x=2, y=-50, z=100, srid=4326)
        cls.org_unit_with_default_location = m.OrgUnit.objects.create(
            name="Default location",
            source_ref="org unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            location=cls.default_location,
            version=cls.source_version,
            org_unit_type=cls.org_unit_type,
        )
        cls.org_unit_with_other_location = m.OrgUnit.objects.create(
            name="Other location",
            source_ref="org unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            location=cls.other_location,
            version=cls.source_version,
            org_unit_type=cls.org_unit_type,
        )

        # Preparing instances - all linked to org_unit_without_location
        cls.form = m.Form.objects.create(name="form", period_type=m.MONTH, single_per_period=True)
        cls.instance_without_location = cls.create_form_instance(
            form=cls.form,
            period="202001",
            org_unit=cls.org_unit_no_location,
            project=cls.project,
            created_by=cls.user,
            export_id="noLoc",
        )
        cls.instance_with_default_location = cls.create_form_instance(
            form=cls.form,
            period="202002",
            org_unit=cls.org_unit_no_location,
            project=cls.project,
            created_by=cls.user,
            export_id="defaultLoc",
            location=cls.default_location,
        )
        cls.instance_with_other_location = cls.create_form_instance(
            form=cls.form,
            period="202003",
            org_unit=cls.org_unit_no_location,
            project=cls.project,
            created_by=cls.user,
            export_id="otherLoc",
            location=cls.other_location,
        )

    def test_ok(self):
        """POST /api/tasks/create/instancebulkgpspush/ without any error nor warning"""

        # Setting up one more instance and orgunit
        new_org_unit = m.OrgUnit.objects.create(
            name="new org unit",
            org_unit_type=self.org_unit_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=self.source_version,
            source_ref="new org unit",
        )
        new_instance = m.Instance.objects.create(
            org_unit=new_org_unit,
            form=self.form,
            period="202004",
            project=self.project,
            created_by=self.user,
            export_id="instance4",
        )

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            data={
                "select_all": False,
                "selected_ids": [self.instance_without_location.id, new_instance.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

    def test_not_logged_in(self):
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_no_permission_instances(self):
        """POST /api/tasks/create/instancebulkgpspush/ without instances permissions"""
        # Adding org unit permission to user
        content_type = ContentType.objects.get_for_model(am.CustomPermissionSupport)
        self.user_no_perms.user_permissions.add(
            Permission.objects.filter(codename="iaso_org_units", content_type=content_type).first().id
        )

        self.client.force_authenticate(self.user_no_perms)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_no_permission_org_units(self):
        """POST /api/tasks/create/instancebulkgpspush/ without orgunit permissions"""
        # Adding instances permission to user
        content_type = ContentType.objects.get_for_model(am.CustomPermissionSupport)
        self.user_no_perms.user_permissions.add(
            Permission.objects.filter(codename="iaso_submissions", content_type=content_type).first().id
        )

        self.client.force_authenticate(self.user_no_perms)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_instance_ids_wrong_account(self):
        """POST /api/tasks/create/instancebulkgpspush/ with instance IDs from another account"""
        # Preparing new setup
        new_account, new_data_source, _, new_project = self.create_account_datasource_version_project(
            "new source", "new account", "new project"
        )
        new_user = self.create_user_with_profile(
            username="new user", account=new_account, permissions=["iaso_submissions", "iaso_org_units"]
        )
        new_org_unit = m.OrgUnit.objects.create(
            name="New Org Unit", source_ref="new org unit", validation_status="VALID"
        )
        new_form = m.Form.objects.create(name="new form", period_type=m.MONTH, single_per_period=True)
        _ = self.create_form_instance(
            form=new_form,
            period="202001",
            org_unit=new_org_unit,
            project=new_project,
            created_by=new_user,
            export_id="Vzhn0nceudr",
            location=Point(1, 2, 3, 4326),
        )

        self.client.force_authenticate(new_user)
        response = self.client.post(
            self.BASE_URL,
            data={
                "select_all": False,
                "selected_ids": [self.instance_without_location.id, self.instance_with_default_location.id],
            },
            format="json",
        )

        # Task is successfully created but will fail once it starts
        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, new_user)

        # Let's run the task to see the error
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        self.assertEqual(
            task.result["message"], "No matching instances found"
        )  # Because the instance IDs are from another account

        # Making sure that nothing changed in both accounts
        self.assertIsNone(new_org_unit.location)
        self.assertIsNone(self.org_unit_no_location.location)
        self.assertEqual(self.org_unit_with_default_location.location, self.default_location)

    def test_overwrite_existing_location(self):
        """POST /api/tasks/create/instancebulkgpspush/ with instances that overwrite existing org unit locations"""
        # Setting a new location for both org_units
        location = Point(42, 69, 420, 4326)
        for org_unit in [self.org_unit_with_default_location, self.org_unit_with_other_location]:
            org_unit.location = location
            org_unit.save()

        # Linking both instances to these org_units
        self.instance_with_default_location.org_unit = self.org_unit_with_default_location
        self.instance_with_default_location.save()
        self.instance_with_other_location.org_unit = self.org_unit_with_other_location
        self.instance_with_other_location.save()

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            data={
                "select_all": False,
                "selected_ids": [self.instance_with_default_location.id, self.instance_with_other_location.id],
            },
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, self.user)

        # It should be a success
        self.runAndValidateTask(task, "SUCCESS")

        self.org_unit_with_default_location.refresh_from_db()
        self.org_unit_with_other_location.refresh_from_db()
        self.assertEqualLocations(self.org_unit_with_default_location.location, self.default_location)
        self.assertEqualLocations(self.org_unit_with_other_location.location, self.other_location)
        self.assertIsNone(self.org_unit_no_location.location)

    def test_no_location(self):
        """POST /api/tasks/create/instancebulkgpspush/ with instances that don't have any location defined"""
        # Let's create another instance without a location, but this time it's linked to self.org_unit_with_default_location
        _ = m.Instance.objects.create(
            form=self.form,
            period="202001",
            org_unit=self.org_unit_with_default_location,
            project=self.project,
            created_by=self.user,
            export_id="noLoc",
        )

        self.client.force_authenticate(self.user)
        # For a change, let's select everything, but remove the two instances with a location
        # (= it's the same as electing both instances without location)
        response = self.client.post(
            self.BASE_URL,
            data={
                "unselected_ids": [self.instance_with_default_location.id, self.instance_with_other_location.id],
            },
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, self.user)

        # It should be a success
        self.runAndValidateTask(task, "SUCCESS")

        self.org_unit_with_default_location.refresh_from_db()
        self.org_unit_no_location.refresh_from_db()
        self.assertIsNone(self.org_unit_with_default_location.location)  # Got overwritten by None
        self.assertIsNone(self.org_unit_no_location.location)  # Still None
        self.assertEqualLocations(self.org_unit_with_other_location.location, self.other_location)  # Not updated

    def test_multiple_updates_same_org_unit(self):
        """POST /api/tasks/create/instancebulkgpspush/ with instances that target the same orgunit"""
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, self.user)

        # It should be an error because the check function returned errors
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        result = task.result["message"]
        self.assertIn("Cannot proceed with the gps push due to errors", result)
        self.assertIn("error_same_org_unit", result)
        for instance in [
            self.instance_without_location,
            self.instance_with_other_location,
            self.instance_with_default_location,
        ]:
            self.assertIn(str(instance.org_unit_id), result)

    def test_read_only_data_source(self):
        """POST /api/tasks/create/instancebulkgpspush/ with instances that target orgunits which are part of a read-only data source"""
        self.data_source.read_only = True
        self.data_source.save()
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, self.user)

        # It should be an error because the check function returned errors
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        result = task.result["message"]
        self.assertIn("Cannot proceed with the gps push due to errors", result)
        self.assertIn("error_read_only_source", result)
        for instance in [
            self.instance_without_location,
            self.instance_with_other_location,
            self.instance_with_default_location,
        ]:
            self.assertIn(str(instance.org_unit_id), result)

    def test_all_errors(self):
        """POST /api/tasks/create/instancebulkgpspush/ all errors are triggered"""
        # Preparing a new read-only data source
        new_data_source = m.DataSource.objects.create(name="new data source", read_only=True)
        new_version = m.SourceVersion.objects.create(data_source=new_data_source, number=2)
        new_data_source.projects.set([self.project])
        new_org_unit = m.OrgUnit.objects.create(
            name="new org unit",
            org_unit_type=self.org_unit_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=new_version,
            source_ref="new org unit",
        )
        new_instance = m.Instance.objects.create(
            org_unit=new_org_unit,
            form=self.form,
            period="202004",
            project=self.project,
            created_by=self.user,
            export_id="instance4",
            location=self.default_location,
        )

        # Changing this org unit so that it does not trigger error_same_org_unit
        self.instance_with_default_location.org_unit = self.org_unit_with_default_location
        self.instance_with_default_location.save()

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_bulk_gps_push")
        self.assertEqual(task.launcher, self.user)

        # It should be an error because the check function returned errors
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        result = task.result["message"]
        self.assertIn("Cannot proceed with the gps push due to errors", result)
        self.assertIn("error_read_only_source", result)
        self.assertIn("error_same_org_unit", result)
        for instance in [self.instance_without_location, self.instance_with_other_location, new_instance]:
            self.assertIn(
                str(instance.org_unit_id), result
            )  # Instead, we should probably check in which error they end up
        self.assertNotIn(str(self.instance_with_default_location.org_unit_id), result)

    def test_task_kill(self):
        """Launch the task and then kill it
        Note this actually doesn't work if it's killed while in the transaction part.
        """
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertValidTaskAndInDB(data["task"])

        task = Task.objects.get(id=data["task"]["id"])
        task.should_be_killed = True
        task.save()

        self.runAndValidateTask(task, "KILLED")

    def assertEqualLocations(self, point_1: Point, point_2: Point):
        self.assertEqual(point_1.x, point_2.x)
        self.assertEqual(point_1.y, point_2.y)
        self.assertEqual(point_1.z, point_2.z)
        self.assertEqual(point_1.srid, point_2.srid)
