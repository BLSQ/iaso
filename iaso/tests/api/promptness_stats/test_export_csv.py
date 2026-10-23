import codecs

import time_machine

from django.contrib.auth.models import User
from rest_framework import status

from iaso import models as m
from iaso.tests.api.promptness_stats.common import PromptnessStatsTestCase


COUNT_COLUMNS = [
    "expected",
    "received",
    "completeness_percent",
    "on_time",
    "on_time_percent",
    "late",
    "late_percent",
    "missing",
    "missing_percent",
]


@time_machine.travel(PromptnessStatsTestCase.TODAY, tick=False)
class PromptnessStatsExportCsvTestCase(PromptnessStatsTestCase):
    def get_csv(self, **params):
        """Lines of the CSV (header included), as lists of strings"""
        response = self.client.get(self.EXPORT_CSV_URL, self.get_serializer_params(**params))
        return self.assertCsvFileResponse(
            response,
            expected_name=f"promptness_{self.form.id}_{self.PERIOD}.csv",
            streaming=True,
            return_as_lists=True,
        )

    @staticmethod
    def get_header(levels_count):
        """Header of the CSV with `levels_count` ancestor levels, and all the statuses"""
        level_columns = [f"level_{level}" for level in range(1, levels_count + 1)]
        return ["org_unit_id", "org_unit_name", "org_unit_type", *level_columns, *COUNT_COLUMNS]

    def result_row_to_csv_line(self, result_row, levels):
        """Converts a row of the list results (as built by the `expected_*_row()` helpers) into the matching CSV line:
        the same values as strings, the name of the org unit type instead of its id, empty cells instead of `None`.
        `levels`: the cells of the level columns, i.e. the names of the ancestors from the root, then empty cells"""
        org_unit_type = m.OrgUnitType.objects.get(id=result_row["org_unit_type_id"])
        return [
            str(result_row["id"]),
            result_row["name"],
            org_unit_type.name,
            *levels,
            *("" if result_row[column] is None else str(result_row[column]) for column in COUNT_COLUMNS),
        ]

    def get_org_unit_ids(self, lines):
        """Org unit ids of the received csv lines, header excluded"""
        return [int(line[0]) for line in lines[1:]]

    def test_num_queries(self):
        # The user is reloaded from the database, like in a real request: its profile and account are not cached yet
        user = User.objects.get(id=self.user.id)
        self.client.force_authenticate(user)

        with self.assertNumQueries(9):
            # 1-2: PERMISSION (user and group permissions)
            # 3: SELECT PROFILE of the user
            # 4: SELECT ACCOUNT of the user
            # 5: EXISTS ORG UNITS of the user (restriction of the accessible org units)
            # 6: SELECT FORM (validation of form_id)
            # 7: SELECT PARENT ORG UNIT (validation of parent_org_unit_id)
            # 8: SELECT the ancestors of the rows (level columns)
            # 9: SELECT the rows with their counts and the name of their org unit type (no query per row)
            self.get_csv()

    def test_export(self):
        self.client.force_authenticate(self.user)
        lines = self.get_csv()

        # The rows are the regions: their only ancestor is Ethiopia (level 1)
        expected_lines = [
            self.get_header(levels_count=1),
            self.result_row_to_csv_line(self.expected_afar_row(), levels=["Ethiopia"]),
            self.result_row_to_csv_line(self.expected_amhara_row(), levels=["Ethiopia"]),
            self.result_row_to_csv_line(self.expected_oromia_row(), levels=["Ethiopia"]),
            # Somali is not applicable: its counts are exported as empty cells
            self.result_row_to_csv_line(self.expected_somali_row(), levels=["Ethiopia"]),
        ]
        self.assertEqual(lines, expected_lines)

    def test_export_starts_with_a_utf8_bom(self):
        # For Excel to detect the encoding (`assertCsvFileResponse()` strips the BOM)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.EXPORT_CSV_URL, self.get_serializer_params())
        content = self.assertFileResponse(response, status.HTTP_200_OK, "text/csv", streaming=True)

        self.assertTrue(content.startswith(codecs.BOM_UTF8))

    def test_export_non_ascii_names(self):
        type_region_fr = self.create_org_unit_type("Région", category="test", projects=[self.project])
        tigray = self.create_ou("Tigray ትግራይ", type_region_fr, self.ethiopia)

        self.client.force_authenticate(self.user)
        lines = self.get_csv()

        expected_line = self.result_row_to_csv_line(self.not_applicable_row(tigray, False), levels=["Ethiopia"])
        self.assertIn(expected_line, lines)

    def test_export_without_rows(self):
        # Somali has no children: the header is still exported, without level columns (no row, so no ancestor)
        self.client.force_authenticate(self.user)
        lines = self.get_csv(parent_org_unit_id=self.somali.id)

        self.assertEqual(lines, [self.get_header(levels_count=0)])

    def test_export_is_not_paginated(self):
        self.client.force_authenticate(self.user)
        lines = self.get_csv(limit=1, page=2)

        expected_ids = [self.afar.id, self.amhara.id, self.oromia.id, self.somali.id]
        result_ids = self.get_org_unit_ids(lines)
        self.assertEqual(result_ids, expected_ids)

    def test_export_order(self):
        # Somali is not applicable: it comes last
        self.client.force_authenticate(self.user)
        lines = self.get_csv(order="-expected")

        expected_ids = [self.oromia.id, self.amhara.id, self.afar.id, self.somali.id]
        result_ids = self.get_org_unit_ids(lines)
        self.assertEqual(result_ids, expected_ids)

    def test_export_filter_org_unit_types(self):
        self.client.force_authenticate(self.user)
        lines = self.get_csv(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")

        expected_ids = [
            self.afar.id,  # region
            self.amhara.id,  # region
            self.awsi.id,  # district
            self.east_shewa.id,  # district
            self.jimma.id,  # district
            self.north_gondar.id,  # district
            self.oromia.id,  # region
            self.somali.id,  # region
        ]
        result_ids = self.get_org_unit_ids(lines)
        self.assertEqual(result_ids, expected_ids)

        header = lines[0]
        # The deepest ancestors are the regions (parents of the districts), at level 2
        self.assertEqual(header, self.get_header(levels_count=2))

        expected_afar_line = self.result_row_to_csv_line(self.expected_afar_row(), levels=["Ethiopia", ""])
        self.assertIn(expected_afar_line, lines)
        expected_jimma_line = self.result_row_to_csv_line(self.expected_jimma_row(), levels=["Ethiopia", "Oromia"])
        self.assertIn(expected_jimma_line, lines)

    def test_export_levels_go_up_to_the_root(self):
        # Facilities under Oromia: the levels start at the root of the pyramid (Ethiopia), above the requested parent
        self.client.force_authenticate(self.user)
        lines = self.get_csv(parent_org_unit_id=self.oromia.id, org_unit_type_ids=str(self.type_facility.id))
        header, *rows = lines

        self.assertEqual(header, self.get_header(levels_count=3))
        hf_a_line = next(line for line in rows if line[0] == str(self.hf_a.id))
        hf_a_levels = {
            column: value for column, value in zip(header, hf_a_line, strict=False) if column.startswith("level_")
        }
        self.assertEqual(hf_a_levels, {"level_1": "Ethiopia", "level_2": "Oromia", "level_3": "Jimma"})

    def test_export_drill_down(self):
        """Try to export results of a region"""
        self.client.force_authenticate(self.user)
        lines = self.get_csv(parent_org_unit_id=self.oromia.id)

        expected_lines = [
            self.get_header(levels_count=2),
            self.result_row_to_csv_line(self.expected_borena_row(), levels=["Ethiopia", "Oromia"]),
            self.result_row_to_csv_line(self.expected_east_shewa_row(), levels=["Ethiopia", "Oromia"]),
            self.result_row_to_csv_line(self.expected_jimma_row(), levels=["Ethiopia", "Oromia"]),
        ]
        self.assertEqual(lines, expected_lines)

        expected_org_unit_types = ["Zone", "District", "District"]
        result_org_unit_types = [line[2] for line in lines[1:]]  # org_unit_type column, header excluded
        self.assertEqual(result_org_unit_types, expected_org_unit_types)

    def test_export_excluded_statuses(self):
        # The ON_TIME columns are left out, the other values are unchanged
        self.client.force_authenticate(self.user)
        lines = self.get_csv(status="LATE,MISSING")
        header, *rows = lines

        expected_header = [
            "org_unit_id",
            "org_unit_name",
            "org_unit_type",
            "level_1",
            "expected",
            "received",
            "completeness_percent",
            # no "on_time" nor "on_time_percent"
            "late",
            "late_percent",
            "missing",
            "missing_percent",
        ]
        self.assertEqual(header, expected_header)

    def test_invalid_params_are_a_json_error(self):
        # The params are validated before the CSV is streamed
        self.client.force_authenticate(self.user)
        response = self.client.get(self.EXPORT_CSV_URL, self.get_serializer_params(period="not a period"))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(data, {"period": ["Invalid period"]})
