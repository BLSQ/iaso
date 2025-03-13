import datetime

from decimal import Decimal

import time_machine

from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError

from hat.audit.models import Modification
from iaso import models as m
from iaso.test import TestCase


class OrgUnitChangeRequestModelTestCase(TestCase):
    """
    Test OrgUnitChangeRequest model.
    """

    DT = datetime.datetime(2023, 10, 18, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        parent = m.OrgUnit.objects.create(org_unit_type=org_unit_type)
        org_unit = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type,
            name="Hôpital Général",
            parent=parent,
            location=Point(-1.1111111, 1.1111111, 1.1111111),
            opening_date=datetime.date(2020, 1, 1),
            closed_date=datetime.date(2055, 1, 1),
        )

        form = m.Form.objects.create(name="Vaccine form")

        account = m.Account.objects.create(name="Account")
        user = cls.create_user_with_profile(username="user", account=account)

        new_parent = m.OrgUnit.objects.create(org_unit_type=org_unit_type)
        new_org_unit_type = m.OrgUnitType.objects.create(name="New org unit type")

        new_group1 = m.Group.objects.create(name="Group 1")
        new_group2 = m.Group.objects.create(name="Group 2")
        org_unit.groups.set([new_group1])

        other_form = m.Form.objects.create(name="Other form")
        new_instance1 = m.Instance.objects.create(form=form, org_unit=org_unit)
        new_instance2 = m.Instance.objects.create(form=other_form, org_unit=org_unit)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form, instance=new_instance1)

        cls.form = form
        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.user = user

        cls.new_group1 = new_group1
        cls.new_group2 = new_group2
        cls.new_instance1 = new_instance1
        cls.new_instance2 = new_instance2
        cls.new_org_unit_type = new_org_unit_type
        cls.parent = parent
        cls.new_parent = new_parent

    @time_machine.travel(DT, tick=False)
    def test_create(self):
        kwargs = {
            "uuid": "018480e4-b0a7-4be8-96b7-d237f131716e",
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_parent": self.new_parent,
            "new_name": "New name",
            "new_org_unit_type": self.new_org_unit_type,
            "new_location": Point(-2.4747713, 47.3358576, 1.3358576),
            "new_location_accuracy": "0.11",
            "new_opening_date": datetime.date(2022, 10, 27),
            "new_closed_date": datetime.date(2024, 10, 27),
            "requested_fields": [
                "new_parent",
                "new_name",
                "new_org_unit_type",
                "new_groups",
                "new_location",
                "new_location_accuracy",
                "new_opening_date",
                "new_closed_date",
                "new_reference_instances",
            ],
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
        change_request.new_groups.set([self.new_group1])
        change_request.new_reference_instances.set([self.new_instance1])
        change_request.refresh_from_db()

        self.assertEqual(str(change_request.uuid), kwargs["uuid"])
        self.assertEqual(change_request.org_unit, self.org_unit)
        self.assertEqual(change_request.kind, change_request.Kind.ORG_UNIT_CREATION)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertIsNone(change_request.updated_by)
        self.assertEqual(change_request.new_parent, self.new_parent)
        self.assertEqual(change_request.new_name, "New name")
        self.assertEqual(change_request.new_org_unit_type, self.new_org_unit_type)
        self.assertCountEqual(change_request.new_location, kwargs["new_location"])
        self.assertEqual(change_request.new_location_accuracy, Decimal("0.11"))
        self.assertEqual(change_request.new_opening_date, datetime.date(2022, 10, 27))
        self.assertEqual(change_request.new_closed_date, datetime.date(2024, 10, 27))
        self.assertEqual(change_request.new_groups.count(), 1)
        self.assertEqual(change_request.new_groups.first(), self.new_group1)
        self.assertEqual(change_request.new_reference_instances.count(), 1)
        self.assertEqual(change_request.new_reference_instances.first(), self.new_instance1)
        self.assertCountEqual(change_request.requested_fields, kwargs["requested_fields"])
        self.assertCountEqual(change_request.approved_fields, kwargs["approved_fields"])
        # Change request old values.
        self.assertEqual(change_request.old_parent, self.org_unit.parent)
        self.assertEqual(change_request.old_name, "Hôpital Général")
        self.assertEqual(change_request.old_org_unit_type, self.org_unit.org_unit_type)
        self.assertCountEqual(change_request.old_groups.all(), [self.new_group1])
        self.assertEqual(change_request.old_location, "SRID=4326;POINT Z (-1.1111111 1.1111111 1.1111111)")
        self.assertEqual(change_request.old_opening_date, datetime.date(2020, 1, 1))
        self.assertEqual(change_request.old_closed_date, datetime.date(2055, 1, 1))
        self.assertCountEqual(change_request.old_reference_instances.all(), [self.new_instance1])

        # Ensure updating a change_request won't override old values.
        change_request.org_unit.name = "Another name"
        change_request.org_unit.save()
        change_request.save()
        self.assertEqual(change_request.old_name, "Hôpital Général")

    def test_kind(self):
        self.org_unit.validation_status = self.org_unit.VALIDATION_VALID
        self.org_unit.save()
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit)
        self.assertEqual(change_request.kind, change_request.Kind.ORG_UNIT_CHANGE)

        self.org_unit.validation_status = self.org_unit.VALIDATION_NEW
        self.org_unit.save()
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit)
        self.assertEqual(change_request.kind, change_request.Kind.ORG_UNIT_CREATION)

    def test_clean_approved_fields(self):
        approved_fields = ["new_name", "foo"]
        change_request = m.OrgUnitChangeRequest(org_unit=self.org_unit, approved_fields=approved_fields)
        with self.assertRaises(ValidationError) as error:
            change_request.clean_approved_fields()
        self.assertIn("Value foo is not a valid choice.", error.exception.messages)

    def test_clean_new_dates(self):
        change_request = m.OrgUnitChangeRequest(
            org_unit=self.org_unit,
            new_opening_date=datetime.date(2022, 10, 27),
            new_closed_date=datetime.date(2021, 10, 27),
        )
        with self.assertRaises(ValidationError) as error:
            change_request.clean_new_dates()
        self.assertIn("Closing date must be later than opening date.", error.exception.messages)

    def test_get_new_fields(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit)
        expected_fields = [
            "new_parent",
            "new_name",
            "new_org_unit_type",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_opening_date",
            "new_closed_date",
            "new_reference_instances",
        ]
        self.assertCountEqual(change_request.get_new_fields(), expected_fields)

    @time_machine.travel(DT, tick=False)
    def test_reject(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="New name")
        change_request.reject(user=self.user, rejection_comment="Foo Bar Baz.")
        self.assertEqual(change_request.status, change_request.Statuses.REJECTED)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.updated_by, self.user)
        self.assertEqual(change_request.rejection_comment, "Foo Bar Baz.")
        self.assertEqual(change_request.org_unit.validation_status, m.OrgUnit.VALIDATION_REJECTED)

    @time_machine.travel(DT, tick=False)
    def test_approve(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="New name given in a change request",
            new_parent=self.new_parent,
            new_org_unit_type=self.new_org_unit_type,
            new_location=Point(-2.4747713, 47.3358576, 1.3358576),
            new_location_accuracy=None,
            new_opening_date=datetime.date(2023, 10, 27),
            new_closed_date=datetime.date(2025, 10, 27),
        )
        change_request.new_groups.set([self.new_group1, self.new_group2])
        change_request.new_reference_instances.set([self.new_instance1, self.new_instance2])

        approved_fields = [
            "new_name",
            "new_parent",
            "new_org_unit_type",
            "new_location",
            "new_location_accuracy",
            "new_opening_date",
            "new_closed_date",
            "new_groups",
            "new_reference_instances",
        ]
        change_request.approve(user=self.user, approved_fields=approved_fields)
        change_request.refresh_from_db()

        # Change request.
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)
        self.assertEqual(change_request.kind, change_request.Kind.ORG_UNIT_CREATION)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.updated_by, self.user)
        self.assertCountEqual(change_request.approved_fields, approved_fields)

        # Org Unit.
        self.assertEqual(self.org_unit.validation_status, self.org_unit.VALIDATION_VALID)
        self.assertEqual(self.org_unit.name, "New name given in a change request")
        self.assertEqual(self.org_unit.parent, self.new_parent)
        self.assertEqual(self.org_unit.org_unit_type, self.new_org_unit_type)
        self.assertEqual(self.org_unit.location, "SRID=4326;POINT Z (-2.4747713 47.3358576 1.3358576)")
        self.assertEqual(self.org_unit.opening_date, datetime.date(2023, 10, 27))
        self.assertEqual(self.org_unit.closed_date, datetime.date(2025, 10, 27))
        self.assertCountEqual(self.org_unit.groups.all(), [self.new_group1, self.new_group2])
        self.assertCountEqual(self.org_unit.reference_instances.all(), [self.new_instance1, self.new_instance2])

        # Logs.
        modification = Modification.objects.get(object_id=self.org_unit.pk)
        diff = modification.field_diffs()
        self.assertIn("name", diff["modified"])
        self.assertIn("parent", diff["modified"])
        self.assertIn("org_unit_type", diff["modified"])
        self.assertIn("location", diff["modified"])

        self.assertEqual(diff["modified"]["name"]["before"], "Hôpital Général")
        self.assertEqual(diff["modified"]["name"]["after"], "New name given in a change request")

    @time_machine.travel(DT, tick=False)
    def test_approve_with_erasing(self):
        self.assertEqual(self.org_unit.location, "SRID=4326;POINT Z (-1.1111111 1.1111111 1.1111111)")
        self.assertEqual(self.org_unit.opening_date, datetime.date(2020, 1, 1))
        self.assertEqual(self.org_unit.closed_date, datetime.date(2055, 1, 1))

        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            # Explicitly ask for `new_location`, `new_opening_date` and `new_closed_date` to be erased.
            new_location=None,
            new_opening_date=None,
            new_closed_date=None,
            requested_fields=["new_groups", "new_location", "new_opening_date", "new_closed_date"],
        )
        change_request.new_groups.set([])

        approved_fields = ["new_groups", "new_location", "new_opening_date", "new_closed_date"]
        change_request.approve(user=self.user, approved_fields=approved_fields)
        change_request.refresh_from_db()

        # Change request.
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)
        self.assertEqual(change_request.kind, change_request.Kind.ORG_UNIT_CREATION)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.updated_by, self.user)
        self.assertCountEqual(change_request.approved_fields, approved_fields)

        # Org Unit.
        self.assertEqual(self.org_unit.validation_status, self.org_unit.VALIDATION_VALID)
        # Those fields should've been erased.
        self.assertIsNone(self.org_unit.location)
        self.assertIsNone(self.org_unit.opening_date)
        self.assertIsNone(self.org_unit.closed_date)
        self.assertEqual(self.org_unit.groups.count(), 0)

        # Logs.
        modification = Modification.objects.get(object_id=self.org_unit.pk)
        diff = modification.field_diffs()
        self.assertIn("location", diff["modified"])
        self.assertIn("opening_date", diff["modified"])
        self.assertIn("closed_date", diff["modified"])

        self.assertEqual(diff["modified"]["location"]["before"], "SRID=4326;POINT Z (-1.1111111 1.1111111 1.1111111)")
        self.assertIsNone(diff["modified"]["location"]["after"])

        self.assertEqual(diff["modified"]["opening_date"]["before"], "2020-01-01")
        self.assertIsNone(diff["modified"]["opening_date"]["after"])

        self.assertEqual(diff["modified"]["closed_date"]["before"], "2055-01-01")
        self.assertIsNone(diff["modified"]["closed_date"]["after"])

    def test_exclude_soft_deleted_new_reference_instances(self):
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit, requested_fields=["new_reference_instances"]
        )
        change_request.new_reference_instances.set([self.new_instance1, self.new_instance2])

        change_requests = m.OrgUnitChangeRequest.objects.exclude_soft_deleted_new_reference_instances()
        self.assertEqual(change_requests.count(), 1)

        self.new_instance1.deleted = True
        self.new_instance1.save()
        self.new_instance2.deleted = True
        self.new_instance2.save()

        change_requests = m.OrgUnitChangeRequest.objects.exclude_soft_deleted_new_reference_instances()
        self.assertEqual(change_requests.count(), 0)
