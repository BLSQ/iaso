import typing

from django.utils.timezone import now
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase


class GroupsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        star_wars = m.Account.objects.create(name="Star Wars", default_version=cls.source_version_2)
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=[CORE_ORG_UNITS_PERMISSION]
        )
        cls.chewbacca = cls.create_user_with_profile(username="chewbacca", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(
            username="raccoon", account=marvel, permissions=[CORE_ORG_UNITS_PERMISSION]
        )

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.group_1 = m.Group.objects.create(name="Councils", source_version=cls.source_version_1)
        cls.group_2 = m.Group.objects.create(name="Assemblies", source_version=cls.source_version_2)

        cls.project_1.data_sources.add(cls.data_source)
        cls.project_1.save()

        cls.org_unit_type = m.OrgUnitType.objects.create(name="Health Center", short_name="HC")
        cls.org_unit_1 = m.OrgUnit.objects.create(
            name="Org Unit 1", version=cls.source_version_2, org_unit_type=cls.org_unit_type
        )
        cls.org_unit_2 = m.OrgUnit.objects.create(
            name="Org Unit 2", version=cls.source_version_2, org_unit_type=cls.org_unit_type
        )
        cls.org_unit_3 = m.OrgUnit.objects.create(
            name="Org Unit 3", version=cls.source_version_2, org_unit_type=cls.org_unit_type
        )

    def test_groups_list_without_auth(self):
        """GET /groups/ without auth: 401"""

        response = self.client.get("/api/groups/")
        self.assertJSONResponse(response, 401)

    def test_groups_list_wrong_permission(self):
        f"""GET /groups/ with authenticated user, without the {CORE_ORG_UNITS_PERMISSION} permission"""

        self.client.force_authenticate(self.chewbacca)
        response = self.client.get("/api/groups/")
        self.assertJSONResponse(response, 403)

    def test_default_version_groups_list_ok(self):
        """GET /groups/ with authenticated user and only default version"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/?defaultVersion=true")
        self.assertJSONResponse(response, 200)
        self.assertValidGroupListData(response.json(), 1)

    def test_groups_list_ok(self):
        """GET /groups/ with authenticated user with the right menu permission"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/")
        self.assertJSONResponse(response, 200)
        self.assertValidGroupListData(response.json(), 2)

    def test_groups_list_paginated(self):
        """GET /groups/ paginated happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/?limit=1&page=1", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidGroupListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 2)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 2)

    def test_groups_retrieve_without_auth(self):
        """GET /groups/<group_id> without auth should result in a 401"""

        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 401)

    def test_groups_retrieve_wrong_auth(self):
        """GET /groups/<group_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_groups_retrieve_not_found(self):
        """GET /groups/<group_id>: id does not exist"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/292003030/")
        self.assertJSONResponse(response, 404)

    def test_groups_retrieve_ok_1(self):
        """GET /groups/<group_id> happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 200)

        self.assertValidGroupData(response.json())

    def test_groups_create_without_auth(self):
        """POST /groups/ without auth: 401"""

        response = self.client.post("/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 401)

    def test_groups_create_no_source_version(self):
        """POST /groups/ (user has no source version, cannot work)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post("/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 400)

    def test_groups_create_ok(self):
        """POST /groups/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 201)

        response_data = response.json()
        self.assertValidGroupData(response_data, skip=["org_unit_count"])
        self.assertEqual(self.yoda.iaso_profile.account.default_version_id, response_data["source_version"]["id"])

    def test_groups_create_invalid(self):
        """POST /groups/ with missing data"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/groups/", data={}, format="json")
        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertHasError(response_data, "name")

    def test_groups_create_error_same_source_ref(self):
        """POST /groups/ with an already existing source ref"""
        shared_source_ref = "sOuRcErEf"
        self.group_2.source_ref = shared_source_ref
        self.group_2.save()

        self.client.force_authenticate(self.yoda)
        data = {
            "name": "Is this going to trigger an error?",
            "source_ref": shared_source_ref,
        }
        response = self.client.post("/api/groups/", data=data, format="json")
        self.assertContains(
            response,
            "This source ref is already used by another group in your default version",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def test_groups_create_multiple_with_blank_source_ref(self):
        """POST /groups/ another group with blank source ref"""
        self.group_2.source_ref = ""
        self.group_2.save()

        count_before = m.Group.objects.filter(source_ref="", source_version=self.source_version_2).count()
        self.assertEqual(count_before, 1)  # we already have a group with blank source_ref

        self.client.force_authenticate(self.yoda)
        data = {
            "name": "Is this going to trigger an error?",
            "source_ref": "",
        }
        response = self.client.post("/api/groups/", data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        count_after = m.Group.objects.filter(source_ref="", source_version=self.source_version_2).count()
        self.assertEqual(count_before + 1, count_after)

        # Multiple groups can be created with blank source_ref
        response = self.client.post("/api/groups/", data=data, format="json")  # posting the same thing again
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        last_count = m.Group.objects.filter(source_ref="", source_version=self.source_version_2).count()
        self.assertEqual(count_after + 1, last_count)

    def test_groups_create_with_org_units_ok(self):
        """POST /groups/ with org_unit_ids - happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/groups/",
            data={"name": "test group with org units", "org_unit_ids": [self.org_unit_1.id, self.org_unit_2.id]},
            format="json",
        )
        self.assertJSONResponse(response, 201)

        response_data = response.json()
        group = m.Group.objects.get(id=response_data["id"])
        self.assertEqual(group.org_units.count(), 2)
        self.assertIn(self.org_unit_1, group.org_units.all())
        self.assertIn(self.org_unit_2, group.org_units.all())

    def test_groups_create_with_empty_org_units(self):
        """POST /groups/ with empty org_unit_ids list"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/groups/", data={"name": "test group empty", "org_unit_ids": []}, format="json"
        )
        self.assertJSONResponse(response, 201)

        group = m.Group.objects.get(id=response.json()["id"])
        self.assertEqual(group.org_units.count(), 0)

    def test_groups_create_with_invalid_org_unit_id(self):
        """POST /groups/ with invalid org_unit_ids - should fail"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/groups/",
            data={"name": "test group", "org_unit_ids": [999999]},
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertIn("org_unit_ids", response.json())

    def test_groups_create_with_org_units_from_different_account(self):
        """POST /groups/ with org_unit_ids from different account - should fail"""

        marvel = self.raccoon.iaso_profile.account
        marvel_data_source = m.DataSource.objects.create(name="Marvel source")
        marvel_version = m.SourceVersion.objects.create(data_source=marvel_data_source, number=1)
        marvel_org_unit_type = m.OrgUnitType.objects.create(name="Marvel HC", short_name="MHC")
        marvel_org_unit = m.OrgUnit.objects.create(
            name="Marvel Org Unit", version=marvel_version, org_unit_type=marvel_org_unit_type
        )

        marvel_project = m.Project.objects.create(name="Marvel Project", app_id="marvel.project", account=marvel)
        marvel_project.data_sources.add(marvel_data_source)
        marvel.default_version = marvel_version
        marvel.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/groups/",
            data={"name": "test group", "org_unit_ids": [marvel_org_unit.id]},
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertIn("org_unit_ids", response.json())

    def test_groups_create_with_org_units_without_write_permission(self):
        """POST /groups/ with org_unit_ids user cannot edit due to org_unit_type restrictions"""

        restricted_org_unit_type = m.OrgUnitType.objects.create(name="Restricted Type", short_name="RT")
        restricted_org_unit = m.OrgUnit.objects.create(
            name="Restricted Org Unit", version=self.source_version_2, org_unit_type=restricted_org_unit_type
        )

        restricted_user = self.create_user_with_profile(
            username="han_solo", account=self.yoda.iaso_profile.account, permissions=[CORE_ORG_UNITS_PERMISSION]
        )
        restricted_user.iaso_profile.editable_org_unit_types.add(self.org_unit_type)

        self.client.force_authenticate(restricted_user)
        response = self.client.post(
            "/api/groups/",
            data={"name": "test group", "org_unit_ids": [restricted_org_unit.id]},
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertIn("org_unit_ids", response.json())

    def test_groups_partial_update_ok(self):
        """PATCH /groups/<group_id>: happy path (validation is already covered by create tests)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/groups/{self.group_1.id}/", data={"name": "test group (updated)"}, format="json"
        )
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidGroupData(response_data)

        self.group_1.refresh_from_db()
        self.assertEqual("test group (updated)", self.group_1.name)
        self.assertEqual(1, self.group_1.source_version.number)

    def test_groups_partial_update_with_blank_source_ref(self):
        """PATCH /groups/<group_id>: removing a source_ref doesn't crash"""
        self.group_2.source_ref = ""
        self.group_2.save()

        count_before = m.Group.objects.filter(source_ref="", source_version=self.source_version_2).count()
        self.assertEqual(count_before, 1)  # we already have a group with blank source_ref

        # Preparing a new group with a source ref
        new_group = m.Group.objects.create(
            name="new group",
            source_version=self.source_version_2,  # default version
            source_ref="some_source_ref",
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(f"/api/groups/{new_group.id}/", data={"source_ref": ""}, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        self.assertValidGroupData(response_data)

        new_group.refresh_from_db()
        self.assertEqual(new_group.source_ref, "")

        count_blank_source_refs = m.Group.objects.filter(source_ref="", source_version=self.source_version_2).count()
        self.assertEqual(count_blank_source_refs, 2)

    def test_groups_update_not_implemented(self):
        """PUT /groups/<group_id>: 405"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(
            f"/api/groups/{self.group_1.id}/", data={"name": "test group (updated)"}, format="json"
        )
        self.assertJSONResponse(response, 405)

    def test_groups_destroy_no_auth(self):
        """DELETE /groups/<group_id> without auth -> 401"""

        response = self.client.delete(f"/api/groups/{self.group_1.id}/", format="json")
        self.assertJSONResponse(response, 401)

    def test_groups_destroy_wrong_auth(self):
        """DELETE /groups/<group_id> with user that cannot access group -> 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.delete(f"/api/groups/{self.group_1.id}/", format="json")
        self.assertJSONResponse(response, 404)

    def test_groups_destroy_ok(self):
        """DELETE /groups/<group_id> happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/groups/{self.group_1.id}/", format="json")
        self.assertJSONResponse(response, 204)

    # Dropdown tests
    def test_dropdown_authenticated_user_ok(self):
        """GET /groups/dropdown/ with authenticated user - happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

        # Check first item structure
        first_item = data[0]
        self.assertHasField(first_item, "id", int)
        self.assertHasField(first_item, "name", str)
        self.assertHasField(first_item, "label", str)

        # Check label format: "name (datasource - version)"
        self.assertIn("(", first_item["label"])
        self.assertIn(")", first_item["label"])

    def test_dropdown_anonymous_user_with_app_id_ok(self):
        """GET /groups/dropdown/ with anonymous user and valid app_id - happy path"""

        response = self.client.get(f"/api/groups/dropdown/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_dropdown_anonymous_user_without_app_id_fails(self):
        """GET /groups/dropdown/ with anonymous user without app_id - should fail"""

        response = self.client.get("/api/groups/dropdown/")
        self.assertJSONResponse(response, 400)

        data = response.json()
        self.assertIn("Parameter app_id is missing", str(data))

    def test_dropdown_with_default_version_filter(self):
        """GET /groups/dropdown/ with defaultVersion=true filter"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/?defaultVersion=true")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only return groups from the default version (source_version_2)
        for item in data:
            # The label should contain the default version number
            self.assertIn("Default source - 2", item["label"])

    def test_dropdown_with_version_filter(self):
        """GET /groups/dropdown/ with specific version filter"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/dropdown/?version={self.source_version_1.id}")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only return groups from the specified version
        for item in data:
            self.assertIn("Default source - 1", item["label"])

    def test_dropdown_with_data_source_filter(self):
        """GET /groups/dropdown/ with dataSource filter"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/dropdown/?dataSource={self.data_source.id}")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only return groups from the specified data source
        for item in data:
            self.assertIn("Default source", item["label"])

    def test_dropdown_with_data_source_ids_filter(self):
        """GET /groups/dropdown/ with dataSourceIds filter"""

        # Create a second data source for testing
        second_data_source = m.DataSource.objects.create(name="Second source")
        second_version = m.SourceVersion.objects.create(data_source=second_data_source, number=1)
        second_group = m.Group.objects.create(name="Second Group", source_version=second_version)

        # Add second data source to the project
        self.project_1.data_sources.add(second_data_source)
        self.project_1.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/dropdown/?dataSourceIds={self.data_source.id},{second_data_source.id}")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should return groups from both specified data sources
        data_source_names = ["Default source", "Second source"]
        for item in data:
            self.assertTrue(any(name in item["label"] for name in data_source_names))

    def test_dropdown_with_search_filter(self):
        """GET /groups/dropdown/ with search filter"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/?search=Councils")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only return groups matching the search term
        for item in data:
            self.assertIn("Councils", item["name"])

    def test_dropdown_with_block_of_countries_filter(self):
        """GET /groups/dropdown/ with blockOfCountries filter"""

        # Create a group with block_of_countries=True
        block_group = m.Group.objects.create(
            name="Countries Block", source_version=self.source_version_1, block_of_countries=True
        )

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/?blockOfCountries=true")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only return groups with block_of_countries=True
        for item in data:
            self.assertEqual("Countries Block", item["name"])

    def test_dropdown_with_order_parameter(self):
        """GET /groups/dropdown/ with order parameter"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/?order=name")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 1)

        # Check that items are ordered by name
        names = [item["name"] for item in data]
        self.assertEqual(names, sorted(names))

    def test_dropdown_pagination(self):
        """GET /groups/dropdown/ with pagination"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/dropdown/?limit=1&page=1")
        self.assertJSONResponse(response, 200)

        data = response.json()
        # Should return paginated response structure
        self.assertHasField(data, "groups", list)
        self.assertHasField(data, "page", int)
        self.assertHasField(data, "pages", int)
        self.assertHasField(data, "limit", int)
        self.assertHasField(data, "count", int)

        self.assertEqual(len(data["groups"]), 1)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], 1)

    def test_dropdown_invalid_app_id_fails(self):
        """GET /groups/dropdown/ with invalid app_id - should fail"""

        response = self.client.get("/api/groups/dropdown/?app_id=invalid_app_id")
        self.assertJSONResponse(response, 400)

        data = response.json()
        self.assertIn("No project found", str(data))

    def test_dropdown_user_from_different_account(self):
        """GET /groups/dropdown/ with user from different account - should only see their groups"""

        # Create a group for the marvel account
        marvel_data_source = m.DataSource.objects.create(name="Marvel source")
        marvel_version = m.SourceVersion.objects.create(data_source=marvel_data_source, number=1)
        marvel_group = m.Group.objects.create(name="Marvel Group", source_version=marvel_version)

        # Add marvel data source to marvel project
        marvel_project = m.Project.objects.create(
            name="Marvel Project", app_id="marvel.project", account=self.raccoon.iaso_profile.account
        )
        marvel_project.data_sources.add(marvel_data_source)
        marvel_project.save()

        # Set default version for marvel account
        marvel_account = self.raccoon.iaso_profile.account
        marvel_account.default_version = marvel_version
        marvel_account.save()

        self.client.force_authenticate(self.raccoon)
        response = self.client.get("/api/groups/dropdown/")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only see groups from their account
        for item in data:
            self.assertIn("Marvel source", item["label"])

    def test_dropdown_anonymous_user_different_project(self):
        """GET /groups/dropdown/ with anonymous user and different project app_id"""

        response = self.client.get(f"/api/groups/dropdown/?app_id={self.project_2.app_id}")
        self.assertJSONResponse(response, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Should only see groups from the specified project
        for item in data:
            self.assertIn("Default source", item["label"])

    def test_export_groups_in_xlsx(self):
        """GET /groups/export/ with xlsx format"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/export/?file_format=xlsx")
        excel_columns, excel_data = self.assertXlsxFileResponse(response)

        self.assertEqual(
            excel_columns,
            [
                "ID",
                "Source ref",
                "Name",
                "Data source",
                "Version",
            ],
        )
        self.assertEqual(
            excel_data,
            {
                "ID": {
                    0: self.group_1.id,
                    1: self.group_2.id,
                },
                "Source ref": {
                    0: self.group_1.source_ref,
                    1: self.group_2.source_ref,
                },
                "Name": {
                    0: self.group_1.name,
                    1: self.group_2.name,
                },
                "Data source": {
                    0: self.data_source.name,
                    1: self.data_source.name,
                },
                "Version": {
                    0: self.source_version_1.number,
                    1: self.source_version_2.number,
                },
            },
        )

    def test_export_groups_in_csv(self):
        """GET /groups/export/ with csv format"""

        self.group_1.source_ref = "group_1_ref"
        self.group_1.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/groups/export/?file_format=csv")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)
        columns = data[0]

        self.assertEqual(
            columns,
            [
                "ID",
                "Source ref",
                "Name",
                "Data source",
                "Version",
            ],
        )
        self.assertEqual(len(data), 3)  # Header + 2 rows
        self.assertEqual(
            data[1],
            [
                str(self.group_1.id),
                self.group_1.source_ref,
                self.group_1.name,
                self.data_source.name,
                str(self.source_version_1.number),
            ],
        )
        self.assertEqual(
            data[2],
            [
                str(self.group_2.id),
                "",  # group_2 has no source_ref, so the result is an empty string
                self.group_2.name,
                self.data_source.name,
                str(self.source_version_2.number),
            ],
        )

    def test_export_groups_no_auth(self):
        """GET /groups/export/ without auth should result in a 401"""

        response = self.client.get("/api/groups/export/?file_format=xlsx")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_export_groups_no_perms(self):
        """GET /groups/export/ with authenticated user without the right permission should result in a 403"""

        self.client.force_authenticate(self.chewbacca)
        response = self.client.get("/api/groups/export/?file_format=csv")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def assertValidGroupListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="groups", paginated=paginated
        )

        for group_data in list_data["groups"]:
            self.assertValidGroupData(group_data)

    def assertValidGroupData(self, group_data: typing.Mapping, skip: typing.Optional[typing.List] = None):
        skip = skip if skip is not None else []

        self.assertHasField(group_data, "id", int)
        self.assertHasField(group_data, "name", str)
        self.assertHasField(group_data, "source_version", dict, optional=True)
        self.assertHasField(group_data, "source_ref", str, optional=True)
        # org_unit_count is a read-only field, it won't be present when creating an instance
        if "org_unit_count" not in skip:
            self.assertHasField(group_data, "org_unit_count", int)
        self.assertHasField(group_data, "created_at", float)
        self.assertHasField(group_data, "updated_at", float)

        if "source_version" in group_data:
            source_version_data = group_data["source_version"]
            self.assertHasField(source_version_data, "id", int)
            self.assertHasField(source_version_data, "number", int)
            self.assertHasField(source_version_data, "data_source", dict)

            data_source_data = source_version_data["data_source"]
            self.assertHasField(data_source_data, "id", int)
            self.assertHasField(data_source_data, "name", str)
