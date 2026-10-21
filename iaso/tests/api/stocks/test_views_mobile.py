import uuid

from datetime import datetime, timedelta, timezone

import rest_framework.status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_STOCK_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


SKU_URL = "/api/mobile/stockkeepingunits/"
LEDGER_ITEM_URL = "/api/mobile/stockledgeritems/"
RULES_VERSION_URL = "/api/mobile/stockrulesversions/"


class StockKeepingUnitMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT_PERMISSION]
        )
        cls.account_2 = account_2 = m.Account.objects.create(name="Account 2")
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_type_3 = m.OrgUnitType.objects.create(name="Org unit type 3")
        cls.org_unit_1 = org_unit_1 = m.OrgUnit.objects.create(name="OrgUnit 1", org_unit_type=org_unit_type_1)
        cls.org_unit_2 = org_unit_2 = m.OrgUnit.objects.create(name="OrgUnit 2", org_unit_type=org_unit_type_1)
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", app_id="p1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", app_id="p2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="p3", account=account_2)

        cls.sku = sku = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
            account=account_1,
        )
        sku.projects.set([project_2])
        sku.org_unit_types.set([org_unit_type_2])

        cls.parent_sku = parent_sku = m.StockKeepingUnit.objects.create(
            name="Parent SKU",
            short_name="Parent",
            created_by=cls.user_without_rights,
            updated_by=cls.user_without_rights,
            account=account_1,
        )
        parent_sku.projects.set([project_1, project_2])
        parent_sku.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        m.StockKeepingUnitChildren.objects.create(
            child=sku,
            parent=parent_sku,
            value=10,
        )
        m.StockItem.objects.create(
            org_unit=org_unit_1,
            sku=sku,
            value=10,
        )
        m.StockItem.objects.create(
            org_unit=org_unit_2,
            sku=sku,
            value=5,
        )

    def test_list_unauthenticated(self):
        response = self.client.get(SKU_URL)
        self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated_missing_app_id(self):
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.get(SKU_URL)
        self.assertJSONResponse(response, rest_framework.status.HTTP_400_BAD_REQUEST)

    def test_list_authenticated_with_app_id(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(5):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT COUNT(*)
            # 3. SELECT stockkeepingunit
            # 4. SELECT stockkeepingunit_org_unit_types
            # 5. SELECT stockkeepingunit_forms
            response = self.client.get(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, len(response.data["results"]))
        with self.assertNumQueries(5):
            response = self.client.get(SKU_URL, data={"app_id": self.project_2.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(2, len(response.data["results"]))
        with self.assertNumQueries(2):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT COUNT(*) — no SKUs for project_3 / other account, so no page SELECT or prefetches
            response = self.client.get(SKU_URL, data={"app_id": self.project_3.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(0, len(response.data["results"]))

    def test_post_user_with_rights(self):
        self.assertEqual(m.StockKeepingUnit.objects.count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockKeepingUnit.objects.count(), 2)

    def test_patch_user_with_rights(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_user_with_rights(self):
        self.assertEqual(m.StockKeepingUnit.objects.count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{SKU_URL}{self.sku.id}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockKeepingUnit.objects.count(), 2)


class StockRulesVersionMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT_PERMISSION]
        )
        cls.account_2 = account_2 = m.Account.objects.create(name="Account 2")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", app_id="p1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", app_id="p2", account=account_1)
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        cls.org_unit_type_1.projects.set([project_1, project_2])
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_type_2.projects.set([project_1])
        cls.org_unit_type_3 = m.OrgUnitType.objects.create(name="Org unit type 3")
        cls.org_unit_type_3.projects.set([project_2])
        cls.form_1 = form_1 = m.Form.objects.create(name="Form 1")
        form_1.projects.set([project_1, project_2])
        cls.form_2 = form_2 = m.Form.objects.create(name="Form 2")
        form_2.projects.set([project_2])
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="p3", account=account_2)

        cls.sku_1 = sku_1 = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
            account=account_1,
        )
        sku_1.projects.set([project_1, project_2])
        sku_1.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        cls.sku_2 = sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
            account=account_1,
        )
        sku_2.projects.set([project_1, project_2])
        sku_2.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        cls.version_1 = version_1 = m.StockRulesVersion.objects.create(name="version_1", account=account_1)
        cls.stock_item_rule_1 = m.StockItemRule.objects.create(
            sku=sku_1,
            form=form_1,
            version=version_1,
            question="question_name_1",
            impact=m.StockImpacts.ADD,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_2 = m.StockItemRule.objects.create(
            sku=sku_1,
            form=form_1,
            version=version_1,
            question="question_name_2",
            impact=m.StockImpacts.SUBTRACT,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_3 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_1,
            question="question_name_3",
            impact=m.StockImpacts.ADD,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_4 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_1,
            question="question_name_4",
            impact=m.StockImpacts.SUBTRACT,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )

    def test_not_authenticated(self):
        with self.assertNumQueries(0):
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT StockRulesVersion (none published → 204)
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_204_NO_CONTENT)

        self.version_1.status = m.StockRulesVersionsStatus.PUBLISHED
        self.version_1.save()

        with self.assertNumQueries(5):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT StockRulesVersion
            # 3. SELECT StockItemRules
            # 4. SELECT StockKeepingUnit
            # 5. SELECT Form
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual("version_1", response.data["name"])
        self.assertEqual(m.StockRulesVersionsStatus.PUBLISHED, response.data["status"])
        self.assertEqual(2, len(response.data["rules"]))

        with self.assertNumQueries(5):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT StockRulesVersion
            # 3. SELECT StockItemRules
            # 4. SELECT StockKeepingUnit
            # 5. SELECT Form
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_2.app_id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual("version_1", response.data["name"])
        self.assertEqual(m.StockRulesVersionsStatus.PUBLISHED, response.data["status"])
        self.assertEqual(4, len(response.data["rules"]))

    def test_post(self):
        self.assertEqual(m.StockRulesVersion.objects.count(), 1)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockRulesVersion.objects.count(), 1)

    def test_patch(self):
        self.assertEqual(self.version_1.name, "version_1")
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{RULES_VERSION_URL}{self.version_1.pk}/", data={"name": "NAME"})
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.version_1.refresh_from_db()
        self.assertEqual(self.version_1.name, "version_1")

    def test_delete(self):
        self.assertEqual(m.StockRulesVersion.objects.count(), 1)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockRulesVersion.objects.count(), 1)


class StockLedgerItemMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT_PERMISSION]
        )
        cls.account_2 = account_2 = m.Account.objects.create(name="Account 2")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", app_id="p1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", app_id="p2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="p3", account=account_2)
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        org_unit_type_1.projects.set([project_1, project_2])
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_type_3 = m.OrgUnitType.objects.create(name="Org unit type 3")
        cls.org_unit_1 = org_unit_1 = m.OrgUnit.objects.create(
            name="OrgUnit 1", org_unit_type=org_unit_type_1, uuid=str(uuid.uuid4())
        )
        cls.org_unit_2 = org_unit_2 = m.OrgUnit.objects.create(
            name="OrgUnit 2", org_unit_type=org_unit_type_1, uuid=str(uuid.uuid4())
        )

        cls.sku_1 = sku_1 = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
            account=account_1,
        )
        sku_1.projects.set([project_1, project_2])
        sku_1.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        cls.sku_2 = sku_2 = m.StockKeepingUnit.objects.create(
            name="SKU 1",
            short_name="1",
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
            account=account_1,
        )
        sku_2.projects.set([project_2])
        sku_2.org_unit_types.set([org_unit_type_1, org_unit_type_2])

        cls.instance = instance = m.Instance.objects.create(project=project_1)
        form = m.Form.objects.create(name="form1")
        version = m.StockRulesVersion.objects.create(account=account_1, name="Version 1")
        cls.rule = m.StockItemRule.objects.create(
            sku=sku_1,
            form=form,
            version=version,
            question="question_name",
            impact=m.StockImpacts.ADD,
        )

        cls.ledger_item_1 = m.StockLedgerItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_1,
            submission=instance,
            question="question_name_1",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item_2 = m.StockLedgerItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_2,
            submission=instance,
            question="question_name_2",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item_3 = m.StockLedgerItem.objects.create(
            sku=sku_2,
            org_unit=org_unit_1,
            submission=instance,
            question="question_name_3",
            value=40,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item_4 = m.StockLedgerItem.objects.create(
            sku=sku_2,
            org_unit=org_unit_2,
            submission=instance,
            question="question_name_4",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

    def test_not_authenticated_without_rights_list(self):
        with self.assertNumQueries(0):
            response = self.client.get(LEDGER_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(3):
            # 1. SELECT project (+ account + default_version via select_related)
            # 2. SELECT COUNT(*)
            # 3. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(2, response.data["count"])

    def test_create_without_authorization(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 4)
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            f"{LEDGER_ITEM_URL}?app_id={self.project_1.app_id}",
            data=[
                {
                    "id": uuid.uuid4().hex,
                    "sku": self.sku_2.id,
                    "org_unit": self.org_unit_1.id,
                    "rule": self.rule.id,
                    "submission_id": self.instance.id,
                    "question": "question_name",
                    "value": 10,
                    "impact": m.StockImpacts.ADD,
                }
            ],
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        # We already have one ledger item doing +40
        self.assertEqual(50, m.StockItem.objects.filter(sku=self.sku_2, org_unit=self.org_unit_1).get().value)
        self.assertEqual(m.StockLedgerItem.objects.count(), 5)

    def test_create_with_authorization(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(
            f"{LEDGER_ITEM_URL}?app_id={self.project_1.app_id}",
            data=[
                {
                    "id": uuid.uuid4().hex,
                    "sku": self.sku_2.id,
                    "org_unit": self.org_unit_1.id,
                    "rule": self.rule.id,
                    "submission_id": self.instance.id,
                    "question": "question_name",
                    "value": 20,
                    "impact": m.StockImpacts.SUBTRACT,
                }
            ],
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        # We already have one ledger item doing +40
        self.assertEqual(20, m.StockItem.objects.filter(sku=self.sku_2, org_unit=self.org_unit_1).get().value)
        self.assertEqual(m.StockLedgerItem.objects.count(), 5)

    def test_create_with_authorization_and_ou_uuid(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(
            f"{LEDGER_ITEM_URL}?app_id={self.project_1.app_id}",
            data=[
                {
                    "id": uuid.uuid4().hex,
                    "sku": self.sku_2.id,
                    "org_unit": self.org_unit_1.uuid,
                    "rule": self.rule.id,
                    "submission_id": self.instance.id,
                    "question": "question_name",
                    "value": 20,
                    "impact": m.StockImpacts.SUBTRACT,
                }
            ],
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        # We already have one ledger item doing +40
        self.assertEqual(20, m.StockItem.objects.filter(sku=self.sku_2, org_unit=self.org_unit_1).get().value)
        self.assertEqual(m.StockLedgerItem.objects.count(), 5)

    def test_patch(self):
        self.assertEqual(self.ledger_item_1.value, 10)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(
            f"{LEDGER_ITEM_URL}{self.ledger_item_1.pk}/?app_id={self.project_1.app_id}", data={"value": 20}
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.ledger_item_1.refresh_from_db()
        self.assertEqual(self.ledger_item_1.value, 10)

    def test_delete(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{LEDGER_ITEM_URL}{self.ledger_item_1.pk}/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockLedgerItem.objects.count(), 4)


class StockLedgerItemMobileListAPITestCase(SwaggerTestCaseMixin, APITestCase):
    CREATED_AT = datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc)
    LAST_SYNC = datetime(2026, 2, 1, tzinfo=timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.belgium = belgium = m.Account.objects.create(name="Belgium")
        cls.france = france = m.Account.objects.create(name="France")
        cls.user = cls.create_user_with_profile(username="brussels_user", account=belgium)
        cls.creator = cls.create_user_with_profile(username="liege_user", account=belgium)
        cls.project = project = m.Project.objects.create(name="Belgium stock", app_id="be.stock", account=belgium)
        cls.other_project = other_project = m.Project.objects.create(
            name="Belgium vaccines", app_id="be.vaccines", account=belgium
        )

        cls.brussels = m.OrgUnit.objects.create(name="Brussels")
        cls.liege = m.OrgUnit.objects.create(name="Liège")

        cls.sku = m.StockKeepingUnit.objects.create(name="Paracetamol", short_name="PCM", account=belgium)
        cls.sku.projects.set([project, other_project])
        cls.other_project_sku = m.StockKeepingUnit.objects.create(name="Syringe", short_name="SYR", account=belgium)
        cls.other_project_sku.projects.set([other_project])
        # Linked to the Belgian project but owned by another account: must never leak
        cls.other_account_sku = m.StockKeepingUnit.objects.create(name="Bandage", short_name="BDG", account=france)
        cls.other_account_sku.projects.set([project])

        cls.stock_count_form = m.Form.objects.create(name="Stock count")
        cls.delivery_form = m.Form.objects.create(name="Delivery")
        cls.stock_count_submission = m.Instance.objects.create(project=project, form=cls.stock_count_form)
        cls.delivery_submission = m.Instance.objects.create(project=project, form=cls.delivery_form)
        cls.submission_without_form = m.Instance.objects.create(project=project)

        # Fixed ids so that the `order_by("id")` of the endpoint gives a known order
        cls.item_stock_count = cls.create_ledger_item(1, cls.sku, cls.brussels, cls.stock_count_submission, 100)
        cls.item_delivery = cls.create_ledger_item(2, cls.sku, cls.liege, cls.delivery_submission, 20)
        cls.item_without_form = cls.create_ledger_item(3, cls.sku, cls.brussels, cls.submission_without_form, 5)
        cls.item_without_submission = cls.create_ledger_item(4, cls.sku, cls.liege, None, 7)
        cls.item_other_project = cls.create_ledger_item(5, cls.other_project_sku, cls.brussels, None, 3)
        cls.item_other_account = cls.create_ledger_item(6, cls.other_account_sku, cls.brussels, None, 9)

    @classmethod
    def create_ledger_item(cls, number, sku, org_unit, submission, value):
        return m.StockLedgerItem.objects.create(
            id=uuid.UUID(int=number),
            sku=sku,
            org_unit=org_unit,
            submission=submission,
            question=f"question_{number}",
            value=value,
            impact=m.StockImpacts.ADD,
            created_by=cls.creator,
            created_at=cls.CREATED_AT,
        )

    def expected_item(self, item, form_name=None):
        return {
            "id": str(item.id),
            "org_unit": item.org_unit_id,
            "sku": item.sku_id,
            "submission_id": item.submission_id,
            "form_name": form_name,
            "question": item.question,
            "value": item.value,
            "impact": m.StockImpacts.ADD,
            "created_at": self.CREATED_AT.timestamp(),
            "created_by": self.creator.username,
        }

    def get_list(self, num_queries, **params):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(num_queries):
            response = self.client.get(LEDGER_ITEM_URL, data={"app_id": self.project.app_id, **params})
            data = self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "PaginatedStockLedgerItemMobileList")
        return data

    def assertResultIds(self, data, expected_items):
        self.assertEqual([str(item.id) for item in expected_items], [result["id"] for result in data["results"]])

    def test_list_results(self):
        # 1. SELECT project (+ account + default_version via select_related)
        # 2. SELECT COUNT(*)
        # 3. SELECT StockLedgerItem (+ sku, org_unit, submission, form, created_by via select_related)
        data = self.get_list(num_queries=3)

        self.assertEqual(
            data,
            {
                "count": 4,
                "results": [
                    self.expected_item(self.item_stock_count, form_name=self.stock_count_form.name),
                    self.expected_item(self.item_delivery, form_name=self.delivery_form.name),
                    self.expected_item(self.item_without_form),
                    self.expected_item(self.item_without_submission),
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 20,
            },
        )

    def test_list_number_of_queries_does_not_grow_with_submissions_with_form(self):
        """No N+1 on form_name (IA-5559): the form is fetched with the ledger items."""
        self.get_list(num_queries=3)

        for number in (10, 11, 12):
            submission = m.Instance.objects.create(project=self.project, form=self.stock_count_form)
            self.create_ledger_item(number, self.sku, self.brussels, submission, 1)

        data = self.get_list(num_queries=3)
        self.assertEqual(7, data["count"])

    def test_list_is_scoped_to_the_project_of_the_app(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(LEDGER_ITEM_URL, data={"app_id": self.other_project.app_id})
        data = self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertResultIds(
            data,
            [
                self.item_stock_count,
                self.item_delivery,
                self.item_without_form,
                self.item_without_submission,
                self.item_other_project,
            ],
        )

    def test_list_excludes_skus_of_another_account(self):
        data = self.get_list(num_queries=3)

        self.assertNotIn(str(self.item_other_account.id), [result["id"] for result in data["results"]])

    def test_list_last_sync(self):
        m.StockLedgerItem.objects.filter(id__in=[self.item_stock_count.id, self.item_without_form.id]).update(
            received_at=self.LAST_SYNC - timedelta(seconds=1)
        )
        m.StockLedgerItem.objects.filter(id=self.item_delivery.id).update(received_at=self.LAST_SYNC)
        m.StockLedgerItem.objects.filter(id=self.item_without_submission.id).update(
            received_at=self.LAST_SYNC + timedelta(days=1)
        )

        data = self.get_list(num_queries=3, last_sync=self.LAST_SYNC.isoformat())

        self.assertEqual(2, data["count"])
        self.assertResultIds(data, [self.item_delivery, self.item_without_submission])

    def test_list_pagination(self):
        data = self.get_list(num_queries=3, limit=2, page=2)

        self.assertResultIds(data, [self.item_without_form, self.item_without_submission])
        self.assertEqual(
            {"count": 4, "has_next": False, "has_previous": True, "page": 2, "pages": 2, "limit": 2},
            {key: value for key, value in data.items() if key != "results"},
        )
