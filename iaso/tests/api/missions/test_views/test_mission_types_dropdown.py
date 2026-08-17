from django.urls import reverse
from rest_framework import status

from iaso.models import Account
from iaso.models.missions import MissionType
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionAPIMissionTypeDropdownTestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")
        cls.user_account_no_perm = cls.create_user_with_profile(
            username="john_doe", email="", password="", account=cls.other_account
        )
        cls.user_account_read_perm = cls.create_user_with_profile(
            username="john_wick_read",
            email="",
            password="",
            account=cls.account,
            permissions=[CORE_MISSION_READ_PERMISSION],
        )
        cls.user_account_write_perm = cls.create_user_with_profile(
            username="john_wick_write",
            email="",
            password="",
            account=cls.account,
            permissions=[CORE_MISSION_WRITE_PERMISSION],
        )
        cls.superuser = cls.create_user_with_profile(
            username="john_wick_superuser",
            email="",
            password="",
            account=cls.account,
            permissions=[],
            is_superuser=True,
        )

    def assertValidData(self, data):
        self.assertEqual(len(data), len(MissionType.choices))
        self.assertResponseCompliantToSwagger(data, "MissionTypeDropdown", True)

    def test_permissions(self):
        res = self.client.get(reverse("missions-mission-types-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user_account_no_perm)
        res = self.client.get(reverse("missions-mission-types-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_read_perm)
        res = self.client.get(reverse("missions-mission-types-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.get(reverse("missions-mission-types-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.superuser)
        res = self.client.get(reverse("missions-mission-types-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.user_account_read_perm)

        with self.assertNumQueries(2):
            res = self.client.get(reverse("missions-mission-types-dropdown"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_dropdown(self):
        self.client.force_authenticate(self.user_account_read_perm)

        res = self.client.get(reverse("missions-mission-types-dropdown"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidData(res_data)
        self.assertEqual(
            res_data,
            [
                {"label": MissionType.FORM_FILLING.label, "value": MissionType.FORM_FILLING.value},
                {"label": MissionType.ORG_UNIT_AND_FORM.label, "value": MissionType.ORG_UNIT_AND_FORM.value},
                {"label": MissionType.ENTITY_AND_FORM.label, "value": MissionType.ENTITY_AND_FORM.value},
            ],
        )
