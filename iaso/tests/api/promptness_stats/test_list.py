import time_machine

from rest_framework import status

from iaso import models as m
from iaso.tests.api.promptness_stats.common import (
    PERIOD,
    PERIOD_KEYS,
    RESPONSE_KEYS,
    ROW_KEYS,
    TODAY,
    URL,
    PromptnessStatsTestCase,
    aware,
)


@time_machine.travel(TODAY, tick=False)
class PromptnessStatsListTestCase(PromptnessStatsTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def get_json(self, expected_status=status.HTTP_200_OK, user=None, **params):
        if user:
            self.client.force_authenticate(user)
        response = self.client.get(URL, self.get_params(**params))
        return self.assertJSONResponse(response, expected_status)

    def result_names(self, data):
        return [row["name"] for row in data["results"]]

    # Response shape

    def test_response_shape(self):
        data = self.get_json()
        self.assertEqual(set(data.keys()), RESPONSE_KEYS)
        self.assertEqual(set(data["period"].keys()), PERIOD_KEYS)
        for row in data["results"]:
            self.assertEqual(set(row.keys()), ROW_KEYS)

    def test_echo_of_params(self):
        data = self.get_json()
        self.assertEqual(data["form_id"], self.form.id)
        self.assertEqual(data["parent_org_unit_id"], self.ethiopia.id)
        self.assertEqual(data["status"], ["ON_TIME", "LATE", "MISSING"])

    def test_period_block(self):
        data = self.get_json()
        self.assertEqual(
            data["period"],
            {
                "value": PERIOD,
                "start": "2026-01-01",
                "end": "2026-01-31",
                "grace_period_days": 10,
                "deadline": "2026-02-10",
                "is_current": False,
                "is_provisional": False,
            },
        )

    def test_period_block_during_the_period(self):
        with time_machine.travel(aware(2026, 1, 20, 12, 0), tick=False):
            data = self.get_json()
        self.assertTrue(data["period"]["is_current"])
        self.assertTrue(data["period"]["is_provisional"])

    def test_period_block_during_the_grace_period(self):
        with time_machine.travel(aware(2026, 2, 10, 12, 0), tick=False):
            data = self.get_json()
        self.assertFalse(data["period"]["is_current"])
        self.assertTrue(data["period"]["is_provisional"])

    # Figures

    def test_default_rows_are_direct_children(self):
        data = self.get_json()
        self.assertEqual(
            data["results"],
            [
                self.expected_afar_row(),
                self.expected_amhara_row(),
                self.expected_oromia_row(),
                self.expected_somali_row(),
            ],
        )

    def test_totals(self):
        data = self.get_json()
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    def test_invariants(self):
        data = self.get_json(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        for counts in [data["totals"], *data["results"]]:
            self.assertEqual(counts["on_time"] + counts["late"] + counts["missing"], counts["expected"])
            self.assertEqual(counts["on_time"] + counts["late"], counts["received"])

    def test_drill_down(self):
        data = self.get_json(parent_org_unit_id=self.oromia.id)
        self.assertEqual(data["parent_org_unit_id"], self.oromia.id)
        self.assertEqual(data["totals"], {k: v for k, v in self.expected_oromia_row().items() if k in data["totals"]})
        self.assertEqual(data["results"], [self.expected_east_shewa_row(), self.expected_jimma_row()])

    def test_drill_down_to_target_org_units(self):
        data = self.get_json(parent_org_unit_id=self.jimma.id)
        self.assertEqual(
            data["results"],
            [
                self.row(self.hf_a, False, 1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0),
                self.row(self.hf_b, False, 1, 0, 1, 0, 1, 100.0, 0.0, 100.0, 0.0),
                self.row(self.hf_c, False, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0),
            ],
        )

    def test_org_unit_without_target_has_null_percentages(self):
        data = self.get_json(parent_org_unit_id=self.somali.id)
        self.assertEqual(data["totals"], self.counts(0, 0, 0, 0, 0, None, None, None, None))
        self.assertEqual(data["results"], [])
        self.assertEqual(data["count"], 0)

    def test_earliest_submission_is_used(self):
        # HF A has an on time submission and a late one: it is on time
        data = self.get_json(parent_org_unit_id=self.jimma.id)
        hf_a = next(row for row in data["results"] if row["id"] == self.hf_a.id)
        self.assertEqual((hf_a["on_time"], hf_a["late"]), (1, 0))

    def test_deadline_day_is_inclusive(self):
        # HF D submitted on 2026-02-10 at 23:30
        data = self.get_json(parent_org_unit_id=self.east_shewa.id)
        self.assertEqual(data["results"][0]["on_time"], 1)

    def test_zero_grace_period(self):
        self.form.promptness_grace_period_days = 0
        self.form.save()
        data = self.get_json(parent_org_unit_id=self.oromia.id)
        self.assertEqual(data["period"]["deadline"], "2026-01-31")
        # HF D (2026-02-10) becomes late
        self.assertEqual(data["totals"]["on_time"], 1)
        self.assertEqual(data["totals"]["late"], 2)

    def test_ignored_submissions(self):
        # HF C only has deleted, file-less, other form and other period submissions
        data = self.get_json(parent_org_unit_id=self.jimma.id)
        hf_c = next(row for row in data["results"] if row["id"] == self.hf_c.id)
        self.assertEqual(hf_c["missing"], 1)

    def test_rejected_org_units_are_ignored(self):
        data = self.get_json(parent_org_unit_id=self.north_gondar.id)
        self.assertEqual(self.result_names(data), ["HF E", "HF F"])
        self.assertEqual(data["totals"]["expected"], 2)
        self.assertEqual(data["totals"]["on_time"], 0)

    def test_new_org_units_are_ignored(self):
        self.create_ou("HF New", self.type_facility, self.north_gondar, validation_status=m.OrgUnit.VALIDATION_NEW)
        data = self.get_json(parent_org_unit_id=self.north_gondar.id)
        self.assertEqual(self.result_names(data), ["HF E", "HF F"])
        self.assertEqual(data["totals"]["expected"], 2)

    def test_target_by_org_unit_group(self):
        # HP H is a health post (not a target type) but belongs to a target group
        data = self.get_json(parent_org_unit_id=self.awsi.id)
        self.assertEqual(data["results"], [self.row(self.hp_h, False, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0)])

    def test_target_by_type_and_group_is_counted_once(self):
        # HF E is a facility and belongs to a target group
        data = self.get_json(parent_org_unit_id=self.north_gondar.id)
        hf_e = next(row for row in data["results"] if row["id"] == self.hf_e.id)
        self.assertEqual(hf_e["expected"], 1)

    def test_parent_org_unit_itself_is_counted(self):
        data = self.get_json(parent_org_unit_id=self.hf_a.id)
        self.assertEqual(data["totals"], self.counts(1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0))
        self.assertEqual(data["results"], [])

    # org_unit_type_ids

    def test_org_unit_types_flat_output(self):
        data = self.get_json(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        self.assertEqual(data["count"], 8)
        self.assertEqual(
            self.result_names(data),
            ["Afar", "Amhara", "Awsi", "East Shewa", "Jimma", "North Gondar", "Oromia", "Somali"],
        )
        self.assertIn(self.expected_jimma_row(), data["results"])
        self.assertIn(self.expected_oromia_row(), data["results"])
        # totals are not the sum of the rows
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    def test_org_unit_types_deep_level(self):
        data = self.get_json(org_unit_type_ids=str(self.type_facility.id))
        self.assertEqual(self.result_names(data), ["HF A", "HF B", "HF C", "HF D", "HF E", "HF F"])

    def test_org_unit_types_below_parent_only(self):
        data = self.get_json(parent_org_unit_id=self.oromia.id, org_unit_type_ids=str(self.type_district.id))
        self.assertEqual(self.result_names(data), ["East Shewa", "Jimma"])

    # statuses

    def test_excluded_statuses(self):
        data = self.get_json(status="LATE,MISSING")
        self.assertEqual(data["status"], ["LATE", "MISSING"])
        self.assertEqual(data["totals"], {**self.expected_ethiopia_totals(), "on_time": None, "on_time_percent": None})
        self.assertEqual(data["results"][2], {**self.expected_oromia_row(), "on_time": None, "on_time_percent": None})

    # order

    def test_order_descending(self):
        data = self.get_json(order="-expected")
        self.assertEqual(self.result_names(data), ["Oromia", "Amhara", "Afar", "Somali"])

    def test_order_multiple_fields(self):
        data = self.get_json(order="-late,name")
        self.assertEqual(self.result_names(data), ["Amhara", "Oromia", "Afar", "Somali"])

    def test_order_by_org_unit_type_name(self):
        data = self.get_json(
            org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}", order="org_unit_type__name,name"
        )
        self.assertEqual(
            self.result_names(data),
            ["Awsi", "East Shewa", "Jimma", "North Gondar", "Afar", "Amhara", "Oromia", "Somali"],
        )

    def test_order_by_all_orderable_fields(self):
        for field in [
            "name",
            "org_unit_type__name",
            "expected",
            "received",
            "completeness_percent",
            "on_time",
            "on_time_percent",
            "late",
            "late_percent",
            "missing",
            "missing_percent",
        ]:
            for order in [field, f"-{field}"]:
                with self.subTest(order=order):
                    self.get_json(order=order)

    def test_unsupported_order_field_is_ignored(self):
        # DRF OrderingFilter ignores unknown fields and falls back to the default ordering
        data = self.get_json(order="foo")
        self.assertEqual(self.result_names(data), ["Afar", "Amhara", "Oromia", "Somali"])

    def test_order_by_percentage(self):
        data = self.get_json(order="-completeness_percent", parent_org_unit_id=self.oromia.id)
        self.assertEqual(self.result_names(data), ["East Shewa", "Jimma"])

    # pagination

    def test_default_pagination(self):
        data = self.get_json()
        self.assertEqual(data["count"], 4)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["pages"], 1)
        self.assertEqual(data["limit"], 20)
        self.assertFalse(data["has_next"])
        self.assertFalse(data["has_previous"])

    def test_pagination(self):
        first_page = self.get_json(limit=2)
        self.assertEqual(self.result_names(first_page), ["Afar", "Amhara"])
        self.assertEqual(first_page["count"], 4)
        self.assertEqual(first_page["pages"], 2)
        self.assertTrue(first_page["has_next"])
        self.assertFalse(first_page["has_previous"])

        second_page = self.get_json(limit=2, page=2)
        self.assertEqual(self.result_names(second_page), ["Oromia", "Somali"])
        self.assertFalse(second_page["has_next"])
        self.assertTrue(second_page["has_previous"])

        # totals are computed for all the rows, not only the current page
        self.assertEqual(first_page["totals"], self.expected_ethiopia_totals())
        self.assertEqual(second_page["totals"], self.expected_ethiopia_totals())

    # access

    def test_user_restricted_to_org_units(self):
        data = self.get_json(user=self.user_restricted, parent_org_unit_id=self.oromia.id)
        self.assertEqual(self.result_names(data), ["East Shewa", "Jimma"])

    def test_user_restricted_to_org_units_cannot_see_parent(self):
        data = self.get_json(status.HTTP_400_BAD_REQUEST, user=self.user_restricted)
        self.assertIn("parent_org_unit_id", data)

    # validation errors

    def test_bad_requests(self):
        cases = [
            ({"form_id": None}, "form_id"),
            ({"period": None}, "period"),
            ({"parent_org_unit_id": None}, "parent_org_unit_id"),
            ({"form_id": self.form_other_account.id}, "form_id"),
            ({"form_id": self.form_without_period_type.id}, "form_id"),
            ({"form_id": self.form_without_grace_period.id}, "form_id"),
            ({"period": "not a period"}, "period"),
            ({"period": "2026Q1"}, "period"),
            ({"parent_org_unit_id": self.other_account_ou.id}, "parent_org_unit_id"),
            ({"org_unit_type_ids": str(self.type_other_account.id)}, "org_unit_type_ids"),
            ({"status": "RECEIVED"}, "status"),
        ]
        for params, field in cases:
            with self.subTest(params=params):
                data = self.get_json(status.HTTP_400_BAD_REQUEST, **params)
                self.assertIn(field, data)
