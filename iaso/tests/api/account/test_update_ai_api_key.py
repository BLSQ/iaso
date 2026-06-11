import random
import string

from django.urls import reverse
from rest_framework import status

from iaso.models import Account
from iaso.modules import MODULE_FORM_AI
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountUpdateAIApiKey(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(
            name="account",
            anthropic_api_key="".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(32)),
        )
        self.other_account = Account.objects.create(name="other_account")

        self.john_doe = self.create_user_with_profile(username="john.doe", account=self.account)
        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION]
        )

    @staticmethod
    def add_form_ai_module(*accounts):
        for account in accounts:
            account_modules = account.modules or []
            if MODULE_FORM_AI not in account_modules:
                account_modules.append(MODULE_FORM_AI.codename)
                account.modules = account_modules
                account.save()

    def assertValidPutData(self, data):
        self.assertResponseCompliantToSwagger(data, "AccountUpdateAIApiKeyRequest")

    def test_permission(self):
        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.john_doe)
        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.john_wick)
        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.add_form_ai_module(self.account)

        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(user=self.john_wick)
        self.add_form_ai_module(self.account)

        with self.assertNumQueries(5):
            # 1-2: PERM
            # 3: QUERYSET
            # 4: SELECT object
            # 5: UPDATE
            res = self.client.put(
                reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}),
                data={"anthropic_api_key": "12345678910111213141516"},
            )
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_update(self):
        self.client.force_authenticate(user=self.john_wick)
        self.add_form_ai_module(self.account)

        with self.subTest("Required"):
            res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "anthropic_api_key", "This field is required.")

        with self.subTest("No blank nor null"):
            res = self.client.put(
                reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}), data={"anthropic_api_key": ""}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "anthropic_api_key", "This field may not be blank.")

            res = self.client.put(
                reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}), data={"anthropic_api_key": None}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "anthropic_api_key", "This field may not be null.")

        with self.subTest("Min length of 16"):
            res = self.client.put(
                reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}), data={"anthropic_api_key": "a" * 15}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "anthropic_api_key", "Ensure this field has at least 16 characters.")

        data = {"anthropic_api_key": "a" * 16}
        self.assertValidPutData(data)
        res = self.client.put(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}), data=data)
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        self.account.refresh_from_db()
        self.assertEqual(self.account.anthropic_api_key, "a" * 16)
