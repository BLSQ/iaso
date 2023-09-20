from iaso.test import APITestCase
from iaso import models as m
from django.contrib.auth.models import AnonymousUser
from hat.menupermissions import models as permission


BASE_URL = "/api/stock/"


class StocksAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        default_account = m.Account.objects.create(name="Default account")

        cls.default_account = default_account

        cls.another_account = m.Account.objects.create(name="Another Account")

        default_ds = m.DataSource.objects.create(name="Default Data Source")
        cls.default_ds = default_ds

        default_sv = m.SourceVersion.objects.create(data_source=default_ds, number=1)
        default_account.default_version = default_sv
        default_account.save()

        cls.another_account.default_version = default_sv
        cls.another_account.save()

        cls.default_orgunit_type = m.OrgUnitType.objects.create(
            name="Default Org Unit Type", short_name="default_ou_type"
        )

        cls.default_orgunit = m.OrgUnit.objects.create(
            name="Default Org Unit",
            source_ref="default_test_orgunit_ref",
            version=default_sv,
            org_unit_type=cls.default_orgunit_type,
        )

        cls.another_orgunit = m.OrgUnit.objects.create(
            name="Another Org Unit",
            source_ref="another_test_orgunit_ref",
            version=default_sv,
            org_unit_type=cls.default_orgunit_type,
        )

        cls.anon = AnonymousUser()

        cls.user_without_rights = cls.create_user_with_profile(
            username="user_without_rights",
            account=default_account,
        )

        cls.user_with_rights = cls.create_user_with_profile(
            username="user_with_rights",
            account=default_account,
            permissions=[permission._STOCKS],
        )

        cls.stock_item_1 = m.StockItem.objects.create(name="Stock Item 1", account=default_account)
        cls.stock_item_2 = m.StockItem.objects.create(name="Stock Item 2", account=default_account)
        cls.stock_item_another_account = m.StockItem.objects.create(name="Stock Item 1", account=cls.another_account)

        cls.stock_movement_1 = m.StockMovement.objects.create(
            stock_item=cls.stock_item_1, org_unit=cls.default_orgunit, account=default_account, quantity=10
        )
        cls.stock_movement_2 = m.StockMovement.objects.create(
            stock_item=cls.stock_item_1, org_unit=cls.default_orgunit, account=default_account, quantity=20
        )

    def test_stock_items_list_without_auth(self):
        """GET /stock/items/ without auth should result in a 403"""

        response = self.client.get(BASE_URL + "items/")
        self.assertJSONResponse(response, 403)

    def test_stock_items_list_with_anon_user(self):
        """GET /stock/items/ with anon user should result in a 403"""
        self.client.force_authenticate(user=self.anon)

        response = self.client.get(BASE_URL + "items/")
        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_stock_items_list_without_right(self):
        """GET /stock/items/ without rights"""
        self.client.force_authenticate(user=self.user_without_rights)

        response = self.client.get(BASE_URL + "items/")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(
            response.data["detail"],
            "You do not have permission to perform this action.",
        )

    def test_stock_items_list_with_rights_should_return_data(self):
        """GET /stock/items/ with correct user rights should return good data"""
        self.client.force_authenticate(user=self.user_with_rights)

        response = self.client.get(BASE_URL + "items/")

        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data["results"]), 2)
