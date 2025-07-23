import datetime
import logging

import time_machine

from django.contrib.contenttypes.models import ContentType

from hat.audit import models as audit_models
from iaso import models as m
from iaso.test import TestCase


class ModificationModelTestCase(TestCase):
    """
    Test the `Modification` model.
    """

    DT = datetime.datetime(2025, 4, 1, 15, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type,
            name="Hôpital Général",
        )
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    @time_machine.travel(DT, tick=False)
    def test_create(self):
        org_unit_content_type = ContentType.objects.get(
            app_label=self.org_unit._meta.app_label, model=self.org_unit._meta.model_name
        )

        past_value = audit_models.serialize_instance(self.org_unit)
        self.org_unit.name = "New name"
        self.org_unit.save()

        new_value = audit_models.serialize_instance(self.org_unit)

        modification = audit_models.Modification.objects.create(
            content_type=org_unit_content_type,
            object_id=self.org_unit.pk,
            past_value=past_value,
            new_value=new_value,
            source=audit_models.ORG_UNIT_CHANGE_REQUEST,
            user=self.user,
        )

        self.assertEqual(modification.content_type, org_unit_content_type)
        self.assertEqual(modification.object_id, self.org_unit.pk)
        self.assertEqual(modification.past_value, past_value)
        self.assertEqual(modification.new_value, new_value)
        self.assertEqual(modification.source, audit_models.ORG_UNIT_CHANGE_REQUEST)
        self.assertEqual(modification.user, self.user)
        self.assertEqual(modification.org_unit_change_request, None)
        self.assertEqual(modification.created_at, self.DT)

        diffs = modification.field_diffs()
        self.assertEqual(len(diffs["added"].keys()), 0)
        self.assertEqual(len(diffs["removed"].keys()), 0)
        self.assertEqual(len(diffs["modified"].keys()), 2)
        self.assertIn("name", diffs["modified"].keys())
        self.assertIn("updated_at", diffs["modified"].keys())

        modification_as_list = modification.as_list([])
        expected_modification_as_list = {
            "id": modification.pk,
            "content_type": "iaso",
            "object_id": self.org_unit.pk,
            "source": "org_unit_change_request",
            "user": {
                "id": self.user.iaso_profile.pk,
                "first_name": "",
                "user_name": "user",
                "last_name": "",
                "email": "",
                "language": None,
                "user_id": self.user.pk,
                "phone_number": None,
                "country_code": None,
                "editable_org_unit_type_ids": [],
                "user_roles_editable_org_unit_type_ids": [],
            },
            "created_at": self.DT,
            "org_unit_change_request_id": None,
        }

        self.assertEqual(modification_as_list, expected_modification_as_list)


class AuditMethodsTestCase(TestCase):
    """
    Test methods in the `audit` module.
    """

    def setUp(self):
        logging.disable(logging.NOTSET)

    def tearDown(self):
        logging.disable(logging.CRITICAL)

    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type,
            name="Hôpital Général",
        )
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_serialize_instance(self):
        json_data = audit_models.serialize_instance(self.org_unit)

        self.assertIsInstance(json_data, list)
        self.assertEqual(len(json_data), 1)

        json_instance = json_data[0]
        self.assertIsInstance(json_instance, dict)
        self.assertEqual(json_instance["model"], "iaso.orgunit")
        self.assertEqual(json_instance["pk"], self.org_unit.pk)
        self.assertIsInstance(json_instance["fields"], dict)

    def test_log_modification_with_nothing(self):
        with self.assertLogs(logger=audit_models.logger, level="WARNING") as caught_msg:
            audit_models.log_modification(
                self.org_unit, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
            )
        self.assertEqual(len(caught_msg.output), 1)
        self.assertIn("log_modification() is empty.", caught_msg.output[0])

    def test_log_modification_with_only_updated_at(self):
        """
        This can happen in e.g. the org unit bulk update and results
        in an empty `Modification`.
        """
        original_copy = m.OrgUnit.objects.get(pk=self.org_unit.pk)
        serialized_original_copy = audit_models.serialize_instance(original_copy)

        self.org_unit.validation_status = self.org_unit.validation_status
        self.org_unit.save()

        with self.assertLogs(logger=audit_models.logger, level="WARNING") as caught_msg:
            audit_models.log_modification(
                serialized_original_copy, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
            )
        self.assertEqual(len(caught_msg.output), 1)
        self.assertIn("log_modification() called with only `updated_at`.", caught_msg.output[0])

    def test_log_modification_for_simple_field(self):
        original_copy = m.OrgUnit.objects.get(pk=self.org_unit.pk)

        self.org_unit.name = "Foo"
        self.org_unit.save()

        modification = audit_models.log_modification(
            original_copy, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
        )

        self.assertIsInstance(modification, audit_models.Modification)
        self.assertEqual(modification.source, audit_models.ORG_UNIT_API)
        self.assertEqual(modification.user, self.user)
        self.assertEqual(modification.org_unit_change_request, None)

        diffs = modification.field_diffs()

        self.assertEqual(len(diffs["added"].keys()), 0)

        self.assertEqual(len(diffs["removed"].keys()), 0)

        self.assertEqual(len(diffs["modified"].keys()), 2)
        self.assertIn("name", diffs["modified"].keys())
        self.assertIn("updated_at", diffs["modified"].keys())

    def test_log_modification_for_m2m_field_with_original_as_serialized_copy(self):
        """
        Test that calling `log_modification()` when there are foreign keys
        or many-to-many relations works as expected.

        The right way to do this is to ensure that the instance has been
        deep copied or serialized before doing any modification on it.

        This avoids issues related to the `call-by-sharing` evaluation
        strategy of Python where two instances are sharing the same
        complex objects.
        """
        original_copy = m.OrgUnitType.objects.get(pk=self.org_unit_type.pk)
        self.assertEqual(original_copy.reference_forms.count(), 0)

        serialized_original_copy = audit_models.serialize_instance(original_copy)

        form_1 = m.Form.objects.create(name="Form 1")
        form_2 = m.Form.objects.create(name="Form 2")
        self.org_unit_type.reference_forms.add(form_1, form_2)
        self.assertEqual(self.org_unit_type.reference_forms.count(), 2)

        modification = audit_models.log_modification(
            serialized_original_copy, self.org_unit_type, source=audit_models.ORG_UNIT_API, user=self.user
        )

        old_reference_forms = modification.past_value[0]["fields"]["reference_forms"]
        new_reference_forms = modification.new_value[0]["fields"]["reference_forms"]
        self.assertEqual(len(old_reference_forms), 0)
        self.assertEqual(len(new_reference_forms), 2)
        self.assertIn(form_1.pk, new_reference_forms)
        self.assertIn(form_2.pk, new_reference_forms)

        diffs = modification.field_diffs()
        self.assertEqual(len(diffs["added"].keys()), 0)
        self.assertEqual(len(diffs["removed"].keys()), 0)
        self.assertEqual(len(diffs["modified"].keys()), 1)
        self.assertIn("reference_forms", diffs["modified"].keys())
