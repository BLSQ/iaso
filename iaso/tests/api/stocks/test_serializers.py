import collections
import uuid

from datetime import datetime

import time_machine

from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.api.stocks.serializers import (
    StockItemRuleSerializer,
    StockItemRuleWriteSerializer,
    StockItemSerializer,
    StockItemWriteSerializer,
    StockKeepingUnitSerializer,
    StockKeepingUnitWriteSerializer,
    StockLedgerItemSerializer,
    StockLedgerItemWriteSerializer,
    StockRulesVersionSerializer,
    StockRulesVersionWriteSerializer,
)
from iaso.test import TestCase


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockKeepingUnitSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.account_2 = account_2 = m.Account.objects.create(name="Forbidden Account")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_type_3 = m.OrgUnitType.objects.create(name="Org unit type 3")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )
        sku.projects.set([project_2])
        sku.org_unit_types.set([org_unit_type_2])

        cls.parent_sku = parent_sku = m.StockKeepingUnit.objects.create(
            name="Parent SKU",
            short_name="Parent",
            created_by=user,
            updated_by=user,
            account=account_1,
        )
        parent_sku.projects.set([project_1, project_2])
        parent_sku.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        m.StockKeepingUnitChildren.objects.create(
            child=sku,
            parent=parent_sku,
            value=10,
        )

    def test_serialize_instance(self):
        serializer = StockKeepingUnitSerializer(self.parent_sku)
        self.assertEqual(
            serializer.data,
            {
                "id": self.parent_sku.pk,
                "name": "Parent SKU",
                "short_name": "Parent",
                "projects": [
                    collections.OrderedDict(
                        {
                            "id": self.project_1.pk,
                            "name": "Project 1",
                        }
                    ),
                    collections.OrderedDict(
                        {
                            "id": self.project_2.pk,
                            "name": "Project 2",
                        },
                    ),
                ],
                "org_unit_types": [
                    collections.OrderedDict(
                        {
                            "id": self.org_unit_type_1.pk,
                            "name": "Org unit type 1",
                        },
                    ),
                    collections.OrderedDict(
                        {
                            "id": self.org_unit_type_2.pk,
                            "name": "Org unit type 2",
                        },
                    ),
                ],
                "forms": [],
                "children": [
                    collections.OrderedDict(
                        {
                            "id": self.sku.pk,
                            "value": 10,
                        },
                    ),
                ],
                "display_units": None,
                "display_precision": 1,
                "created_at": 1755608400.0,
                "created_by": collections.OrderedDict(
                    {
                        "id": self.user.pk,
                        "username": "User 1",
                    },
                ),
                "updated_at": 1755608400.0,
                "updated_by": collections.OrderedDict(
                    {
                        "id": self.user.pk,
                        "username": "User 1",
                    },
                ),
                "deleted_at": None,
            },
        )

    def test_validate_data_correct(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "name": "New SKU",
            "short_name": "NEW",
            "projects": [self.project_1.pk],
            "org_unit_types": [self.org_unit_type_1.pk],
        }
        serializer = StockKeepingUnitWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

    def test_validate_data_incorrect(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "name": "New SKU",
            "short_name": "NEW",
            "projects": [self.project_3.pk],
            "org_unit_types": [self.org_unit_type_1.pk],
        }
        serializer = StockKeepingUnitWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("User doesn't have access to this project", serializer.errors["non_field_errors"][0])


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockItemSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.account_2 = account_2 = m.Account.objects.create(name="Forbidden Account")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_1 = org_unit_1 = m.OrgUnit.objects.create(name="Org unit 1")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_2)

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )
        sku.projects.set([project_1])
        sku.org_unit_types.set([org_unit_type_1])
        cls.sku_2 = sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 2",
            short_name="2",
            created_by=user,
            account=account_2,
        )
        sku_2.projects.set([project_2])
        sku_2.org_unit_types.set([org_unit_type_2])

        cls.stock_item = m.StockItem.objects.create(
            org_unit=org_unit_1,
            sku=sku,
            value=10,
        )

    def test_serialize_instance(self):
        serializer = StockItemSerializer(self.stock_item)
        self.assertEqual(
            serializer.data,
            {
                "id": self.stock_item.pk,
                "org_unit": collections.OrderedDict({"id": self.org_unit_1.pk, "name": "Org unit 1"}),
                "sku": collections.OrderedDict({"id": self.sku.pk, "name": "SKU 1", "short_name": "1"}),
                "value": 10,
                "created_at": 1755608400.0,
                "updated_at": 1755608400.0,
            },
        )

    def test_validate_data_correct(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "value": 10,
        }
        serializer = StockItemWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

    def test_validate_data_incorrect_sku(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku_2.pk,
            "value": 10,
        }
        serializer = StockItemWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("User doesn't have access to this SKU", serializer.errors["non_field_errors"][0])

    def test_validate_data_incorrect_value(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "value": -10,
        }
        serializer = StockItemWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Ensure this value is greater than or equal to 0.", serializer.errors["value"][0])


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockLedgerItemSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.account_2 = account_2 = m.Account.objects.create(name="Forbidden Account")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.org_unit_1 = org_unit_1 = m.OrgUnit.objects.create(name="Org unit 1")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )
        sku.projects.set([project_1])
        sku.org_unit_types.set([org_unit_type_1])
        cls.sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 2",
            short_name="2",
            created_by=user,
            account=account_2,
        )
        cls.instance = instance = m.Instance.objects.create()
        form = m.Form.objects.create(name="form1")
        version = m.StockRulesVersion.objects.create(account=account_1, name="Version 1")
        cls.rule = rule = m.StockItemRule.objects.create(
            sku=sku,
            form=form,
            version=version,
            question="question_name",
            impact=m.StockImpacts.ADD,
        )
        cls.ledger_item = m.StockLedgerItem.objects.create(
            sku=sku,
            org_unit=org_unit_1,
            rule=rule,
            submission=instance,
            question="question_name",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=user,
            created_at=datetime.now(),
        )

    def test_serialize_instance(self):
        serializer = StockLedgerItemSerializer(self.ledger_item)
        self.assertEqual(
            serializer.data,
            {
                "id": self.ledger_item.pk.__str__(),
                "org_unit": collections.OrderedDict({"id": self.org_unit_1.pk, "name": "Org unit 1"}),
                "sku": collections.OrderedDict({"id": self.sku.pk, "name": "SKU 1", "short_name": "1"}),
                "rule": self.rule.pk,
                "submission_id": self.instance.id,
                "question": "question_name",
                "value": 10,
                "impact": m.StockImpacts.ADD,
                "created_at": 1755608400.0,
                "created_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
            },
        )

    def test_validate_data_correct(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "id": uuid.uuid4().hex,
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "rule": self.rule.pk,
            "submission_id": self.instance.id,
            "question": "question_name",
            "value": 10,
            "impact": m.StockImpacts.ADD,
        }
        serializer = StockLedgerItemWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

    def test_validate_data_incorrect_value(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "submission_id": self.instance.id,
            "question": "question_name",
            "value": -10,
            "impact": m.StockImpacts.ADD,
        }
        serializer = StockLedgerItemWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Ensure this value is greater than or equal to 0.", serializer.errors["value"][0])

    def test_validate_data_incorrect_impact(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "submission_id": self.instance.id,
            "question": "question_name",
            "value": 10,
            "impact": "WRONG",
        }
        serializer = StockLedgerItemWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('"WRONG" is not a valid choice.', serializer.errors["impact"][0])

    def test_validate_data_impact_not_provided(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "org_unit": self.org_unit_1.pk,
            "sku": self.sku.pk,
            "submission_id": self.instance.id,
            "question": "question_name",
            "value": 10,
        }
        serializer = StockLedgerItemWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("This field is required.", serializer.errors["impact"][0])


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockItemRuleSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.account_2 = account_2 = m.Account.objects.create(name="Forbidden Account")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.form_1 = form_1 = m.Form.objects.create(name="Form 1")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )
        sku.projects.set([project_1])
        sku.org_unit_types.set([org_unit_type_1])
        cls.sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 2",
            short_name="2",
            created_by=user,
            account=account_2,
        )
        cls.instance = m.Instance.objects.create()

        cls.version = version = m.StockRulesVersion.objects.create(name="version", account=account_1)
        cls.stock_item_rule = m.StockItemRule.objects.create(
            sku=sku,
            form=form_1,
            question="question_name",
            impact=m.StockImpacts.ADD,
            version=version,
            created_by=user,
            updated_by=user,
        )

    def test_serialize_instance(self):
        serializer = StockItemRuleSerializer(self.stock_item_rule)
        self.assertEqual(
            serializer.data,
            {
                "id": self.stock_item_rule.pk,
                "version_id": self.version.pk,
                "sku": collections.OrderedDict({"id": self.sku.pk, "name": "SKU 1", "short_name": "1"}),
                "form": collections.OrderedDict({"id": self.form_1.pk, "name": "Form 1"}),
                "question": "question_name",
                "impact": m.StockImpacts.ADD,
                "order": 0,
                "created_at": 1755608400.0,
                "updated_at": 1755608400.0,
                "created_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                "updated_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
            },
        )

    def test_validate_data_correct(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "version": self.version.pk,
            "sku": self.sku.pk,
            "form": self.form_1.pk,
            "question": "question_name",
            "value": 10,
            "impact": m.StockImpacts.ADD,
        }
        serializer = StockItemRuleWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

    def test_validate_data_incorrect_sku(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "version": self.version.pk,
            "sku": self.sku_2.pk,
            "form": self.form_1.pk,
            "question": "question_name",
            "value": 10,
            "impact": m.StockImpacts.ADD,
        }
        serializer = StockItemRuleWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("User doesn't have access to this SKU", serializer.errors["non_field_errors"][0])

    def test_validate_data_incorrect_impact(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "version": self.version.pk,
            "sku": self.sku.pk,
            "form": self.form_1.pk,
            "question": "question_name",
            "value": 10,
            "impact": "WRONG",
        }
        serializer = StockItemRuleWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('"WRONG" is not a valid choice.', serializer.errors["impact"][0])

    def test_validate_data_impact_not_provided(self):
        request = APIRequestFactory().get("/")
        request.user = self.user

        data = {
            "version": self.version.pk,
            "sku": self.sku.pk,
            "form": self.form_1.pk,
            "question": "question_name",
            "value": 10,
        }
        serializer = StockItemRuleWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("This field is required.", serializer.errors["impact"][0])


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockRulesVersionSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.account_2 = account_2 = m.Account.objects.create(name="Forbidden Account")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.form_1 = form_1 = m.Form.objects.create(name="Form 1")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )
        sku.projects.set([project_1])
        sku.org_unit_types.set([org_unit_type_1])
        cls.sku_2 = sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 2",
            short_name="2",
            created_by=user,
            account=account_2,
        )
        cls.instance = m.Instance.objects.create()

        cls.version_1 = version_1 = m.StockRulesVersion.objects.create(
            name="Version 1", account=account_1, created_by=user, updated_by=user
        )
        cls.version_2 = version_2 = m.StockRulesVersion.objects.create(name="Version 2", account=account_2)
        cls.stock_item_rule_1 = m.StockItemRule.objects.create(
            sku=sku,
            form=form_1,
            question="question_name_1",
            impact=m.StockImpacts.ADD,
            version=version_1,
            created_by=user,
            updated_by=user,
        )
        cls.stock_item_rule_2 = m.StockItemRule.objects.create(
            sku=sku,
            form=form_1,
            question="question_name_2",
            impact=m.StockImpacts.SUBTRACT,
            version=version_1,
            created_by=user,
            updated_by=user,
        )
        cls.stock_item_rule_3 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_1,
            question="question_name_3",
            impact=m.StockImpacts.ADD,
            version=version_2,
            created_by=user,
            updated_by=user,
        )
        cls.stock_item_rule_4 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_1,
            question="question_name_4",
            impact=m.StockImpacts.SUBTRACT,
            version=version_2,
            created_by=user,
            updated_by=user,
        )

    def test_serialize_instance(self):
        serializer = StockRulesVersionSerializer(self.version_1)
        self.assertEqual(
            serializer.data,
            {
                "name": "Version 1",
                "status": m.StockRulesVersionsStatus.DRAFT.value,
                "rules": [
                    collections.OrderedDict(
                        {
                            "id": self.stock_item_rule_1.pk,
                            "version_id": self.version_1.pk,
                            "sku": collections.OrderedDict({"id": self.sku.pk, "name": "SKU 1", "short_name": "1"}),
                            "form": collections.OrderedDict({"id": self.form_1.pk, "name": "Form 1"}),
                            "question": "question_name_1",
                            "impact": m.StockImpacts.ADD.value,
                            "order": 0,
                            "created_at": 1755608400.0,
                            "created_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                            "updated_at": 1755608400.0,
                            "updated_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                        }
                    ),
                    collections.OrderedDict(
                        {
                            "id": self.stock_item_rule_2.pk,
                            "version_id": self.version_1.pk,
                            "sku": collections.OrderedDict({"id": self.sku.pk, "name": "SKU 1", "short_name": "1"}),
                            "form": collections.OrderedDict({"id": self.form_1.pk, "name": "Form 1"}),
                            "question": "question_name_2",
                            "impact": m.StockImpacts.SUBTRACT.value,
                            "order": 0,
                            "created_at": 1755608400.0,
                            "created_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                            "updated_at": 1755608400.0,
                            "updated_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                        }
                    ),
                ],
                "created_at": 1755608400.0,
                "created_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                "updated_at": 1755608400.0,
                "updated_by": collections.OrderedDict({"id": self.user.pk, "username": "User 1"}),
                "deleted_at": None,
            },
        )

    def _update_from_status_to_status(
        self, from_status: m.StockRulesVersionsStatus, to_status: m.StockRulesVersionsStatus
    ):
        request = APIRequestFactory().get("/")
        request.user = self.user
        self.version_1.status = from_status
        serializer = StockRulesVersionWriteSerializer(context={"request": request})
        serializer.update(self.version_1, collections.OrderedDict({"status": to_status}))
        self.assertEqual(self.version_1.status, to_status)

    def test_update_from_draft_to_draft(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.DRAFT, m.StockRulesVersionsStatus.DRAFT)

    def test_update_from_draft_to_published(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.DRAFT, m.StockRulesVersionsStatus.PUBLISHED)

    def test_update_from_draft_to_unpublished(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.DRAFT, m.StockRulesVersionsStatus.UNPUBLISHED)

    def test_update_from_published_to_published(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.PUBLISHED, m.StockRulesVersionsStatus.PUBLISHED)

    def test_update_from_published_to_unpublished(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.PUBLISHED, m.StockRulesVersionsStatus.UNPUBLISHED)

    def test_update_from_published_to_draft(self):
        try:
            self._update_from_status_to_status(m.StockRulesVersionsStatus.PUBLISHED, m.StockRulesVersionsStatus.DRAFT)
            raise self.failureException("It should have thrown an exception")
        except ValidationError as e:
            self.assertEqual("Transition from PUBLISHED to DRAFT is not allowed", e.detail[0])

    def test_update_from_unpublished_to_unpublished(self):
        self._update_from_status_to_status(
            m.StockRulesVersionsStatus.UNPUBLISHED, m.StockRulesVersionsStatus.UNPUBLISHED
        )

    def test_update_from_unpublished_to_published(self):
        self._update_from_status_to_status(m.StockRulesVersionsStatus.UNPUBLISHED, m.StockRulesVersionsStatus.PUBLISHED)

    def test_update_from_unpublished_to_draft(self):
        try:
            self._update_from_status_to_status(m.StockRulesVersionsStatus.UNPUBLISHED, m.StockRulesVersionsStatus.DRAFT)
            raise self.failureException("It should have thrown an exception")
        except ValidationError as e:
            self.assertEqual("Transition from UNPUBLISHED to DRAFT is not allowed", e.detail[0])

    def test_update_name(self):
        request = APIRequestFactory().get("/")
        request.user = self.user
        serializer = StockRulesVersionWriteSerializer(context={"request": request})
        serializer.update(self.version_1, collections.OrderedDict({"name": "New name"}))
        self.assertEqual(self.version_1.name, "New name")
