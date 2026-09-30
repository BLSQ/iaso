import datetime

from rest_framework.test import APIRequestFactory

from iaso.api.promptness_stats.constants import PROMPTNESS_STATUSES
from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.api.promptness_stats.serializers import (
    PromptnessPeriodSerializer,
    PromptnessStatsQueryParamsSerializer,
    PromptnessStatsRowSerializer,
    PromptnessStatsTotalsSerializer,
)
from iaso.tests.api.promptness_stats.common import PERIOD, PERIOD_KEYS, ROW_KEYS, TOTALS_KEYS, PromptnessStatsTestCase


class PromptnessPeriodTestCase(PromptnessStatsTestCase):
    def test_month_period(self):
        period = PromptnessPeriod.build("202601", 10, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.value, "202601")
        self.assertEqual(period.start, datetime.date(2026, 1, 1))
        self.assertEqual(period.end, datetime.date(2026, 1, 31))
        self.assertEqual(period.grace_period_days, 10)
        self.assertEqual(period.deadline, datetime.date(2026, 2, 10))
        self.assertFalse(period.is_current)
        self.assertFalse(period.is_provisional)

    def test_zero_grace_period(self):
        period = PromptnessPeriod.build("202602", 0, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.end, datetime.date(2026, 2, 28))
        self.assertEqual(period.deadline, period.end)

    def test_deadline_in_next_year(self):
        period = PromptnessPeriod.build("202612", 10, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.end, datetime.date(2026, 12, 31))
        self.assertEqual(period.deadline, datetime.date(2027, 1, 10))

    def test_quarter_period(self):
        period = PromptnessPeriod.build("2026Q1", 15, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.start, datetime.date(2026, 1, 1))
        self.assertEqual(period.end, datetime.date(2026, 3, 31))
        self.assertEqual(period.deadline, datetime.date(2026, 4, 15))

    def test_year_period(self):
        period = PromptnessPeriod.build("2026", 0, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.start, datetime.date(2026, 1, 1))
        self.assertEqual(period.end, datetime.date(2026, 12, 31))

    def test_is_current_and_is_provisional(self):
        cases = [
            # today, is_current, is_provisional
            (datetime.date(2025, 12, 31), False, True),  # before the period
            (datetime.date(2026, 1, 1), True, True),  # first day
            (datetime.date(2026, 1, 31), True, True),  # last day
            (datetime.date(2026, 2, 1), False, True),  # grace period
            (datetime.date(2026, 2, 10), False, True),  # deadline day is inclusive
            (datetime.date(2026, 2, 11), False, False),  # after the deadline
        ]
        for today, is_current, is_provisional in cases:
            with self.subTest(today=today):
                period = PromptnessPeriod.build("202601", 10, today=today)
                self.assertEqual(period.is_current, is_current)
                self.assertEqual(period.is_provisional, is_provisional)

    def test_invalid_period(self):
        with self.assertRaises(ValueError):
            PromptnessPeriod.build("not a period", 10)


class PromptnessStatsQueryParamsSerializerTestCase(PromptnessStatsTestCase):
    def get_serializer(self, params, user=None):
        request = APIRequestFactory().get("/")
        request.user = user or self.user
        return PromptnessStatsQueryParamsSerializer(data=params, context={"request": request})

    def assert_valid(self, params, user=None):
        serializer = self.get_serializer(params, user=user)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.validated_data

    def assert_invalid(self, params, field, user=None):
        serializer = self.get_serializer(params, user=user)
        self.assertFalse(serializer.is_valid())
        self.assertIn(field, serializer.errors)
        return serializer.errors

    def test_minimal_params_and_defaults(self):
        data = self.assert_valid(self.get_params())
        self.assertEqual(data["form"], self.form)
        self.assertEqual(data["period"], PERIOD)
        self.assertEqual(data["parent_org_unit"], self.ethiopia)
        self.assertFalse(data.get("org_unit_types"))
        self.assertEqual(data["status"], set(PROMPTNESS_STATUSES))

    def test_all_params(self):
        params = self.get_params(
            org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}",
            status="LATE,MISSING",
        )
        data = self.assert_valid(params)
        self.assertCountEqual(data["org_unit_types"], [self.type_region, self.type_district])
        self.assertEqual(data["status"], {"LATE", "MISSING"})

    def test_order_is_not_handled_by_the_serializer(self):
        data = self.assert_valid(self.get_params(order="-missing"))
        self.assertNotIn("order", data)

    def test_required_params(self):
        for field in ["form_id", "period", "parent_org_unit_id"]:
            with self.subTest(field=field):
                self.assert_invalid(self.get_params(**{field: None}), field)

    def test_form_not_found(self):
        self.assert_invalid(self.get_params(form_id=999999), "form_id")

    def test_form_of_another_account(self):
        self.assert_invalid(self.get_params(form_id=self.form_other_account.id), "form_id")

    def test_form_without_period_type(self):
        self.assert_invalid(self.get_params(form_id=self.form_without_period_type.id), "form_id")

    def test_form_without_grace_period(self):
        self.assert_invalid(self.get_params(form_id=self.form_without_grace_period.id), "form_id")

    def test_form_with_zero_grace_period_is_valid(self):
        self.form_without_grace_period.promptness_grace_period_days = 0
        self.form_without_grace_period.save()
        self.assert_valid(self.get_params(form_id=self.form_without_grace_period.id))

    def test_invalid_period(self):
        self.assert_invalid(self.get_params(period="not a period"), "period")

    def test_invalid_month(self):
        self.assert_invalid(self.get_params(period="202613"), "period")

    def test_period_type_mismatch(self):
        self.assert_invalid(self.get_params(period="2026Q1"), "period")
        self.assert_invalid(self.get_params(form_id=self.form_quarterly.id, period=PERIOD), "period")

    def test_quarter_period_for_quarterly_form(self):
        self.assert_valid(self.get_params(form_id=self.form_quarterly.id, period="2026Q1"))

    def test_parent_org_unit_not_found(self):
        self.assert_invalid(self.get_params(parent_org_unit_id=999999), "parent_org_unit_id")

    def test_parent_org_unit_of_another_account(self):
        self.assert_invalid(self.get_params(parent_org_unit_id=self.other_account_ou.id), "parent_org_unit_id")

    def test_parent_org_unit_outside_of_user_org_units(self):
        self.assert_invalid(self.get_params(), "parent_org_unit_id", user=self.user_restricted)

    def test_parent_org_unit_within_user_org_units(self):
        self.assert_valid(self.get_params(parent_org_unit_id=self.jimma.id), user=self.user_restricted)

    def test_org_unit_types_not_found(self):
        self.assert_invalid(self.get_params(org_unit_type_ids=f"{self.type_region.id},999999"), "org_unit_type_ids")

    def test_org_unit_types_of_another_account(self):
        self.assert_invalid(self.get_params(org_unit_type_ids=str(self.type_other_account.id)), "org_unit_type_ids")

    def test_org_unit_types_not_integers(self):
        self.assert_invalid(self.get_params(org_unit_type_ids="abc"), "org_unit_type_ids")

    def test_invalid_status(self):
        self.assert_invalid(self.get_params(status="ON_TIME,RECEIVED"), "status")

    def test_empty_statuses(self):
        self.assert_invalid(self.get_params(status=""), "status")

    def test_duplicated_statuses(self):
        data = self.assert_valid(self.get_params(status="MISSING,ON_TIME,MISSING"))
        self.assertEqual(data["status"], {"ON_TIME", "MISSING"})

    def test_several_errors_are_reported_together(self):
        # Only field-level errors are reported together: the period type mismatch is only checked once
        # all the fields are valid
        errors = self.assert_invalid(self.get_params(period="not a period", status="RECEIVED"), "period")
        self.assertIn("status", errors)


class PromptnessPeriodSerializerTestCase(PromptnessStatsTestCase):
    def test_serialize(self):
        period = PromptnessPeriod(
            value="202601",
            start=datetime.date(2026, 1, 1),
            end=datetime.date(2026, 1, 31),
            grace_period_days=10,
            deadline=datetime.date(2026, 2, 10),
            is_current=False,
            is_provisional=True,
        )
        data = PromptnessPeriodSerializer(period).data
        self.assertEqual(set(data.keys()), PERIOD_KEYS)
        self.assertEqual(
            dict(data),
            {
                "value": "202601",
                "start": "2026-01-01",
                "end": "2026-01-31",
                "grace_period_days": 10,
                "deadline": "2026-02-10",
                "is_current": False,
                "is_provisional": True,
            },
        )


class PromptnessStatsTotalsSerializerTestCase(PromptnessStatsTestCase):
    def serialize(self, counts, status=PROMPTNESS_STATUSES):
        return dict(PromptnessStatsTotalsSerializer(counts, context={"status": status}).data)

    def test_all_statuses(self):
        data = self.serialize({"expected": 7, "on_time": 2, "late": 2, "missing": 3})
        self.assertEqual(set(data.keys()), TOTALS_KEYS)
        self.assertEqual(data, self.expected_ethiopia_totals())

    def test_rounding(self):
        data = self.serialize({"expected": 3, "on_time": 1, "late": 1, "missing": 1})
        self.assertEqual(data["completeness_percent"], 66.7)
        self.assertEqual(data["on_time_percent"], 33.3)

    def test_percentages_are_floats(self):
        data = self.serialize({"expected": 4, "on_time": 4, "late": 0, "missing": 0})
        for key in ["completeness_percent", "on_time_percent", "late_percent", "missing_percent"]:
            self.assertIsInstance(data[key], float, key)

    def test_nothing_expected(self):
        data = self.serialize({"expected": 0, "on_time": 0, "late": 0, "missing": 0})
        self.assertEqual(data, self.counts(0, 0, 0, 0, 0, None, None, None, None))

    def test_excluded_statuses(self):
        data = self.serialize({"expected": 7, "on_time": 2, "late": 2, "missing": 3}, status=["LATE", "MISSING"])
        self.assertEqual(data, {**self.expected_ethiopia_totals(), "on_time": None, "on_time_percent": None})

    def test_only_one_status(self):
        data = self.serialize({"expected": 7, "on_time": 2, "late": 2, "missing": 3}, status=["MISSING"])
        self.assertEqual(
            data,
            {
                **self.expected_ethiopia_totals(),
                "on_time": None,
                "on_time_percent": None,
                "late": None,
                "late_percent": None,
            },
        )


class PromptnessStatsRowSerializerTestCase(PromptnessStatsTestCase):
    def annotate(self, org_unit, expected, on_time, late, missing, has_children):
        org_unit.expected = expected
        org_unit.on_time = on_time
        org_unit.late = late
        org_unit.missing = missing
        org_unit.has_children = has_children
        return org_unit

    def serialize(self, org_unit, status=PROMPTNESS_STATUSES):
        return dict(PromptnessStatsRowSerializer(org_unit, context={"status": status}).data)

    def test_serialize(self):
        data = self.serialize(self.annotate(self.oromia, 4, 2, 1, 1, True))
        self.assertEqual(set(data.keys()), ROW_KEYS)
        self.assertEqual(data, self.expected_oromia_row())

    def test_without_children_and_nothing_expected(self):
        data = self.serialize(self.annotate(self.somali, 0, 0, 0, 0, False))
        self.assertEqual(data, self.expected_somali_row())

    def test_root_org_unit_has_no_parent(self):
        data = self.serialize(self.annotate(self.ethiopia, 7, 2, 2, 3, True))
        self.assertIsNone(data["parent_org_unit"])

    def test_excluded_statuses(self):
        data = self.serialize(self.annotate(self.oromia, 4, 2, 1, 1, True), status=["ON_TIME", "MISSING"])
        self.assertEqual(data, {**self.expected_oromia_row(), "late": None, "late_percent": None})
