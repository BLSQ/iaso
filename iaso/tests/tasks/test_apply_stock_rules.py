import datetime

from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.models import ERRORED, QUEUED, SUCCESS, Task
from iaso.permissions.core_permissions import CORE_STOCK_MANAGEMENT_PERMISSION
from iaso.tasks.apply_stock_rules import _parse_question_value, apply_stock_rules
from iaso.test import TestCase
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class ParseQuestionValueTestCase(TestCase):
    def test_returns_none_for_empty_or_zero_values(self):
        for raw in [None, "", "   ", 0, "0", " 0 ", 0.0, "0.0", False, True]:
            with self.subTest(raw=raw):
                self.assertIsNone(_parse_question_value(raw))

    def test_parses_non_zero_integers(self):
        cases = [
            (5, 5),
            ("12", 12),
            (" 42 ", 42),
            (7.0, 7),
            ("10.0", 10),
            (-3, -3),
            ("-8", -8),
        ]
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.assertEqual(_parse_question_value(raw), expected)

    def test_raises_for_invalid_values(self):
        for raw in ["abc", "12.5", 3.14, float("nan"), float("inf"), [1], {"a": 1}]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    _parse_question_value(raw)


class ApplyStockRulesTaskTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.other_project = m.Project.objects.create(name="Other Project", app_id="other.project", account=cls.account)
        cls.other_account, _, cls.other_source_version, cls.other_account_project = (
            cls.create_account_datasource_version_project("other_source", "other_account", "other_account_project")
        )

        cls.user, cls.anon_user, cls.user_no_perms = cls.create_base_users(
            cls.account, [CORE_STOCK_MANAGEMENT_PERMISSION]
        )
        cls.submitter = cls.create_user_with_profile(username="submitter", account=cls.account)

        cls.ou_type_target = m.OrgUnitType.objects.create(name="Clinic", short_name="CL")
        cls.ou_type_target.projects.add(cls.project, cls.other_project)
        cls.ou_type_other = m.OrgUnitType.objects.create(name="District", short_name="DS")
        cls.ou_type_other.projects.add(cls.project)

        cls.ou_1 = m.OrgUnit.objects.create(
            name="Clinic 1",
            org_unit_type=cls.ou_type_target,
            version=cls.source_version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.ou_2 = m.OrgUnit.objects.create(
            name="Clinic 2",
            org_unit_type=cls.ou_type_target,
            version=cls.source_version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.ou_wrong_type = m.OrgUnit.objects.create(
            name="District 1",
            org_unit_type=cls.ou_type_other,
            version=cls.source_version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.form_1 = m.Form.objects.create(name="Stock Movement Form")
        cls.form_1.projects.add(cls.project, cls.other_project)
        cls.form_2 = m.Form.objects.create(name="Inventory Reset Form")
        cls.form_2.projects.add(cls.project)
        cls.form_unused = m.Form.objects.create(name="Unrelated Form")
        cls.form_unused.projects.add(cls.project)

        cls.sku = m.StockKeepingUnit.objects.create(
            name="Vaccine A",
            short_name="VAC_A",
            account=cls.account,
            created_by=cls.user,
        )
        cls.sku.projects.set([cls.project])
        cls.sku.org_unit_types.set([cls.ou_type_target])

        cls.other_sku = m.StockKeepingUnit.objects.create(
            name="Vaccine B",
            short_name="VAC_B",
            account=cls.account,
            created_by=cls.user,
        )
        cls.other_sku.projects.set([cls.project])
        cls.other_sku.org_unit_types.set([cls.ou_type_target])

        cls.published_version = m.StockRulesVersion.objects.create(
            account=cls.account,
            name="Published v1",
            status=m.StockRulesVersionsStatus.PUBLISHED,
            created_by=cls.user,
        )
        cls.draft_version = m.StockRulesVersion.objects.create(
            account=cls.account,
            name="Draft v2",
            status=m.StockRulesVersionsStatus.DRAFT,
            created_by=cls.user,
        )
        cls.unpublished_version = m.StockRulesVersion.objects.create(
            account=cls.account,
            name="Unpublished v0",
            status=m.StockRulesVersionsStatus.UNPUBLISHED,
            created_by=cls.user,
        )

        cls.rule_add = m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form_1,
            version=cls.published_version,
            question="qty_received",
            impact=m.StockImpacts.ADD,
            order=1,
        )
        cls.rule_sub = m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form_1,
            version=cls.published_version,
            question="qty_used",
            impact=m.StockImpacts.SUBTRACT,
            order=2,
        )
        cls.rule_reset = m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form_2,
            version=cls.published_version,
            question="qty_counted",
            impact=m.StockImpacts.RESET,
            order=1,
        )
        # Rule for another SKU in the same published version (should be ignored when running for cls.sku)
        cls.rule_other_sku = m.StockItemRule.objects.create(
            sku=cls.other_sku,
            form=cls.form_1,
            version=cls.published_version,
            question="other_sku_received",
            impact=m.StockImpacts.ADD,
            order=3,
        )
        # Rules in DRAFT / UNPUBLISHED versions (should be ignored)
        m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form_1,
            version=cls.draft_version,
            question="draft_qty",
            impact=m.StockImpacts.ADD,
            order=1,
        )
        m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form_1,
            version=cls.unpublished_version,
            question="unpublished_qty",
            impact=m.StockImpacts.ADD,
            order=1,
        )

    def _run_task(self, sku_id=None, start_date="2025-01-01", end_date="2025-01-31", launcher=None):
        task = Task.objects.create(
            name="apply_stock_rules",
            account=self.account,
            launcher=launcher if launcher is not None else self.user,
        )
        apply_stock_rules(
            sku_id=sku_id if sku_id is not None else self.sku.id,
            start_date=start_date,
            end_date=end_date,
            task=task,
            _immediate=True,
        )
        task.refresh_from_db()
        return task

    def _create_instance(
        self,
        *,
        form=None,
        org_unit=None,
        project=None,
        json=None,
        source_created_at=None,
        created_at=None,
        created_by=...,
        deleted=False,
        device=None,
    ):
        instance = m.Instance.objects.create(
            form=form or self.form_1,
            org_unit=org_unit,
            project=project if project is not None else self.project,
            json=json,
            source_created_at=source_created_at,
            created_by=self.submitter if created_by is ... else created_by,
            deleted=deleted,
            device=device,
        )
        if created_at is not None:
            m.Instance.objects.filter(pk=instance.pk).update(created_at=created_at)
            instance.refresh_from_db()
        return instance

    def test_applies_published_rules_and_updates_stock_items(self):
        t1 = datetime.datetime(2025, 1, 10, 8, 0, tzinfo=datetime.timezone.utc)
        t2 = datetime.datetime(2025, 1, 15, 12, 0, tzinfo=datetime.timezone.utc)
        t3 = datetime.datetime(2025, 1, 20, 9, 30, tzinfo=datetime.timezone.utc)

        # Clinic 1: RESET 50, then ADD 20 & SUBTRACT 5 -> 65
        inst_reset = self._create_instance(
            form=self.form_2,
            org_unit=self.ou_1,
            source_created_at=t1,
            json={"qty_counted": "50"},
        )
        inst_move = self._create_instance(
            form=self.form_1,
            org_unit=self.ou_1,
            source_created_at=t2,
            json={
                "qty_received": "20",
                "qty_used": 5,
                "other_sku_received": "99",
                "draft_qty": "100",
                "unpublished_qty": "200",
            },
        )
        # Clinic 2: ADD 12, qty_used=0 (skipped), no created_by -> fallback to task.launcher,
        # no source_created_at -> fallback to created_at
        inst_ou2 = self._create_instance(
            form=self.form_1,
            org_unit=self.ou_2,
            source_created_at=None,
            created_at=t3,
            created_by=None,
            json={"qty_received": "12", "qty_used": "0"},
        )

        task = self._run_task()
        self.assertEqual(task.status, SUCCESS)

        ledger_items = list(m.StockLedgerItem.objects.filter(sku=self.sku).order_by("created_at", "rule__order"))
        self.assertEqual(len(ledger_items), 4)

        self.assertEqual(ledger_items[0].submission_id, inst_reset.id)
        self.assertEqual(ledger_items[0].org_unit_id, self.ou_1.id)
        self.assertEqual(ledger_items[0].rule_id, self.rule_reset.id)
        self.assertEqual(ledger_items[0].question, "qty_counted")
        self.assertEqual(ledger_items[0].value, 50)
        self.assertEqual(ledger_items[0].impact, m.StockImpacts.RESET)
        self.assertEqual(ledger_items[0].created_at, t1)
        self.assertEqual(ledger_items[0].created_by_id, self.submitter.id)

        self.assertEqual(ledger_items[1].submission_id, inst_move.id)
        self.assertEqual(ledger_items[1].rule_id, self.rule_add.id)
        self.assertEqual(ledger_items[1].value, 20)
        self.assertEqual(ledger_items[1].impact, m.StockImpacts.ADD)
        self.assertEqual(ledger_items[1].created_at, t2)

        self.assertEqual(ledger_items[2].submission_id, inst_move.id)
        self.assertEqual(ledger_items[2].rule_id, self.rule_sub.id)
        self.assertEqual(ledger_items[2].value, 5)
        self.assertEqual(ledger_items[2].impact, m.StockImpacts.SUBTRACT)
        self.assertEqual(ledger_items[2].created_at, t2)

        self.assertEqual(ledger_items[3].submission_id, inst_ou2.id)
        self.assertEqual(ledger_items[3].org_unit_id, self.ou_2.id)
        self.assertEqual(ledger_items[3].rule_id, self.rule_add.id)
        self.assertEqual(ledger_items[3].value, 12)
        self.assertEqual(ledger_items[3].created_at, t3)
        self.assertEqual(ledger_items[3].created_by_id, self.user.id)

        # StockItem balances recomputed
        stock_ou1 = m.StockItem.objects.get(sku=self.sku, org_unit=self.ou_1)
        stock_ou2 = m.StockItem.objects.get(sku=self.sku, org_unit=self.ou_2)
        self.assertEqual(stock_ou1.value, 65)
        self.assertEqual(stock_ou2.value, 12)

        # Re-running is idempotent
        second_task = self._run_task()
        self.assertEqual(second_task.status, SUCCESS)
        self.assertEqual(m.StockLedgerItem.objects.filter(sku=self.sku).count(), 4)
        stock_ou1.refresh_from_db()
        self.assertEqual(stock_ou1.value, 65)

    def test_excludes_ineligible_instances(self):
        in_range = datetime.datetime(2025, 1, 15, 10, 0, tzinfo=datetime.timezone.utc)
        before_range = datetime.datetime(2024, 12, 31, 23, 59, 59, tzinfo=datetime.timezone.utc)
        after_range = datetime.datetime(2025, 2, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)

        # 1. Wrong org unit type
        self._create_instance(org_unit=self.ou_wrong_type, source_created_at=in_range, json={"qty_received": "10"})
        # 2. No org unit
        self._create_instance(org_unit=None, source_created_at=in_range, json={"qty_received": "10"})
        # 3. Wrong project (not in sku.projects)
        self._create_instance(
            org_unit=self.ou_1, project=self.other_project, source_created_at=in_range, json={"qty_received": "10"}
        )
        # 4. Soft-deleted instance
        self._create_instance(org_unit=self.ou_1, source_created_at=in_range, deleted=True, json={"qty_received": "10"})
        # 5. Test device instance
        test_device = m.Device.objects.create(installation_id="test-install", test_device=True)
        self._create_instance(
            org_unit=self.ou_1, source_created_at=in_range, device=test_device, json={"qty_received": "10"}
        )
        # 6. Outside date range
        self._create_instance(org_unit=self.ou_1, source_created_at=before_range, json={"qty_received": "10"})
        self._create_instance(org_unit=self.ou_1, source_created_at=after_range, json={"qty_received": "10"})
        # 7. Unrelated form
        self._create_instance(
            form=self.form_unused, org_unit=self.ou_1, source_created_at=in_range, json={"qty_received": "10"}
        )
        # 8. Already has a StockLedgerItem for THIS sku
        already_processed = self._create_instance(
            org_unit=self.ou_1, source_created_at=in_range, json={"qty_received": "10", "qty_used": "3"}
        )
        m.StockLedgerItem.objects.create(
            sku=self.sku,
            org_unit=self.ou_1,
            rule=self.rule_add,
            submission=already_processed,
            question="qty_received",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=self.user,
            created_at=in_range,
        )

        # Eligible: normal (non-test) device, boundary dates, AND has ledger item only for OTHER sku
        real_device = m.Device.objects.create(installation_id="real-install", test_device=False)
        eligible_start_boundary = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2025, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc),
            device=real_device,
            json={"qty_received": "7"},
        )
        eligible_end_boundary = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2025, 1, 31, 23, 59, 59, tzinfo=datetime.timezone.utc),
            json={"qty_received": "4"},
        )
        m.StockLedgerItem.objects.create(
            sku=self.other_sku,
            org_unit=self.ou_1,
            rule=self.rule_other_sku,
            submission=eligible_end_boundary,
            question="other_sku_received",
            value=99,
            impact=m.StockImpacts.ADD,
            created_by=self.user,
            created_at=in_range,
        )

        task = self._run_task(start_date="2025-01-01", end_date="2025-01-31")
        self.assertEqual(task.status, SUCCESS)

        created_for_sku = m.StockLedgerItem.objects.filter(sku=self.sku).exclude(submission=already_processed)
        self.assertEqual(created_for_sku.count(), 2)
        self.assertSetEqual(
            set(created_for_sku.values_list("submission_id", flat=True)),
            {eligible_start_boundary.id, eligible_end_boundary.id},
        )
        # Total StockItem value includes pre-existing ledger item (10) + 7 + 4 = 21
        stock_item = m.StockItem.objects.get(sku=self.sku, org_unit=self.ou_1)
        self.assertEqual(stock_item.value, 21)

    def test_skips_none_zero_and_invalid_values(self):
        in_range = datetime.datetime(2025, 1, 15, 10, 0, tzinfo=datetime.timezone.utc)
        self._create_instance(
            org_unit=self.ou_1,
            source_created_at=in_range,
            json={"qty_received": None, "qty_used": 0},
        )
        self._create_instance(
            org_unit=self.ou_1,
            source_created_at=in_range,
            json={"qty_received": "", "qty_used": "0.0"},
        )
        inst_mixed = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=in_range,
            json={"qty_received": "not_a_number", "qty_used": "8"},
        )

        task = self._run_task()
        self.assertEqual(task.status, SUCCESS)
        self.assertIn("1 invalid question values skipped", task.progress_message)

        items = list(m.StockLedgerItem.objects.filter(sku=self.sku))
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].submission_id, inst_mixed.id)
        self.assertEqual(items[0].question, "qty_used")
        self.assertEqual(items[0].value, 8)

    def test_uses_source_created_at_over_created_at_for_date_window(self):
        # Instance received in Feb (created_at) but recorded on device in Jan (source_created_at) -> INCLUDED
        inst_device_in_jan = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2025, 1, 15, 10, 0, tzinfo=datetime.timezone.utc),
            created_at=datetime.datetime(2025, 2, 5, 10, 0, tzinfo=datetime.timezone.utc),
            json={"qty_received": "15"},
        )
        # Instance received in Jan (created_at) but recorded on device in Dec (source_created_at) -> EXCLUDED
        self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2024, 12, 20, 10, 0, tzinfo=datetime.timezone.utc),
            created_at=datetime.datetime(2025, 1, 5, 10, 0, tzinfo=datetime.timezone.utc),
            json={"qty_received": "99"},
        )

        task = self._run_task(start_date="2025-01-01", end_date="2025-01-31")
        self.assertEqual(task.status, SUCCESS)

        items = list(m.StockLedgerItem.objects.filter(sku=self.sku))
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].submission_id, inst_device_in_jan.id)
        self.assertEqual(items[0].created_at, inst_device_in_jan.source_created_at)

    def test_optional_start_and_end_dates(self):
        inst_old = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2024, 6, 1, 10, 0, tzinfo=datetime.timezone.utc),
            json={"qty_received": "3"},
        )
        inst_mid = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2025, 1, 15, 10, 0, tzinfo=datetime.timezone.utc),
            json={"qty_received": "5"},
        )
        inst_new = self._create_instance(
            org_unit=self.ou_1,
            source_created_at=datetime.datetime(2025, 6, 1, 10, 0, tzinfo=datetime.timezone.utc),
            json={"qty_received": "7"},
        )

        # Only start_date provided -> includes inst_mid and inst_new
        task_start_only = self._run_task(start_date="2025-01-01", end_date=None)
        self.assertEqual(task_start_only.status, SUCCESS)
        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_mid.id, inst_new.id},
        )

        # Clear and test only end_date provided -> includes inst_old and inst_mid
        m.StockLedgerItem.objects.filter(sku=self.sku).delete()
        task_end_only = self._run_task(start_date=None, end_date="2025-01-31")
        self.assertEqual(task_end_only.status, SUCCESS)
        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_old.id, inst_mid.id},
        )

        # Clear and test neither date provided -> includes all three
        m.StockLedgerItem.objects.filter(sku=self.sku).delete()
        task_no_dates = self._run_task(start_date=None, end_date=None)
        self.assertEqual(task_no_dates.status, SUCCESS)
        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_old.id, inst_mid.id, inst_new.id},
        )
        self.assertEqual(m.StockItem.objects.get(sku=self.sku, org_unit=self.ou_1).value, 15)

    def test_no_org_unit_types_or_projects_or_rules_completes_cleanly(self):
        sku_no_types = m.StockKeepingUnit.objects.create(
            name="No Types", short_name="NT", account=self.account, created_by=self.user
        )
        sku_no_types.projects.set([self.project])
        task_1 = self._run_task(sku_id=sku_no_types.id)
        self.assertEqual(task_1.status, SUCCESS)

        sku_no_projects = m.StockKeepingUnit.objects.create(
            name="No Projects", short_name="NP", account=self.account, created_by=self.user
        )
        sku_no_projects.org_unit_types.set([self.ou_type_target])
        task_2 = self._run_task(sku_id=sku_no_projects.id)
        self.assertEqual(task_2.status, SUCCESS)

        sku_no_rules = m.StockKeepingUnit.objects.create(
            name="No Rules", short_name="NR", account=self.account, created_by=self.user
        )
        sku_no_rules.projects.set([self.project])
        sku_no_rules.org_unit_types.set([self.ou_type_target])
        task_3 = self._run_task(sku_id=sku_no_rules.id)
        self.assertEqual(task_3.status, SUCCESS)

    def test_fails_when_no_published_version_or_invalid_dates(self):
        task_bad_dates = self._run_task(start_date="2025-02-01", end_date="2025-01-01")
        self.assertEqual(task_bad_dates.status, ERRORED)

        m.StockRulesVersion.objects.filter(pk=self.published_version.pk).update(
            status=m.StockRulesVersionsStatus.UNPUBLISHED
        )
        task_no_published = self._run_task()
        self.assertEqual(task_no_published.status, ERRORED)


class ApplyStockRulesAPITestCase(TaskAPITestCase):
    BASE_URL = "/api/tasks/create/applystockrules/"

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.other_account, _, _, cls.other_project = cls.create_account_datasource_version_project(
            "other_source", "other_account", "other_project"
        )
        cls.user, cls.anon_user, cls.user_no_perms = cls.create_base_users(
            cls.account, [CORE_STOCK_MANAGEMENT_PERMISSION]
        )

        cls.ou_type = m.OrgUnitType.objects.create(name="Clinic", short_name="CL")
        cls.ou_type.projects.add(cls.project)
        cls.org_unit = m.OrgUnit.objects.create(
            name="Clinic A",
            org_unit_type=cls.ou_type,
            version=cls.source_version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.form = m.Form.objects.create(name="Stock Form")
        cls.form.projects.add(cls.project)

        cls.sku = m.StockKeepingUnit.objects.create(
            name="SKU 1", short_name="S1", account=cls.account, created_by=cls.user
        )
        cls.sku.projects.set([cls.project])
        cls.sku.org_unit_types.set([cls.ou_type])

        cls.deleted_sku = m.StockKeepingUnit.objects.create(
            name="Deleted SKU",
            short_name="DS",
            account=cls.account,
            created_by=cls.user,
            deleted_at=timezone.now(),
        )
        cls.other_account_sku = m.StockKeepingUnit.objects.create(
            name="Other Account SKU",
            short_name="OS",
            account=cls.other_account,
        )

        cls.published_version = m.StockRulesVersion.objects.create(
            account=cls.account,
            name="Published v1",
            status=m.StockRulesVersionsStatus.PUBLISHED,
            created_by=cls.user,
        )
        cls.rule = m.StockItemRule.objects.create(
            sku=cls.sku,
            form=cls.form,
            version=cls.published_version,
            question="stock_in",
            impact=m.StockImpacts.ADD,
            order=1,
        )

    def test_unauthenticated(self):
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_without_stock_permission(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_validation_errors(self):
        self.client.force_authenticate(self.user)

        # Invalid date order
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-02-01", "end_date": "2025-01-01"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # Soft-deleted SKU
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.deleted_sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # SKU from another account
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.other_account_sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # No published rules version
        m.StockRulesVersion.objects.filter(pk=self.published_version.pk).update(status=m.StockRulesVersionsStatus.DRAFT)
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    def test_create_and_run_task_end_to_end(self):
        inst = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            created_by=self.user,
            source_created_at=datetime.datetime(2025, 1, 10, 12, 0, tzinfo=datetime.timezone.utc),
            json={"stock_in": "25"},
        )

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-01-01", "end_date": "2025-01-31"},
            format="json",
        )
        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status=QUEUED, name="apply_stock_rules")
        self.assertEqual(task.launcher, self.user)

        self.runAndValidateTask(task, SUCCESS)

        ledger_item = m.StockLedgerItem.objects.get(sku=self.sku, submission=inst)
        self.assertEqual(ledger_item.value, 25)
        self.assertEqual(ledger_item.impact, m.StockImpacts.ADD)
        self.assertEqual(ledger_item.rule_id, self.rule.id)

        stock_item = m.StockItem.objects.get(sku=self.sku, org_unit=self.org_unit)
        self.assertEqual(stock_item.value, 25)

    def test_create_and_run_task_without_dates(self):
        inst_1 = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            created_by=self.user,
            source_created_at=datetime.datetime(2024, 3, 1, 12, 0, tzinfo=datetime.timezone.utc),
            json={"stock_in": "10"},
        )
        inst_2 = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            created_by=self.user,
            source_created_at=datetime.datetime(2025, 8, 1, 12, 0, tzinfo=datetime.timezone.utc),
            json={"stock_in": "15"},
        )

        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id},
            format="json",
        )
        response_json = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        task = self.assertValidTaskAndInDB(response_json["task"], status=QUEUED, name="apply_stock_rules")

        self.runAndValidateTask(task, SUCCESS)

        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_1.id, inst_2.id},
        )
        self.assertEqual(m.StockItem.objects.get(sku=self.sku, org_unit=self.org_unit).value, 25)

    def test_create_and_run_task_with_only_one_date(self):
        inst_old = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            created_by=self.user,
            source_created_at=datetime.datetime(2024, 3, 1, 12, 0, tzinfo=datetime.timezone.utc),
            json={"stock_in": "10"},
        )
        inst_new = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            created_by=self.user,
            source_created_at=datetime.datetime(2025, 8, 1, 12, 0, tzinfo=datetime.timezone.utc),
            json={"stock_in": "15"},
        )

        self.client.force_authenticate(self.user)

        # Only start_date
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": "2025-01-01"},
            format="json",
        )
        task = self.assertValidTaskAndInDB(
            self.assertJSONResponse(response, status.HTTP_201_CREATED)["task"],
            status=QUEUED,
            name="apply_stock_rules",
        )
        self.runAndValidateTask(task, SUCCESS)
        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_new.id},
        )

        # Only end_date (with explicit null start_date)
        response = self.client.post(
            self.BASE_URL,
            data={"sku_id": self.sku.id, "start_date": None, "end_date": "2024-12-31"},
            format="json",
        )
        task = self.assertValidTaskAndInDB(
            self.assertJSONResponse(response, status.HTTP_201_CREATED)["task"],
            status=QUEUED,
            name="apply_stock_rules",
        )
        self.runAndValidateTask(task, SUCCESS)
        self.assertSetEqual(
            set(m.StockLedgerItem.objects.filter(sku=self.sku).values_list("submission_id", flat=True)),
            {inst_old.id, inst_new.id},
        )
