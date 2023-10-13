import time_machine

from django.contrib.gis.geos import Point

from iaso.api.mobile.org_unit_change_requests import MobileOrgUnitChangeRequestListSerializer
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
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(org_unit_type=cls.org_unit_type)

        cls.form = m.Form.objects.create(name="Vaccine form")
        cls.instance = m.Instance.objects.create(form=cls.form, org_unit=cls.org_unit)

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_serialization_of_change_request(self):
        kwargs = {
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_org_unit_type": self.org_unit_type,
            "new_location": Point(-2.4747713, 47.3358576, 1.3358576),
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
                "new_location": "SRID=4326;POINT Z (-2.4747713 47.3358576 1.3358576)",
                "new_accuracy": None,
                "new_reference_instances": [new_instance.pk],
            },
        )


class MobileOrgUnitChangeRequestAPITestCase(APITestCase):
    """
    Test mobile ViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(org_unit_type=cls.org_unit_type)

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(4):
            # 1. COUNT(*)
            # 2. SELECT OrgUnitChangeRequest
            # 3. PREFETCH OrgUnitChangeRequest.new_groups
            # 4. PREFETCH OrgUnitChangeRequest.new_reference_instances
            response = self.client.get(f"/api/mobile/orgunits/changes/?app_id={self.project.app_id}")
            self.assertJSONResponse(response, 200)
