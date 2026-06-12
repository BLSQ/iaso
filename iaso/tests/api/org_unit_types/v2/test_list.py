from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import MONTH, Account, DataSource, Form, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class OrgUnitTypesV2ListTestCase(SwaggerTestCaseMixin, APITestCase):
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
        cls.org_unit_type_6 = org_unit_type_6 = OrgUnitType.objects.create(name="6", short_name="6")
        wrong_project.unit_types.add(org_unit_type_6)
        wrong_project.save()

    def assertValidOrgUnitTypeListData(self, list_data, expected_length: int):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="results", paginated=True
        )
        self.assertResponseCompliantToSwagger(list_data, "PaginatedOrgUnitTypeListList")

    def test_permissions(self):
        res = self.client.get(reverse("orgunittypes_v2-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.normal_user)
        res = self.client.get(reverse("orgunittypes_v2-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.jane)

        res = self.client.get(reverse("orgunittypes_v2-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_org_unit_types_list_count_valid_orgunits(self):
        """GET /orgunittypes/ with checks on the count of org units (all validation statuses)"""

        # Prepare org units
        OrgUnit.objects.create(
            name="OU 1 ok",
            org_unit_type=self.org_unit_type_1,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )
        OrgUnit.objects.create(
            name="OU 1 new",
            org_unit_type=self.org_unit_type_1,
            validation_status=OrgUnit.VALIDATION_NEW,
            version=self.version_1,
        )
        OrgUnit.objects.create(
            name="OU 1 rejected",
            org_unit_type=self.org_unit_type_1,
            validation_status=OrgUnit.VALIDATION_REJECTED,
            version=self.version_1,
        )
        OrgUnit.objects.create(
            name="OU 2 ok",
            org_unit_type=self.org_unit_type_2,
            validation_status=OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )

        # Link projects to datasource
        self.data_source_1.projects.set([self.ead, self.esd])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-list"), data={"order": "id", "fields": ":all"})
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 5)
        response_data = response.json()["results"]

        result_out_1 = response_data[0]
        total_org_units_type_1 = OrgUnit.objects.filter(org_unit_type=self.org_unit_type_1).count()
        self.assertEqual(result_out_1["name"], self.org_unit_type_1.name)
        self.assertEqual(result_out_1["units_count"], 3)
        self.assertEqual(result_out_1["units_count"], total_org_units_type_1)

        result_out_2 = response_data[1]
        total_org_units_type_2 = OrgUnit.objects.filter(org_unit_type=self.org_unit_type_2).count()
        self.assertEqual(result_out_2["name"], self.org_unit_type_2.name)
        self.assertEqual(result_out_2["units_count"], 1)
        self.assertEqual(result_out_2["units_count"], total_org_units_type_2)

        for other_types in response_data[2:]:
            self.assertEqual(other_types["units_count"], 0)

    def test_filter_project(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-list"), data={"project": self.ead.id})
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 2)

    def test_filter_by_wrong_data_source_retrieve_ok(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-list"), {"project": -1, "fields": ":all"})
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 0)

    def test_filter_project_ids(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"),
            data={"project_ids": ",".join([str(self.ead.id), str(self.esd.id)]), "fields": ":all"},
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 5)

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"),
            data={"project_ids": ",".join([str(self.wrong_project.id)]), "fields": ":all"},
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 0)

    def test_filter_project_id(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-list"), data={"project": self.ead.id, "fields": ":all"})
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 2)

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"), data={"project": self.wrong_project.id, "fields": ":all"}
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 0)

    def test_filter_app_id(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"), data={"app_id": "ead.app_id", "order": "id", "fields": ":all"}
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 2)

        # check the ou type in response + in sub unit types
        self.assertCountEqual(
            [self.org_unit_type_1.id, self.org_unit_type_2.id], [x["id"] for x in res_data["results"]]
        )
        out_1 = res_data["results"][0]

        self.assertEqual(out_1["id"], self.org_unit_type_1.id)
        self.assertCountEqual([x["id"] for x in out_1["sub_unit_types"]], [])

        out_2 = res_data["results"][1]

        self.assertEqual(out_2["id"], self.org_unit_type_2.id)
        # org_unit_type_3 not in there
        self.assertCountEqual([x["id"] for x in out_2["sub_unit_types"]], [self.org_unit_type_2.id])

    def test_filter_search(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"), data={"search": "test", "order": "id", "fields": ":all"}
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 0)

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"), data={"search": "boom", "order": "id", "fields": ":all"}
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 1)

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-list"), data={"search": "bo", "order": "id", "fields": ":all"}
        )
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 1)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(9):
            response = self.client.get(reverse("orgunittypes_v2-list"), data={"app_id": "ead.app_id", "fields": ":all"})
        res_data = self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(res_data, 2)
