from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Form, MissionForm, Project
from iaso.models.missions import MissionFormThroughForm
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionFormAPIUpdateTestCase(SwaggerTestCaseMixin, APITestCase):
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

    def setUp(self):
        super().setUp()
        # missions
        self.mission_form_1 = MissionForm.objects.create(
            name="mission_form_1", description="mission_form_1", account=self.account
        )
        self.mission_form_2 = MissionForm.objects.create(
            name="mission_form_2", description="mission_form_2", account=self.account
        )
        self.mission_form_3 = MissionForm.objects.create(
            name="mission_form_3", description="mission_form_3", account=self.other_account
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=self.mission_form_1, form=self.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=self.mission_form_1, form=self.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=self.mission_form_1, form=self.form_3, min_cardinality=3, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=self.mission_form_2, form=self.form_4, min_cardinality=4, max_cardinality=5
                ),
                MissionFormThroughForm(
                    mission_form=self.mission_form_2, form=self.form_5, min_cardinality=5, max_cardinality=6
                ),
            ]
        )

    def assertValidBodyData(self, data):
        self.assertResponseCompliantToSwagger(data, "MissionFormUpdateRequest")

    def test_validation_should_have_one_form(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}), data={"name": "name"})
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "forms", "This field is required.")

        res = self.client.put(
            reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}), data={"name": "name", "forms": []}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_data, {"forms": {api_settings.NON_FIELD_ERRORS_KEY: ["This list may not be empty."]}})

    def test_validation_should_provide_forms_that_belong_to_account(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.put(
            reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}),
            data={
                "name": "name",
                "forms": [
                    {"form": self.form_6.pk, "min_cardinality": 1, "max_cardinality": 2},
                    {"form": self.form_7.pk, "min_cardinality": 1, "max_cardinality": 2},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res_data,
            {
                "forms": [
                    {"form": [f'Invalid pk "{self.form_6.pk}" - object does not exist.']},
                    {"form": [f'Invalid pk "{self.form_7.pk}" - object does not exist.']},
                ]
            },
        )

    def test_validation_forms_should_be_unique(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.put(
            reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}),
            data={
                "name": "name",
                "forms": [
                    {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                    {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 3},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "forms", "Each form may only be specified once.")

    def test_validation_min_max_cardinality(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.put(
            reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}),
            data={
                "name": "name",
                "forms": [
                    {"form": self.form_1.pk, "min_cardinality": 3, "max_cardinality": 1},
                    {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 1},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res_data,
            {
                "forms": [
                    {"min_cardinality": ["Minimum cardinality must be inferior than the maximum cardinality"]},
                    {"min_cardinality": ["Minimum cardinality must be inferior than the maximum cardinality"]},
                ],
            },
        )

        res = self.client.put(
            reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}),
            data={
                "name": "name",
                "forms": [
                    {"form": self.form_1.pk, "max_cardinality": 1},
                    {"form": self.form_2.pk, "min_cardinality": 1, "max_cardinality": 4},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res_data,
            {
                "forms": [{"min_cardinality": ["This field is required."]}, {}],
            },
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        self.client.force_authenticate(self.superuser)

        body = {
            "name": "new name",
            "description": "",
            "forms": [
                {"form": self.form_1.pk, "min_cardinality": 12, "max_cardinality": 15},
                {"form": self.form_4.pk, "min_cardinality": 1, "max_cardinality": 5},
            ],
        }
        self.assertValidBodyData(body)

        ContentType.objects.clear_cache()

        with self.assertNumQueries(18):
            res = self.client.put(
                reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}),
                data=body,
            )
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_update(self):
        self.client.force_authenticate(self.superuser)

        body = {
            "name": "new name",
            "description": "",
            "forms": [
                {"form": self.form_1.pk, "min_cardinality": 12, "max_cardinality": 15},
                {"form": self.form_4.pk, "min_cardinality": 1},
            ],
        }
        self.assertValidBodyData(body)
        res = self.client.put(reverse("missions-detail", kwargs={"pk": self.mission_form_1.pk}), data=body)

        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.mission_form_1.refresh_from_db()

        self.assertEqual(self.mission_form_1.name, "new name")
        self.assertEqual(self.mission_form_1.description, "")
        self.assertEqual(
            list(
                self.mission_form_1.missionformthroughform_set.values_list(
                    "form_id", "min_cardinality", "max_cardinality"
                )
            ),
            [(self.form_1.pk, 12, 15), (self.form_4.pk, 1, None)],
        )
