from iaso.test import APITestCase
from iaso import models as m


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

        user = cls.create_user_with_profile(
            username="user", account=account, permissions=["iaso_org_unit_change_request"]
        )
        user2 = cls.create_user_with_profile(
            username="user2", account=account, permissions=["iaso_org_unit_change_request"]
        )

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.org_unit = org_unit
        cls.project = project
        cls.user = user
        cls.user2 = user2

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

    def test_list_without_auth(self):
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 403)
