from django.urls import reverse

from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase


class ProfileListExportAPITestCase(BaseProfileAPITestCase):
    maxDiff = None

    def test_profile_list_export_as_csv_multiple_teams(self):
        multi_user = self.create_user_with_profile(username="multiteam", account=self.account)

        multi_user.teams.set([self.team1, self.team2])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-export-csv", kwargs={"version": "v2"}))
        self.assertEqual(response.status_code, 200)

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

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-export-csv", kwargs={"version": "v2"}))
        self.assertEqual(response.status_code, 200)
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

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-export-xlsx", kwargs={"version": "v2"}))
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
