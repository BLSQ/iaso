from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import status

from hat.menupermissions import models as am
from iaso import models as m
from iaso.models import QUEUED, Task
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class ReferenceInstanceBulkLinkAPITestCase(TaskAPITestCase):
    BASE_URL = "/api/tasks/create/instanceReferencebulkLink/"

    @classmethod
    def setUpTestData(cls):
        # Preparing account, data source, project, users...
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.user, cls.anon_user, cls.user_no_perms = cls.create_base_users(
            cls.account, ["iaso_submissions", "iaso_org_units"]
        )

        # Preparing form, org unit type & org units
        cls.first_reference_form = m.Form.objects.create(name="first reference form")
        cls.second_reference_form = m.Form.objects.create(name="second reference form")
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type", short_name="OUT")
        cls.org_unit_type.reference_forms.add(cls.first_reference_form, cls.second_reference_form)
        cls.org_unit_type.projects.add(cls.project)
        cls.not_linked_org_unit = m.OrgUnit.objects.create(
            name="No linked org unit",
            source_ref="org unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
            org_unit_type=cls.org_unit_type,
        )
 
        cls.linked_org_unit = m.OrgUnit.objects.create(
            name="Linked org unit",
            source_ref="org unit",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
            org_unit_type=cls.org_unit_type,
        )

        # Preparing reference instances linked and not linked to org unit
        cls.reference_instance_not_linked = cls.create_form_instance(
            form=cls.first_reference_form,
            period="202001",
            org_unit=cls.not_linked_org_unit,
            project=cls.project,
            created_by=cls.user,
            export_id="notLinked",
        )

        cls.reference_instance_linked = cls.create_form_instance(
            form=cls.second_reference_form,
            period="202002",
            org_unit=cls.linked_org_unit,
            project=cls.project,
            created_by=cls.user,
            export_id="linked",
        )
        
        m.OrgUnitReferenceInstance.objects.create(org_unit=cls.linked_org_unit, instance=cls.reference_instance_linked, form=cls.second_reference_form)

    def test_ok(self):
        """POST /api/tasks/create/instanceReferencebulkLink/ without any error nor warning"""

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            data={
                "select_all": False,
                "selected_ids": [self.reference_instance_not_linked.id, self.reference_instance_linked.id],
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
        """POST /api/tasks/create/instanceReferencebulkLink/ without instances permissions"""
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
        """POST /api/tasks/create/instanceReferencebulkLink/ without orgunit permissions"""
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
        """POST /api/tasks/create/instanceReferencebulkLink/ with instance IDs from another account"""
        # Preparing new setup
        new_account, _, _, _ = self.create_account_datasource_version_project(
            "new source", "new account", "new project"
        )
        new_user = self.create_user_with_profile(
            username="new user", account=new_account, permissions=["iaso_submissions", "iaso_org_units"]
        )
        new_first_form = m.Form.objects.create(name="new first form", period_type=m.MONTH, single_per_period=True)
        new_second_form = m.Form.objects.create(name="new second form", period_type=m.MONTH, single_per_period=True)
        new_org_unit_type = m.OrgUnitType.objects.create(name="Org unit type", short_name="OUT")
        new_org_unit_type.reference_forms.add(new_first_form, new_second_form)
        new_not_linked_org_unit = m.OrgUnit.objects.create(
            name="New not linked Org Unit", org_unit_type=new_org_unit_type, source_ref="new org unit", validation_status="VALID"
        )
        new_linked_org_unit = m.OrgUnit.objects.create(
            name="New linked Org Unit", org_unit_type=new_org_unit_type, source_ref="new org unit", validation_status="VALID"
        )

        linked_instance = m.Instance.objects.create(org_unit=new_linked_org_unit, form=new_first_form)
        m.Instance.objects.create(org_unit=new_not_linked_org_unit, form=new_second_form)
        m.OrgUnitReferenceInstance.objects.create(org_unit=new_linked_org_unit, form=new_first_form, instance=linked_instance)

        self.client.force_authenticate(new_user)
        response = self.client.post(
            self.BASE_URL,
            data={
                "select_all": False,
                "selected_ids": [self.reference_instance_not_linked.id, self.reference_instance_linked.id],
            },
            format="json",
        )

        # Task is successfully created but will fail once it starts
        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_reference_bulk_link")
        self.assertEqual(task.launcher, new_user)

        # Let's run the task to see the error
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        self.assertEqual(
            task.result["message"], "No matching instances found"
        )

        self.assertEqual(self.linked_org_unit.reference_instances.filter(id=self.reference_instance_linked.id)[0].id, self.reference_instance_linked.id)
        self.assertEqual(self.not_linked_org_unit.reference_instances.filter(id=self.reference_instance_not_linked.id).count(), 0)
    
    def test_multiple_updates_same_org_unit(self):
        """POST /api/tasks/create/instanceReferencebulkLink/ with instances that target the same orgunit"""
        self.client.force_authenticate(self.user)

        duplicate_reference_instance = self.create_form_instance(
            form=self.second_reference_form,
            period="202001",
            org_unit=self.linked_org_unit,
            project=self.project,
            created_by=self.user,
            export_id="duplicated",
        )

        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_reference_bulk_link")
        self.assertEqual(task.launcher, self.user)

        # It should be an error because the check function returned errors
        self.runAndValidateTask(task, "ERRORED")
        task.refresh_from_db()
        result = task.result["message"]
        self.assertIn("Cannot proceed with the bulk reference submission link or unlink due to errors", result)
        self.assertIn("error_multiple_instances_same_org_unit", result)
        for instance in [
            self.reference_instance_linked,
            duplicate_reference_instance,
        ]:
            self.assertIn(str(instance.org_unit_id), result)

    def test_warning_when_instance_is_not_reference(self):
        """POST /api/tasks/create/instanceReferencebulkLink/ with instances which are not reference"""
        self.client.force_authenticate(self.user)
        not_reference_form = m.Form.objects.create(name="not reference form")
        not_reference_instance = self.create_form_instance(
            form=not_reference_form,
            period="202002",
            org_unit=self.linked_org_unit,
            project=self.project,
            created_by=self.user,
            export_id="not_reference_instance",
        )
        response = self.client.post(
            self.BASE_URL,
            format="json",
        )

        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status="QUEUED", name="instance_reference_bulk_link")
        self.assertEqual(task.launcher, self.user)

        self.runAndValidateTask(task, "SUCCESS")
        task.refresh_from_db()
        result = task.result["message"]
    
        self.assertIn("3 modified", result)
        self.assertNotIn(str(not_reference_instance.id), result)


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
