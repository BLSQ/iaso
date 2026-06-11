from django.urls import reverse
from rest_framework import status

from iaso.models import Account, AccountFeatureFlag
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountFeatureFlagList(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        account = Account.objects.create(name="account")

        # delete the ones created by migration
        AccountFeatureFlag.objects.all().delete()

        for i in range(20):
            AccountFeatureFlag.objects.create(name=f"test-name-{i}", code=f"test-code-{i}")

        self.john_doe = self.create_user_with_profile(username="john.doe", account=account)
        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )

    def assertValidData(self, res_data, expected_length):
        self.assertValidListData(
            list_data=res_data, results_key="results", expected_length=expected_length, paginated=True
        )
        self.assertResponseCompliantToSwagger(res_data, "PaginatedAccountFeatureFlagListList")

    def test_permission(self):
        res = self.client.get(reverse("account_feature_flags-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("account_feature_flags-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("account_feature_flags-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(4):
            # 1-2 PERMISSION CHECK
            # 3 PAGINATION COUNT
            # 4 SELECT
            res = self.client.get(reverse("account_feature_flags-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 20)

    def test_list(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("account_feature_flags-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 20)

        for item in res_data["results"]:
            self.assertIsNotNone(item["created_at"])
            self.assertIsNotNone(item["updated_at"])
            self.assertIn("test-code-", item["code"])
            self.assertIn("test-name-", item["name"])
