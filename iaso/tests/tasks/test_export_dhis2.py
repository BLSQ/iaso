import datetime

from unittest.mock import MagicMock, _Call, call, patch

from iaso import models as m
from iaso.tasks.dhis2_ou_exporter import dhis2_ou_exporter
from iaso.test import TestCase
from iaso.tests.diffing.utils import PyramidBaseTest


class ExportDHIS2TaskTestCase(TestCase, PyramidBaseTest):
    """
    These tests are linked to the CSV preview tests
    (check the fixtures in iaso/tests/fixtures/pyramid_diff_csv to see what could be exported).

    Overview of the DHIS2 API calls made by the exporter:
        1- create missing org units in DHIS2
            1 POST per org unit
        2- update org units in DHIS2
             1 GET + POST per group of 4 org units, provided that they are modified (not at the group level)
        3- update groups in DHIS2
            1 GET per group
            1 PUT per modified group
    """

    DHIS2_ENDPOINT_GROUPS = "organisationUnitGroups"
    DHIS2_ENDPOINT_ORGUNITS = "organisationUnits"
    DHIS2_ENDPOINT_ORGUNITS_METADATA = "metadata"

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

        self.task = m.Task.objects.create(
            name="dhis2_ou_exporter",
            launcher=self.user_with_perms,
            account=self.account,
        )

        # Adding required credentials to the data source
        self.fake_dhis2_url = "https://example.com/dhis2"
        credentials = m.ExternalCredentials.objects.create(
            name="Test Credentials",
            url=self.fake_dhis2_url,
            login="admin",
            password="district",
            account=self.account,
        )
        self.data_source.credentials = credentials
        self.data_source.save()
        self.data_source.refresh_from_db()

        self.maxDiff = None

    @patch("dhis2.api.Api.get")
    @patch("dhis2.api.Api.post")
    @patch("dhis2.api.Api.put")
    def test_happy_path(self, mock_api_put, mock_api_post, mock_api_get):
        # Preparing some extra changes to trigger various DHIS2 API calls
        new_orgunit_name = "New org unit"
        new_orgunit_source_ref = "new-org-unit-source-ref"
        new_district = m.OrgUnit.objects.create(
            parent=self.angola_region_to_compare_with,
            version=self.source_version_to_compare_with,
            name=new_orgunit_name,
            source_ref=new_orgunit_source_ref,
            opening_date=datetime.date(2025, 6, 10),
            closed_date=datetime.date(2025, 7, 10),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            org_unit_type=self.org_unit_type_district,
        )
        new_country_name = "Angola Updated"
        self.angola_country_to_compare_with.name = new_country_name
        self.angola_country_to_compare_with.save()

        new_region_opening_date = datetime.date(2025, 6, 10)
        self.angola_region_to_compare_with.opening_date = new_region_opening_date
        self.angola_region_to_compare_with.save()

        # this group should not be exported because it's not assigned to any org unit in the pyramid
        new_group = m.Group.objects.create(
            name="New Group",
            source_version=self.source_version_to_compare_with,
            source_ref="new-group-source-ref",
        )

        # Mocking the DHIS2 API calls, in the order that they are expected to be made
        payloads_create_missings_post = {  # call #1
            "call": call(
                self.DHIS2_ENDPOINT_ORGUNITS,
                {
                    "id": new_orgunit_source_ref,
                    "name": new_orgunit_name,
                    "shortName": new_orgunit_name,
                    "openingDate": new_district.opening_date.strftime("%Y-%m-%d") + "T00:00:00.000",
                    "parent": {"id": self.angola_region_to_compare_with.source_ref},
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(),
        }
        payloads_update_orgunits_get = {  # call #2
            "call": call(
                f"{self.DHIS2_ENDPOINT_ORGUNITS}?",
                params={
                    "filter": f"id:in:[{self.angola_country_to_update.source_ref},{self.angola_region_to_update.source_ref}]",
                    "fields": ":all",
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": self.angola_country_to_update.name,
                        },
                        {
                            "id": self.angola_region_to_update.source_ref,
                            "name": self.angola_region_to_update.name,
                        },
                    ]
                }
            ),
        }
        payloads_update_orgunits_post = {  # call #3
            "call": call(
                self.DHIS2_ENDPOINT_ORGUNITS_METADATA,
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": new_country_name,
                        },
                        {
                            "id": self.angola_region_to_update.source_ref,
                            "name": self.angola_region_to_update.name,
                            "openingDate": new_region_opening_date.strftime("%Y-%m-%d") + "T00:00:00",
                        },
                    ]
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "status": "OK",
                }
            ),
        }
        payloads_update_groups_get_group_a = {  # call #4
            "call": call(
                self.DHIS2_ENDPOINT_GROUPS,
                params={"fields": ":all", "filter": f"id:eq:{self.group_a1.source_ref}", "paging": "false"},
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "organisationUnitGroups": [
                        {
                            "id": self.group_a1.source_ref,
                            "name": self.group_a1.name,
                            "organisationUnits": [
                                {
                                    "id": self.angola_country_to_update.source_ref,
                                }
                            ],
                        }
                    ]
                }
            ),
        }
        payloads_update_groups_get_group_b = {  # call #5
            "call": call(
                self.DHIS2_ENDPOINT_GROUPS,
                params={"fields": ":all", "filter": f"id:eq:{self.group_b.source_ref}", "paging": "false"},
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "organisationUnitGroups": [
                        {
                            "id": self.group_b.source_ref,
                            "name": self.group_b.name,
                            "organisationUnits": [
                                {
                                    "id": self.angola_country_to_update.source_ref,
                                }
                            ],
                        }
                    ]
                }
            ),
        }
        payloads_update_groups_get_group_c = {  # call #6
            "call": call(
                self.DHIS2_ENDPOINT_GROUPS,
                params={"fields": ":all", "filter": f"id:eq:{self.group_c.source_ref}", "paging": "false"},
            ),
            "result": self._generate_mock_dhis2_api_call_result({"organisationUnitGroups": []}),
        }
        payloads_update_groups_put_group_b = {  # call #7
            "call": call(
                f"{self.DHIS2_ENDPOINT_GROUPS}/{self.group_b.source_ref}",
                {"id": self.group_b.source_ref, "name": self.group_b.name, "organisationUnits": []},
            ),
            "result": self._generate_mock_dhis2_api_call_result(),
        }
        mock_api_get.side_effect = [
            payloads_update_orgunits_get["result"],
            payloads_update_groups_get_group_a["result"],
            payloads_update_groups_get_group_b["result"],
            payloads_update_groups_get_group_c["result"],
        ]
        mock_api_post.side_effect = [
            payloads_create_missings_post["result"],
            payloads_update_orgunits_post["result"],
        ]
        mock_api_put.side_effect = [
            payloads_update_groups_put_group_b["result"],
        ]

        dhis2_ou_exporter(
            ref_version_id=self.source_version_to_compare_with.id,
            version_id=self.source_version_to_update.id,
            ignore_groups=False,
            show_deleted_org_units=True,
            validation_status=None,
            ref_validation_status=None,
            top_org_unit_id=None,
            top_org_unit_ref_id=None,
            org_unit_types_ids=None,
            org_unit_types_ref_ids=None,
            org_unit_group_id=None,
            org_unit_group_ref_id=None,
            field_names=["name", "geometry", "parent", "opening_date", "closed_date"],
            task=self.task,
            _immediate=True,
        )

        self.assertEqual(self.task.status, m.SUCCESS)

        expected_calls_get = [
            payloads_update_orgunits_get["call"],
            payloads_update_groups_get_group_a["call"],
            payloads_update_groups_get_group_b["call"],
            payloads_update_groups_get_group_c["call"],
        ]
        self.assertEqualCallLists(expected_calls_get, mock_api_get.call_args_list)

        expected_calls_post = [
            payloads_create_missings_post["call"],
            payloads_update_orgunits_post["call"],
        ]
        self.assertEqualCallLists(expected_calls_post, mock_api_post.call_args_list)

        expected_calls_put = [
            payloads_update_groups_put_group_b["call"],
        ]
        self.assertEqualCallLists(expected_calls_put, mock_api_put.call_args_list)

    @patch("dhis2.api.Api.get")
    @patch("dhis2.api.Api.post")
    @patch("dhis2.api.Api.put")
    def test_export_to_dhis2_with_group_filtering(self, mock_api_put, mock_api_post, mock_api_get):
        # Preparing some extra changes to trigger various DHIS2 API calls
        new_country_name = "Angola Updated"  # This change will trigger a DHIS2 API call
        self.angola_country_to_compare_with.name = new_country_name
        self.angola_country_to_compare_with.save()

        # The below changes should not trigger any DHIS2 API calls, since the pyramid will be filtered by group
        # the region and district are not assigned to the group we are filtering on
        new_region_opening_date = datetime.date(2025, 6, 10)
        self.angola_region_to_compare_with.opening_date = new_region_opening_date
        self.angola_region_to_compare_with.save()

        new_district_closed_date = datetime.date(2025, 6, 10)
        self.angola_district_to_compare_with.closed_date = new_district_closed_date
        self.angola_district_to_compare_with.save()

        # Mocking the DHIS2 API calls, in the order that they are expected to be made
        payloads_update_orgunits_get = {  # call #1
            "call": call(
                f"{self.DHIS2_ENDPOINT_ORGUNITS}?",
                params={
                    "filter": f"id:in:[{self.angola_country_to_update.source_ref}]",
                    "fields": ":all",
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": self.angola_country_to_update.name,
                        }
                    ]
                }
            ),
        }
        payloads_update_orgunits_post = {  # call #2
            "call": call(
                self.DHIS2_ENDPOINT_ORGUNITS_METADATA,
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": new_country_name,
                        }
                    ]
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "status": "OK",
                }
            ),
        }
        mock_api_get.side_effect = [
            payloads_update_orgunits_get["result"],
        ]
        mock_api_post.side_effect = [
            payloads_update_orgunits_post["result"],
        ]
        mock_api_put.side_effect = []

        dhis2_ou_exporter(
            ref_version_id=self.source_version_to_compare_with.id,
            version_id=self.source_version_to_update.id,
            ignore_groups=True,  # Difference from happy path here
            show_deleted_org_units=True,
            validation_status=None,
            ref_validation_status=None,
            top_org_unit_id=None,
            top_org_unit_ref_id=None,
            org_unit_types_ids=None,
            org_unit_types_ref_ids=None,
            org_unit_group_id=self.group_a1.id,  # Difference from happy path here
            org_unit_group_ref_id=self.group_a2.id,  # Difference from happy path here
            field_names=["name", "opening_date", "closed_date"],  # Difference from happy path here
            task=self.task,
            _immediate=True,
        )

        self.assertEqual(self.task.status, m.SUCCESS)

        expected_calls_get = [
            payloads_update_orgunits_get["call"],
        ]
        self.assertEqualCallLists(expected_calls_get, mock_api_get.call_args_list)

        expected_calls_post = [
            payloads_update_orgunits_post["call"],
        ]
        self.assertEqualCallLists(expected_calls_post, mock_api_post.call_args_list)

        expected_calls_put = []
        self.assertEqualCallLists(expected_calls_put, mock_api_put.call_args_list)

    @patch("dhis2.api.Api.get")
    @patch("dhis2.api.Api.post")
    @patch("dhis2.api.Api.put")
    def test_export_to_dhis2_with_group_filtering_and_group_mismatches(self, mock_api_put, mock_api_post, mock_api_get):
        # Preparing some extra changes to trigger various DHIS2 API calls
        new_country_name = "Angola Updated"  # This change will be exported to DHIS2
        self.angola_country_to_compare_with.name = new_country_name
        self.angola_country_to_compare_with.save()
        new_region_opening_date = datetime.date(2025, 6, 10)  # This change will be exported to DHIS2
        self.angola_region_to_compare_with.opening_date = new_region_opening_date
        self.angola_region_to_compare_with.save()

        # This change should not trigger any DHIS2 API calls, since the pyramid will be filtered by group
        # the district is not assigned to the group we are filtering on
        new_district_closed_date = datetime.date(2025, 6, 10)
        self.angola_district_to_compare_with.closed_date = new_district_closed_date
        self.angola_district_to_compare_with.save()

        # Adding another OrgUnit to the Group C -> 2 OrgUnits will be compared to 1 OrgUnit
        self.angola_region_to_compare_with.groups.set([self.group_c])
        self.angola_region_to_compare_with.save()

        # Mocking the DHIS2 API calls, in the order that they are expected to be made
        payloads_create_missings_post = {  # call #1; this is considered a new orgunit even though it's in the other pyramid
            "call": call(
                self.DHIS2_ENDPOINT_ORGUNITS,
                {
                    "id": self.angola_region_to_compare_with.source_ref,
                    "name": self.angola_region_to_compare_with.name,
                    "shortName": self.angola_region_to_compare_with.name,
                    "openingDate": new_region_opening_date.strftime("%Y-%m-%d") + "T00:00:00.000",
                    "parent": {"id": self.angola_country_to_update.source_ref},
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(),
        }
        payloads_update_orgunits_get = {  # call #2
            "call": call(
                f"{self.DHIS2_ENDPOINT_ORGUNITS}?",
                params={
                    "filter": f"id:in:[{self.angola_country_to_update.source_ref}]",
                    "fields": ":all",
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": self.angola_country_to_update.name,
                        }
                    ]
                }
            ),
        }
        payloads_update_orgunits_post = {  # call #3
            "call": call(
                self.DHIS2_ENDPOINT_ORGUNITS_METADATA,
                {
                    "organisationUnits": [
                        {
                            "id": self.angola_country_to_update.source_ref,
                            "name": new_country_name,
                        }
                    ]
                },
            ),
            "result": self._generate_mock_dhis2_api_call_result(
                {
                    "status": "OK",
                }
            ),
        }
        mock_api_get.side_effect = [
            payloads_update_orgunits_get["result"],
        ]
        mock_api_post.side_effect = [
            payloads_create_missings_post["result"],
            payloads_update_orgunits_post["result"],
        ]
        mock_api_put.side_effect = []

        dhis2_ou_exporter(
            ref_version_id=self.source_version_to_compare_with.id,
            version_id=self.source_version_to_update.id,
            ignore_groups=True,  # Difference from happy path here
            show_deleted_org_units=True,
            validation_status=None,
            ref_validation_status=None,
            top_org_unit_id=None,
            top_org_unit_ref_id=None,
            org_unit_types_ids=None,
            org_unit_types_ref_ids=None,
            org_unit_group_id=self.group_b.id,  # Difference from happy path here
            org_unit_group_ref_id=self.group_c.id,  # Difference from happy path here
            field_names=["name", "opening_date", "closed_date"],  # Difference from happy path here
            task=self.task,
            _immediate=True,
        )

        self.assertEqual(self.task.status, m.SUCCESS)

        expected_calls_get = [
            payloads_update_orgunits_get["call"],
        ]
        self.assertEqualCallLists(expected_calls_get, mock_api_get.call_args_list)

        expected_calls_post = [
            payloads_create_missings_post["call"],
            payloads_update_orgunits_post["call"],
        ]
        self.assertEqualCallLists(expected_calls_post, mock_api_post.call_args_list)

        expected_calls_put = []
        self.assertEqualCallLists(expected_calls_put, mock_api_put.call_args_list)

    def _generate_mock_dhis2_api_call_result(self, returned_values: dict = {}, status_code: int = 200):
        mock_dhis2_call = MagicMock()
        mock_dhis2_call.json.return_value = returned_values
        mock_dhis2_call.status_code = status_code
        return mock_dhis2_call

    def assertEqualCallLists(self, expected_calls: list[_Call], actual_calls: list[_Call]):
        """
        Helper method to compare two lists of calls.
        Lists are manually compared for easier debugging
        """
        self.assertEqual(len(expected_calls), len(actual_calls))
        for i in range(len(actual_calls)):
            expected_call = expected_calls[i]
            actual_call = actual_calls[i]
            self.assertIsInstance(expected_call, _Call)
            self.assertIsInstance(actual_call, _Call)
            self.assertEqual(expected_call, actual_call)

    # TODO: add more tests to make sure the export task works as expected + errors
