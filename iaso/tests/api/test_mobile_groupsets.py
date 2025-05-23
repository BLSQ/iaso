import json

from django.utils.timezone import now

from iaso import models as m
from iaso.api.query_params import APP_ID
from iaso.test import APITestCase


class MobileGroupSetsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source_nig = m.DataSource.objects.create(name="Default source nig")
        cls.data_source_cam = m.DataSource.objects.create(name="Default source cam")
        cls.source_version_1_cam = m.SourceVersion.objects.create(data_source=cls.data_source_cam, number=1)

        cls.source_version_2_nig = m.SourceVersion.objects.create(data_source=cls.data_source_nig, number=2)
        cls.source_version_3_nig = m.SourceVersion.objects.create(data_source=cls.data_source_nig, number=3)

        account_cameroon = m.Account.objects.create(name="Cameroon", default_version=cls.source_version_1_cam)
        account_nigeria = m.Account.objects.create(name="Nigeria", default_version=cls.source_version_2_nig)

        cls.user_nigeria = cls.create_user_with_profile(
            username="user_nigeria",
            account=account_nigeria,
            permissions=["iaso_org_units"],
        )
        cls.user_cameroon = cls.create_user_with_profile(
            username="user_cameroon",
            account=account_cameroon,
            permissions=["iaso_org_units"],
        )

        cls.project_nigeria = m.Project.objects.create(
            name="Nigeria health pyramid",
            app_id="nigeria.health.pyramid",
            account=account_nigeria,
        )
        cls.project_nigeria_pev = m.Project.objects.create(
            name="Nigeria pev",
            app_id="nigeria.health.pev",
            account=account_nigeria,
        )
        cls.project_cameroon = m.Project.objects.create(
            name="Cameroon health map",
            app_id="cameroon.health.map",
            account=account_cameroon,
        )

        cls.data_source_nig.projects.add(cls.project_nigeria)
        cls.data_source_nig.projects.add(cls.project_nigeria_pev)

        cls.group_nigeria_1_hospital = m.Group.objects.create(name="Hospitals", source_version=cls.source_version_2_nig)
        cls.group_nigeria_1_healthcenter = m.Group.objects.create(
            name="Health Centers", source_version=cls.source_version_2_nig
        )

        cls.group_nigeria_2_villages = m.Group.objects.create(name="Villages", source_version=cls.source_version_2_nig)

        cls.group_set_1_nigeria = m.GroupSet.objects.create(name="contracts", source_version=cls.source_version_2_nig)
        cls.group_set_1_nigeria.groups.add(cls.group_nigeria_1_hospital)
        cls.group_set_1_nigeria.groups.add(cls.group_nigeria_1_healthcenter)

        cls.group_nigeria_2_hospital = m.Group.objects.create(name="Hospitals", source_version=cls.source_version_3_nig)
        cls.group_nigeria_2_healthcenter = m.Group.objects.create(
            name="Health Centers", source_version=cls.source_version_3_nig
        )

        cls.group_set_2_nigeria = m.GroupSet.objects.create(name="contracts", source_version=cls.source_version_3_nig)
        cls.group_set_2_nigeria.groups.add(cls.group_nigeria_2_hospital)
        cls.group_set_2_nigeria.groups.add(cls.group_nigeria_2_healthcenter)

        cls.group_cameroon_north = m.Group.objects.create(name="North", source_version=cls.source_version_1_cam)
        cls.group_cameroon_south = m.Group.objects.create(name="South", source_version=cls.source_version_1_cam)

        cls.group_set_2_cameroon_region = m.GroupSet.objects.create(
            name="region", source_version=cls.source_version_1_cam
        )
        cls.group_set_2_cameroon_region.groups.add(cls.group_cameroon_north)
        cls.group_set_2_cameroon_region.groups.add(cls.group_cameroon_south)
        cls.maxDiff = None

        cls.user_nigeria.iaso_profile.projects.add(cls.project_nigeria)
        cls.user_nigeria.iaso_profile.projects.add(cls.project_nigeria_pev)

        # verify the fixture creates a case where
        # this filter creates a cardinal product / cross join
        # of source versions
        version_ids = m.SourceVersion.objects.filter(
            data_source__projects__account=cls.user_nigeria.iaso_profile.account
        ).values_list("id", flat=True)
        assert len(version_ids) == 4

    def test_api_mobile_groupsets_list_without_app_id(self):
        response = self.client.get("/api/mobile/group_sets/")
        self.assertJSONResponse(response, 400)

    def test_api_mobile_groupsets_list_with_unknown_app_id(self):
        """GET /api/mobile/groups/ with unknown app_id"""
        response = self.client.get("/api/mobile/group_sets/", {APP_ID: "foo"})
        self.assertJSONResponse(response, 404)

    def test_api_mobile_groupsets_list_with_app_id(self):
        """GET /api/mobile/groups/ with app_id"""

        record_cameroon = {
            "id": self.group_set_2_cameroon_region.id,
            "name": "region",
            "group_ids": [self.group_cameroon_north.id, self.group_cameroon_south.id],
            "group_belonging": "SINGLE",
            "erased": False,
        }

        # Groups with `source_version_1`.
        response = self.client.get("/api/mobile/group_sets/", {APP_ID: self.project_cameroon.app_id})
        self.assertJSONResponse(response, 200)
        self.assertEqual(json.dumps(response.data), json.dumps([record_cameroon]))

        record_nigeria = {
            "id": self.group_set_1_nigeria.id,
            "name": "contracts",
            "group_ids": [self.group_nigeria_1_hospital.id, self.group_nigeria_1_healthcenter.id],
            "group_belonging": "SINGLE",
            "erased": False,
        }

        record_nigeria_2 = {
            "id": self.group_set_2_nigeria.id,
            "name": "contracts",
            "group_ids": [self.group_nigeria_2_hospital.id, self.group_nigeria_2_healthcenter.id],
            "group_belonging": "SINGLE",
            "erased": True,
        }

        # Groups with `source_version_2`.
        ## Without all versions
        response = self.client.get("/api/mobile/group_sets/", {APP_ID: self.project_nigeria.app_id})
        self.assertEqual(json.dumps(response.data), json.dumps([record_nigeria, record_nigeria_2]))

    def test_api_mobile_groupsets_list_with_app_id_and_authenticated(self):
        """GET /api/mobile/groups/ with app_id"""

        self.client.force_authenticate(self.user_nigeria)

        record_nigeria = {
            "id": self.group_set_1_nigeria.id,
            "name": "contracts",
            "group_ids": [self.group_nigeria_1_hospital.id, self.group_nigeria_1_healthcenter.id],
            "group_belonging": "SINGLE",
            "erased": False,
        }

        record_nigeria_2 = {
            "id": self.group_set_2_nigeria.id,
            "name": "contracts",
            "group_ids": [self.group_nigeria_2_hospital.id, self.group_nigeria_2_healthcenter.id],
            "group_belonging": "SINGLE",
            "erased": True,
        }

        # Groups with `source_version_2`.
        ## Without all versions
        response = self.client.get("/api/mobile/group_sets/", {APP_ID: self.project_nigeria.app_id})
        self.assertEqual(json.dumps(response.data), json.dumps([record_nigeria, record_nigeria_2]))
