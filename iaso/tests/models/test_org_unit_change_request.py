from decimal import Decimal

from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError

from iaso import models as m
from iaso.test import TestCase


class OrgUnitChangeRequestModelTestCase(TestCase):
    """
    Test OrgUnitChangeRequest model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(org_unit_type=cls.org_unit_type)

        cls.form = m.Form.objects.create(name="Vaccine form")
        cls.instance = m.Instance.objects.create(form=cls.form, org_unit=cls.org_unit)

        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_create(self):
        new_org_unit_type = m.OrgUnitType.objects.create(name="New org unit type")
        new_parent = m.OrgUnit.objects.create(org_unit_type=new_org_unit_type)
        new_group = m.Group.objects.create(name="new group")
        new_instance = m.Instance.objects.create(form=self.form, org_unit=self.org_unit)

        kwargs = {
            "uuid": "018480e4-b0a7-4be8-96b7-d237f131716e",
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_parent": new_parent,
            "new_name": "New name",
            "new_org_unit_type": new_org_unit_type,
            "new_location": Point(-2.4747713, 47.3358576, 1.3358576),
            "new_location_accuracy": "0.11",
            "approved_fields": [
                "new_parent",
                "new_name",
                "new_org_unit_type",
                "new_groups",
                "new_location",
                "new_reference_instances",
            ],
        }
        change_request = m.OrgUnitChangeRequest(**kwargs)

        change_request.full_clean()
        change_request.save()
        change_request.new_groups.set([new_group])
        change_request.new_reference_instances.set([new_instance])
        change_request.refresh_from_db()

        self.assertEqual(str(change_request.uuid), kwargs["uuid"])
        self.assertEqual(change_request.org_unit, self.org_unit)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.new_parent, new_parent)
        self.assertEqual(change_request.new_name, "New name")
        self.assertEqual(change_request.new_org_unit_type, new_org_unit_type)
        self.assertCountEqual(change_request.new_location, kwargs["new_location"])
        self.assertEqual(change_request.new_location_accuracy, Decimal("0.11"))
        self.assertEqual(change_request.new_groups.count(), 1)
        self.assertEqual(change_request.new_groups.first(), new_group)
        self.assertEqual(change_request.new_reference_instances.count(), 1)
        self.assertEqual(change_request.new_reference_instances.first(), new_instance)
        self.assertCountEqual(change_request.approved_fields, kwargs["approved_fields"])

    def test_clean_approved_fields(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="New name")

        # It should remove duplicates.
        change_request.approved_fields = ["new_name", "new_name"]
        change_request.clean_approved_fields()
        self.assertEqual(change_request.approved_fields, ["new_name"])

        # It should raise for an invalid value.
        change_request.approved_fields = ["new_name", "foo"]
        with self.assertRaises(ValidationError) as error:
            change_request.clean_approved_fields()
        self.assertIn("Value foo is not a valid choice.", error.exception.messages)

        # `clean()` should call `clean_approved_fields()`.
        change_request.approved_fields = ["new_parent", "new_parent"]
        change_request.clean()
        self.assertEqual(change_request.approved_fields, ["new_parent"])

    def test_new_fields(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit)
        expected_fields = [
            "new_parent",
            "new_name",
            "new_org_unit_type",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_reference_instances",
        ]
        self.assertCountEqual(change_request.new_fields, expected_fields)

    def test_requested_fields(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="New name")
        self.assertCountEqual(change_request.requested_fields, ["new_name"])

        change_request.new_org_unit_type = m.OrgUnitType.objects.create(name="New org unit type")
        change_request.new_groups.add(m.Group.objects.create(name="new group"))
        change_request.save()
        self.assertCountEqual(change_request.requested_fields, ["new_name", "new_org_unit_type", "new_groups"])
