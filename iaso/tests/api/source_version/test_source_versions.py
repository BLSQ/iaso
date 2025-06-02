from django.contrib.auth.models import Permission
from rest_framework import status

from hat.menupermissions import models as permission
from iaso import models as m
from iaso.test import APITestCase
from iaso.tests.diffing.utils import PyramidBaseTest
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class SourceVersionAPITestCase(APITestCase):
    """
    Test SourceVersionViewSet.
    """

    BASE_URL = "/api/sourceversions/"

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)

        cls.account = m.Account.objects.create(name="Account", default_version=cls.version)
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)
        cls.user_with_perms = cls.create_user_with_profile(
            account=cls.account, username="user_with_perms", permissions=["iaso_org_units"]
        )

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
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 401)

    def test_list_unauthorized_without_perms(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_list_ok_with_right_perms(self):
        self.client.force_authenticate(self.user)

        self.user.user_permissions.set([Permission.objects.get(codename=permission._MAPPINGS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.MAPPINGS))
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._ORG_UNITS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.ORG_UNITS))
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._ORG_UNITS_READ)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.ORG_UNITS_READ))
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._LINKS)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.LINKS))
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

        del self.user._perm_cache
        del self.user._user_perm_cache
        self.user.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.assertEqual(1, self.user.user_permissions.count())
        self.assertTrue(self.user.has_perm(permission.SOURCES))
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, 200)

    def test_list(self):
        self.user.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.client.force_authenticate(self.user)

        response = self.client.get(self.BASE_URL)
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
        response = self.client.get(f"{self.BASE_URL}dropdown/")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(data), 1)
        version = data[0]
        self.assertEqual(version["id"], self.version.pk)
        self.assertEqual(version["data_source"], self.data_source.pk)
        self.assertEqual(version["number"], self.version.number)
        self.assertEqual(version["data_source_name"], self.data_source.name)

    def test_dropdown_sourceversions_without_user_authentication(self):
        response = self.client.get(f"{self.BASE_URL}dropdown/")
        self.assertJSONResponse(response, 401)

    def test_dropdown_sourceversions_with_user_without_permission(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.BASE_URL}dropdown/")
        self.assertJSONResponse(response, 403)

    def test_dropdown_sourceversions_with_user_from_another_account(self):
        self.user2.user_permissions.set([Permission.objects.get(codename=permission._SOURCES)])
        self.client.force_authenticate(self.user2)
        response = self.client.get(f"{self.BASE_URL}dropdown/")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(data), 1)
        version = data[0]
        self.assertEqual(version["id"], self.version2.pk)
        self.assertEqual(version["data_source"], self.data_source2.pk)
        self.assertEqual(version["number"], self.version2.number)
        self.assertEqual(version["data_source_name"], self.data_source2.name)


class SourceVersionPyramidsAPITestCase(PyramidBaseTest, TaskAPITestCase):
    BASE_URL = "/api/sourceversions/"
    PATH_TO_FIXTURES = "iaso/tests/fixtures/pyramid_diff_csv"
    EXPECTED_FILE_NAME = "comparison.csv"

    def setUp(self):
        # Other fields are defined in PyramidBaseTest, so I'm using setUp instead of setUpTestData
        self.account = m.Account.objects.create(name="Account", default_version=self.source_version_to_update)
        self.user = self.create_user_with_profile(username="user", account=self.account)
        self.user_with_perms = self.create_user_with_profile(
            account=self.account, username="user_with_perms", permissions=["iaso_org_units"]
        )

        self.project = m.Project.objects.create(name="Project", account=self.account, app_id="foo.bar.baz")
        self.data_source.projects.set([self.project])

        self.account2, self.data_source2, self.version2, self.project2 = self.create_account_datasource_version_project(
            source_name="GDHF source", account_name="GDHF", project_name="GDHF campaign"
        )
        self.project2.account = self.account2
        self.data_source2.account = self.account2
        self.project2.app_id = "GDHF.campaign"
        self.project2.save()
        self.data_source2.save()
        self.user2 = self.create_user_with_profile(username="GDHF", account=self.account2)

        self.maxDiff = None  # For debugging purposes when these tests will fail

    def test_diff_csv_happy_path(self):
        self.client.force_authenticate(self.user_with_perms)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        csv_data = self.assertCsvFileResponse(response, expected_name=self.EXPECTED_FILE_NAME, return_as_str=True)

        # Prepare values for each variable in the Jinja template
        context_group_ids = {
            "id_group_a1": self.group_a1.id,
            "id_group_b": self.group_b.id,
            "id_group_a2": self.group_a2.id,
            "id_group_c": self.group_c.id,
        }

        expected_csv = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="diff_happy_path.csv", context=context_group_ids
        )
        self.assertEqual(expected_csv, csv_data)  # 4 lines: 3 org units + header

    def test_diff_csv_with_group_filtering(self):
        # filtering with groups will reduce the number of org units in the file
        self.client.force_authenticate(self.user_with_perms)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": self.group_c.id,
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": self.group_b.id,
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        csv_data = self.assertCsvFileResponse(response, expected_name=self.EXPECTED_FILE_NAME, return_as_str=True)

        # Prepare values for each variable in the Jinja template
        context_group_ids = {
            "id_group_a1": self.group_a1.id,
            "id_group_b": self.group_b.id,
            "id_group_a2": self.group_a2.id,
            "id_group_c": self.group_c.id,
        }

        expected_csv = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES,
            fixture_name="diff_csv_with_group_filtering.csv",
            context=context_group_ids,
        )
        self.assertEqual(expected_csv, csv_data)  # 2 lines: 1 org unit + header

    def test_diff_csv_with_group_filtering_and_group_mismatches(self):
        # filtering with groups will reduce the number of org units in the file
        # but there are group mismatches that will cause a comparison of pyramids of different sizes
        self.client.force_authenticate(self.user_with_perms)

        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": self.group_c.id,
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": self.group_b.id,
            "fields_to_export": [],
        }
        # Adding another OrgUnit to the Group B -> one OrgUnit will be compared to 2 OrgUnits
        self.angola_region_to_update.groups.set([self.group_b])
        self.angola_region_to_update.save()
        self.angola_region_to_update.refresh_from_db()

        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        csv_data = self.assertCsvFileResponse(response, expected_name=self.EXPECTED_FILE_NAME, return_as_str=True)

        expected_csv = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES, fixture_name="diff_csv_with_group_filtering_and_mismatches.csv"
        )
        self.assertEqual(expected_csv, csv_data)  # 3 lines: 2 org units + header
        # the region is considered as a "deleted" org unit even though it's in the previous pyramid because it was filtered out by groups

    def test_diff_csv_with_relevant_groups_in_columns(self):
        # Let's add some new groups to both pyramids, without assigning them to any OrgUnit
        # They shouldn't appear in the diff CSV
        new_group_in_source_pyramid = m.Group.objects.create(
            name="new group 1",
            source_version=self.source_version_to_compare_with,
            source_ref="new-group-1",
        )
        new_group_in_target_pyramid = m.Group.objects.create(
            name="new group 2",
            source_version=self.source_version_to_update,
            source_ref="new-group-2",
        )

        self.client.force_authenticate(self.user_with_perms)

        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "fields_to_export": ["name", "groups", "opening_date"],
        }

        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        csv_data = self.assertCsvFileResponse(response, expected_name=self.EXPECTED_FILE_NAME, return_as_str=True)

        # Prepare values for each variable in the Jinja template
        context_group_ids = {
            "id_group_a1": self.group_a1.id,
            "id_group_b": self.group_b.id,
            "id_group_a2": self.group_a2.id,
            "id_group_c": self.group_c.id,
        }
        expected_csv = self.load_fixture_with_jinja_template(
            path_to_fixtures=self.PATH_TO_FIXTURES,
            fixture_name="diff_relevant_groups.csv",
            context=context_group_ids,
        )
        self.assertEqual(expected_csv, csv_data)  # 4 lines: 3 org units + header
        self.assertNotIn(new_group_in_source_pyramid.source_ref, csv_data)
        self.assertNotIn(new_group_in_target_pyramid.source_ref, csv_data)

    def test_diff_csv_without_login(self):
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": self.group_c.id,
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": self.group_b.id,
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        self.assertContains(response, "Authentication credentials were not provided.", status_code=status.HTTP_401_UNAUTHORIZED)

    def test_diff_csv_without_perms(self):
        self.client.force_authenticate(self.user)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": self.group_c.id,
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": self.group_b.id,
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}diff.csv/", data=payload)
        self.assertContains(response, "You do not have permission to perform this action.", status_code=status.HTTP_403_FORBIDDEN)

    def test_export_to_dhis2_happy_path(self):
        # Adding missing credentials to the data source
        credentials = m.ExternalCredentials.objects.create(
            name="Test Credentials",
            url="https://example.com/dhis2",
            login="admin",
            password="district",
            account=self.account,
        )
        self.data_source.credentials = credentials
        self.data_source.save()
        self.data_source.refresh_from_db()

        total_tasks_before = m.Task.objects.count()

        self.client.force_authenticate(self.user_with_perms)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": "",
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": "",
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}export_dhis2/", data=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Don't know why it's not 201

        total_tasks_after = m.Task.objects.count()
        self.assertEqual(total_tasks_before + 1, total_tasks_after)  # one new task created

        response_data = response.json()["task"]
        self.assertValidTaskAndInDB(response_data, name="dhis2_ou_exporter")
        # Not starting the task here, don't want to mess with DHIS2 mocks (see tasks folder)

    def test_export_to_dhis2_missing_credentials(self):
        total_tasks_before = m.Task.objects.count()
        self.client.force_authenticate(self.user_with_perms)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": "",
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": "",
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}export_dhis2/", data=payload)
        self.assertContains(response, "No valid DHIS2 configured on source", status_code=status.HTTP_400_BAD_REQUEST)
        total_tasks_after = m.Task.objects.count()
        self.assertEqual(total_tasks_before, total_tasks_after)  # no new task created

    def test_export_to_dhis2_without_login(self):
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": "",
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": "",
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}export_dhis2/", data=payload)
        self.assertContains(response, "Authentication credentials were not provided.", status_code=status.HTTP_401_UNAUTHORIZED)

    def test_export_to_dhis2_without_perms(self):
        self.client.force_authenticate(self.user)
        payload = {
            "ref_version_id": self.source_version_to_compare_with.id,
            "ref_status": "",
            "ref_org_unit_type_ids": [],
            "ref_org_unit_group_id": "",
            "source_version_id": self.source_version_to_update.id,
            "source_status": "",
            "source_org_unit_type_ids": [],
            "source_org_unit_group_id": "",
            "fields_to_export": ["name", "parent", "geometry", "groups", "opening_date", "closed_date"],
        }
        response = self.client.post(f"{self.BASE_URL}export_dhis2/", data=payload)
        self.assertContains(response, "You do not have permission to perform this action.", status_code=status.HTTP_403_FORBIDDEN)
