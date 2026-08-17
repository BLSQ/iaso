from django.urls import reverse
from rest_framework import status

from iaso.models import Account, MissionForm
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase


class MissionBaseAPIUpdateTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")

        cls.user_other_account = cls.create_user_with_profile(
            username="jane_doe", email="", password="", account=cls.other_account
        )
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

        cls.soft_deleted_mission = MissionForm.objects.create(name="mission", account=cls.account)
        cls.soft_deleted_mission.delete()

        cls.mission_other_account = MissionForm.objects.create(name="other_account_mission", account=cls.other_account)

    def test_permissions(self):
        res = self.client.put(reverse("missions-detail", kwargs={"pk": 1}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user_account_no_perm)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": 1}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_read_perm)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": 1}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": 1}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(user=self.superuser)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": 1}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_soft_deleted(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": self.soft_deleted_mission.id}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_out_of_account(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": self.mission_other_account.id}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
