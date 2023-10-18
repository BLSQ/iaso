import time_machine

from django.contrib.gis.geos import Point

from iaso.api.org_unit_change_requests.serializers import MobileOrgUnitChangeRequestListSerializer
from iaso.test import TestCase
from iaso.test import APITestCase
from iaso import models as m


@time_machine.travel("2023-10-13T13:00:00.000Z", tick=False)
class MobileOrgUnitChangeRequestListSerializerTestCase(TestCase):
    """
    Test mobile list serializer.
    """

    @classmethod
    def setUpTestData(cls):
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(org_unit_type=org_unit_type)

        form = m.Form.objects.create(name="Vaccine form")
        account = m.Account.objects.create(name="Account")
        user = cls.create_user_with_profile(username="user", account=account)

        cls.form = form
        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.user = user

    def test_serialize_change_request_for_mobile(self):
        kwargs = {
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_org_unit_type": self.org_unit_type,
            "new_location": Point(-2.4747713, 47.3358576, 10.0),
            "approved_fields": ["new_org_unit_type"],
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)
        new_group = m.Group.objects.create(name="new group")
        change_request.new_groups.set([new_group])
        new_instance = m.Instance.objects.create(form=self.form, org_unit=self.org_unit)
        change_request.new_reference_instances.set([new_instance])

        serializer = MobileOrgUnitChangeRequestListSerializer(change_request)

        self.assertEqual(
            serializer.data,
            {
                "id": change_request.pk,
                "uuid": str(change_request.uuid),
                "org_unit_id": self.org_unit.pk,
                "org_unit_uuid": self.org_unit.uuid,
                "status": change_request.status.value,
                "approved_fields": ["new_org_unit_type"],
                "rejection_comment": "",
                "created_at": "2023-10-13T13:00:00Z",
                "updated_at": None,
                "new_parent_id": None,
                "new_name": "",
                "new_org_unit_type_id": self.org_unit_type.pk,
                "new_groups": [new_group.pk],
                "new_location": {
                    "latitude": 47.3358576,
                    "longitude": -2.4747713,
                    "altitude": 10.0,
                },
                "new_location_accuracy": None,
                "new_reference_instances": [new_instance.pk],
            },
        )


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
