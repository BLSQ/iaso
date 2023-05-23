from iaso.test import APITestCase
from iaso import models as m
from django.contrib.auth.models import Permission, Group


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

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_user_roles"])

        cls.permission = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission"
        )

        cls.permission1 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission1"
        )

        cls.permission2 = Permission.objects.create(
            name="iaso permission", content_type_id=1, codename="iaso_permission2"
        )
        cls.group = Group.objects.create(name="user role")
        cls.group.permissions.add(cls.permission)

        cls.userRole = m.UserRole.objects.create(group=cls.group)

    def test_create_user_role(self):
        self.client.force_authenticate(self.yoda)

        payload = {"name": "New user role name"}

        response = self.client.post("/api/userroles/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["name"], payload["name"])
        self.assertIsNotNone(r["id"])

    def test_create_user_role_without_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"permissions": ["iaso_mappings"]}
        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_retrieve_user_role(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/userroles/{self.userRole.pk}/")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["id"], self.userRole.pk)

    def test_list_without_search(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/userroles/")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["user_roles"]), 6)

    def test_list_with_search_on_user_role_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"search": "user role"}
        response = self.client.get("/api/userroles/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["user_roles"]), 1)
        self.assertEqual(r["user_roles"][0]["name"], self.group.name)

    def test_partial_update_no_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {}
        response = self.client.patch(f"/api/userroles/{self.userRole.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r, {})

    def test_partial_update_name_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {"name": "user role modified"}
        response = self.client.patch(f"/api/userroles/{self.userRole.id}/", data=payload, format="json")
        self.group.refresh_from_db()
        r = self.assertJSONResponse(response, 200)

        self.assertEqual(r["name"], self.group.name)

    def test_partial_update_permissions_modification(self):
        self.client.force_authenticate(self.yoda)

        payload = {"permissions": [self.permission1.codename, self.permission2.codename]}
        response = self.client.patch(f"/api/userroles/{self.userRole.id}/", data=payload, format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["permissions"], [self.permission1.codename, self.permission2.codename])

    def test_delete_permissions_modification(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.delete(f"/api/userroles/{self.userRole.id}/")

        r = self.assertJSONResponse(response, 200)
