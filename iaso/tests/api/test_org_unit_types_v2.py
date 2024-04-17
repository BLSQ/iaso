import typing

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso import models as m
from iaso.api.org_unit_types.serializers import validate_reference_forms
from iaso.api.query_params import PROJECT
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
    @classmethod
    def setUpTestData(cls):
        cls.data_source_1 = data_source_1 = m.DataSource.objects.create(name="DataSource1")
        version_1 = m.SourceVersion.objects.create(number=1, data_source=data_source_1)
        ghi = m.Account.objects.create(name="Global Health Initiative", default_version=version_1)
        cls.ead = ead = m.Project.objects.create(name="End All Diseases", account=ghi)
        cls.esd = esd = m.Project.objects.create(name="End Some Diseases", account=ghi)
        cls.data_source_2 = data_source_2 = m.DataSource.objects.create(name="DataSource2")
        version_2 = m.SourceVersion.objects.create(number=1, data_source=data_source_2)

        wha = m.Account.objects.create(name="Worldwide Health Aid", default_version=version_2)
        cls.wrong_project = wrong_project = m.Project.objects.create(name="End No Diseases", account=wha)

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_forms"])
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

        response = self.client.get("/api/v2/orgunittypes/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 0)

    def test_org_unit_types_list_with_auth(self):
        """GET /orgunittypes/ with auth but empty app id should return list of org unit types"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/v2/orgunittypes/")
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidOrgUnitTypeListData(response_data, 5)
        for org_unit_type_data in response_data["orgUnitTypes"]:
            self.assertEqual(len(org_unit_type_data["projects"]), 1)

    def test_org_unit_types_retrieve_without_auth_or_app_id(self):
        """GET /orgunittypes/<org_unit_type_id>/ without auth or app id should result in a 200 empty response"""

        response = self.client.get(f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_org_unit_types_retrieve_ok(self):
        """GET /orgunittypes/<org_unit_type_id>/ happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())

    def test_org_unit_types_filter_by_project_retrieve_ok(self):
        f"""GET /orgunittypes/?{PROJECT}=... happy path"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/v2/orgunittypes/", {PROJECT: self.ead.id})
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 2)

    def test_org_unit_types_filter_by_wrong_data_source_retrieve_ok(self):
        f"""GET /orgunittypes/?{PROJECT}=... wrong id"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/v2/orgunittypes/", {PROJECT: -1})
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 0)

    def test_org_unit_type_create_no_auth(self):
        """POST /orgunittypes/ without auth: 401"""

        response = self.client.post("/api/v2/orgunittypes/", data={}, format="json")
        self.assertJSONResponse(response, 401)

    def test_org_unit_type_create_invalid(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            "/api/v2/orgunittypes/", data={"name": "", "depth": 1, "project_ids": []}, format="json"
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "name", "This field may not be blank.")
        self.assertHasError(response.json(), "short_name", "This field is required.")
        self.assertHasError(response.json(), "project_ids", "This list may not be empty.")

    def test_org_unit_type_create_invalid_wrong_project(self):
        """POST /orgunittypes/ without project ids: invalid"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            "/api/v2/orgunittypes/",
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
            "/api/v2/orgunittypes/",
            data={
                "name": "Bimbam",
                "short_name": "Bi",
                "depth": 1,
                "project_ids": [self.ead.id],
                "sub_unit_type_ids": [],
                "allow_creating_sub_unit_type_ids": [],
                "reference_forms_ids": [100],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "reference_forms_ids", 'Invalid pk "100" - object does not exist.')

    def test_org_unit_type_create_with_reference_form_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post(
            "/api/v2/orgunittypes/",
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
            "/api/v2/orgunittypes/",
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
            "/api/v2/orgunittypes/",
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
            "/api/v2/orgunittypes/",
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
            f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/",
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
            f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/",
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
            f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/", data={"short_name": "P"}, format="json"
        )
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())
        self.org_unit_type_1.refresh_from_db()
        self.assertEqual("P", self.org_unit_type_1.short_name)

    def test_org_unit_type_delete_ok(self):
        """DELETE /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.delete(f"/api/v2/orgunittypes/{self.org_unit_type_1.id}/", format="json")
        self.assertJSONResponse(response, 204)

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
