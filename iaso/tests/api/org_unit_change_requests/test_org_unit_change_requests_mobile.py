from iaso import models as m
from iaso.test import APITestCase


class MobileOrgUnitChangeRequestAPITestCase(APITestCase):
    """
    Test mobile ViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")

        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(org_unit_type=org_unit_type, version=version)

        form_1 = m.Form.objects.create(name="Form 1")
        form_2 = m.Form.objects.create(name="Form 2")
        instance_1 = m.Instance.objects.create(form=form_1, org_unit=org_unit)
        instance_2 = m.Instance.objects.create(form=form_2, org_unit=org_unit)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form_1, instance=instance_1)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form_2, instance=instance_2)

        user = cls.create_user_with_profile(
            username="user", account=account, permissions=["iaso_org_unit_change_request"]
        )
        user2 = cls.create_user_with_profile(
            username="user2", account=account, permissions=["iaso_org_unit_change_request"]
        )

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.account = account
        cls.data_source = data_source
        cls.instance_1 = instance_1
        cls.instance_2 = instance_2
        cls.org_unit = org_unit
        cls.project = project
        cls.user = user
        cls.user2 = user2
        cls.version = version

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo", created_by=self.user)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar", created_by=self.user2)
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Ding", created_by=self.user)

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
            response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data["results"]))

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
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            data_source_synchronization=data_source_synchronization,
        )

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_should_not_include_soft_deleted_intances(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit, new_name="Foo", created_by=self.user, requested_fields=["new_reference_instances"]
        )
        change_request.new_reference_instances.set([self.instance_1.pk])

        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(len(response.data["results"][0]["new_reference_instances"]), 1)
        self.assertEqual(response.data["results"][0]["new_reference_instances"][0]["id"], self.instance_1.pk)

        # Soft delete instance.
        self.instance_1.deleted = True
        self.instance_1.save()

        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 401)
