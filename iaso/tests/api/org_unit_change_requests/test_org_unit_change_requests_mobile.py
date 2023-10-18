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

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.org_unit = org_unit
        cls.project = project
        cls.user = user

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(10):
            # permission_classes
            #   1. SELECT User perms
            #   2. SELECT Group perms
            # filter_for_user_and_app_id
            #   3. SELECT OrgUnit
            #   4. SELECT Project
            #   5. SELECT Account
            #   6. SELECT SourceVersion
            # get_queryset
            #   7. COUNT(*) OrgUnitChangeRequest
            #   8. SELECT OrgUnitChangeRequest
            #   9. PREFETCH OrgUnitChangeRequest.new_groups
            #  10. PREFETCH OrgUnitChangeRequest.new_reference_instances
            response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))

    def test_list_without_auth(self):
        response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
        self.assertJSONResponse(response, 403)
