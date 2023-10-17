from django.contrib.gis.geos import Point

from iaso.api.org_unit_change_requests.serializers import InstanceForChangeRequest, OrgUnitForChangeRequest
from iaso.test import TestCase
from iaso import models as m


class InstanceForChangeRequestTestCase(TestCase):
    """
    Test `InstanceForChangeRequest`.
    """

    @classmethod
    def setUpTestData(cls):
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(org_unit_type=org_unit_type)
        form = m.Form.objects.create(name="Vaccine form")
        instance = m.Instance.objects.create(form=form, org_unit=org_unit, json={"key1": "value1", "key2": "value2"})

        cls.form = form
        cls.instance = instance

    def test_serialize_instance(self):
        serializer = InstanceForChangeRequest(self.instance)
        self.assertEqual(
            serializer.data,
            {
                "id": self.instance.pk,
                "form_id": self.form.pk,
                "form_name": "Vaccine form",
                "values": {
                    "key1": "value1",
                    "key2": "value2",
                },
            },
        )


class OrgUnitForChangeRequestTestCase(TestCase):
    """
    Test `OrgUnitForChangeRequest`.
    """

    @classmethod
    def setUpTestData(cls):
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(org_unit_type=org_unit_type, location=Point(-2.4747713, 47.3358576, 10.0))
        org_unit.groups.set([m.Group.objects.create(name="Group 1"), m.Group.objects.create(name="Group 2")])
        form = m.Form.objects.create(name="Vaccine form")
        instance = m.Instance.objects.create(form=form, org_unit=org_unit, json={"key1": "value1", "key2": "value2"})
        # Mark `instance` as a reference instance of `form` for `org_unit`.
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, instance=instance, form=form)

        cls.form = form
        cls.instance = instance
        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type

    def test_serialize_org_unit(self):
        serializer = OrgUnitForChangeRequest(self.org_unit)
        self.assertEqual(
            serializer.data,
            {
                "id": self.org_unit.pk,
                "parent": "",
                "name": "",
                "org_unit_type_id": self.org_unit_type.pk,
                "org_unit_type_name": "Org unit type",
                "groups": ["Group 1", "Group 2"],
                "location": {
                    "latitude": 47.3358576,
                    "longitude": -2.4747713,
                    "altitude": 10.0,
                },
                "reference_instances": [
                    {
                        "id": self.instance.pk,
                        "form_id": self.form.pk,
                        "form_name": "Vaccine form",
                        "values": {
                            "key1": "value1",
                            "key2": "value2",
                        },
                    }
                ],
            },
        )
