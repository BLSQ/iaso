import random
import string

from django.urls import reverse
from rest_framework import status

from iaso.models import Account
from iaso.modules import MODULE_FORM_AI
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TestAccountRetrieveAIApiKey(SwaggerTestCaseMixin, APITestCase):
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

    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "AccountRetrieveAIApiKey")

    def test_view(self):
        self.client.force_authenticate(user=self.john_wick)
        self.add_form_ai_module(self.account)

        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        # check that we don't see the whole key
        self.assertNotEqual(res_data["anthropic_api_key"], self.account.anthropic_api_key)
        self.assertEqual(res_data["anthropic_api_key"], f"{self.account.anthropic_api_key[:8]}...")

        self.account.anthropic_api_key = None
        self.account.save()

        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

        self.account.anthropic_api_key = ""
        self.account.save()

        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_num_queries(self):
        self.client.force_authenticate(user=self.john_wick)
        self.add_form_ai_module(self.account)

        with self.assertNumQueries(4):
            # 1-2: PERM
            # 3: QUERYSET
            # 4: SELECT object
            res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_permission(self):
        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.john_doe)
        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.john_wick)
        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.add_form_ai_module(self.account)

        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.account.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("accounts-ai-api-key", kwargs={"pk": self.other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
