from django.contrib.auth.models import Permission

from hat.menupermissions import models as permission
from iaso import models as m
from iaso.test import APITestCase


class SourceVersionAPITestCase(APITestCase):
    """
    Test SourceVersionViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)

        cls.account = m.Account.objects.create(name="Account", default_version=cls.version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")
        cls.data_source.projects.set([cls.project])

        cls.account2, cls.data_source2, cls.version2, cls.project2 = cls.create_account_datasource_version_project(
            source_name="GDHF source", account_name="GDHF", project_name="GDHF campaign"
        )
        cls.project2.account = cls.account2
        cls.data_source2.account = cls.account2
        cls.project2.app_id = "GDHF.campaign"
        cls.project2.save()
        cls.data_source2.save()
        cls.user2 = cls.create_user_with_profile(username="GDHF", account=cls.account2)

    def test_list_unauthorized_without_auth(self):
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 401)

    def test_list_unauthorized_without_perms(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/sourceversions/")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_list_ok_with_right_perms(self):
        self.client.force_authenticate(self.user)

        self.user.user_permissions.set([Permission.objects.get(codename=permission._MAPPINGS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.MAPPINGS))
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._ORG_UNITS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.ORG_UNITS))
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._ORG_UNITS_READ)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.ORG_UNITS_READ))
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._LINKS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.LINKS))
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.SOURCES))
        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

    def test_list(self):
        self.user.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/sourceversions/")
        self.assertJSONResponse(response, 200)

        data = response.data["versions"]
        self.assertEqual(1, len(data))

        version = data[0]
        self.assertEqual(version["id"], self.version.pk)
        self.assertEqual(version["data_source"], self.data_source.pk)
        self.assertEqual(version["number"], self.version.number)
        self.assertEqual(version["description"], None)
        self.assertEqual(version["data_source_name"], self.data_source.name)
        self.assertEqual(version["is_default"], False)
        self.assertEqual(version["org_units_count"], 0)
        self.assertEqual(version["tree_config_status_fields"], [])

    def test_dropdown_sourceversions(self):
        self.user.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/sourceversions/dropdown/")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(data), 1)
        version = data[0]
        self.assertEqual(version["id"], self.version.pk)
        self.assertEqual(version["data_source"], self.data_source.pk)
        self.assertEqual(version["number"], self.version.number)
        self.assertEqual(version["data_source_name"], self.data_source.name)

    def test_dropdown_sourceversions_without_user_authentication(self):
        response = self.client.get("/api/sourceversions/dropdown/")
        self.assertJSONResponse(response, 401)

    def test_dropdown_sourceversions_with_user_without_permission(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/sourceversions/dropdown/")
        self.assertJSONResponse(response, 403)

    def test_dropdown_sourceversions_with_user_from_another_account(self):
        self.user2.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.client.force_authenticate(self.user2)
        response = self.client.get("/api/sourceversions/dropdown/")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(data), 1)
        version = data[0]
        self.assertEqual(version["id"], self.version2.pk)
        self.assertEqual(version["data_source"], self.data_source2.pk)
        self.assertEqual(version["number"], self.version2.number)
        self.assertEqual(version["data_source_name"], self.data_source2.name)
