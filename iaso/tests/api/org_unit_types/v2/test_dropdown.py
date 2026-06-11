from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import MONTH, Account, DataSource, Form, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class OrgUnitTypesV2DropdownTestCase(SwaggerTestCaseMixin, APITestCase):
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
        wrong_project.save()

    def assertValidOrgUnitTypeDropdownData(self, data, expected_length):
        self.assertEqual(len(data), expected_length)
        self.assertResponseCompliantToSwagger(data, "OrgUnitTypesDropdown", as_array=True)

    def test_org_unit_type_dropdown(self):
        # Default path that returns all OUTs to which the user has access
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-dropdown"))
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 5)  # The 5 types created in setUpTestData

    def test_filter_source_version(self):
        # Let's make sure that some OUTs from the setup account are actually used
        OrgUnit.objects.create(
            name="OUT 1",
            version=self.version_1,
            org_unit_type=self.org_unit_type_1,
        )
        OrgUnit.objects.create(
            name="OUT 2",
            version=self.version_1,
            org_unit_type=self.org_unit_type_2,
        )
        OrgUnit.objects.create(
            name="OUT 3",
            version=self.version_2,
            org_unit_type=self.org_unit_type_3,
        )

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"source_version_id": self.version_1.id})
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertValidOrgUnitTypeDropdownData(res_data, 2)
        for out in res_data:
            self.assertIn(out["id"], [self.org_unit_type_1.id, self.org_unit_type_2.id])

        # Now let's try with the other version
        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"source_version_id": self.version_2.id})
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertValidOrgUnitTypeDropdownData(res_data, 1)  # Because only 1 OU was created above with that version
        self.assertEqual(res_data[0]["id"], self.org_unit_type_3.id)

    def test_filter_source_version_unknown_version(self):
        probably_not_a_valid_source_version_id = 1234567890
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("orgunittypes_v2-dropdown"), data={"source_version_id": probably_not_a_valid_source_version_id}
        )
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 0)  # Because no OU was created with that version

    def test_filter_source_version_error_version_wrong_account(self):
        # First, let's create a parallel account/project/....
        new_account, new_datasource, new_source_version, new_project = self.create_account_datasource_version_project(
            "new source", "new account", "new project"
        )
        new_user = self.create_user_with_profile(
            username="new user", account=new_account, permissions=[CORE_FORMS_PERMISSION]
        )
        new_out_1 = OrgUnitType.objects.create(name="new out 1", short_name="new out 1")
        new_out_2 = OrgUnitType.objects.create(name="new out 2", short_name="new out 2")
        new_project.unit_types.set([new_out_1, new_out_2])
        OrgUnit.objects.create(
            name="new OUT 1",
            version=new_source_version,
            org_unit_type=new_out_1,
        )
        OrgUnit.objects.create(
            name="new OUT 2",
            version=new_source_version,
            org_unit_type=new_out_2,
        )

        # Then let's make sure that OUTs from the setup account are actually used
        OrgUnit.objects.create(
            name="OUT 1",
            version=self.version_1,
            org_unit_type=self.org_unit_type_1,
        )
        OrgUnit.objects.create(
            name="OUT 2",
            version=self.version_1,
            org_unit_type=self.org_unit_type_2,
        )
        OrgUnit.objects.create(
            name="OUT 3",
            version=self.version_1,
            org_unit_type=self.org_unit_type_3,
        )

        # Let's make sure that the dropdown properly returns values for the setup account
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"source_version_id": self.version_1.id})

        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 3)  # Because 3 OU were created above

        # Now let's make sure that nothing is returned for the setup source version and the new user because it's the wrong account
        self.client.force_authenticate(new_user)
        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"source_version_id": self.version_1.id})
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 0)

    def test_filter_by_app_id(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"app_id": "somethingwrong"})

        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 0)

        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"app_id": "ead.app_id"})

        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 2)

        response = self.client.get(reverse("orgunittypes_v2-dropdown"), data={"app_id": "esd.app_id"})

        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 3)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(2):
            # SELECT QUERYSET
            # PREFETCH sub_types
            response = self.client.get(reverse("orgunittypes_v2-dropdown"))
        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidOrgUnitTypeDropdownData(res_data, 5)

    def test_permissions(self):
        res = self.client.get(reverse("orgunittypes_v2-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.normal_user)
        res = self.client.get(reverse("orgunittypes_v2-dropdown"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.jane)

        res = self.client.get(reverse("orgunittypes_v2-dropdown"))
        self.assertJSONResponse(res, status.HTTP_200_OK)
