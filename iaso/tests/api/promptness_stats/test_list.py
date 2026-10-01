import time_machine

from rest_framework import status

from iaso import models as m
from iaso.tests.api.promptness_stats.common import (
    PERIOD_KEYS,
    RESPONSE_KEYS,
    ROW_KEYS,
    PromptnessStatsTestCase,
    aware,
)


@time_machine.travel(PromptnessStatsTestCase.TODAY, tick=False)
class PromptnessStatsListTestCase(PromptnessStatsTestCase):
    def result_names(self, data):
        return [row["name"] for row in data["results"]]

    # Response shape
    def test_response_shape(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(set(data.keys()), RESPONSE_KEYS)
        self.assertEqual(set(data["period"].keys()), PERIOD_KEYS)
        for row in data["results"]:
            self.assertEqual(set(row.keys()), ROW_KEYS)

    def test_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            data["period"],
            {
                "value": self.PERIOD,
                "start": "2026-01-01",
                "end": "2026-01-31",
                "grace_period_days": 10,
                "deadline": "2026-02-10",
                "is_current": False,
                "is_provisional": False,
            },
        )
        self.assertEqual(
            data["results"],
            [
                self.expected_afar_row(),
                self.expected_amhara_row(),
                self.expected_oromia_row(),
                self.expected_somali_row(),
            ],
        )
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    def test_period_block_during_the_period(self):
        self.client.force_authenticate(self.user)
        with time_machine.travel(aware(2026, 1, 20, 12, 0), tick=False):
            response = self.client.get(self.URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        period_data = data["period"]
        self.assertTrue(period_data["is_current"])
        self.assertTrue(period_data["is_provisional"])

    def test_period_block_during_the_grace_period(self):
        self.client.force_authenticate(self.user)
        with time_machine.travel(aware(2026, 2, 10, 12, 0), tick=False):
            response = self.client.get(self.URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        period_data = data["period"]
        self.assertFalse(period_data["is_current"])
        self.assertTrue(period_data["is_provisional"])

    # Figures
    def test_invariants(self):
        self.client.force_authenticate(self.user)
        # params = self.get_serializer_params(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        params = self.get_serializer_params()
        response = self.client.get(self.URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        for counts in [data["totals"], *data["results"]]:
            if not counts["is_applicable"]:
                continue  # not applicable org units (e.g. Somali) have no counts
            self.assertEqual(counts["on_time"] + counts["late"] + counts["missing"], counts["expected"])
            self.assertEqual(counts["on_time"] + counts["late"], counts["received"])

    def test_drill_down(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # totals are computed for the requested parent org unit: Oromia (4 expected, 2 on time, 1 late, 1 missing)
        self.assertEqual(data["totals"], self.counts(4, 2, 1, 1, 3, 75.0, 50.0, 25.0, 25.0))
        # rows are the direct children of the requested parent org unit
        self.assertEqual(
            data["results"],
            [self.expected_borena_row(), self.expected_east_shewa_row(), self.expected_jimma_row()],
        )
        for row in data["results"]:
            self.assertEqual(row["parent_org_unit"], {"id": self.oromia.id, "name": self.oromia.name})

    def test_drill_down_into_a_not_applicable_section_of_the_pyramid(self):
        # Borena (Zone, same level as districts) and its health post HP J are not expected to submit the form
        self.client.force_authenticate(self.user)

        # Level 1: Oromia is applicable, the Borena section doesn't change its figures
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.ethiopia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        oromia = next(row for row in data["results"] if row["id"] == self.oromia.id)
        self.assertEqual(oromia, self.expected_oromia_row())

        # Level 2: Borena is not applicable, next to the applicable districts
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(4, 2, 1, 1, 3, 75.0, 50.0, 25.0, 25.0))
        self.assertEqual(
            data["results"],
            [self.expected_borena_row(), self.expected_east_shewa_row(), self.expected_jimma_row()],
        )

        # Level 3: inside Borena, the totals and HP J are not applicable (its on time submission is ignored)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.borena.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.not_applicable_counts())
        self.assertEqual(data["results"], [self.not_applicable_row(self.hp_j, False)])

    def test_drill_down_to_target_org_units(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.jimma.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            data["results"],
            [
                self.row(self.hf_a, False, 1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0),
                self.row(self.hf_b, False, 1, 0, 1, 0, 1, 100.0, 0.0, 100.0, 0.0),
                self.row(self.hf_c, False, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0),
            ],
        )

    def test_org_unit_without_target_is_not_applicable(self):
        """Somali has no org unit expected to submit the form: its totals are not applicable"""
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.somali.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.not_applicable_counts())
        self.assertEqual(data["results"], [])
        self.assertEqual(data["count"], 0)

    def test_earliest_submission_is_used(self):
        # HF A has an on time submission and a late one: it is on time
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.jimma.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        hf_a = next(row for row in data["results"] if row["id"] == self.hf_a.id)
        self.assertEqual(hf_a["on_time"], 1)
        self.assertEqual(hf_a["late"], 0)

    def test_deadline_day_is_inclusive(self):
        # HF D submitted on 2026-02-10 at 23:30
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.east_shewa.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["results"][0]["on_time"], 1)

    def test_zero_grace_period(self):
        self.client.force_authenticate(self.user)

        # With the 10 days grace period: HF D (submitted on 2026-02-10) is on time
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["period"]["deadline"], "2026-02-10")
        self.assertEqual(data["totals"]["on_time"], 2)
        self.assertEqual(data["totals"]["late"], 1)

        self.form.promptness_grace_period_days = 0
        self.form.save()

        # Without grace period: the deadline is the end of the period, HF D becomes late
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["period"]["deadline"], "2026-01-31")
        self.assertEqual(data["totals"]["on_time"], 1)
        self.assertEqual(data["totals"]["late"], 2)

    def test_ignored_submissions(self):
        # HF C only has deleted, file-less, other form and other period submissions
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.jimma.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        hf_c = next(row for row in data["results"] if row["id"] == self.hf_c.id)
        self.assertEqual(hf_c["missing"], 1)

    def test_rejected_org_units_are_ignored(self):
        # HF G is rejected
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.north_gondar.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["HF E", "HF F"])
        self.assertEqual(data["totals"]["expected"], 2)
        self.assertEqual(data["totals"]["on_time"], 0)

    def test_new_org_units_are_ignored(self):
        self.create_ou("HF New", self.type_facility, self.north_gondar, validation_status=m.OrgUnit.VALIDATION_NEW)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.north_gondar.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["HF E", "HF F"])
        self.assertEqual(data["totals"]["expected"], 2)

    def test_target_by_org_unit_group(self):
        # HP H is a health post (not a target type) but belongs to a target group: it is expected to submit the form
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.awsi.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        hp_h = next(row for row in data["results"] if row["id"] == self.hp_h.id)
        self.assertEqual(hp_h, self.row(self.hp_h, False, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0))

    def test_org_unit_not_expected_to_submit_is_not_applicable(self):
        # HP I is a health post (not a target type) and doesn't belong to any target group:
        # it is not applicable, and its (on time) submission is ignored
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.awsi.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            data["results"],
            [
                self.row(self.hp_h, False, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0),
                self.not_applicable_row(self.hp_i, False),
            ],
        )
        # Awsi totals only count HP H
        self.assertEqual(data["totals"], self.counts(1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0))

    def test_target_by_type_and_group_is_counted_once(self):
        # HF E is a facility and belongs to a target group
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.north_gondar.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        hf_e = next(row for row in data["results"] if row["id"] == self.hf_e.id)
        self.assertEqual(hf_e["expected"], 1)

    def test_parent_org_unit_itself_is_counted(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.hf_a.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0))
        self.assertEqual(data["results"], [])

    # org_unit_type_ids
    def test_org_unit_types_flat_output(self):
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        response = self.client.get(self.URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["count"], 8)
        self.assertEqual(
            self.result_names(data),
            ["Afar", "Amhara", "Awsi", "East Shewa", "Jimma", "North Gondar", "Oromia", "Somali"],
        )
        self.assertIn(self.expected_jimma_row(), data["results"])
        self.assertIn(self.expected_oromia_row(), data["results"])
        # totals are not the sum of the rows - since regions are requested, totals are the ones from the country
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    def test_org_unit_types_deep_level(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(org_unit_type_ids=str(self.type_facility.id)))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["HF A", "HF B", "HF C", "HF D", "HF E", "HF F"])

    def test_org_unit_types_below_parent_only(self):
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(
            parent_org_unit_id=self.oromia.id, org_unit_type_ids=str(self.type_district.id)
        )
        response = self.client.get(self.URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["East Shewa", "Jimma"])

    # statuses
    def test_excluded_statuses(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(status="LATE,MISSING"))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # ON_TIME is hidden from the totals, the other values are unchanged (expected, received and
        # completeness_percent still include the on time submissions)
        self.assertEqual(data["totals"], {**self.expected_ethiopia_totals(), "on_time": None, "on_time_percent": None})
        self.assertEqual(data["results"][2], {**self.expected_oromia_row(), "on_time": None, "on_time_percent": None})
        # ON_TIME is hidden from every row, LATE and MISSING are still returned for applicable rows
        for row in data["results"]:
            self.assertIsNone(row["on_time"])
            self.assertIsNone(row["on_time_percent"])
            if row["is_applicable"]:
                self.assertIsNotNone(row["late"])
                self.assertIsNotNone(row["missing"])
        # Somali is not applicable whatever the statuses
        self.assertEqual(data["results"][3], self.expected_somali_row())

    # order
    def test_order_descending(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(order="-expected"))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # Somali is not applicable: its `expected` is returned as None, but it is ordered as 0
        self.assertEqual(
            [(row["name"], row["expected"]) for row in data["results"]],
            [("Oromia", 4), ("Amhara", 2), ("Afar", 1), ("Somali", None)],
        )

    def test_order_multiple_fields(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(order="-late,name"))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # Same number of late submissions: ordered by name. Somali is not applicable, but it is ordered as 0
        self.assertEqual(
            [(row["late"], row["name"]) for row in data["results"]],
            [(1, "Amhara"), (1, "Oromia"), (0, "Afar"), (None, "Somali")],
        )

    def test_order_by_org_unit_type_name(self):
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(
            org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}", order="org_unit_type__name,name"
        )
        response = self.client.get(self.URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # The response only contains the org unit type id: "District" comes before "Region"
        district_id = self.type_district.id
        region_id = self.type_region.id
        self.assertEqual(
            [(row["org_unit_type_id"], row["name"]) for row in data["results"]],
            [
                (district_id, "Awsi"),
                (district_id, "East Shewa"),
                (district_id, "Jimma"),
                (district_id, "North Gondar"),
                (region_id, "Afar"),
                (region_id, "Amhara"),
                (region_id, "Oromia"),
                (region_id, "Somali"),
            ],
        )

    def test_unsupported_order_field_is_ignored(self):
        # DRF OrderingFilter ignores unknown fields and falls back to the default ordering
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params(order="foo"))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["Afar", "Amhara", "Oromia", "Somali"])

    def test_order_by_percentage(self):
        self.client.force_authenticate(self.user)
        # Only districts: Borena (Zone) is not applicable, it has no percentage to be ordered by
        params = self.get_serializer_params(
            order="-completeness_percent",
            parent_org_unit_id=self.oromia.id,
            org_unit_type_ids=str(self.type_district.id),
        )
        response = self.client.get(self.URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            [(row["name"], row["completeness_percent"]) for row in data["results"]],
            [("East Shewa", 100.0), ("Jimma", 66.7)],
        )

    # pagination
    def test_default_pagination(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["pages"], 1)
        self.assertEqual(data["limit"], 20)
        self.assertFalse(data["has_next"])
        self.assertFalse(data["has_previous"])

    def test_pagination(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.URL, self.get_serializer_params(limit=2))
        first_page = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(first_page), ["Afar", "Amhara"])
        self.assertEqual(first_page["count"], 4)
        self.assertEqual(first_page["pages"], 2)
        self.assertTrue(first_page["has_next"])
        self.assertFalse(first_page["has_previous"])

        response = self.client.get(self.URL, self.get_serializer_params(limit=2, page=2))
        second_page = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(second_page), ["Oromia", "Somali"])
        self.assertFalse(second_page["has_next"])
        self.assertTrue(second_page["has_previous"])

        # totals are computed for all the rows, not only the current page
        self.assertEqual(first_page["totals"], self.expected_ethiopia_totals())
        self.assertEqual(second_page["totals"], self.expected_ethiopia_totals())

    # access

    def test_user_restricted_to_org_units(self):
        # user_restricted only has access to Oromia and its descendants
        self.client.force_authenticate(self.user_restricted)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.result_names(data), ["Borena", "East Shewa", "Jimma"])

    def test_user_restricted_to_org_units_cannot_see_parent(self):
        # user_restricted only has access to Oromia and its descendants
        self.client.force_authenticate(self.user_restricted)
        response = self.client.get(self.URL, self.get_serializer_params(parent_org_unit_id=self.ethiopia.id))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
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
        self.client.force_authenticate(self.user)
        for params, field in cases:
            with self.subTest(params=params):
                response = self.client.get(self.URL, self.get_serializer_params(**params))
                data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, data)
