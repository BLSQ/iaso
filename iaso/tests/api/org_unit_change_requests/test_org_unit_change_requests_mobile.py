import uuid

from iaso import models as m
from iaso.test import APITestCase


class MobileOrgUnitChangeRequestAPITestCase(APITestCase):
    """
    Test mobile ViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.version)
        cls.project_a = m.Project.objects.create(name="Project A", account=cls.account, app_id="project.a")
        cls.project_b = m.Project.objects.create(name="Project B", account=cls.account, app_id="project.b")
        cls.data_source.projects.set([cls.project_a, cls.project_b])

        org_unit_type_a = m.OrgUnitType.objects.create(name="Org unit type A")
        org_unit_type_a.projects.set([cls.project_a])

        org_unit_type_b = m.OrgUnitType.objects.create(name="Org unit type B")
        org_unit_type_b.projects.set([cls.project_b])

        cls.org_unit_a = m.OrgUnit.objects.create(name="A", org_unit_type=org_unit_type_a, version=cls.version)
        cls.org_unit_b = m.OrgUnit.objects.create(name="B", org_unit_type=org_unit_type_b, version=cls.version)

        cls.form_1 = m.Form.objects.create(name="Form 1")
        cls.form_1.projects.set([cls.project_a])
        cls.form_1.save()
        cls.form_2 = m.Form.objects.create(name="Form 2")
        cls.form_2.projects.set([cls.project_a])
        cls.form_2.save()
        # form_3 has no project associated
        cls.form_3 = m.Form.objects.create(name="Form 3")

        cls.form_version_1 = m.FormVersion.objects.create(form=cls.form_1, version_id=1)
        cls.form_version_2 = m.FormVersion.objects.create(form=cls.form_2, version_id=1)
        cls.form_version_3 = m.FormVersion.objects.create(form=cls.form_3, version_id=1)

        cls.instance_1 = m.Instance.objects.create(
            form=cls.form_1,
            org_unit=cls.org_unit_a,
            uuid=uuid.uuid4(),
            json={"key": "value"},
            form_version=cls.form_version_1,
            project=cls.project_a,
        )
        cls.instance_2 = m.Instance.objects.create(
            form=cls.form_2,
            org_unit=cls.org_unit_a,
            uuid=uuid.uuid4(),
            json={"key": "value"},
            form_version=cls.form_version_2,
            project=cls.project_a,
        )
        cls.instance_3 = m.Instance.objects.create(
            form=cls.form_3,
            org_unit=cls.org_unit_a,
            uuid=uuid.uuid4(),
            json={"key": "value"},
            form_version=cls.form_version_3,
            project=cls.project_a,
        )

        m.OrgUnitReferenceInstance.objects.create(org_unit=cls.org_unit_a, form=cls.form_1, instance=cls.instance_1)
        m.OrgUnitReferenceInstance.objects.create(org_unit=cls.org_unit_a, form=cls.form_2, instance=cls.instance_2)

        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=["iaso_org_unit_change_request"]
        )
        cls.user.iaso_profile.org_units.set([cls.org_unit_a, cls.org_unit_b])

        cls.user2 = cls.create_user_with_profile(
            username="user2", account=cls.account, permissions=["iaso_org_unit_change_request"]
        )

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_a, new_name="Foo", created_by=self.user)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_a, new_name="Bar", created_by=self.user2)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_a, new_name="Ding", created_by=self.user)

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(8):
            # filter_for_user_and_app_id
            #   1. SELECT OrgUnit
            #   2. SELECT Project
            #   3. SELECT Account
            #   4. SELECT SourceVersion
            # get_queryset
            #   5. COUNT(*) OrgUnitChangeRequest
            #   6. SELECT OrgUnitChangeRequest
            #   8. PREFETCH OrgUnitChangeRequest.new_groups
            #   8. PREFETCH OrgUnitChangeRequest.new_reference_instances
            response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data["results"]))

    def test_list_should_be_filtered_by_project_via_orgunittype(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_b, new_name="Foo", created_by=self.user)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_a, new_name="Bar", created_by=self.user)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit_a, new_name="Ding", created_by=self.user)

        self.client.force_authenticate(self.user)

        # This should return only change requests related to `self.project_b`.
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_b.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(response.data["results"][0]["org_unit_id"], self.org_unit_b.pk)

    def test_list_should_be_filtered_by_project_via_new_reference_instances(self):
        # The `change_request` is related to project A via new_reference_instances -> project.
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit_a, new_name="Foo", created_by=self.user, requested_fields=["new_reference_instances"]
        )
        self.assertEqual(change_request.org_unit.org_unit_type.projects.count(), 1)
        self.assertEqual(change_request.org_unit.org_unit_type.projects.first(), self.project_a)

        # The `new_reference_instances` is related to project A.
        change_request.new_reference_instances.set([self.instance_1.pk])
        self.assertEqual(change_request.new_reference_instances.count(), 1)
        self.assertEqual(change_request.new_reference_instances.first().project, self.project_a)

        self.client.force_authenticate(self.user)

        # Get Change Requests for project A
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))

        # Get Change Requests for project B
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_b.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_should_be_filtered_by_project_via_new_reference_instances_when_form_removed_from_project(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit_a, new_name="Foo", created_by=self.user, requested_fields=["new_reference_instances"]
        )
        self.assertEqual(change_request.org_unit.org_unit_type.projects.count(), 1)
        self.assertEqual(change_request.org_unit.org_unit_type.projects.first(), self.project_a)

        # The `new_reference_instances` is related to project A.
        change_request.new_reference_instances.set([self.instance_3.pk])
        self.assertEqual(change_request.new_reference_instances.count(), 1)
        self.assertEqual(change_request.new_reference_instances.first().project, self.project_a)

        self.client.force_authenticate(self.user)

        # We expect no results as instance_3 is attached to a form which is attached to no project.
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_should_be_filtered_by_project_via_new_reference_instances_when_instance_project_is_null(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit_a, new_name="Foo", created_by=self.user, requested_fields=["new_reference_instances"]
        )
        self.assertEqual(change_request.org_unit.org_unit_type.projects.count(), 1)
        self.assertEqual(change_request.org_unit.org_unit_type.projects.first(), self.project_a)

        # The `new_reference_instances` is related to no project.
        instance = m.Instance.objects.create(
            form=self.form_1,
            org_unit=self.org_unit_a,
            uuid=uuid.uuid4(),
            json={"key": "value"},
            form_version=self.form_version_1,
            project=None,
        )
        change_request.new_reference_instances.set([self.instance_1, instance.pk])
        self.assertEqual(change_request.new_reference_instances.count(), 2)
        self.assertEqual(change_request.new_reference_instances.first().project, self.project_a)
        self.assertEqual(change_request.new_reference_instances.all()[1].project, None)

        self.client.force_authenticate(self.user)

        # We expect no results as instance is attached to no project.
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_should_not_include_change_requests_linked_to_data_source_synchronization(self):
        self.client.force_authenticate(self.user)

        version2 = m.SourceVersion.objects.create(number=2, data_source=self.data_source)
        data_source_synchronization = m.DataSourceVersionsSynchronization.objects.create(
            name="New synchronization",
            source_version_to_update=self.version,
            source_version_to_compare_with=version2,
            account=self.account,
            created_by=self.user,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit_a,
            new_name="Foo",
            created_by=self.user,
            data_source_synchronization=data_source_synchronization,
        )

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_should_not_include_soft_deleted_intances(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit_a, new_name="Foo", created_by=self.user, requested_fields=["new_reference_instances"]
        )
        change_request.new_reference_instances.set([self.instance_1.pk])

        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(len(response.data["results"][0]["new_reference_instances"]), 1)
        self.assertEqual(response.data["results"][0]["new_reference_instances"][0]["id"], self.instance_1.pk)

        # Soft delete instance.
        self.instance_1.deleted = True
        self.instance_1.save()

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project_a.app_id}")
        self.assertJSONResponse(response, 401)
