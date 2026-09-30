"""Tests of the CSV export.

/!\\ The CSV format has not been decided yet (see the spec): the columns tested here follow the example of the spec
and may have to be updated.
"""

import time_machine

from rest_framework import status

from iaso.tests.api.promptness_stats.common import EXPORT_CSV_URL, PERIOD, TODAY, PromptnessStatsTestCase


HEADER = [
    "form_id",
    "period",
    "deadline",
    "org_unit_id",
    "org_unit_name",
    "org_unit_type",
    "parent_org_unit",
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


@time_machine.travel(TODAY, tick=False)
class PromptnessStatsExportCsvTestCase(PromptnessStatsTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def get_csv(self, **params):
        response = self.client.get(EXPORT_CSV_URL, self.get_serializer_params(**params))
        return self.assertCsvFileResponse(
            response, expected_name=f"promptness_{self.form.id}_{PERIOD}.csv", return_as_lists=True
        )

    def csv_line(self, org_unit, *counts):
        return [
            str(self.form.id),
            PERIOD,
            "2026-02-10",
            str(org_unit.id),
            org_unit.name,
            org_unit.org_unit_type.name,
            org_unit.parent.name,
            *counts,
        ]

    def test_export(self):
        lines = self.get_csv()
        self.assertEqual(lines[0], HEADER)
        self.assertEqual(
            lines[1:],
            [
                self.csv_line(self.afar, "1", "0", "0.0", "0", "0.0", "0", "0.0", "1", "100.0"),
                self.csv_line(self.amhara, "2", "1", "50.0", "0", "0.0", "1", "50.0", "1", "50.0"),
                self.csv_line(self.oromia, "4", "3", "75.0", "2", "50.0", "1", "25.0", "1", "25.0"),
                # null percentages are exported as empty cells
                self.csv_line(self.somali, "0", "0", "", "0", "", "0", "", "0", ""),
            ],
        )

    def test_export_is_not_paginated(self):
        lines = self.get_csv(limit=1, page=2)
        self.assertEqual(len(lines), 5)  # header + 4 rows

    def test_export_order(self):
        lines = self.get_csv(order="-expected")
        self.assertEqual([line[4] for line in lines[1:]], ["Oromia", "Amhara", "Afar", "Somali"])

    def test_export_org_unit_types(self):
        lines = self.get_csv(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        self.assertEqual(len(lines), 9)  # header + 8 rows

    def test_export_drill_down(self):
        lines = self.get_csv(parent_org_unit_id=self.oromia.id)
        self.assertEqual([line[4] for line in lines[1:]], ["East Shewa", "Jimma"])
        self.assertEqual({line[6] for line in lines[1:]}, {"Oromia"})

    def test_export_excluded_statuses(self):
        lines = self.get_csv(status="LATE,MISSING")
        self.assertEqual(lines[0], [column for column in HEADER if column not in ("on_time", "on_time_percent")])
        self.assertEqual(len(lines[1]), len(HEADER) - 2)

    def test_export_bad_request(self):
        response = self.client.get(EXPORT_CSV_URL, self.get_serializer_params(period="2026Q1"))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("period", data)

    def test_export_user_restricted_to_org_units(self):
        self.client.force_authenticate(self.user_restricted)
        response = self.client.get(EXPORT_CSV_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parent_org_unit_id", data)
