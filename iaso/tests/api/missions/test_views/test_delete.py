from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, MissionForm, Project
from iaso.models.missions import MissionFormThroughForm
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionAPIDeleteTestCase(SwaggerTestCaseMixin, APITestCase):
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

        # create some data

        cls.project = Project.objects.create(name="project", account=cls.account)
        cls.project_other_account = Project.objects.create(name="project", account=cls.other_account)

        # forms
        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")
        cls.form_4 = Form.objects.create(name="form_4")
        cls.form_5 = Form.objects.create(name="form_5")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)
        cls.form_4.projects.add(cls.project)
        cls.form_5.projects.add(cls.project)

        cls.form_6 = Form.objects.create(name="form_6")
        cls.form_7 = Form.objects.create(name="form_7")

        cls.form_6.projects.add(cls.project_other_account)
        cls.form_7.projects.add(cls.project_other_account)

        # missions
        cls.mission_form_1 = MissionForm.objects.create(name="mission_form_1", account=cls.account)
        cls.mission_form_2 = MissionForm.objects.create(name="mission_form_2", account=cls.account)
        cls.mission_form_3 = MissionForm.objects.create(name="mission_form_3", account=cls.other_account)

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_2, form=cls.form_4, min_cardinality=4, max_cardinality=5
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_2, form=cls.form_5, min_cardinality=5, max_cardinality=6
                ),
            ]
        )
        # deleted missions
        cls.soft_deleted_mission = MissionForm.objects.create(name="soft_deleted_mission_form", account=cls.account)
        cls.soft_deleted_mission.delete()

    def test_permissions(self):
        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.user_account_no_perm)
        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_read_perm)
        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.delete(
            reverse("missions-detail", kwargs={"pk": MissionForm.objects.order_by("-id").first().pk + 1})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(user=self.superuser)
        res = self.client.delete(
            reverse("missions-detail", kwargs={"pk": MissionForm.objects.order_by("-id").first().pk + 1})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_soft_deleted(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.soft_deleted_mission.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_mission_to_another_account(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_3.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        ContentType.objects.clear_cache()
        with self.assertNumQueries(12):
            res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_2.pk}))

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.delete(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.mission_form_1.refresh_from_db()

        self.assertIsNotNone(self.mission_form_1.deleted_at)
        self.assertIsNotNone(self.mission_form_1.missionwithforms.deleted_at)
        self.assertIsNotNone(self.mission_form_1.mission_ptr.deleted_at)
