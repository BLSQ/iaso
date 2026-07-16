from django.urls import reverse
from rest_framework import status

from iaso.models import Account
from iaso.test import APITestCase


class V1MobilePlanningListAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="test")
        cls.user = user = cls.create_user_with_profile(username="test", account=cls.account)

    def test_permissions(self):
        res = self.client.get(reverse("mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.fail()

    def test_list(self):
        self.fail()
