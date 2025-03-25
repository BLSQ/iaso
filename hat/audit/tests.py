from hat.audit import models as audit_models
from iaso import models as m
from iaso.test import TestCase


class LogModificationTestCase(TestCase):
    """
    Test log_modification().
    """

    @classmethod
    def setUpTestData(cls):
        cls.org_unit = m.OrgUnit.objects.create(
            org_unit_type=m.OrgUnitType.objects.create(name="Org unit type"),
            name="Hôpital Général",
        )
        cls.account = m.Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_log_modification_with_nothing(self):
        modification = audit_models.log_modification(
            self.org_unit, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
        )
        self.assertIsNone(modification)

    def test_log_modification_with_only_updated_at(self):
        original_copy = m.OrgUnit.objects.get(pk=self.org_unit.pk)
        self.org_unit.save()

        modification = audit_models.log_modification(
            original_copy, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
        )
        self.assertIsNone(modification)

    def test_log_modification_for_name(self):
        original_copy = m.OrgUnit.objects.get(pk=self.org_unit.pk)

        self.org_unit.name = "Foo"
        self.org_unit.save()

        modification = audit_models.log_modification(
            original_copy, self.org_unit, source=audit_models.ORG_UNIT_API, user=self.user
        )

        self.assertIsInstance(modification, audit_models.Modification)
        self.assertEqual(modification.source, audit_models.ORG_UNIT_API)
        self.assertEqual(modification.user, self.user)

        diffs = modification.field_diffs()

        self.assertEqual(len(diffs["added"].keys()), 0)

        self.assertEqual(len(diffs["removed"].keys()), 0)

        self.assertEqual(len(diffs["modified"].keys()), 2)
        self.assertIn("name", diffs["modified"].keys())
        self.assertIn("updated_at", diffs["modified"].keys())
