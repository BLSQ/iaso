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
        cls.group = Group.objects.create(name="OrgUnit Group")
        cls.userRole = m.UserRole.objects.create(group=cls.group)

    def test_create_user_role(self):
        self.client.force_authenticate(self.yoda)

        payload = {"name": "New OrgUnit Group"}

        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, 200)

    def test_create_user_role_without_name(self):
        self.client.force_authenticate(self.yoda)

        payload = {"permissions": ["iaso_mappings"]}

        response = self.client.post("/api/userroles/", data=payload, format="json")

        self.assertEqual(response.status_code, 400)

    def test_retrieve_user_role(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/userroles/" + str(self.userRole.id), format="json")

        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r), 8)
