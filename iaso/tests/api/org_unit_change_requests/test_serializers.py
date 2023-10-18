import uuid

from django.contrib.gis.geos import Point

from iaso.api.org_unit_change_requests.serializers import (
    InstanceForChangeRequest,
    OrgUnitForChangeRequest,
    OrgUnitChangeRequestWriteSerializer,
)
from iaso.models import OrgUnitChangeRequest
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


class OrgUnitChangeRequestWriteSerializerTestCase(TestCase):
    """
    Test `OrgUnitChangeRequestWriteSerializer`.
    """

    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type, location=Point(-2.4747713, 47.3358576, 10.0)
        )

    def test_deserialize_change_request(self):
        data = {
            "uuid": "e05933f4-8370-4329-8cf5-197941785a24",
            "org_unit_id": self.org_unit.id,
            "new_name": "Foo",
        }
        serializer = OrgUnitChangeRequestWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_deserialize_change_request_generate_uuid_if_not_provided(self):
        data = {
            "org_unit_id": self.org_unit.id,
            "new_name": "Foo",
        }
        serializer = OrgUnitChangeRequestWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertTrue(isinstance(serializer.validated_data["uuid"], uuid.UUID))

    def test_deserialize_change_request_missing_new_fields(self):
        data = {
            "org_unit_id": self.org_unit.id,
        }
        serializer = OrgUnitChangeRequestWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("You must provide at least one of the following fields", serializer.errors["non_field_errors"][0])

    def test_deserialize_change_request_full(self):
        group1 = m.Group.objects.create(name="Group 1")
        group2 = m.Group.objects.create(name="Group 2")

        form1 = m.Form.objects.create(name="Vaccine form 1")
        instance1 = m.Instance.objects.create(form=form1, org_unit=self.org_unit)
        form2 = m.Form.objects.create(name="Vaccine form 2")
        instance2 = m.Instance.objects.create(form=form2, org_unit=self.org_unit)

        data = {
            "uuid": "e05933f4-8370-4329-8cf5-197941785a24",
            "org_unit_id": self.org_unit.id,
            "new_parent_id": self.org_unit.id,
            "new_name": "Foo",
            "new_org_unit_type_id": self.org_unit_type.id,
            "new_groups": [group1.id, group2.id],
            "new_location": {
                "latitude": 47.3358576,
                "longitude": -2.4747713,
                "altitude": 10.0,
            },
            "new_location_accuracy": 4.0,
            "new_reference_instances": [instance1.id, instance2.id],
        }
        serializer = OrgUnitChangeRequestWriteSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        serializer.save()

        change_request = OrgUnitChangeRequest.objects.get(uuid=data["uuid"])
        self.assertEqual(change_request.org_unit, self.org_unit)
        self.assertEqual(change_request.new_parent, self.org_unit)
        self.assertEqual(change_request.new_name, "Foo")
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        new_groups = change_request.new_groups.all()
        self.assertIn(group1, new_groups)
        self.assertIn(group2, new_groups)
        self.assertEqual(change_request.new_location, Point(-2.4747713, 47.3358576, 10.0, srid=4326))
        self.assertEqual(change_request.new_location_accuracy, 4.0)
        new_reference_instances = change_request.new_reference_instances.all()
        self.assertIn(instance1, new_reference_instances)
        self.assertIn(instance2, new_reference_instances)
