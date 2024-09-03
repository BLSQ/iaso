from django.utils.timezone import now
from rest_framework import status

from iaso import models as m
from iaso.models import GroupSet
from iaso.test import APITestCase


class GroupSetsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source_2 = m.DataSource.objects.create(name="Source 2")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source_2, number=2)

        star_wars = m.Account.objects.create(name="Star Wars", default_version=cls.source_version_1)
        marvel = m.Account.objects.create(name="Marvel")

        cls.acccount_1_user_1 = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_org_units"]
        )
        cls.acccount_1_user_2 = cls.create_user_with_profile(username="chewbacca", account=star_wars)
        cls.acccount_3_user_1 = cls.create_user_with_profile(
            username="raccoon", account=marvel, permissions=["iaso_org_units"]
        )

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.src_1_group_1 = m.Group.objects.create(name="Councils", source_version=cls.source_version_1)
        cls.src_1_group_2 = m.Group.objects.create(name="Hidden", source_version=cls.source_version_1)

        cls.src_2_group_1 = m.Group.objects.create(name="Assemblies", source_version=cls.source_version_2)

        cls.project_1.data_sources.add(cls.data_source)
        cls.project_1.save()
        cls.data_source.account = star_wars
        cls.data_source.default_version = cls.source_version_1
        cls.data_source.projects.add(cls.project_1)
        cls.data_source.save()

        cls.data_source_2.account = star_wars
        cls.data_source_2.projects.add(cls.project_1)
        cls.data_source_2.save()

        cls.acccount_1_user_1.iaso_profile.projects.add(cls.project_1)

    def test_authentification_required(self):
        response = self.client.get("/api/group_sets/", format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_groupset_with_valid_groups(self):
        """
        Ensure we can create a GroupSet with valid group_ids.
        """

        self.client.force_authenticate(self.acccount_1_user_1)

        valid_payload = {
            "name": "New GroupSet",
            "source_version_id": self.source_version_1.id,
            "group_ids": [self.src_1_group_1.id, self.src_1_group_2.id],
        }
        response = self.client.post("/api/group_sets/", valid_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GroupSet.objects.count(), 1)

        created_groupset = GroupSet.objects.last()
        self.assertEqual(created_groupset.name, "New GroupSet")
        self.assertEqual(created_groupset.source_version.id, self.source_version_1.id)
        self.assertEqual([x.id for x in created_groupset.groups.all()], [self.src_1_group_1.id, self.src_1_group_2.id])

    def test_create_groupset_with_missing_source_version(self):
        self.client.force_authenticate(self.acccount_1_user_1)

        invalid_payload = {
            "name": "New GroupSet without source",
            "group_ids": [self.src_1_group_1.id],
        }
        response = self.client.post("/api/group_sets/", invalid_payload, format="json")

        self.assertIn("This field is required.", response.json()["source_version_id"][0])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GroupSet.objects.count(), 0)

    def test_create_groupset_with_missing_name(self):
        self.client.force_authenticate(self.acccount_1_user_1)

        invalid_payload = {
            "source_version_id": self.source_version_1.id,
            "group_ids": [self.src_1_group_1.id],
        }
        response = self.client.post("/api/group_sets/", invalid_payload, format="json")
        self.assertIn("This field is required.", response.json()["name"][0])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GroupSet.objects.count(), 0)

    def test_create_groupset_with_invalid_groups(self):
        """
        Ensure we can create a GroupSet with valid group_ids.
        """

        self.client.force_authenticate(self.acccount_1_user_1)

        invalid_payload = {
            "name": "New GroupSet mixing 2 sources",
            "source_version_id": self.source_version_1.id,
            "group_ids": [self.src_1_group_1.id, self.src_2_group_1.id],
        }
        response = self.client.post("/api/group_sets/", invalid_payload, format="json")

        self.assertIn("Groups do not all belong to the same SourceVersion", response.json()["group_ids"][0])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GroupSet.objects.count(), 0)
        self.assertIn("group_ids", response.data)

    def seed_a_group_set(self):
        self.client.force_authenticate(self.acccount_1_user_1)

        valid_payload = {
            "name": "New GroupSet",
            "source_version_id": self.source_version_1.id,
        }
        response = self.client.post("/api/group_sets/", valid_payload, format="json")

        groupset = GroupSet.objects.all()[0]

        return groupset

    def test_patch_groupset_with_valid_groups(self):
        groupset = self.seed_a_group_set()

        self.assertEqual(groupset.groups.count(), 0)
        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.patch(
            url,
            {
                "group_ids": [self.src_1_group_1.id, self.src_1_group_2.id],
            },
            format="json",
        )

        groupset = GroupSet.objects.all()[0]
        self.assertEqual(groupset.groups.count(), 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_groupset_with_invalid_name_null(self):
        groupset = self.seed_a_group_set()

        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.patch(
            url,
            {
                "name": None,
            },
            format="json",
        )
        self.assertEqual(response.json(), {"name": ["This field may not be null."]})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_groupset_with_invalid_name_blank(self):
        groupset = self.seed_a_group_set()

        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.patch(
            url,
            {
                "name": "",
            },
            format="json",
        )
        self.assertEqual(response.json(), {"name": ["This field may not be blank."]})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_groupset_with_invalid_groups(self):
        groupset = self.seed_a_group_set()

        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.patch(
            url,
            {
                "group_ids": [self.src_1_group_1.id, self.src_2_group_1.id],
            },
            format="json",
        )

        self.assertIn("Groups do not all belong to the same SourceVersion", response.json()["group_ids"][0])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_groupset_with_valid_groups(self):
        groupset = self.seed_a_group_set()

        self.assertEqual(GroupSet.objects.count(), 1)
        url = f"/api/group_sets/{groupset.id}/"
        response = self.client.delete(
            url,
            format="json",
        )

        self.assertEqual(GroupSet.objects.count(), 0)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def seed_list(self):
        self.client.force_authenticate(self.acccount_1_user_1)

        resp = self.client.post(
            "/api/group_sets/",
            {
                "name": "New GroupSet src 1",
                "source_version_id": self.source_version_1.id,
                "group_ids": [self.src_1_group_1.id, self.src_1_group_2.id],
            },
            format="json",
        )
        group_set_1 = resp.json()

        resp = self.client.post(
            "/api/group_sets/",
            {
                "name": "New GroupSet src 2",
                "source_version_id": self.source_version_2.id,
                "group_ids": [self.src_2_group_1.id],
            },
            format="json",
        )
        group_set_2 = resp.json()

        record_1 = {"id": group_set_1["id"], "name": "New GroupSet src 1"}
        record_2 = {"id": group_set_2["id"], "name": "New GroupSet src 2"}

        return [record_1, record_2]

    def test_list_groupsets_search_all(self):
        record_1, record_2 = self.seed_list()
        # Search all

        resp = self.client.get("/api/group_sets/?fields=id,name")
        self.assertEqual(
            resp.json()["group_sets"],
            [
                record_1,
                record_2,
            ],
        )

    def test_list_groupsets_search_by_name(self):
        record_1, record_2 = self.seed_list()

        resp = self.client.get("/api/group_sets/?fields=id,name&search=src 1")
        self.assertEqual(resp.json()["group_sets"], [record_1])

        resp = self.client.get("/api/group_sets/?fields=id,name&search=src")
        self.assertEqual(resp.json()["group_sets"], [record_1, record_2])

    def test_list_groupsets_search_by_default_version(self):
        record_1, record_2 = self.seed_list()

        resp = self.client.get("/api/group_sets/?fields=id,name&default_version=true")
        self.assertEqual(resp.json()["group_sets"], [record_1])

    def test_list_groupsets_search_by_version(self):
        record_1, record_2 = self.seed_list()

        resp = self.client.get(f"/api/group_sets/?fields=id,name&version={self.source_version_1.id}")
        self.assertEqual(resp.json()["group_sets"], [record_1])

        resp = self.client.get(f"/api/group_sets/?fields=id,name&version={self.source_version_2.id}")
        self.assertEqual(resp.json()["group_sets"], [record_2])

    def test_list_groupsets_search_return_dynamic_fields(self):
        record_1, record_2 = self.seed_list()

        resp = self.client.get(f"/api/group_sets/?fields=id")
        self.assertEqual(resp.json()["group_sets"], [{"id": record_1["id"]}, {"id": record_2["id"]}])

    def test_list_groupsets_search_return_dynamic_fields_groups(self):
        record_1, record_2 = self.seed_list()

        resp = self.client.get(f"/api/group_sets/?fields=id,name,groups&version={self.source_version_1.id}")
        groups_name = [g["name"] for g in resp.json()["group_sets"][0]["groups"]]
        self.assertEqual(groups_name, ["Councils", "Hidden"])
