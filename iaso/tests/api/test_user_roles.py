from rest_framework import status

from iaso.test import APITestCase
from iaso import models as m
from django.contrib.auth.models import Permission, Group

from iaso.utils.strings import remove_prefix_from_str


class UserRoleAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars
        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.project = m.Project.objects.create(name="project", account=star_wars)

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_user_roles"])
        cls.yoda.iaso_profile.projects.add(cls.project)
        cls.user_with_no_permissions = cls.create_user_with_profile(username="userNoPermission", account=star_wars)

        cls.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )

        cls.permission1 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission1"
        )

        cls.permission2 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission2"
        )

        cls.permission_not_allowable = Permission.objects.create(
            name="admin permission", content_type_id=1, codename="admin_permission1"
        )
        cls.group = Group.objects.create(name=str(star_wars.id) + "user role")

        cls.group.permissions.add(cls.permission)
        cls.group.refresh_from_db()

        cls.org_unit_type_1 = m.OrgUnitType.objects.create(name="org unit type 1")
        cls.org_unit_type_1.projects.add(cls.project)
        cls.org_unit_type_2 = m.OrgUnitType.objects.create(name="org unit type 2")
        cls.org_unit_type_2.projects.add(cls.project)

        cls.user_role = m.UserRole.objects.create(group=cls.group, account=star_wars)
        cls.user_role.editable_org_unit_types.set([cls.org_unit_type_1, cls.org_unit_type_2])

    # *** test POST create ***
    def test_create_user_role(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New user role name",
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id]
        }

        response = self.client.post("/api/userroles/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertEqual(r["name"], payload["name"])
        self.assertIsNotNone(r["id"])

    def test_create_user_role_without_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id]
        }
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_user_role_without_org_unit_types(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New user role name",
            "permissions": ["iaso_mappings"],
        }
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        result = m.UserRole.objects.get(id=response.json()["id"])
        self.assertIsNone(result.editable_org_unit_types.first())

    def test_create_user_role_with_org_unit_types(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New user role name",
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
        }
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        result = m.UserRole.objects.get(id=response.json()["id"])
        self.assertCountEqual(result.editable_org_unit_types.values_list("id", flat=True), payload["editable_org_unit_type_ids"])

    def test_create_user_role_with_unknown_org_unit_type(self):
        self.client.force_authenticate(self.yoda)

        probably_not_a_valid_id = 1234567890
        payload = {
            "name": "Oh no an error :(",
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [probably_not_a_valid_id],
        }
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertContains(response, probably_not_a_valid_id, status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("editable_org_unit_type_ids", result)
        self.assertIn(str(probably_not_a_valid_id), result["editable_org_unit_type_ids"][0])

    def test_create_user_role_with_org_unit_type_by_superuser(self):
        new_project = m.Project.objects.create(name="new project", account=self.star_wars, app_id="test")
        superuser = self.create_user_with_profile(username="superuser", account=self.star_wars, is_superuser=True)
        superuser.iaso_profile.projects.add(new_project)

        payload = {
            "name": "Yay superuser can do anything",
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
        }

        self.client.force_authenticate(superuser)
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        result = m.UserRole.objects.get(id=response.json()["id"])
        self.assertCountEqual(result.editable_org_unit_types.values_list("id", flat=True), payload["editable_org_unit_type_ids"])

    def test_create_user_role_with_restricted_org_unit_type(self):
        # The user doesn't have access to this new org unit type, so it can't be in the userrole
        new_org_unit_type = m.OrgUnitType.objects.create(name="new org unit type")
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "Oh no an error :(",
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, new_org_unit_type.id],
        }
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertContains(response, f"The user doesn't have access to the OrgUnitType {new_org_unit_type.id}", status_code=status.HTTP_400_BAD_REQUEST)

    # *** test GET retrieve ***
    def test_retrieve_user_role(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/userroles/{self.user_role.pk}/")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["id"], self.user_role.pk)
        self.user_role.refresh_from_db()
        user_role_name = remove_prefix_from_str(self.user_role.group.name, str(self.star_wars.id) + "_")
        self.assertEqual(r["name"], user_role_name)
        self.assertCountEqual(r["editable_org_unit_type_ids"], [self.org_unit_type_1.id, self.org_unit_type_2.id])

    def test_retrieve_user_role_read_only(self):
        self.client.force_authenticate(self.user_with_no_permissions)

        response = self.client.get(f"/api/userroles/{self.user_role.pk}/")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["id"], self.user_role.pk)

    # *** test GET list ***
    def test_list_without_search(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/userroles/")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(r["results"]), 1)

    def test_list_with_search_on_user_role_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"search": "user role"}
        response = self.client.get("/api/userroles/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        user_role_name = remove_prefix_from_str(self.user_role.group.name, str(self.star_wars.id) + "_")

        self.assertEqual(len(r["results"]), 1)
        self.assertEqual(r["results"][0]["name"], user_role_name)

    # *** test PATCH update ***
    def test_partial_update_no_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": self.user_role.group.name,
            "permissions": ["iaso_mappings"],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id],
        }
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(r["name"], payload["name"])

    def test_partial_update_no_permission(self):
        self.client.force_authenticate(self.user_with_no_permissions)

        payload = {"name": self.user_role.group.name}
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        self.assertEqual(r["detail"], "You do not have permission to perform this action.")

    def test_update_name_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {"name": "user role modified"}
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")
        self.group.refresh_from_db()
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        user_role_name = remove_prefix_from_str(self.group.name, str(self.star_wars.id) + "_")
        self.assertEqual(r["name"], user_role_name)

    def test_partial_update_permissions_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission1.codename, self.permission2.codename],
        }
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            [r["permissions"][0], r["permissions"][1]],
            [self.permission1.codename, self.permission2.codename],
        )

    def test_partial_update_not_allowable_permissions_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission_not_allowable.codename],
        }
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            r["detail"],
            "Not found.",
        )

    def test_partial_update_org_unit_types(self):
        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id],  # removing the other OrgUnitType
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        user_role = m.UserRole.objects.get(pk=self.user_role.id)
        self.assertCountEqual(user_role.editable_org_unit_types.values_list("id", flat=True), payload["editable_org_unit_type_ids"])

    def test_partial_update_remove_org_unit_types(self):
        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [],
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        user_role = m.UserRole.objects.get(pk=self.user_role.id)
        self.assertFalse(user_role.editable_org_unit_types.exists())

    def test_partial_update_unknown_org_unit_types(self):
        probably_not_a_valid_id = 1234567890
        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [probably_not_a_valid_id],
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        self.assertContains(response, probably_not_a_valid_id, status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("editable_org_unit_type_ids", result)
        self.assertIn(str(probably_not_a_valid_id), result["editable_org_unit_type_ids"][0])

    def test_partial_update_unknown_org_unit_types(self):
        probably_not_a_valid_id = 1234567890
        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [probably_not_a_valid_id],
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        self.assertContains(response, probably_not_a_valid_id, status_code=status.HTTP_400_BAD_REQUEST)

        result = response.json()
        self.assertIn("editable_org_unit_type_ids", result)
        self.assertIn(str(probably_not_a_valid_id), result["editable_org_unit_type_ids"][0])

    def test_partial_update_with_restricted_org_unit_type(self):
        # The user doesn't have access to this new org unit type, so it can't be in the userrole
        new_org_unit_type = m.OrgUnitType.objects.create(name="new org unit type")
        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [new_org_unit_type.id],
        }

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")
        self.assertContains(response, f"The user doesn't have access to the OrgUnitType {new_org_unit_type.id}",
                            status_code=status.HTTP_400_BAD_REQUEST)

    def test_partial_update_with_org_unit_type_by_superuser(self):
        new_project = m.Project.objects.create(name="new project", account=self.star_wars, app_id="test")
        superuser = self.create_user_with_profile(username="superuser", account=self.star_wars, is_superuser=True)
        superuser.iaso_profile.projects.add(new_project)
        new_org_unit_type = m.OrgUnitType.objects.create(name="new org unit type")
        new_org_unit_type.projects.add(new_project)

        payload = {
            "name": self.user_role.group.name,
            "permissions": [self.permission.codename],
            "editable_org_unit_type_ids": [self.org_unit_type_1.id, self.org_unit_type_2.id, new_org_unit_type.id],
        }

        self.client.force_authenticate(superuser)
        response = self.client.put(f"/api/userroles/{self.user_role.id}/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = m.UserRole.objects.get(id=response.json()["id"])
        self.assertCountEqual(result.editable_org_unit_types.values_list("id", flat=True), payload["editable_org_unit_type_ids"])

    # *** test DELETE ***
    def test_delete_user_role(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.delete(f"/api/userroles/{self.user_role.id}/")
        r = self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

    def test_delete_user_role_and_remove_users_in_it(self):
        self.client.force_authenticate(self.yoda)
        group_1 = Group.objects.create(name="Group 1")
        group_2 = Group.objects.create(name="Group 2")

        group_1.permissions.add(self.permission)
        group_2.permissions.add(self.permission)

        userRole_1 = m.UserRole.objects.create(group=group_1, account=self.star_wars)
        userRole_2 = m.UserRole.objects.create(group=group_2, account=self.star_wars)

        self.yoda.iaso_profile.user_roles.add(userRole_1)
        self.yoda.iaso_profile.user_roles.add(userRole_2)
        self.assertEqual(
            list(self.yoda.iaso_profile.user_roles.all()),
            list(m.UserRole.objects.filter(id__in=[userRole_2.id, userRole_1.id])),
        )
        response = self.client.delete(f"/api/userroles/{userRole_1.id}/")
        r = self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        self.assertEqual(
            list(self.yoda.iaso_profile.user_roles.all()),
            list(m.UserRole.objects.filter(id__in=[userRole_2.id])),
        )

        self.assertFalse(Group.objects.filter(id=group_1.id).exists())
