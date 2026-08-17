from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Form, OrgUnitType, Project
from iaso.models.missions import MissionOrgUnitType, MissionType
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionOrgUnitTypeAPICreateTestCase(SwaggerTestCaseMixin, APITestCase):
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

        cls.out = OrgUnitType.objects.create(name="out")
        cls.out_2 = OrgUnitType.objects.create(name="out2")
        cls.out_other_account = OrgUnitType.objects.create(name="out_other_account")

        cls.out.projects.add(cls.project)
        cls.out_2.projects.add(cls.project)
        cls.out_other_account.projects.add(cls.project_other_account)

        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)

        cls.form_1.org_unit_types.add(cls.out)
        cls.form_2.org_unit_types.add(cls.out)
        cls.form_3.org_unit_types.add(cls.out_2)

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

        res = self.client.post(reverse("missions-list"), data={"mission_type": MissionType.ORG_UNIT_AND_FORM})
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.post(
            reverse("missions-list"), data={"mission_type": MissionType.ORG_UNIT_AND_FORM, "name": "test"}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "org_unit_type", "This field is required.")

        res = self.client.post(
            reverse("missions-list"),
            data={"mission_type": MissionType.ORG_UNIT_AND_FORM, "name": "test", "org_unit_type": self.out.pk},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "min_cardinality", "This field is required.")

    def test_validation_should_have_one_form(self):
        self.client.force_authenticate(user=self.user_account_write_perm)
        res = self.client.post(
            reverse("missions-list"), data={"mission_type": MissionType.ORG_UNIT_AND_FORM, "name": "name"}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "forms", "This field is required.")

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "min_cardinality": 1,
                "org_unit_type": self.out.pk,
                "forms": [],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_data, {"forms": {api_settings.NON_FIELD_ERRORS_KEY: ["This list may not be empty."]}})

    def test_validation_should_provide_org_unit_type_that_belong_to_account(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out_other_account.pk,
                "min_cardinality": 1,
                "forms": [],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "org_unit_type", f'Invalid pk "{self.out_other_account.pk}" - object does not exist.'
        )

    def test_validation_should_provide_forms_that_belong_to_out(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out_2.pk,
                "min_cardinality": 1,
                "forms": [
                    {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                    {"form": self.form_2.pk, "min_cardinality": 1, "max_cardinality": 2},
                ],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(
            res_data,
            {
                "forms": [
                    {"form": [f'Invalid pk "{self.form_1.pk}" - object does not exist.']},
                    {"form": [f'Invalid pk "{self.form_2.pk}" - object does not exist.']},
                ]
            },
        )

    def test_validation_should_provide_forms_that_belong_to_account(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out.pk,
                "min_cardinality": 1,
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
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out.pk,
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
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out.pk,
                "min_cardinality": 4,
                "max_cardinality": 2,
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
                ]
            },
        )

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out.pk,
                "min_cardinality": 4,
                "max_cardinality": 2,
                "forms": [
                    {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 3},
                    {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 4},
                ],
            },
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(
            res_data, "min_cardinality", "Minimum cardinality must be inferior than the maximum cardinality"
        )

        res = self.client.post(
            reverse("missions-list"),
            data={
                "mission_type": MissionType.ORG_UNIT_AND_FORM,
                "name": "name",
                "org_unit_type": self.out.pk,
                "min_cardinality": 4,
                "max_cardinality": 2,
                "forms": [
                    {"form": self.form_1.pk, "max_cardinality": 3},
                    {"form": self.form_2.pk, "max_cardinality": 4},
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
                ]
            },
        )

    def test_num_queries(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        ContentType.objects.clear_cache()
        with self.assertNumQueries(14):
            res = self.client.post(
                reverse("missions-list"),
                data={
                    "mission_type": MissionType.ORG_UNIT_AND_FORM.value,
                    "name": "name",
                    "description": "description",
                    "org_unit_type": self.out.pk,
                    "min_cardinality": 2,
                    "max_cardinality": 3,
                    "forms": [
                        {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                        {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 3},
                    ],
                },
            )

        self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_create(self):
        self.client.force_authenticate(user=self.user_account_write_perm)

        body = {
            "mission_type": MissionType.ORG_UNIT_AND_FORM.value,
            "name": "name",
            "description": "description",
            "org_unit_type": self.out.pk,
            "min_cardinality": 2,
            "max_cardinality": 3,
            "forms": [
                {"form": self.form_1.pk, "min_cardinality": 1, "max_cardinality": 2},
                {"form": self.form_2.pk, "min_cardinality": 2, "max_cardinality": 3},
            ],
        }
        self.assertValidBodyData(body)
        res = self.client.post(
            reverse("missions-list"),
            data=body,
        )

        self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertEqual(MissionOrgUnitType.objects.count(), 1)

        mission_out = MissionOrgUnitType.objects.first()

        self.assertEqual(mission_out.name, "name")
        self.assertEqual(mission_out.description, "description")
        self.assertEqual(mission_out.org_unit_type_id, self.out.pk)
        self.assertEqual(mission_out.min_cardinality, 2)
        self.assertEqual(mission_out.max_cardinality, 3)

        self.assertEqual(mission_out.forms.count(), 2)

        self.assertCountEqual(
            list(mission_out.missionformthroughform_set.values_list("min_cardinality", "max_cardinality", "form_id")),
            [(1, 2, self.form_1.pk), (2, 3, self.form_2.pk)],
        )
