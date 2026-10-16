from django.urls import reverse
from rest_framework import status

from iaso.tests.api.missions.test_views.test_retrieve.base import MissionAPIRetrieveBaseTestCase


class MissionAPIRetrieveCommonTestCase(MissionAPIRetrieveBaseTestCase):
    def test_permissions(self):
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user_account_no_perm)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_read_perm)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.superuser)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_should_see_missions_only_belonging_to_account(self):
        self.client.force_authenticate(self.user_account_read_perm)

        for pk in [self.mission_et_3.pk, self.mission_out_3.pk, self.mission_form_3.pk]:
            res = self.client.get(reverse("missions-detail", kwargs={"pk": pk}))
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_not_see_soft_deleted_mission(self):
        self.assertIsNotNone(self.soft_deleted_mission.deleted_at)

        self.client.force_authenticate(self.user_account_read_perm)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.soft_deleted_mission.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
