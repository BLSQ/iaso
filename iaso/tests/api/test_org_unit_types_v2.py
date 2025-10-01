import typing

from django.test import TestCase
from rest_framework import status
from rest_framework.exceptions import ValidationError

from iaso import models as m
from iaso.api.org_unit_types.serializers import validate_reference_forms
from iaso.api.query_params import PROJECT, SOURCE_VERSION_ID
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase


class ValidateReferenceFormsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ref_form_1 = m.Form.objects.create(name="Form 1")
        cls.ref_form_2 = m.Form.objects.create(name="Form 2")
        cls.other_form = m.Form.objects.create(name="Form 3")

        cls.org_unit_type = m.OrgUnitType.objects.create(name="Plop", short_name="Pl")
        cls.org_unit_type.reference_forms.set([cls.ref_form_1, cls.ref_form_2])

        cls.account = m.Account.objects.create(name="Global Health Initiative")
        cls.project = m.Project.objects.create(name="End All Diseases", account=cls.account)
        cls.project.forms.set([cls.ref_form_1, cls.ref_form_2])

    def test_validate_reference_forms(self):
        data = {"projects": [self.project], "reference_forms": [self.ref_form_1, self.ref_form_2]}
        self.assertEqual(validate_reference_forms(data), data)

        data = {"projects": [self.project], "reference_forms": []}
        self.assertEqual(validate_reference_forms(data), data)

        data = {"projects": [self.project], "reference_forms": [self.other_form]}
        with self.assertRaises(ValidationError):
            validate_reference_forms(data)

        data = {"projects": [self.project], "reference_forms": [self.ref_form_1, self.other_form]}
        with self.assertRaises(ValidationError):
            validate_reference_forms(data)


class OrgUnitTypesAPITestCase(APITestCase):
    BASE_URL = "/api/v2/orgunittypes/"

    @classmethod
    def setUpTestData(cls):
        cls.data_source_1 = data_source_1 = m.DataSource.objects.create(name="DataSource1")
        cls.version_1 = m.SourceVersion.objects.create(number=1, data_source=data_source_1)
        ghi = m.Account.objects.create(name="Global Health Initiative", default_version=cls.version_1)
        cls.ead = ead = m.Project.objects.create(name="End All Diseases", account=ghi)
        cls.esd = esd = m.Project.objects.create(name="End Some Diseases", account=ghi)
        cls.data_source_2 = data_source_2 = m.DataSource.objects.create(name="DataSource2")
        cls.version_2 = m.SourceVersion.objects.create(number=1, data_source=data_source_2)

        wha = m.Account.objects.create(name="Worldwide Health Aid", default_version=cls.version_2)
        cls.wrong_project = wrong_project = m.Project.objects.create(name="End No Diseases", account=wha)

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=[CORE_FORMS_PERMISSION])
        cls.reference_form = reference_form = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )
        cls.reference_form_update = reference_form_update = m.Form.objects.create(
            name="Reference form update", period_type=m.MONTH, single_per_period=True
        )
        cls.reference_form_wrong_project = reference_form_wrong_project = m.Form.objects.create(
            name="Reference form with wrong project", period_type=m.MONTH, single_per_period=True
        )
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Plop", short_name="Pl")
        cls.org_unit_type_1.reference_forms.add(cls.reference_form_update)
        cls.org_unit_type_1.save()
        cls.org_unit_type_2 = org_unit_type_2 = m.OrgUnitType.objects.create(name="Boom", short_name="Bo")
        ead.unit_types.set([org_unit_type_1, org_unit_type_2])

        ead.forms.add(reference_form)
        ead.forms.add(reference_form_update)
        ead.save()

        cls.org_unit_type_3 = org_unit_type_3 = m.OrgUnitType.objects.create(name="3", short_name="3")
        cls.org_unit_type_4 = org_unit_type_4 = m.OrgUnitType.objects.create(name="4", short_name="4")
        cls.org_unit_type_5 = org_unit_type_5 = m.OrgUnitType.objects.create(name="5", short_name="5")
        esd.unit_types.set([org_unit_type_3, org_unit_type_4, org_unit_type_5])
        esd.save()

        wrong_project.forms.add(reference_form_wrong_project)
        wrong_project.save()

    def test_org_unit_types_list_without_auth_or_app_id(self):
        """GET /orgunittypes/ without auth or app id should result in a 200 empty response"""

        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 0)

    def test_org_unit_types_list_with_auth(self):
        """GET /orgunittypes/ with auth but empty app id should return list of org unit types"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitTypeListData(response_data, 5)
        for org_unit_type_data in response_data["orgUnitTypes"]:
            self.assertEqual(len(org_unit_type_data["projects"]), 1)

    def test_org_unit_types_list_count_valid_orgunits(self):
        """GET /orgunittypes/ with checks on the count of org units (all validation statuses)"""

        # Prepare org units
        ou_type1_ok = m.OrgUnit.objects.create(
            name="OU 1 ok",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )
        ou_type1_new = m.OrgUnit.objects.create(
            name="OU 1 new",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_NEW,
            version=self.version_1,
        )
        ou_type1_rejected = m.OrgUnit.objects.create(
            name="OU 1 rejected",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
            version=self.version_1,
        )
        ou_type2_ok = m.OrgUnit.objects.create(
            name="OU 2 ok",
            org_unit_type=self.org_unit_type_2,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )

        # Link projects to datasource
        self.data_source_1.projects.set([self.ead, self.esd])

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/v2/orgunittypes/?order=id&with_units_count=true")
        self.assertJSONResponse(response, 200)

        response_data = response.json()["orgUnitTypes"]

        result_out_1 = response_data[0]
        total_org_units_type_1 = m.OrgUnit.objects.filter(org_unit_type=self.org_unit_type_1).count()
        self.assertEqual(result_out_1["name"], self.org_unit_type_1.name)
        self.assertEqual(result_out_1["units_count"], 3)
        self.assertEqual(result_out_1["units_count"], total_org_units_type_1)

        result_out_2 = response_data[1]
        total_org_units_type_2 = m.OrgUnit.objects.filter(org_unit_type=self.org_unit_type_2).count()
        self.assertEqual(result_out_2["name"], self.org_unit_type_2.name)
        self.assertEqual(result_out_2["units_count"], 1)
        self.assertEqual(result_out_2["units_count"], total_org_units_type_2)

        for other_types in response_data[2:]:
            self.assertEqual(other_types["units_count"], 0)

    def test_org_unit_types_list_without_units_count(self):
        """GET /orgunittypes/ without with_units_count should not include units_count in response"""

        # Create some org units to ensure there would be counts if requested
        m.OrgUnit.objects.create(
            name="OU 1 ok",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/v2/orgunittypes/?order=id")
        self.assertJSONResponse(response, 200)

        response_data = response.json()["orgUnitTypes"]

        # Verify units_count is not present in any of the returned org unit types
        for org_unit_type in response_data:
            self.assertNotIn("units_count", org_unit_type)

    def test_org_unit_types_retrieve_without_auth_or_app_id(self):
        """GET /orgunittypes/<org_unit_type_id>/ without auth or app id should result in a 200 empty response"""

        response = self.client.get(f"{self.BASE_URL}{self.org_unit_type_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_org_unit_types_retrieve_ok(self):
        """GET /orgunittypes/<org_unit_type_id>/ happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}{self.org_unit_type_1.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())

    def test_org_unit_types_filter_by_project_retrieve_ok(self):
        f"""GET /orgunittypes/?{PROJECT}=... happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(self.BASE_URL, {PROJECT: self.ead.id})
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 2)

    def test_org_unit_types_filter_by_wrong_data_source_retrieve_ok(self):
        f"""GET /orgunittypes/?{PROJECT}=... wrong id"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(self.BASE_URL, {PROJECT: -1})
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 0)

    def test_org_unit_type_create_no_auth(self):
        """POST /orgunittypes/ without auth: 401"""

        response = self.client.post(self.BASE_URL, data={}, format="json")
        self.assertJSONResponse(response, 401)

    def test_org_unit_type_create_invalid(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(self.BASE_URL, data={"name": "", "depth": 1, "project_ids": []}, format="json")
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "name", "This field may not be blank.")
        self.assertHasError(response.json(), "short_name", "This field is required.")
        self.assertHasError(response.json(), "project_ids", "This list may not be empty.")

    def test_org_unit_type_create_invalid_wrong_project(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.wrong_project.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "project_ids", "Invalid project ids")

    def test_org_unit_type_create_with_not_existing_reference_form_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [1000],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "reference_forms_ids", 'Invalid pk "1000" - object does not exist.')

    def test_org_unit_type_create_with_reference_form_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [self.reference_form.id],
            },
            format="json",
        )

        org_unit_type_data = response.json()
        self.assertJSONResponse(response, 201)
        self.assertValidOrgUnitTypeData(org_unit_type_data)
        self.assertEqual(self.reference_form.id, org_unit_type_data["reference_forms"][0]["id"])

    def test_org_unit_type_create_with_reference_form_wrong_project(self):
        """POST /orgunittypes/ with Invalid reference form id"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
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

        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "reference_forms_ids", "Invalid reference forms ids")

    def test_org_unit_type_create_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [],
            },
            format="json",
        )

        org_unit_type_data = response.json()
        self.assertJSONResponse(response, 201)
        self.assertValidOrgUnitTypeData(org_unit_type_data)
        self.assertEqual(1, len(org_unit_type_data["projects"]))

    def test_org_unit_type_create_with_sub_unit_types_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            self.BASE_URL,
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)

        org_unit_type_data = response.json()
        self.assertValidOrgUnitTypeData(org_unit_type_data)
        self.assertEqual(1, len(org_unit_type_data["projects"]))
        self.assertEqual(2, len(org_unit_type_data["sub_unit_types"]))

    def test_org_unit_type_update_ok(self):
        """PUT /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(
            f"{self.BASE_URL}{self.org_unit_type_1.id}/",
            data={
                "name": "Plop updated",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())

    def test_org_unit_type_update_with_reference_form_id_ok(self):
        """PUT /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(
            f"{self.BASE_URL}{self.org_unit_type_1.id}/",
            data={
                "name": "Plop updated",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [self.reference_form_update.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())

    def test_org_unit_type_partial_update_ok(self):
        """PATCH /orgunittypes/<org_unit_type_id>/: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.patch(
            f"{self.BASE_URL}{self.org_unit_type_1.id}/", data={"short_name": "P"}, format="json"
        )
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())
        self.org_unit_type_1.refresh_from_db()
        self.assertEqual("P", self.org_unit_type_1.short_name)

    def test_org_unit_type_delete_ok(self):
        """DELETE /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.delete(f"{self.BASE_URL}{self.org_unit_type_1.id}/", format="json")
        self.assertJSONResponse(response, 204)

    def test_org_unit_type_delete_with_associated_org_units(self):
        """DELETE /orgunittypes/<org_unit_type_id> with associated org units should fail"""
        m.OrgUnit.objects.create(
            name="Test OU 1",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=self.version_1,
        )
        m.OrgUnit.objects.create(
            name="Test OU 2",
            org_unit_type=self.org_unit_type_1,
            validation_status=m.OrgUnit.VALIDATION_NEW,
            version=self.version_1,
        )

        self.client.force_authenticate(self.jane)
        response = self.client.delete(f"{self.BASE_URL}{self.org_unit_type_1.id}/", format="json")

        self.assertIn(response.status_code, [400])

        # Verify the org unit type still exists
        self.org_unit_type_1.refresh_from_db()
        self.assertIsNotNone(self.org_unit_type_1.id)

    def test_org_unit_type_dropdown(self):
        # Default path that returns all OUTs to which the user has access
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}dropdown/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_json = response.json()
        for out in response_json:
            self.assertValidOrgUnitTypeDropdownData(out)
        self.assertEqual(len(response_json), 5)  # The 5 types created in setUpTestData

    def test_org_unit_type_dropdown_with_source_version(self):
        # Let's make sure that some OUTs from the setup account are actually used
        m.OrgUnit.objects.create(
            name="OUT 1",
            version=self.version_1,
            org_unit_type=self.org_unit_type_1,
        )
        m.OrgUnit.objects.create(
            name="OUT 2",
            version=self.version_1,
            org_unit_type=self.org_unit_type_2,
        )
        m.OrgUnit.objects.create(
            name="OUT 3",
            version=self.version_2,
            org_unit_type=self.org_unit_type_3,
        )

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}dropdown/?{SOURCE_VERSION_ID}={self.version_1.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_json = response.json()
        self.assertEqual(len(response_json), 2)  # Because 2 OU were created above with that version
        for out in response_json:
            self.assertValidOrgUnitTypeDropdownData(out)
            self.assertIn(out["id"], [self.org_unit_type_1.id, self.org_unit_type_2.id])

        # Now let's try with the other version
        response = self.client.get(f"{self.BASE_URL}dropdown/?{SOURCE_VERSION_ID}={self.version_2.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_json = response.json()

        self.assertEqual(len(response_json), 1)  # Because only 1 OU was created above with that version
        out = response_json[0]
        self.assertValidOrgUnitTypeDropdownData(out)
        self.assertEqual(out["id"], self.org_unit_type_3.id)

    def test_org_unit_type_dropdown_with_source_version_unknown_version(self):
        probably_not_a_valid_source_version_id = 1234567890
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            f"{self.BASE_URL}dropdown/?{SOURCE_VERSION_ID}={probably_not_a_valid_source_version_id}"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_json = response.json()
        self.assertEqual(len(response_json), 0)  # Because no OU was created with that version

    def test_org_unit_type_dropdown_with_source_version_error_version_wrong_account(self):
        # First, let's create a parallel account/project/....
        new_account, new_datasource, new_source_version, new_project = self.create_account_datasource_version_project(
            "new source", "new account", "new project"
        )
        new_user = self.create_user_with_profile(
            username="new user", account=new_account, permissions=[CORE_FORMS_PERMISSION]
        )
        new_out_1 = m.OrgUnitType.objects.create(name="new out 1", short_name="new out 1")
        new_out_2 = m.OrgUnitType.objects.create(name="new out 2", short_name="new out 2")
        new_project.unit_types.set([new_out_1, new_out_2])
        m.OrgUnit.objects.create(
            name="new OUT 1",
            version=new_source_version,
            org_unit_type=new_out_1,
        )
        m.OrgUnit.objects.create(
            name="new OUT 2",
            version=new_source_version,
            org_unit_type=new_out_2,
        )

        # Then let's make sure that OUTs from the setup account are actually used
        m.OrgUnit.objects.create(
            name="OUT 1",
            version=self.version_1,
            org_unit_type=self.org_unit_type_1,
        )
        m.OrgUnit.objects.create(
            name="OUT 2",
            version=self.version_1,
            org_unit_type=self.org_unit_type_2,
        )
        m.OrgUnit.objects.create(
            name="OUT 3",
            version=self.version_1,
            org_unit_type=self.org_unit_type_3,
        )

        # Let's make sure that the dropdown properly returns values for the setup account
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}dropdown/?{SOURCE_VERSION_ID}={self.version_1.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_json = response.json()
        self.assertEqual(len(response_json), 3)  # Because 3 OU were created above

        # Now let's make sure that nothing is returned for the setup source version and the new user because it's the wrong account
        self.client.force_authenticate(new_user)
        response = self.client.get(f"{self.BASE_URL}dropdown/?{SOURCE_VERSION_ID}={self.version_1.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_json = response.json()
        self.assertEqual(len(response_json), 0)

    def assertValidOrgUnitTypeListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="orgUnitTypes", paginated=paginated
        )

        for org_unit_type_data in list_data["orgUnitTypes"]:
            self.assertValidOrgUnitTypeData(org_unit_type_data)

    # noinspection DuplicatedCode
    def assertValidOrgUnitTypeData(self, org_unit_type_data):
        self.assertHasField(org_unit_type_data, "id", int)
        self.assertHasField(org_unit_type_data, "name", str)
        self.assertHasField(org_unit_type_data, "short_name", str)
        self.assertHasField(org_unit_type_data, "depth", int, optional=True)
        self.assertHasField(org_unit_type_data, "projects", list, optional=True)
        self.assertHasField(org_unit_type_data, "sub_unit_types", list, optional=True)
        self.assertHasField(org_unit_type_data, "created_at", float)
        self.assertHasField(org_unit_type_data, "reference_forms", list, optional=True)

        if "projects" in org_unit_type_data:
            for project_data in org_unit_type_data["projects"]:
                self.assertValidProjectData(project_data)

        if "sub_unit_types" in org_unit_type_data:
            for sub_org_unit_type_data in org_unit_type_data["sub_unit_types"]:
                self.assertValidOrgUnitTypeData(sub_org_unit_type_data)

    def assertValidOrgUnitTypeDropdownData(self, data):
        self.assertHasField(data, "id", int)
        self.assertHasField(data, "name", str)
        self.assertHasField(data, "depth", int, optional=True)

    def test_org_unit_type_hierarchy_success(self):
        """Test GET /orgunittypes/{id}/hierarchy/ returns complete hierarchy"""

        # Create a hierarchy: Country -> Region -> District -> Health Facility
        country = m.OrgUnitType.objects.create(name="Country", short_name="COUNTRY", depth=1, category="COUNTRY")
        region = m.OrgUnitType.objects.create(name="Region", short_name="REGION", depth=2, category="REGION")
        district = m.OrgUnitType.objects.create(name="District", short_name="DISTRICT", depth=3, category="DISTRICT")
        health_facility = m.OrgUnitType.objects.create(name="Health Facility", short_name="HF", depth=4, category="HF")

        country.sub_unit_types.set([region])
        region.sub_unit_types.set([district])
        district.sub_unit_types.set([health_facility])

        country.projects.set([self.ead])
        region.projects.set([self.ead])
        district.projects.set([self.ead])
        health_facility.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}{country.id}/hierarchy/")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()

        self.assertEqual(response_data["id"], country.id)
        self.assertEqual(response_data["name"], "Country")
        self.assertEqual(response_data["depth"], 1)
        self.assertEqual(response_data["category"], "COUNTRY")

        self.assertEqual(len(response_data["sub_unit_types"]), 1)
        region_data = response_data["sub_unit_types"][0]
        self.assertEqual(region_data["id"], region.id)
        self.assertEqual(region_data["name"], "Region")
        self.assertEqual(region_data["depth"], 2)

        self.assertEqual(len(region_data["sub_unit_types"]), 1)
        district_data = region_data["sub_unit_types"][0]
        self.assertEqual(district_data["id"], district.id)
        self.assertEqual(district_data["name"], "District")
        self.assertEqual(district_data["depth"], 3)

        # Check third level (health facility)
        self.assertEqual(len(district_data["sub_unit_types"]), 1)
        hf_data = district_data["sub_unit_types"][0]
        self.assertEqual(hf_data["id"], health_facility.id)
        self.assertEqual(hf_data["name"], "Health Facility")
        self.assertEqual(hf_data["depth"], 4)

        self.assertEqual(len(hf_data["sub_unit_types"]), 0)

    def test_org_unit_type_hierarchy_not_found(self):
        """Test GET /orgunittypes/{id}/hierarchy/ with non-existent ID returns 404"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}99999/hierarchy/")

        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)
        response_data = response.json()
        self.assertIn("error", response_data)

    def test_org_unit_type_hierarchy_without_auth(self):
        """Test GET /orgunittypes/{id}/hierarchy/ without authentication"""

        response = self.client.get(f"{self.BASE_URL}{self.org_unit_type_1.id}/hierarchy/")
        # Without authentication, the queryset is filtered and returns empty, so 404 is expected
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

    def test_org_unit_type_hierarchy_multiple_children(self):
        """Test hierarchy with multiple children at same level"""

        parent = m.OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1)
        child1 = m.OrgUnitType.objects.create(name="Child 1", short_name="CHILD1", depth=2)
        child2 = m.OrgUnitType.objects.create(name="Child 2", short_name="CHILD2", depth=2)
        child3 = m.OrgUnitType.objects.create(name="Child 3", short_name="CHILD3", depth=2)

        parent.sub_unit_types.set([child1, child2, child3])
        parent.projects.set([self.ead])
        child1.projects.set([self.ead])
        child2.projects.set([self.ead])
        child3.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}{parent.id}/hierarchy/")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()

        self.assertEqual(len(response_data["sub_unit_types"]), 3)

        child_ids = [child["id"] for child in response_data["sub_unit_types"]]
        self.assertIn(child1.id, child_ids)
        self.assertIn(child2.id, child_ids)
        self.assertIn(child3.id, child_ids)

    def test_org_unit_type_hierarchy_empty_children(self):
        """Test hierarchy with no children (leaf node)"""

        leaf = m.OrgUnitType.objects.create(name="Leaf Node", short_name="LEAF", depth=1)
        leaf.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}{leaf.id}/hierarchy/")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()

        self.assertEqual(len(response_data["sub_unit_types"]), 0)
        self.assertEqual(response_data["id"], leaf.id)
        self.assertEqual(response_data["name"], "Leaf Node")

    def test_org_unit_type_hierarchy_serializer_fields(self):
        """Test that hierarchy serializer returns correct fields"""

        parent = m.OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1, category="COUNTRY")
        child = m.OrgUnitType.objects.create(name="Child", short_name="CHILD", depth=2, category="REGION")

        parent.sub_unit_types.set([child])
        parent.projects.set([self.ead])
        child.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"{self.BASE_URL}{parent.id}/hierarchy/")

        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()

        expected_fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]
        for field in expected_fields:
            self.assertIn(field, response_data)

        child_data = response_data["sub_unit_types"][0]
        for field in expected_fields:
            self.assertIn(field, child_data)

    def test_org_unit_type_hierarchy_without_permissions(self):
        """Test GET /orgunittypes/{id}/hierarchy/ with user that has no permissions"""

        # Create a user without any permissions
        user_no_perms = self.create_user_with_profile(username="no_perms_user", account=self.ead.account)

        # Create a simple hierarchy
        parent = m.OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1)
        child = m.OrgUnitType.objects.create(name="Child", short_name="CHILD", depth=2)

        parent.sub_unit_types.set([child])
        parent.projects.set([self.ead])
        child.projects.set([self.ead])

        # Authenticate user without permissions
        self.client.force_authenticate(user_no_perms)

        # Test hierarchy endpoint - should be forbidden
        response = self.client.get(f"{self.BASE_URL}{parent.id}/hierarchy/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # Test regular org unit types list - should also be forbidden
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # Test org unit types retrieve - should be forbidden
        response = self.client.get(f"{self.BASE_URL}{parent.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
