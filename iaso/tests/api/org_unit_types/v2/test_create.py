from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import MONTH, Account, DataSource, Form, OrgUnitType, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class OrgUnitTypesV2CreateTestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.data_source_1 = data_source_1 = DataSource.objects.create(name="DataSource1")
        cls.version_1 = SourceVersion.objects.create(number=1, data_source=data_source_1)
        ghi = Account.objects.create(name="Global Health Initiative", default_version=cls.version_1)
        cls.ead = ead = Project.objects.create(name="End All Diseases", account=ghi, app_id="ead.app_id")
        cls.esd = esd = Project.objects.create(name="End Some Diseases", account=ghi, app_id="esd.app_id")
        cls.data_source_2 = data_source_2 = DataSource.objects.create(name="DataSource2")
        cls.version_2 = SourceVersion.objects.create(number=1, data_source=data_source_2)

        wha = Account.objects.create(name="Worldwide Health Aid", default_version=cls.version_2)
        cls.wrong_project = wrong_project = Project.objects.create(name="End No Diseases", account=wha)

        cls.normal_user = get_user_model().objects.create_user(username="normal", password="normal")
        cls.read_only_user = cls.create_user_with_profile(
            username="readonly", account=ghi, permissions=[CORE_FORMS_PERMISSION]
        )
        cls.jane = cls.create_user_with_profile(
            username="janedoe",
            account=ghi,
            permissions=[CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION],
        )
        cls.reference_form = reference_form = Form.objects.create(
            name="Hydroponics study", period_type=MONTH, single_per_period=True
        )
        cls.reference_form_update = reference_form_update = Form.objects.create(
            name="Reference form update", period_type=MONTH, single_per_period=True
        )
        cls.reference_form_wrong_project = reference_form_wrong_project = Form.objects.create(
            name="Reference form with wrong project", period_type=MONTH, single_per_period=True
        )
        cls.org_unit_type_1 = org_unit_type_1 = OrgUnitType.objects.create(name="Plop", short_name="Pl")
        cls.org_unit_type_1.reference_forms.add(cls.reference_form_update)
        cls.org_unit_type_1.save()
        cls.org_unit_type_2 = org_unit_type_2 = OrgUnitType.objects.create(name="Boom", short_name="Bo")
        ead.unit_types.set([org_unit_type_1, org_unit_type_2])

        ead.forms.add(reference_form)
        ead.forms.add(reference_form_update)
        ead.save()

        cls.org_unit_type_3 = org_unit_type_3 = OrgUnitType.objects.create(name="3", short_name="3")
        cls.org_unit_type_4 = org_unit_type_4 = OrgUnitType.objects.create(name="4", short_name="4")
        cls.org_unit_type_5 = org_unit_type_5 = OrgUnitType.objects.create(name="5", short_name="5")
        esd.unit_types.set([org_unit_type_3, org_unit_type_4, org_unit_type_5])
        esd.save()

        cls.org_unit_type_3.sub_unit_types.add(cls.org_unit_type_4)
        cls.org_unit_type_3.sub_unit_types.add(cls.org_unit_type_5)

        cls.org_unit_type_2.sub_unit_types.add(cls.org_unit_type_2)
        cls.org_unit_type_2.sub_unit_types.add(cls.org_unit_type_3)

        wrong_project.forms.add(reference_form_wrong_project)
        wrong_project.save()

    def assertValidBodyData(self, data):
        self.assertResponseCompliantToSwagger(data, "OrgUnitTypeCreateRequest")

    def assertValidResponseData(self, data):
        self.assertResponseCompliantToSwagger(data, "OrgUnitTypeCreate")

    def test_permissions(self):
        res = self.client.post(reverse("orgunittypes_v2-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.read_only_user)
        res = self.client.post(reverse("orgunittypes_v2-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.jane)
        res = self.client.post(reverse("orgunittypes_v2-list"))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        data = {
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "project_ids": [self.ead.id],
            "sub_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
            "allow_creating_sub_unit_type_ids": [self.org_unit_type_3.id],
            "reference_forms_ids": [self.reference_form.id],
        }
        self.client.force_authenticate(self.jane)
        self.assertValidBodyData(data)

        with self.assertNumQueries(14):
            res = self.client.post(reverse("orgunittypes_v2-list"), data=data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_org_unit_type_create_invalid(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(reverse("orgunittypes_v2-list"), data={"name": "", "depth": 1, "project_ids": []})
        res_data = self.assertJSONResponse(response, 400)
        self.assertHasError(res_data, "name", "This field may not be blank.")
        self.assertHasError(res_data, "short_name", "This field is required.")
        self.assertHasError(res_data, "project_ids", "This list may not be empty.")

    def test_org_unit_type_create_invalid_wrong_project(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            reverse("orgunittypes_v2-list"),
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.wrong_project.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [],
            },
        )
        res_data = self.assertJSONResponse(response, 400)
        self.assertHasError(res_data, "project_ids", f'Invalid pk "{self.wrong_project.id}" - object does not exist.')

    def test_org_unit_type_create_with_not_existing_reference_form_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            reverse("orgunittypes_v2-list"),
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [1000],
            },
        )
        res_data = self.assertJSONResponse(response, 400)
        self.assertHasError(res_data, "reference_forms_ids", 'Invalid pk "1000" - object does not exist.')

    def test_org_unit_type_create_with_reference_form_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        data = {
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "project_ids": [self.ead.id],
            "sub_unit_type_ids": [],
            "allow_creating_sub_unit_type_ids": [],
            "reference_forms_ids": [self.reference_form.id],
        }
        self.assertValidBodyData(data)
        response = self.client.post(reverse("orgunittypes_v2-list"), data=data)

        res_data = self.assertJSONResponse(response, 201)
        self.assertValidResponseData(res_data)
        out = OrgUnitType.objects.get(id=res_data["id"])

        self.assertEqual([self.reference_form.id], list(out.reference_forms.values_list("id", flat=True)))

    def test_org_unit_type_create_with_reference_form_wrong_project(self):
        """POST /orgunittypes/ with Invalid reference form id"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            reverse("orgunittypes_v2-list"),
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [self.reference_form_wrong_project.id],
            },
            format="json",
        )

        res_data = self.assertJSONResponse(response, 400)
        self.assertHasError(
            res_data,
            "reference_forms_ids",
            f'Invalid pk "{self.reference_form_wrong_project.id}" - object does not exist.',
        )

    def test_org_unit_type_create_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        data = {
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "project_ids": [self.ead.id],
            "sub_unit_type_ids": [],
            "allow_creating_sub_unit_type_ids": [],
            "reference_forms_ids": [],
        }
        self.assertValidBodyData(data)

        response = self.client.post(
            reverse("orgunittypes_v2-list"),
            data=data,
        )

        res_data = self.assertJSONResponse(response, 201)
        self.assertValidResponseData(res_data)
        out = OrgUnitType.objects.get(id=res_data["id"])

        self.assertEqual(1, out.projects.count())

    def test_org_unit_type_create_with_sub_unit_types_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""
        data = {
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "project_ids": [self.ead.id],
            "sub_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
            "allow_creating_sub_unit_type_ids": [],
            "reference_forms_ids": [],
        }
        self.client.force_authenticate(self.jane)
        self.assertValidBodyData(data)

        response = self.client.post(
            reverse("orgunittypes_v2-list"),
            data=data,
        )

        res_data = self.assertJSONResponse(response, 201)
        self.assertValidResponseData(res_data)
        out = OrgUnitType.objects.get(id=res_data["id"])
        self.assertEqual(1, out.projects.count())
        self.assertEqual(2, out.sub_unit_types.count())
