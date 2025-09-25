import collections

from datetime import datetime

import time_machine

from iaso import models as m
from iaso.api.stocks.serializers_mobile import (
    StockItemRuleMobileSerializer,
    StockKeepingUnitMobileSerializer,
    StockLedgerItemMobileSerializer,
    StockRulesVersionMobileSerializer,
)
from iaso.test import TestCase


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockKeepingUnitMobileSerializerTestCase(TestCase):
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
        serializer = StockKeepingUnitMobileSerializer(self.parent_sku)
        self.assertEqual(
            serializer.data,
            {
                "id": self.parent_sku.pk,
                "name": "Parent SKU",
                "short_name": "Parent",
                "org_unit_types": [
                    self.org_unit_type_1.pk,
                    self.org_unit_type_2.pk,
                ],
                "forms": [],
                "display_unit": "",
                "display_precision": 1,
                "created_at": 1755608400.0,
                "updated_at": 1755608400.0,
            },
        )


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockItemRuleMobileSerializerTestCase(TestCase):
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
        serializer = StockItemRuleMobileSerializer(self.stock_item_rule)
        self.assertEqual(
            serializer.data,
            {
                "id": self.stock_item_rule.pk,
                "version_id": self.version.pk,
                "sku_id": self.sku.pk,
                "form_id": self.form_1.pk,
                "question": "question_name",
                "impact": m.StockImpacts.ADD,
                "order": 0,
                "created_at": 1755608400.0,
                "updated_at": 1755608400.0,
            },
        )


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockRulesVersionMobileSerializerTestCase(TestCase):
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
            sku=sku_2,
            form=form_1,
            question="question_name_2",
            impact=m.StockImpacts.SUBTRACT,
            version=version_1,
            created_by=user,
            updated_by=user,
        )

    def test_serialize_instance(self):
        serializer = StockRulesVersionMobileSerializer(self.version_1)
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
                            "sku_id": self.sku.pk,
                            "form_id": self.form_1.pk,
                            "question": "question_name_1",
                            "impact": m.StockImpacts.ADD.value,
                            "order": 0,
                            "created_at": 1755608400.0,
                            "updated_at": 1755608400.0,
                        }
                    ),
                    collections.OrderedDict(
                        {
                            "id": self.stock_item_rule_2.pk,
                            "version_id": self.version_1.pk,
                            "sku_id": self.sku_2.pk,
                            "form_id": self.form_1.pk,
                            "question": "question_name_2",
                            "impact": m.StockImpacts.SUBTRACT.value,
                            "order": 0,
                            "created_at": 1755608400.0,
                            "updated_at": 1755608400.0,
                        }
                    ),
                ],
                "created_at": 1755608400.0,
                "updated_at": 1755608400.0,
            },
        )


@time_machine.travel("2025-08-19T13:00:00.000Z", tick=False)
class StockLedgerItemMobileSerializerTestCase(TestCase):
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
        cls.form = form = m.Form.objects.create(name="form1")
        cls.instance = instance = m.Instance.objects.create(form=form)
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
        serializer = StockLedgerItemMobileSerializer(self.ledger_item)
        self.assertEqual(
            serializer.data,
            {
                "id": self.ledger_item.pk.__str__(),
                "org_unit": self.org_unit_1.pk,
                "sku": self.sku.pk,
                "submission_id": self.instance.id,
                "form_name": self.form.name,
                "question": "question_name",
                "value": 10,
                "impact": m.StockImpacts.ADD,
                "created_at": 1755608400.0,
                "created_by": "User 1",
            },
        )
