from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Form, MissionForm, Project
from iaso.models.missions import MissionType
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionFormAPICreateTestCase(SwaggerTestCaseMixin, APITestCase):
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

        cls.project = Project.objects.create(name="project", account=cls.account)
        cls.project_other_account = Project.objects.create(name="project", account=cls.other_account)

        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)

        cls.form_4 = Form.objects.create(name="form_4")
        cls.form_5 = Form.objects.create(name="form_5")

        cls.form_4.projects.add(cls.project_other_account)
        cls.form_5.projects.add(cls.project_other_account)

    def assertValidBodyData(self, data):
        self.assertResponseCompliantToSwagger(data, "MissionPolymorphicCreateRequest")

    def test_validation(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.post(reverse("missions-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "mission_type", "This field is required")

        res = self.client.post(reverse("missions-list"), data={"mission_type": "wrong"})
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "mission_type", "Invalid mission_type")

        res = self.client.post(reverse("missions-list"), data={"mission_type": MissionType.FORM_FILLING})
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field is required.")

    def test_validation_should_have_one_form(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.post(
            reverse("missions-list"), data={"mission_type": MissionType.FORM_FILLING, "name": "name"}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "forms", "This field is required.")

        res = self.client.post(
            reverse("missions-list"), data={"mission_type": MissionType.FORM_FILLING, "name": "name", "forms": []}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_data, {"forms": {api_settings.NON_FIELD_ERRORS_KEY: ["This list may not be empty."]}})

    def test_validation_should_provide_forms_that_belong_to_account(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.FORM_FILLING,
                "name": "name",
                "forms": [
                    {"form": self.form_4.pk, "min_cardinality": 1, "max_cardinality": 2},
                    {"form": self.form_5.pk, "min_cardinality": 1, "max_cardinality": 2},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res_data,
            {
                "forms": [
                    {"form": [f'Invalid pk "{self.form_4.pk}" - object does not exist.']},
                    {"form": [f'Invalid pk "{self.form_5.pk}" - object does not exist.']},
                ]
            },
        )

    def test_validation_forms_should_be_unique(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.FORM_FILLING,
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

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.FORM_FILLING,
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

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.FORM_FILLING,
                "name": "name",
                "forms": [
                    {"form": self.form_1.pk, "max_cardinality": 1},
                    {"form": self.form_2.pk, "max_cardinality": 1},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res_data,
            {
                "forms": [
                    {"min_cardinality": ["This field is required."]},
                    {"min_cardinality": ["This field is required."]},
                ],
            },
        )

    def test_num_queries(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        ContentType.objects.clear_cache()
        with self.assertNumQueries(14):
            res = self.client.post(
                reverse("missions-list"),
                data={
                    "mission_type": MissionType.FORM_FILLING,
                    "name": "name",
                    "description": "description",
                    "forms": [
                        {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                        {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 3},
                        {"form": self.form_3.pk, "min_cardinality": 3, "max_cardinality": 4},
                    ],
                },
            )

        self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_create(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        body = {
            "mission_type": MissionType.FORM_FILLING,
            "name": "name",
            "description": "description",
            "forms": [
                {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 3},
                {"form": self.form_3.pk, "min_cardinality": 3, "max_cardinality": 4},
            ],
        }
        self.assertValidBodyData(body)
        res = self.client.post(
            reverse("missions-list"),
            data=body,
        )

        self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertEqual(MissionForm.objects.count(), 1)

        mission_form = MissionForm.objects.first()

        self.assertEqual(mission_form.name, "name")
        self.assertEqual(mission_form.description, "description")
        self.assertEqual(mission_form.created_by, self.user_account_write_perm)
        self.assertEqual(mission_form.account, self.account)

        self.assertEqual(mission_form.forms.count(), 3)

        self.assertCountEqual(
            list(mission_form.missionformthroughform_set.values_list("min_cardinality", "max_cardinality", "form_id")),
            [(1, 2, self.form_1.pk), (2, 3, self.form_2.pk), (3, 4, self.form_3.pk)],
        )
