import uuid

from datetime import datetime

from iaso import models as m
from iaso.permissions.core_permissions import CORE_STOCK_MANAGEMENT
from iaso.test import APITestCase


SKU_URL = "/api/mobile/stockkeepingunits/"
LEDGER_ITEM_URL = "/api/mobile/stockledgeritems/"
RULES_VERSION_URL = "/api/mobile/stockrulesversions/"


class StockRulesVersionMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT]
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
        self.assertJSONResponse(response, 401)

    def test_list_authenticated_missing_app_id(self):
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.get(SKU_URL)
        self.assertJSONResponse(response, 400)

    def test_list_authenticated_with_app_id(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(5):
            # 1. SELECT project
            # 2. SELECT account
            # 3. SELECT COUNT(*)
            # 4. SELECT stockkeepingunit
            # 5. SELECT stockkeepingunit_org_unit_types
            response = self.client.get(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        with self.assertNumQueries(5):
            response = self.client.get(SKU_URL, data={"app_id": self.project_2.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(2, len(response.data["results"]))
        with self.assertNumQueries(3):
            response = self.client.get(SKU_URL, data={"app_id": self.project_3.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(0, len(response.data["results"]))

    def test_post_user_with_rights(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, 405)

    def test_patch_user_with_rights(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(SKU_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, 405)

    def test_delete_user_with_rights(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{SKU_URL}{self.sku.id}/")
        self.assertJSONResponse(response, 405)


class StockRulesVersionMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT]
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
            self.assertJSONResponse(response, 401)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(3):
            # 1. SELECT Project
            # 2. SELECT Account
            # 3. SELECT COUNT(*)
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, 204)

        self.version_1.status = m.StockRulesVersionsStatus.PUBLISHED
        self.version_1.save()

        with self.assertNumQueries(6):
            # 1. SELECT Project
            # 2. SELECT Account
            # 3. SELECT StockRulesVersion
            # 4. SELECT StockItemRules
            # 5. SELECT StockKeepingUnit
            # 6. SELECT Form
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, 200)
        self.assertEqual("version_1", response.data["name"])
        self.assertEqual(m.StockRulesVersionsStatus.PUBLISHED, response.data["status"])
        self.assertEqual(2, len(response.data["rules"]))

        with self.assertNumQueries(6):
            # 1. SELECT Project
            # 2. SELECT Account
            # 3. SELECT StockRulesVersion
            # 4. SELECT StockItemRules
            # 5. SELECT StockKeepingUnit
            # 6. SELECT Form
            response = self.client.get(RULES_VERSION_URL, data={"app_id": self.project_2.app_id})
            self.assertJSONResponse(response, 200)
        self.assertEqual("version_1", response.data["name"])
        self.assertEqual(m.StockRulesVersionsStatus.PUBLISHED, response.data["status"])
        self.assertEqual(4, len(response.data["rules"]))

    def test_post(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(RULES_VERSION_URL, data={"app_id": self.project_1.app_id})
        self.assertJSONResponse(response, 405)

    def test_patch(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{RULES_VERSION_URL}{self.version_1.pk}/", data={"name": "NAME"})
        self.assertJSONResponse(response, 405)

    def test_delete(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertJSONResponse(response, 405)


class StockLedgerItemMobileAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1 = account_1 = m.Account.objects.create(name="Account 1")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(
            account_1, [CORE_STOCK_MANAGEMENT]
        )
        cls.account_2 = account_2 = m.Account.objects.create(name="Account 2")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", app_id="p1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", app_id="p2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", app_id="p3", account=account_2)
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Org unit type 1")
        org_unit_type_1.projects.set([project_1, project_2])
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Org unit type 2")
        cls.org_unit_type_3 = m.OrgUnitType.objects.create(name="Org unit type 3")
        cls.org_unit_1 = org_unit_1 = m.OrgUnit.objects.create(name="OrgUnit 1", org_unit_type=org_unit_type_1)
        cls.org_unit_2 = org_unit_2 = m.OrgUnit.objects.create(name="OrgUnit 2", org_unit_type=org_unit_type_1)

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

        cls.ledger_item = m.StockLedgerItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_1,
            submission=instance,
            question="question_name_1",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item = m.StockLedgerItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_2,
            submission=instance,
            question="question_name_2",
            value=10,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item = m.StockLedgerItem.objects.create(
            sku=sku_2,
            org_unit=org_unit_1,
            submission=instance,
            question="question_name_3",
            value=40,
            impact=m.StockImpacts.ADD,
            created_by=cls.user_without_rights,
            created_at=datetime.now(),
        )

        cls.ledger_item = m.StockLedgerItem.objects.create(
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
            self.assertJSONResponse(response, 401)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(4):
            # 1. SELECT Project
            # 2. SELECT Account
            # 3. SELECT COUNT(*)
            # 4. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL, data={"app_id": self.project_1.app_id})
            self.assertJSONResponse(response, 200)
        self.assertEqual(2, response.data["count"])

    def test_create_without_authorization(self):
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
        self.assertJSONResponse(response, 201)
        # We already have one ledger item doing +40
        self.assertEqual(50, m.StockItem.objects.filter(sku=self.sku_2, org_unit=self.org_unit_1).get().value)

    def test_create_with_authorization(self):
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
        self.assertJSONResponse(response, 201)
        # We already have one ledger item doing +40
        self.assertEqual(20, m.StockItem.objects.filter(sku=self.sku_2, org_unit=self.org_unit_1).get().value)

    def test_patch(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(
            f"{LEDGER_ITEM_URL}{self.ledger_item.pk}/?app_id={self.project_1.app_id}", data={"value": 20}
        )
        self.assertJSONResponse(response, 405)

    def test_delete(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{LEDGER_ITEM_URL}{self.ledger_item.pk}/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 405)
