from django.utils.timezone import now

from iaso import models as m
from iaso.api.query_params import APP_ID, SHOW_DELETED
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase


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
            username="user_nigeria",
            account=account_nigeria,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )
        cls.user_cameroon = cls.create_user_with_profile(
            username="user_cameroon",
            account=account_cameroon,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        cls.project_nigeria = m.Project.objects.create(
            name="Nigeria health pyramid",
            app_id="nigeria.health.pyramid",
            account=account_nigeria,
        )
        cls.project_cameroon = m.Project.objects.create(
            name="Cameroon health map",
            app_id="cameroon.health.map",
            account=account_cameroon,
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
        response = self.client.get("/api/mobile/groups/", {APP_ID: "foo"})
        self.assertJSONResponse(response, 404)

    def test_api_mobile_groups_list_with_app_id(self):
        """GET /api/mobile/groups/ with app_id"""

        # Groups with `source_version_1`.
        response = self.client.get("/api/mobile/groups/", {APP_ID: self.project_cameroon.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data), 2)
        expected_data = [
            {"id": self.group_nigeria_1.pk, "name": "Hospitals", "erased": False},
            {"id": self.group_cameroon.pk, "name": "North", "erased": False},
        ]
        self.assertCountEqual(response.data, expected_data)

        # Groups with `source_version_2`.
        ## Without all versions
        response = self.client.get("/api/mobile/groups/", {APP_ID: self.project_nigeria.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data), 1)
        expected_data = [{"id": self.group_nigeria_2.pk, "name": "Villages", "erased": False}]
        self.assertCountEqual(response.data, expected_data)

        ## With all versions
        response = self.client.get(
            "/api/mobile/groups/",
            {APP_ID: self.project_nigeria.app_id, SHOW_DELETED: "true"},
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data), 3)
        expected_data = [
            {"id": self.group_nigeria_1.pk, "name": "Hospitals", "erased": True},
            {"id": self.group_cameroon.pk, "name": "North", "erased": True},
            {"id": self.group_nigeria_2.pk, "name": "Villages", "erased": False},
        ]
        self.assertCountEqual(response.data, expected_data)
