import datetime

from iaso import models as m
from iaso.api.stocks.use_cases import compute_new_stock_item_value
from iaso.test import TestCase


class StockUseCaseUtilsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Test Account")
        cls.org_unit = org_unit = m.OrgUnit.objects.create(name="Org unit 1")

        cls.user = user = m.User.objects.create(username="User 1")
        m.Profile.objects.create(user=user, account=account_1)
        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=user,
            account=account_1,
        )

        cls.instance = m.Instance.objects.create()
        form = m.Form.objects.create(name="form1")
        version = m.StockRulesVersion.objects.create(account=account_1, name="Version 1")
        cls.rule = m.StockItemRule.objects.create(
            sku=sku,
            form=form,
            version=version,
            question="question_name",
            impact=m.StockImpacts.ADD,
        )
        cls.stock_item = m.StockItem.objects.create(sku=sku, org_unit=org_unit)

    def test_stock_value_returns_0_when_no_last_reset_and_no_items(self):
        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(0, balance)

    def test_stock_value_returns_last_reset_value_when_there_are_no_subsequent_items(self):
        lastResetValue = 100
        lastResetTime = 1000
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=lastResetValue,
            impact=m.StockImpacts.RESET,
            created_at=datetime.datetime.fromtimestamp(lastResetTime),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )

        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(lastResetValue, balance)

    def test_stock_value_correctly_calculates_stock_with_ADD_impacts(self):
        lastResetValue = 50
        lastResetTime = 1000
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=lastResetValue,
            impact=m.StockImpacts.RESET,
            created_at=datetime.datetime.fromtimestamp(lastResetTime),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=10,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 1000),
            created_by=self.user,
            submission=self.instance,
            question="q2",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=20,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 2000),
            created_by=self.user,
            submission=self.instance,
            question="q3",
        )
        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(80, balance)  # 50 (reset) + 10 (add) + 20 (add)

    def test_stock_value_correctly_calculates_stock_with_SUBTRACT_impacts(self):
        lastResetValue = 100
        lastResetTime = 1000
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=lastResetValue,
            impact=m.StockImpacts.RESET,
            created_at=datetime.datetime.fromtimestamp(lastResetTime),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=10,
            impact=m.StockImpacts.SUBTRACT,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 1000),
            created_by=self.user,
            submission=self.instance,
            question="q2",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=20,
            impact=m.StockImpacts.SUBTRACT,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 2000),
            created_by=self.user,
            submission=self.instance,
            question="q3",
        )

        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(70, balance)  # 100 (reset) - 10 (subtract) - 20 (subtract)

    def test_stock_value_correctly_calculates_stock_with_mixed_impacts_and_no_reset(self):
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=30,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(1000),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=5,
            impact=m.StockImpacts.SUBTRACT,
            created_at=datetime.datetime.fromtimestamp(2000),
            created_by=self.user,
            submission=self.instance,
            question="q2",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=15,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(3000),
            created_by=self.user,
            submission=self.instance,
            question="q3",
        )
        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(40, balance)  # 0 + 30 - 5 + 15

    def test_stock_value_correctly_calculates_stock_with_mixed_impacts_and_a_reset(self):
        lastResetValue = 50
        lastResetTime = 1000
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=lastResetValue,
            impact=m.StockImpacts.RESET,
            created_at=datetime.datetime.fromtimestamp(lastResetTime),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=10,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 1000),
            created_by=self.user,
            submission=self.instance,
            question="q2",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=20,
            impact=m.StockImpacts.SUBTRACT,
            created_at=datetime.datetime.fromtimestamp(lastResetTime + 2000),
            created_by=self.user,
            submission=self.instance,
            question="q3",
        )

        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(40, balance)  # 50 (reset) + 10 (add) - 20 (subtract)

    def test_stock_value_when_reset_is_last(self):
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=50,
            impact=m.StockImpacts.ADD,
            created_at=datetime.datetime.fromtimestamp(1000),
            created_by=self.user,
            submission=self.instance,
            question="q1",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=10,
            impact=m.StockImpacts.SUBTRACT,
            created_at=datetime.datetime.fromtimestamp(2000),
            created_by=self.user,
            submission=self.instance,
            question="q2",
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.org_unit,
            rule=self.rule,
            value=20,
            impact=m.StockImpacts.RESET,
            created_at=datetime.datetime.fromtimestamp(3000),
            created_by=self.user,
            submission=self.instance,
            question="q3",
        )

        balance = compute_new_stock_item_value(self.stock_item)
        self.assertEqual(20, balance)
