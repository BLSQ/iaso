from iaso import models as m
from iaso.test import APITestCase


def _create_new_group(name, source_version):
    """
    Helper method to create a new group.
    """
    return m.Group.objects.create(
        name=name,
        source_ref=name,
        source_version=source_version,
    )


class GroupListFilterTestCase(APITestCase):
    """
    Test filtering on the ViewSet.

    Layout of the test data:
    Account_1 & Project_1
     └── DataSource_1
          ├── SourceVersion_1
          │    ├── Group_1
          │    └── Group_2
          └── SourceVersion_2
               ├── Group_3
               └── Group_4
     └── DataSource_2
          └── SourceVersion_3
               ├── Group_5
               └── Group_6

    Account_2 & Project_2
     └── DataSource_3
          └── SourceVersion_4
               ├── Group_7
               └── Group_8
    """

    BASE_URL = "/api/groups/export/"

    @classmethod
    def setUpTestData(cls):
        cls.account_1, cls.data_source_1, cls.source_version_1, cls.project_1 = (
            cls.create_account_datasource_version_project(
                source_name="data_source_1", account_name="account_1", project_name="project_1"
            )
        )
        cls.group_1 = _create_new_group("group_1", cls.source_version_1)
        cls.group_2 = _create_new_group("group_2", cls.source_version_1)

        # Preparing another version in the same account and data source
        cls.source_version_2 = m.SourceVersion.objects.create(
            data_source=cls.data_source_1,
            number=2,
            description="source_version_2",
        )
        cls.group_3 = _create_new_group("group_3", cls.source_version_2)
        cls.group_4 = _create_new_group("group_4", cls.source_version_2)

        # Preparing another data source and version in the same account
        cls.data_source_2 = m.DataSource.objects.create(
            name="data_source_2",
        )
        cls.data_source_2.projects.add(cls.project_1)
        cls.source_version_3 = m.SourceVersion.objects.create(
            data_source=cls.data_source_2,
            number=1,
            description="source_version_3",
        )
        cls.group_5 = _create_new_group("group_5", cls.source_version_3)
        cls.group_6 = _create_new_group("group_6", cls.source_version_3)

        # Preparing second account and groups that will be filtered out by account
        cls.account_2, cls.data_source_3, cls.source_version_4, cls.project_2 = (
            cls.create_account_datasource_version_project(
                source_name="data_source_3", account_name="account_2", project_name="project_2"
            )
        )
        cls.group_7 = _create_new_group("group_7", cls.source_version_4)
        cls.group_8 = _create_new_group("group_8", cls.source_version_4)

        # Preparing users
        cls.user_1, cls.anon_1, cls.user_no_perms_1 = cls.create_base_users(cls.account_1, ["iaso_org_units"], "user_1")
        cls.user_2, cls.anon_2, cls.user_no_perms_2 = cls.create_base_users(cls.account_2, ["iaso_org_units"], "user_2")

    def test_filter_by_source_version(self):
        # Checking without any filters
        self.client.force_authenticate(self.user_1)
        response = self.client.get(f"{self.BASE_URL}?file_format=csv")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 6)  # there are only 6 groups in account_1

        # Same call, but filtering on source_version_1
        response = self.client.get(f"{self.BASE_URL}?file_format=csv&version={self.source_version_1.id}")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 2)  # there are only 2 groups in source_version_1

        ids = [int(row[0]) for row in data]
        self.assertCountEqual(ids, [self.group_1.id, self.group_2.id])

    def test_filter_by_data_source(self):
        # Checking without any filters
        self.client.force_authenticate(self.user_1)
        response = self.client.get(f"{self.BASE_URL}?file_format=csv")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 6)  # there are only 6 groups in account_1

        # Same call, but filtering on data_source_2
        response = self.client.get(f"{self.BASE_URL}?file_format=csv&dataSource={self.data_source_2.id}")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 2)  # there are only 2 groups in data_source_2

        ids = [int(row[0]) for row in data]
        self.assertCountEqual(ids, [self.group_5.id, self.group_6.id])

    def test_filter_by_project_ids(self):
        # Preparing another project, along with its data source, version and groups
        new_project = m.Project.objects.create(
            name="new_project",
            account=self.account_1,
        )
        new_data_source = m.DataSource.objects.create(
            name="new_data_source",
        )
        new_data_source.projects.add(new_project)
        new_source_version = m.SourceVersion.objects.create(
            data_source=new_data_source,
            number=1,
            description="new_source_version",
        )
        new_group_1 = _create_new_group("new_group_1", new_source_version)
        new_group_2 = _create_new_group("new_group_2", new_source_version)

        # Checking without any filters
        self.client.force_authenticate(self.user_1)
        response = self.client.get(f"{self.BASE_URL}?file_format=csv")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 8)  # there are only 8 groups in account_1 (6 + 2 new ones)

        # Same call, but filtering on project_1
        response = self.client.get(f"{self.BASE_URL}?file_format=csv&projectIds={self.project_1.id}")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        self.assertEqual(len(data), 6)  # there are only 6 groups in project_1

        ids = [int(row[0]) for row in data]
        self.assertCountEqual(
            ids, [self.group_1.id, self.group_2.id, self.group_3.id, self.group_4.id, self.group_5.id, self.group_6.id]
        )

        # When providing both project IDs, all groups are there
        response = self.client.get(f"{self.BASE_URL}?file_format=csv&projectIds={self.project_1.id},{new_project.id}")
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)  # Remove header
        ids = [int(row[0]) for row in data]
        self.assertCountEqual(
            ids,
            [
                self.group_1.id,
                self.group_2.id,
                self.group_3.id,
                self.group_4.id,
                self.group_5.id,
                self.group_6.id,
                new_group_1.id,
                new_group_2.id,
            ],
        )

    def test_invalid_version_and_data_source(self):
        """
        Test that there is no result when the version does not belong to the data source.
        """
        self.client.force_authenticate(self.user_1)
        response = self.client.get(
            f"{self.BASE_URL}?file_format=csv&version={self.source_version_1.id}&dataSource={self.data_source_2.id}"
        )
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        self.assertEqual(len(data), 1)  # Only the header row should be returned

    def test_invalid_version_and_project(self):
        """
        Test that there is no result when the version is not linked to the project.
        """
        self.client.force_authenticate(self.user_1)
        response = self.client.get(
            f"{self.BASE_URL}?file_format=csv&version={self.source_version_2.id}&projectIds={self.project_2.id}"
        )
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        self.assertEqual(len(data), 1)  # Only the header row should be returned

    def test_multiple_filters(self):
        """
        Test that multiple filters can be applied together.
        """
        self.client.force_authenticate(self.user_1)
        response = self.client.get(
            f"{self.BASE_URL}?file_format=csv&dataSource={self.data_source_1.id}&projectIds={self.project_1.id}"
        )
        data = self.assertCsvFileResponse(response, streaming=True, return_as_lists=True)

        data.pop(0)

        self.assertEqual(len(data), 4)
        ids = [int(row[0]) for row in data]
        self.assertCountEqual(
            ids,
            [
                self.group_1.id,
                self.group_2.id,
                self.group_3.id,
                self.group_4.id,
            ],
        )
