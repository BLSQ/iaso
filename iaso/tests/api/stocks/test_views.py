import uuid

from datetime import datetime

import rest_framework.status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_STOCK_MANAGEMENT_PERMISSION
from iaso.tests.tasks.task_api_test_case import APITestCase


SKU_URL = "/api/stockkeepingunits/"
STOCK_ITEM_URL = "/api/stockitems/"
LEDGER_ITEM_URL = "/api/stockledgeritems/"
RULE_ITEM_URL = "/api/stockitemrules/"
RULES_VERSION_URL = "/api/stockrulesversions/"


class StockKeepingUnitAPITestCase(APITestCase):
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
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)
        org_unit_type_1.projects.set([project_2, project_1])

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

    def test_not_authenticated_without_rights_list(self):
        with self.assertNumQueries(0):
            response = self.client.get(SKU_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(6):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockKeepingUnit
            # 3. SELECT FROM Project
            # 4. SELECT FROM OrgUnitType
            # 5. SELECT FROM Form
            # 6. SELECT FROM StockKeepingUnitChildren
            response = self.client.get(SKU_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(2, response.data["count"])
        self.assertEqual("SKU 1", response.data["results"][0]["name"])
        self.assertEqual("Parent SKU", response.data["results"][1]["name"])

    def test_list_filter_project_ids(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(6):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockKeepingUnit
            # 3. SELECT FROM Project
            # 4. SELECT FROM OrgUnitType
            # 5. SELECT FROM Form
            # 6. SELECT FROM StockKeepingUnitChildren
            response = self.client.get(SKU_URL, {"project_ids": self.project_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertEqual(1, response.data["count"])
        self.assertEqual("Parent SKU", response.data["results"][0]["name"])

    def test_list_filter_org_unit_type_ids(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(6):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockKeepingUnit
            # 3. SELECT FROM Project
            # 4. SELECT FROM OrgUnitType
            # 5. SELECT FROM Form
            # 6. SELECT FROM StockKeepingUnitChildren
            response = self.client.get(SKU_URL, {"org_unit_type_ids": self.org_unit_type_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertEqual(1, response.data["count"])
        self.assertEqual("Parent SKU", response.data["results"][0]["name"])

    def test_list_filter_created_by(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(6):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockKeepingUnit
            # 3. SELECT FROM Project
            # 4. SELECT FROM OrgUnitType
            # 5. SELECT FROM Form
            # 6. SELECT FROM StockKeepingUnitChildren
            response = self.client.get(SKU_URL, {"created_by": self.user_with_rights.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertEqual(1, response.data["count"])
        self.assertEqual("SKU 1", response.data["results"][0]["name"])

    def test_create_sku_without_authorization(self):
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            SKU_URL,
            data={
                "name": "New SKU",
                "short_name": "NEW",
                "projects": [self.project_1.pk],
                "org_unit_types": [self.org_unit_type_1.pk],
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)

    def test_create_with_authorization(self):
        self.client.force_authenticate(self.user_with_rights)

        response = self.client.post(
            SKU_URL,
            data={
                "name": "New SKU",
                "short_name": "NEW",
                "projects": [self.project_1.pk],
                "org_unit_types": [self.org_unit_type_1.pk],
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)

    def test_patch_without_authorization(self):
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.patch(f"{SKU_URL}{self.sku.pk}/", data={"name": "New SKU"})
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)

    def test_patch(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{SKU_URL}{self.sku.pk}/", data={"name": "New SKU"})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        response = self.client.get(f"{SKU_URL}{self.sku.pk}/")
        self.assertEqual(response.json()["name"], "New SKU")

    def test_delete_without_authorization(self):
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.delete(f"{SKU_URL}{self.sku.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)

    def test_delete(self):
        self.assertEqual(m.StockKeepingUnit.objects.filter(deleted_at=None).count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{SKU_URL}{self.sku.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_204_NO_CONTENT)

        response = self.client.get(f"{SKU_URL}{self.sku.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertIsNotNone(response.data["deleted_at"])
        self.assertEqual(m.StockKeepingUnit.objects.filter(deleted_at=None).count(), 1)


class StockItemAPITestCase(APITestCase):
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
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)

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

        cls.stock_item_1 = m.StockItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_1,
        )
        cls.stock_item_2 = m.StockItem.objects.create(
            sku=sku_1,
            org_unit=org_unit_2,
        )
        cls.stock_item_3 = m.StockItem.objects.create(
            sku=sku_2,
            org_unit=org_unit_1,
        )

    def test_not_authenticated_without_rights_list(self):
        with self.assertNumQueries(0):
            response = self.client.get(STOCK_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockItem
            response = self.client.get(STOCK_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(3, response.data["count"])

    def test_list_filter_sku_ids(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockItem
            response = self.client.get(STOCK_ITEM_URL, {"skus": self.sku_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(2, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockItem
            response = self.client.get(STOCK_ITEM_URL, {"skus": f"{self.sku_1.id},{self.sku_2.id}"})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(3, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT FROM StockItem
            response = self.client.get(STOCK_ITEM_URL, {"skus": self.sku_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

    def test_list_filter_org_unit_id(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(3):
            # 1. SELECT FROM OrgUnit
            # 2. SELECT COUNT(*)
            # 3. SELECT StockItem
            response = self.client.get(STOCK_ITEM_URL, {"org_unit_id": self.org_unit_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(2, response.data["count"])

        with self.assertNumQueries(3):
            # 1. SELECT FROM OrgUnit
            # 2. SELECT COUNT(*)
            # 3. SELECT StockItem
            response = self.client.get(STOCK_ITEM_URL, {"org_unit_id": self.org_unit_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

    def test_create_without_authorization(self):
        self.assertEqual(m.StockItem.objects.count(), 3)
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            STOCK_ITEM_URL,
            data={"sku": self.sku_2.id, "org_unit": self.org_unit_1.id, "value": 10},
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockItem.objects.count(), 3)

    def test_create_with_authorization(self):
        self.assertEqual(m.StockItem.objects.count(), 3)
        self.client.force_authenticate(self.user_with_rights)

        response = self.client.post(
            STOCK_ITEM_URL,
            data={"sku": self.sku_2.id, "org_unit": self.org_unit_2.id, "value": 10},
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        self.assertEqual(m.StockItem.objects.count(), 4)

    def test_patch_without_authorization(self):
        self.assertEqual(self.stock_item_1.value, 0)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.patch(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/", data={"value": 20})
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.stock_item_1.refresh_from_db()
        self.assertEqual(self.stock_item_1.value, 0)

    def test_patch(self):
        self.assertEqual(self.stock_item_1.value, 0)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/", data={"value": 20})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        response = self.client.get(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/")
        self.assertEqual(response.json()["value"], 20)
        self.stock_item_1.refresh_from_db()
        self.assertEqual(self.stock_item_1.value, 20)

    def test_delete_without_authorization(self):
        self.assertEqual(m.StockItem.objects.count(), 3)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.delete(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockItem.objects.count(), 3)

    def test_delete(self):
        self.assertEqual(m.StockItem.objects.count(), 3)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_204_NO_CONTENT)

        response = self.client.get(f"{STOCK_ITEM_URL}{self.stock_item_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_404_NOT_FOUND)
        self.assertEqual(m.StockItem.objects.count(), 2)


class StockLedgerItemAPITestCase(APITestCase):
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
        cls.org_unit_2 = m.OrgUnit.objects.create(name="OrgUnit 2", org_unit_type=org_unit_type_1)
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)

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

        cls.instance = instance = m.Instance.objects.create(
            created_at=datetime.now(),
        )

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
            question="question_name",
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
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

    def test_list_filter_sku_ids(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL, {"skus": self.sku_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL, {"skus": f"{self.sku_1.id},{self.sku_2.id}"})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

        with self.assertNumQueries(1):
            # 1. SELECT COUNT(*)
            response = self.client.get(LEDGER_ITEM_URL, {"skus": self.sku_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(0, response.data["count"])

    def test_list_filter_org_unit_id(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(3):
            # 1. SELECT OrgUnit
            # 2. SELECT COUNT(*)
            # 3. SELECT StockLedgerItem
            response = self.client.get(LEDGER_ITEM_URL, {"org_unit_id": self.org_unit_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT OrgUnit
            # 2. SELECT COUNT(*)
            response = self.client.get(LEDGER_ITEM_URL, {"org_unit_id": self.org_unit_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(0, response.data["count"])

    def test_create_without_authorization(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 1)
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            LEDGER_ITEM_URL,
            data={
                "id": uuid.uuid4().hex,
                "sku": self.sku_2.id,
                "org_unit": self.org_unit_1.id,
                "submission_id": self.instance.id,
                "question": "question_name",
                "value": 10,
                "impact": m.StockImpacts.ADD,
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockLedgerItem.objects.count(), 1)

    def test_create_with_authorization(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 1)
        self.client.force_authenticate(self.user_with_rights)

        response = self.client.post(
            LEDGER_ITEM_URL,
            data={
                "id": uuid.uuid4().hex,
                "sku": self.sku_2.id,
                "org_unit": self.org_unit_1.id,
                "rule": self.rule.id,
                "submission_id": self.instance.id,
                "question": "question_name",
                "value": 10,
                "impact": m.StockImpacts.ADD,
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        self.assertEqual(m.StockLedgerItem.objects.count(), 2)

    def test_patch(self):
        self.assertEqual(self.ledger_item.value, 10)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{LEDGER_ITEM_URL}{self.ledger_item.pk}/", data={"value": 20})
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.ledger_item.refresh_from_db()
        self.assertEqual(self.ledger_item.value, 10)

    def test_delete(self):
        self.assertEqual(m.StockLedgerItem.objects.count(), 1)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{LEDGER_ITEM_URL}{self.ledger_item.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(m.StockLedgerItem.objects.count(), 1)


class StockItemRuleAPITestCase(APITestCase):
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
        cls.form_1 = form_1 = m.Form.objects.create(name="Form 1")
        cls.form_2 = form_2 = m.Form.objects.create(name="Form 2")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)

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

        cls.version = version = m.StockRulesVersion.objects.create(name="version", account=account_1)
        cls.version_2 = version_2 = m.StockRulesVersion.objects.create(
            name="Finalized", account=account_1, status=m.StockRulesVersionsStatus.PUBLISHED
        )

        cls.stock_item_rule_1 = m.StockItemRule.objects.create(
            sku=sku_1,
            form=form_1,
            version=version,
            question="question_name",
            impact=m.StockImpacts.ADD,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_2 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_2,
            question="question_name_1",
            impact=m.StockImpacts.ADD,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_3 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_2,
            question="question_name_2",
            impact=m.StockImpacts.SUBTRACT,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_4 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_2,
            question="question_name_3",
            impact=m.StockImpacts.RESET,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )

    def test_not_authenticated_without_rights_list(self):
        with self.assertNumQueries(0):
            response = self.client.get(RULE_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(4, response.data["count"])

    def test_list_filter_sku_ids(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL, {"skus": self.sku_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL, {"skus": f"{self.sku_1.id},{self.sku_2.id}"})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(4, response.data["count"])

        with self.assertNumQueries(2):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL, {"skus": self.sku_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(3, response.data["count"])

    def test_list_filter_form_id(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(3):
            # 1. SELECT Form
            # 2. SELECT COUNT(*)
            # 3. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL, {"form_id": self.form_1.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

        with self.assertNumQueries(3):
            # 1. SELECT Form
            # 2. SELECT COUNT(*)
            # 3. SELECT StockItemRule
            response = self.client.get(RULE_ITEM_URL, {"form_id": self.form_2.id})
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(3, response.data["count"])

    def test_create_without_authorization(self):
        self.assertEqual(m.StockItemRule.objects.count(), 4)
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            RULE_ITEM_URL,
            data={
                "version": self.version.id,
                "sku": self.sku_2.id,
                "form": self.form_1.id,
                "question": "question_name",
                "impact": m.StockImpacts.ADD,
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockItemRule.objects.count(), 4)

    def test_create_with_authorization(self):
        self.assertEqual(m.StockItemRule.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)

        response = self.client.post(
            RULE_ITEM_URL,
            data={
                "version": self.version.id,
                "sku": self.sku_2.id,
                "form": self.form_1.id,
                "question": "question_name",
                "impact": m.StockImpacts.ADD,
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)
        self.assertEqual(m.StockItemRule.objects.count(), 5)

    def test_patch_without_authorization(self):
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.ADD)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.patch(f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/", data={"value": 20})
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.stock_item_rule_1.refresh_from_db()
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.ADD)

    def test_patch_rule(self):
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.ADD)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(
            f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/", data={"impact": m.StockImpacts.SUBTRACT}
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        response = self.client.get(f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/")
        self.assertEqual(response.json()["impact"], m.StockImpacts.SUBTRACT)
        self.stock_item_rule_1.refresh_from_db()
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.SUBTRACT)

    def test_delete_without_authorization(self):
        self.assertEqual(m.StockItemRule.objects.count(), 4)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.delete(f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockItemRule.objects.count(), 4)

    def test_delete(self):
        self.assertEqual(m.StockItemRule.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_204_NO_CONTENT)

        response = self.client.get(f"{RULE_ITEM_URL}{self.stock_item_rule_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_404_NOT_FOUND)
        self.assertEqual(m.StockItemRule.objects.count(), 3)

    def test_create_for_finalized_version(self):
        self.assertEqual(m.StockItemRule.objects.count(), 4)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(
            RULE_ITEM_URL,
            data={
                "version": self.version_2.id,
                "sku": self.sku_2.id,
                "form": self.form_1.id,
                "question": "question_name",
                "impact": m.StockImpacts.ADD,
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockItemRule.objects.count(), 4)

    def test_patch_for_finalized_version(self):
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.ADD)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(
            f"{RULE_ITEM_URL}{self.stock_item_rule_2.pk}/", data={"impact": m.StockImpacts.SUBTRACT}
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.stock_item_rule_2.refresh_from_db()
        self.assertEqual(self.stock_item_rule_1.impact, m.StockImpacts.ADD)

    def test_delete_for_finalized_version(self):
        self.assertEqual(m.StockRulesVersion.objects.count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{RULE_ITEM_URL}{self.stock_item_rule_2.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockRulesVersion.objects.count(), 2)


class StockRulesVersionAPITestCase(APITestCase):
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
        cls.form_1 = form_1 = m.Form.objects.create(name="Form 1")
        cls.form_2 = form_2 = m.Form.objects.create(name="Form 2")
        cls.project_1 = project_1 = m.Project.objects.create(name="Project 1", account=account_1)
        cls.project_2 = project_2 = m.Project.objects.create(name="Project 2", account=account_1)
        cls.project_3 = m.Project.objects.create(name="Project 3", account=account_2)

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
        cls.version_2 = version_2 = m.StockRulesVersion.objects.create(name="version_2", account=account_2)
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
            form=form_2,
            version=version_1,
            question="question_name_2",
            impact=m.StockImpacts.SUBTRACT,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_3 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_1,
            version=version_2,
            question="question_name_3",
            impact=m.StockImpacts.ADD,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )
        cls.stock_item_rule_4 = m.StockItemRule.objects.create(
            sku=sku_2,
            form=form_2,
            version=version_2,
            question="question_name_4",
            impact=m.StockImpacts.SUBTRACT,
            created_by=cls.user_with_rights,
            updated_by=cls.user_with_rights,
        )

    def test_not_authenticated_without_rights_list(self):
        with self.assertNumQueries(0):
            response = self.client.get(RULES_VERSION_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_rights_list(self):
        self.client.force_authenticate(self.user_without_rights)
        with self.assertNumQueries(7):
            # 1. SELECT COUNT(*)
            # 2. SELECT StockRulesVersion
            # 3. SELECT rules
            # 4. SELECT rules__sku
            # 5. SELECT rules__form
            # 6. SELECT rules__created_by
            # 7. SELECT rules__updated_by
            response = self.client.get(RULES_VERSION_URL)
            self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertEqual(1, response.data["count"])

    def test_create_without_authorization(self):
        self.client.force_authenticate(self.user_without_rights)

        response = self.client.post(
            RULES_VERSION_URL,
            data={
                "name": "Test",
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)

    def test_create_with_authorization(self):
        self.client.force_authenticate(self.user_with_rights)

        response = self.client.post(
            RULES_VERSION_URL,
            data={
                "name": "Test",
            },
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_201_CREATED)

    def test_patch_without_authorization(self):
        self.assertEqual(self.version_1.name, "version_1")
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.patch(f"{RULES_VERSION_URL}{self.version_1.pk}/", data={"name": "NAME"})
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.version_1.refresh_from_db()
        self.assertEqual(self.version_1.name, "version_1")

    def test_patch(self):
        self.assertEqual(self.version_1.name, "version_1")
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.patch(f"{RULES_VERSION_URL}{self.version_1.pk}/", data={"name": "NAME"})
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        response = self.client.get(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertEqual(response.json()["name"], "NAME")
        self.version_1.refresh_from_db()
        self.assertEqual(self.version_1.name, "NAME")

    def test_change_status(self):
        self.client.force_authenticate(self.user_with_rights)
        version = m.StockRulesVersion.objects.create(
            name="Published", account=self.account_1, status=m.StockRulesVersionsStatus.PUBLISHED
        )
        self.assertEqual(1, m.StockRulesVersion.objects.filter(status=m.StockRulesVersionsStatus.PUBLISHED).count())
        self.assertEqual(version, m.StockRulesVersion.objects.get(status=m.StockRulesVersionsStatus.PUBLISHED))

        response = self.client.patch(
            f"{RULES_VERSION_URL}{self.version_1.pk}/", data={"status": m.StockRulesVersionsStatus.PUBLISHED}
        )
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertEqual(1, m.StockRulesVersion.objects.filter(status=m.StockRulesVersionsStatus.PUBLISHED).count())
        response = self.client.get(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertEqual(response.json()["status"], m.StockRulesVersionsStatus.PUBLISHED)
        self.assertEqual(m.StockRulesVersion.objects.get(pk=version.pk).status, m.StockRulesVersionsStatus.UNPUBLISHED)

    def test_delete_without_authorization(self):
        self.assertEqual(m.StockRulesVersion.objects.filter(deleted_at=None).count(), 2)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.delete(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockRulesVersion.objects.filter(deleted_at=None).count(), 2)

    def test_delete(self):
        self.assertEqual(m.StockRulesVersion.objects.filter(deleted_at=None).count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.delete(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_204_NO_CONTENT)

        response = self.client.get(f"{RULES_VERSION_URL}{self.version_1.pk}/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)
        self.assertIsNotNone(response.json()["deleted_at"])
        self.assertEqual(m.StockRulesVersion.objects.filter(deleted_at=None).count(), 1)

    def test_copy_without_rights(self):
        self.assertEqual(m.StockRulesVersion.objects.count(), 2)
        self.client.force_authenticate(self.user_without_rights)
        response = self.client.post(f"{RULES_VERSION_URL}{self.version_1.pk}/copy/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_403_FORBIDDEN)
        self.assertEqual(m.StockRulesVersion.objects.count(), 2)

    def test_copy_with_rights(self):
        self.assertEqual(m.StockRulesVersion.objects.count(), 2)
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(f"{RULES_VERSION_URL}{self.version_1.pk}/copy/")
        self.assertJSONResponse(response, rest_framework.status.HTTP_200_OK)

        self.assertEqual("Copy of version_1", response.json()["name"])
        self.assertEqual(2, len(response.json()["rules"]))
        self.assertEqual(m.StockRulesVersionsStatus.DRAFT, response.json()["status"])
        self.assertEqual(m.StockRulesVersion.objects.count(), 3)
