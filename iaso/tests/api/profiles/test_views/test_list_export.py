from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase
from iaso.tests.utils.query_profiler import QueryProfiler


class ProfileListExportAPITestCase(BaseProfileAPITestCase):
    maxDiff = None

    def test_profile_list_export_denied_without_users_permissions(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-export-csv"))
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        response = self.client.get(reverse("profiles-export-xlsx"))
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_profile_list_export_as_csv_multiple_teams(self):
        multi_user = self.create_user_with_profile(username="multiteam", account=self.account)

        multi_user.teams.set([self.team1, self.team2])

        self.client.force_authenticate(self.jim)
        response = self.client.get(reverse("profiles-export-csv"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        csv_rows = self.assertCsvFileResponse(response, expected_name="users.csv", streaming=True, return_as_lists=True)

        header = csv_rows[0]

        username_idx = header.index("username")
        teams_idx = header.index("teams")
        user_row = next(row for row in csv_rows if row[username_idx] == "multiteam")

        teams = sorted([self.team1, self.team2], key=lambda x: x.id)
        expected_teams_value = f"{teams[0].name},{teams[1].name}"

        self.assertEqual(user_row[teams_idx], expected_teams_value)

    def test_profile_list_export_as_csv(self):
        self.maxDiff = None
        self.john.iaso_profile.org_units.set([self.org_unit_from_sub_type, self.org_unit_from_parent_type])
        self.jum.iaso_profile.editable_org_unit_types.set([self.sub_unit_type])

        self.client.force_authenticate(self.jim)
        response = self.client.get(reverse("profiles-export-csv"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

        response_csv = response.getvalue().decode("utf-8")

        expected_csv = "".join(
            [
                "user_profile_id,"
                "username,"
                "password,"
                "email,"
                "first_name,"
                "last_name,"
                "orgunit,"
                "orgunit__source_ref,"
                "profile_language,"
                "dhis2_id,"
                "organization,"
                "permissions,"
                "user_roles,"
                "projects,"
                "teams,"
                "phone_number,"
                "editable_org_unit_types\r\n"
            ]
        )

        expected_csv += f"{self.jane.iaso_profile.id},janedoe,,,Jane,Doe,,,,,,iaso_forms,,,{self.team1.name},,\r\n"
        expected_csv += f'{self.john.iaso_profile.id},johndoe,,,,,"{self.org_unit_from_sub_type.pk},{self.org_unit_from_parent_type.pk}",{self.org_unit_from_parent_type.source_ref},,,,,,,,,\r\n'
        expected_csv += f'{self.jim.iaso_profile.id},jim,,,,,,,,,,"{CORE_FORMS_PERMISSION.codename},{CORE_USERS_ADMIN_PERMISSION.codename}",,,{self.team2.name},,\r\n'
        expected_csv += f"{self.jam.iaso_profile.id},jam,,,,,,,en,,,{CORE_USERS_MANAGED_PERMISSION.codename},,,,,\r\n"
        expected_csv += f"{self.jom.iaso_profile.id},jom,,,,,,,fr,,,,,,,,\r\n"
        expected_csv += f"{self.jum.iaso_profile.id},jum,,,,,,,,,,,,{self.project.name},,,{self.sub_unit_type.pk}\r\n"
        expected_csv += f'{self.user_managed_geo_limit.iaso_profile.id},managedGeoLimit,,,,,{self.org_unit_from_parent_type.id},{self.org_unit_from_parent_type.source_ref},,,,{CORE_USERS_MANAGED_PERMISSION.codename},"{self.user_role_name},{self.user_role_another_account_name}",,,,\r\n'

        self.assertEqual(response_csv, expected_csv)

    def test_profile_list_export_as_xlsx(self):
        self.maxDiff = None
        self.john.iaso_profile.org_units.set([self.org_unit_from_sub_type, self.org_unit_from_parent_type])
        self.jum.iaso_profile.editable_org_unit_types.set([self.sub_unit_type])

        self.client.force_authenticate(self.jim)
        response = self.client.get(reverse("profiles-export-xlsx"))
        excel_columns, excel_data = self.assertXlsxFileResponse(response)

        self.assertEqual(
            excel_columns,
            [
                "user_profile_id",
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "orgunit",
                "orgunit__source_ref",
                "profile_language",
                "dhis2_id",
                "organization",
                "permissions",
                "user_roles",
                "projects",
                "teams",
                "phone_number",
                "editable_org_unit_types",
            ],
        )

        self.assertDictEqual(
            excel_data,
            {
                "user_profile_id": {
                    0: self.jane.iaso_profile.id,
                    1: self.john.iaso_profile.id,
                    2: self.jim.iaso_profile.id,
                    3: self.jam.iaso_profile.id,
                    4: self.jom.iaso_profile.id,
                    5: self.jum.iaso_profile.id,
                    6: self.user_managed_geo_limit.iaso_profile.id,
                },
                "username": {0: "janedoe", 1: "johndoe", 2: "jim", 3: "jam", 4: "jom", 5: "jum", 6: "managedGeoLimit"},
                "password": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "email": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "first_name": {0: "Jane", 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "last_name": {0: "Doe", 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "orgunit": {
                    0: None,
                    1: f"{self.org_unit_from_sub_type.id},{self.org_unit_from_parent_type.id}",
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: f"{self.org_unit_from_parent_type.id}",
                },
                "orgunit__source_ref": {
                    0: None,
                    1: self.org_unit_from_parent_type.source_ref,
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: self.org_unit_from_parent_type.source_ref,
                },
                "profile_language": {0: None, 1: None, 2: None, 3: "en", 4: "fr", 5: None, 6: None},
                "dhis2_id": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "organization": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "permissions": {
                    0: CORE_FORMS_PERMISSION.codename,
                    1: None,
                    2: f"{CORE_FORMS_PERMISSION.codename},{CORE_USERS_ADMIN_PERMISSION.codename}",
                    3: CORE_USERS_MANAGED_PERMISSION.codename,
                    4: None,
                    5: None,
                    6: CORE_USERS_MANAGED_PERMISSION.codename,
                },
                "user_roles": {
                    0: None,
                    1: None,
                    2: None,
                    3: None,
                    4: None,
                    5: None,
                    6: f"{self.user_role_name},{self.user_role_another_account_name}",
                },
                "projects": {0: None, 1: None, 2: None, 3: None, 4: None, 5: self.project.name, 6: None},
                "teams": {0: self.team1.name, 1: None, 2: self.team2.name, 3: None, 4: None, 5: None, 6: None},
                "phone_number": {0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None},
                "editable_org_unit_types": {
                    0: None,
                    1: None,
                    2: None,
                    3: None,
                    4: None,
                    5: self.sub_unit_type.pk,
                    6: None,
                },
            },
        )

    def test_profile_list_export_multi_valued_columns_are_ordered_by_id(self):
        """
        Each multi-valued column lists its items by id, whatever the order they were added in
        (and, for teams, whatever their name), and skips soft-deleted teams.
        """
        belgium_type = m.OrgUnitType.objects.create(name="Belgium type")
        france_type = m.OrgUnitType.objects.create(name="France type")
        belgium = m.OrgUnit.objects.create(name="Belgium", org_unit_type=belgium_type, source_ref="BE")
        france = m.OrgUnit.objects.create(name="France", org_unit_type=france_type, source_ref="FR")
        project_belgium = m.Project.objects.create(name="Project Belgium", app_id="belgium", account=self.account)
        project_france = m.Project.objects.create(name="Project France", app_id="france", account=self.account)
        role_belgium = m.UserRole.objects.create(
            group=Group.objects.create(name=f"{self.account.pk}_Role Belgium"), account=self.account
        )
        role_france = m.UserRole.objects.create(
            group=Group.objects.create(name=f"{self.account.pk}_Role France"), account=self.account
        )
        # Created first but named last: the export follows ids, not the `Team` default ordering by name.
        team_z = m.Team.objects.create(project=self.project, name="Z team", manager=self.jim)
        team_a = m.Team.objects.create(project=self.project, name="A team", manager=self.jim)
        deleted_team = m.Team.objects.create(project=self.project, name="Deleted team", manager=self.jim)

        user = self.create_user_with_profile(username="belgian", account=self.account)
        profile = user.iaso_profile
        # Added one at a time, highest id first, so that the M2M rows aren't in id order.
        for org_unit in [france, belgium]:
            profile.org_units.add(org_unit)
        for org_unit_type in [france_type, belgium_type]:
            profile.editable_org_unit_types.add(org_unit_type)
        for role in [role_france, role_belgium]:
            profile.user_roles.add(role)
        for project in [project_france, project_belgium]:
            profile.projects.add(project)
        for team in [deleted_team, team_a, team_z]:
            team.users.add(user)
        deleted_team.delete()

        self.client.force_authenticate(self.jim)
        response = self.client.get(reverse("profiles-export-csv"))
        csv_rows = self.assertCsvFileResponse(response, expected_name="users.csv", streaming=True, return_as_lists=True)

        header = csv_rows[0]
        row = next(row for row in csv_rows if row[header.index("username")] == "belgian")
        self.assertDictEqual(
            {
                column: row[header.index(column)]
                for column in [
                    "orgunit",
                    "orgunit__source_ref",
                    "user_roles",
                    "projects",
                    "teams",
                    "editable_org_unit_types",
                ]
            },
            {
                "orgunit": f"{belgium.pk},{france.pk}",
                "orgunit__source_ref": "BE,FR",
                "user_roles": "Role Belgium,Role France",
                "projects": "Project Belgium,Project France",
                "teams": "Z team,A team",
                "editable_org_unit_types": f"{belgium_type.pk},{france_type.pk}",
            },
        )

    def assertExportQueryCount(self, export_url: str, expected_profile_queries: int):
        """
        The export queries each relation once for all the profiles (7 in the fixture), not once per profile:
        - iaso_profile: the profiles, joined with their user (+ a COUNT for the CSV, streamed page by page);
        - auth_permission: the requester's user and group permissions (permission check), then the prefetched
          permissions of the exported users;
        - iaso_orgunit, iaso_orgunittype, iaso_userrole (joined with its group), iaso_project, iaso_team:
          one prefetch each.
        """
        self.client.force_authenticate(self.jim)
        with QueryProfiler(trace_tables=["iaso_profile", "auth_user", "iaso_account"]) as profiler:
            response = self.client.get(export_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            if response.streaming:
                b"".join(response.streaming_content)

        with profiler.report_on_failure(title="Profiles export query report"):
            profiler.assertLessEqualQueryCount(
                {
                    "iaso_profile": expected_profile_queries,
                    "auth_permission": 3,
                    "iaso_orgunit": 1,
                    "iaso_orgunittype": 1,
                    "iaso_userrole": 1,
                    "iaso_project": 1,
                    "iaso_team": 1,
                }
            )

    def test_profile_list_export_as_csv_query_count(self):
        self.assertExportQueryCount(reverse("profiles-export-csv"), expected_profile_queries=2)

    def test_profile_list_export_as_xlsx_query_count(self):
        self.assertExportQueryCount(reverse("profiles-export-xlsx"), expected_profile_queries=1)
