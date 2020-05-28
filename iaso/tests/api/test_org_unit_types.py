import typing
from django.test import tag

from iaso.test import APITestCase
from iaso import models as m


class OrgUnitTypesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health initial")

        cls.jane = cls.create_user_with_profile(
            username="janedoe", account=ghi, permissions=["iaso_forms"]
        )
        cls.project_1 = m.Project.objects.create(
            name="Project 1", app_id="org.ghi.p1", account=ghi
        )
        cls.org_unit_type_1 = m.OrgUnitType.objects.create(name="Plop", short_name="Pl")
        cls.org_unit_type_2 = m.OrgUnitType.objects.create(name="Boom", short_name="Bo")
        cls.project_1.unit_types.set([cls.org_unit_type_1, cls.org_unit_type_2])

    @tag("iaso_only")
    def test_org_unit_types_list_without_auth_or_app_id(self):
        """GET /orgunittypes/ without auth or app idshould result in a 200 empty response"""

        response = self.client.get("/api/orgunittypes/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 0)

    @tag("iaso_only")
    def test_org_unit_types_list_with_auth(self):
        """GET /orgunittypes/ without auth or app idshould result in a 200 empty response"""

        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/orgunittypes/")
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeListData(response.json(), 2)

    @tag("iaso_only")
    def test_org_unit_type_create_no_auth(self):
        """POST /orgunittypes/ without auth: 403"""

        response = self.client.post("/api/orgunittypes/", data={}, format="json")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_org_unit_type_create_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post("/api/orgunittypes/", data={
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "sub_unit_type_ids": []
        }, format="json")
        self.assertJSONResponse(response, 201)
        self.assertValidOrgUnitTypeData(response.json())

    @tag("iaso_only")
    def test_org_unit_type_create_with_sub_unit_types_ok(self):
        """POST /orgunittypes/ with auth: 201 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.post("/api/orgunittypes/", data={
            "name": "Bimbam",
            "short_name": "Bi",
            "depth": 1,
            "sub_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id]
        }, format="json")
        self.assertJSONResponse(response, 201)

        org_unit_type_data = response.json()
        self.assertValidOrgUnitTypeData(org_unit_type_data)
        self.assertEqual(2, len(org_unit_type_data["sub_unit_types"]))

    @tag("iaso_only")
    def test_org_unit_type_update_ok(self):
        """PUT /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.put(
            f"/api/orgunittypes/{self.org_unit_type_1.id}/", data={
                "name": "Plop updated",
                "short_name": "Bi",
                "depth": 1,
                "sub_unit_type_ids": []
            }, format="json"
        )
        self.assertJSONResponse(response, 200)
        self.assertValidOrgUnitTypeData(response.json())

    @tag("iaso_only")
    def test_org_unit_type_delete_ok(self):
        """DELETE /orgunittypes/<org_unit_type_id>: 200 OK"""

        self.client.force_authenticate(self.jane)
        response = self.client.delete(
            f"/api/orgunittypes/{self.org_unit_type_1.id}/", format="json"
        )
        self.assertJSONResponse(response, 204)

    def assertValidOrgUnitTypeListData(
            self, list_data: typing.Mapping, expected_length: int, paginated: bool = False
    ):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="orgUnitTypes",
            paginated=paginated,
        )

        for org_unit_type_data in list_data["orgUnitTypes"]:
            self.assertValidOrgUnitTypeData(org_unit_type_data)

    # noinspection DuplicatedCode
    def assertValidOrgUnitTypeData(self, org_unit_type_data):
        self.assertHasField(org_unit_type_data, "id", int)
        self.assertHasField(org_unit_type_data, "name", str)
        self.assertHasField(org_unit_type_data, "short_name", str)
        self.assertHasField(org_unit_type_data, "depth", int, optional=True)
        self.assertHasField(org_unit_type_data, "sub_unit_types", list, optional=True)
        self.assertHasField(org_unit_type_data, "created_at", float)

        if "sub_unit_types" in org_unit_type_data:
            for sub_org_unit_type_data in org_unit_type_data["sub_unit_types"]:
                self.assertValidOrgUnitTypeData(sub_org_unit_type_data)

