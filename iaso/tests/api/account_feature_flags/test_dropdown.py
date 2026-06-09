from django.urls import reverse
from rest_framework import status

from iaso.models import Account, AccountFeatureFlag
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountFeatureFlagDropdown(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        account = Account.objects.create(name="account")

        self.ff_length = AccountFeatureFlag.objects.count()
        self.assertGreater(self.ff_length, 0)

        self.john_doe = self.create_user_with_profile(username="john.doe", account=account)
        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )

    def assertValidData(self, res_data, expected_length):
        self.assertEqual(len(res_data), expected_length)
        self.assertResponseCompliantToSwagger(res_data, "AccountFeatureFlagDropdown", as_array=True)

    def test_permission(self):
        res = self.client.get(reverse("account_feature_flags-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("account_feature_flags-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("account_feature_flags-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(3):
            # 1-2 PERMISSION CHECK
            # 3 SELECT
            res = self.client.get(reverse("account_feature_flags-dropdown"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, self.ff_length)

    def test_list(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("account_feature_flags-dropdown"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, self.ff_length)

        self.assertCountEqual(res_data, [{"value": x.code, "label": x.name} for x in AccountFeatureFlag.objects.all()])

    def test_list_empty(self):
        """
        Test for swagger compliance with empty list
        """
        AccountFeatureFlag.objects.all().delete()

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("account_feature_flags-dropdown"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)
