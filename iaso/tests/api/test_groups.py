import typing

from django.utils.timezone import now

from hat.menupermissions import models as permission
from iaso import models as m
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

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.chewbacca = cls.create_user_with_profile(username="chewbacca", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.group_1 = m.Group.objects.create(name="Councils", source_version=cls.source_version_1)
        cls.group_2 = m.Group.objects.create(name="Assemblies", source_version=cls.source_version_2)
        cls.group_3 = m.Group.objects.create(name="Hidden", source_version=cls.source_version_1, domain="POLIO")

        cls.project_1.data_sources.add(cls.data_source)
        cls.project_1.save()

    def test_groups_list_without_auth(self):
        """GET /groups/ without auth: 403"""

        response = self.client.get("/api/groups/")
        self.assertJSONResponse(response, 403)

    def test_groups_list_wrong_permission(self):
        f"""GET /groups/ with authenticated user, without the {permission.ORG_UNITS} permission"""

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
        """GET /groups/<group_id> without auth should result in a 404"""

        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 403)

    def test_groups_retrieve_wrong_auth(self):
        """GET /groups/<group_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_groups_retrieve_not_found(self):
        """GET /groups/<group_id>: id does not exist"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/292003030/")
        self.assertJSONResponse(response, 404)

    def test_groups_retrieve_ok_1(self):
        """GET /groups/<group_id> happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/groups/{self.group_1.id}/")
        self.assertJSONResponse(response, 200)

        self.assertValidGroupData(response.json())

    def test_groups_create_without_auth(self):
        """POST /groups/ without auth: 403"""

        response = self.client.post(f"/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 403)

    def test_groups_create_no_source_version(self):
        """POST /groups/ (user has no source version, cannot work)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(f"/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 400)

    def test_groups_create_ok(self):
        """POST /groups/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/groups/", data={"name": "test group"}, format="json")
        self.assertJSONResponse(response, 201)

        response_data = response.json()
        self.assertValidGroupData(response_data, skip=["org_unit_count"])
        self.assertEqual(self.yoda.iaso_profile.account.default_version_id, response_data["source_version"]["id"])

    def test_groups_create_invalid(self):
        """POST /groups/ with missing data"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/groups/", data={}, format="json")
        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertHasError(response_data, "name")

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
        self.assertEquals("test group (updated)", self.group_1.name)
        self.assertEquals(1, self.group_1.source_version.number)

    def test_groups_update_not_implemented(self):
        """PUT /groups/<group_id>: 405"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(
            f"/api/groups/{self.group_1.id}/", data={"name": "test group (updated)"}, format="json"
        )
        self.assertJSONResponse(response, 405)

    def test_groups_destroy_no_auth(self):
        """DELETE /groups/<group_id> without auth -> 403"""

        response = self.client.delete(f"/api/groups/{self.group_1.id}/", format="json")
        self.assertJSONResponse(response, 403)

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


class MobileGroupsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        account_nigeria = m.Account.objects.create(name="Nigeria", default_version=cls.source_version_2)
        account_cameroon = m.Account.objects.create(name="Cameroon", default_version=cls.source_version_1)

        cls.user_nigeria = cls.create_user_with_profile(
            username="user_nigeria", account=account_nigeria, permissions=["iaso_org_units"]
        )
        cls.user_cameroon = cls.create_user_with_profile(
            username="user_cameroon", account=account_cameroon, permissions=["iaso_org_units"]
        )

        cls.project_nigeria = m.Project.objects.create(
            name="Nigeria health pyramid", app_id="nigeria.health.pyramid", account=account_nigeria
        )
        cls.project_cameroon = m.Project.objects.create(
            name="Cameroon health map", app_id="cameroon.health.map", account=account_cameroon
        )

        cls.group_nigeria_1 = m.Group.objects.create(name="Hospitals", source_version=cls.source_version_1)
        cls.group_nigeria_2 = m.Group.objects.create(name="Villages", source_version=cls.source_version_2)
        cls.group_cameroon = m.Group.objects.create(name="North", source_version=cls.source_version_1)

    def test_api_mobile_groups_list_without_app_id(self):
        """GET /api/mobile/groups/ without app_id"""
        response = self.client.get("/api/mobile/groups/")
        self.assertJSONResponse(response, 400)

    def test_api_mobile_groups_list_with_unknown_app_id(self):
        """GET /api/mobile/groups/ with unknown app_id"""
        response = self.client.get("/api/mobile/groups/?app_id=foo")
        self.assertJSONResponse(response, 404)

    def test_api_mobile_groups_list_with_app_id(self):
        """GET /api/mobile/groups/ with app_id"""

        # Groups with `source_version_1`.
        response = self.client.get(f"/api/mobile/groups/?app_id={self.project_cameroon.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data["groups"]), 2)
        expected_data = [
            {"id": self.group_nigeria_1.pk, "name": "Hospitals"},
            {"id": self.group_cameroon.pk, "name": "North"},
        ]
        self.assertCountEqual(response.data["groups"], expected_data)

        # Groups with `source_version_2`.
        response = self.client.get(f"/api/mobile/groups/?app_id={self.project_nigeria.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data["groups"]), 1)
        expected_data = [{"id": self.group_nigeria_2.pk, "name": "Villages"}]
        self.assertCountEqual(response.data["groups"], expected_data)
