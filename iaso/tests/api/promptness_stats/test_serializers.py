import datetime

from decimal import Decimal
from types import SimpleNamespace

from rest_framework.test import APIRequestFactory

from iaso.api.promptness_stats.constants import PROMPTNESS_STATUSES
from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.api.promptness_stats.serializers import (
    PromptnessPeriodSerializer,
    PromptnessStatsQueryParamsSerializer,
    PromptnessStatsRowSerializer,
    PromptnessStatsTotalsSerializer,
)
from iaso.test import TestCase
from iaso.tests.api.promptness_stats.common import PERIOD_KEYS, ROW_KEYS, TOTALS_KEYS, PromptnessStatsTestCase


class PromptnessStatsQueryParamsSerializerTestCase(PromptnessStatsTestCase):
    def get_serializer(self, params, user=None):
        request = APIRequestFactory().get("/")
        request.user = user or self.user
        return PromptnessStatsQueryParamsSerializer(data=params, context={"request": request})

    def test_all_params(self):
        params = self.get_serializer_params(
            org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}",
            status="LATE,MISSING",
        )
        serializer = self.get_serializer(params)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # mandatory params
        self.assertEqual(serializer.validated_data["form"], self.form)
        self.assertEqual(serializer.validated_data["period"], self.PERIOD)
        self.assertEqual(serializer.validated_data["parent_org_unit"], self.ethiopia)

        # optional params
        self.assertCountEqual(serializer.validated_data["org_unit_types"], [self.type_region, self.type_district])
        self.assertEqual(serializer.validated_data["status"], {"LATE", "MISSING"})

    def test_required_params(self):
        for field in ["form_id", "period", "parent_org_unit_id"]:
            with self.subTest(field=field):
                serializer = self.get_serializer(self.get_serializer_params(**{field: None}))
                self.assertFalse(serializer.is_valid())
                self.assertEqual(serializer.errors, {field: ["This field is required."]})

    def test_form_not_found(self):
        serializer = self.get_serializer(self.get_serializer_params(form_id=999999))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"form_id": ['Invalid pk "999999" - object does not exist.']})

    def test_form_of_another_account(self):
        form_id = self.form_other_account.id
        serializer = self.get_serializer(self.get_serializer_params(form_id=form_id))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"form_id": [f'Invalid pk "{form_id}" - object does not exist.']})

    def test_form_without_period_type(self):
        serializer = self.get_serializer(self.get_serializer_params(form_id=self.form_without_period_type.id))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"form_id": ["The form has no period type"]})

    def test_form_without_grace_period(self):
        serializer = self.get_serializer(self.get_serializer_params(form_id=self.form_without_grace_period.id))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"form_id": ["The form has no grace period"]})

    def test_form_with_zero_grace_period_is_valid(self):
        self.form_without_grace_period.promptness_grace_period_days = 0
        self.form_without_grace_period.save()
        serializer = self.get_serializer(self.get_serializer_params(form_id=self.form_without_grace_period.id))
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_period_format(self):
        serializer = self.get_serializer(self.get_serializer_params(period="not a period"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"period": ["Invalid period"]})

    def test_invalid_period_value(self):
        serializer = self.get_serializer(self.get_serializer_params(period="202613"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"period": ["Invalid period"]})

    def test_quarter_period_for_monthly_form(self):
        serializer = self.get_serializer(self.get_serializer_params(period="2026Q1"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors, {"period": ["Period type QUARTER does not match the form period type MONTH"]}
        )

    def test_month_period_for_quarterly_form(self):
        serializer = self.get_serializer(self.get_serializer_params(form_id=self.form_quarterly.id, period=self.PERIOD))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors, {"period": ["Period type MONTH does not match the form period type QUARTER"]}
        )

    def test_quarter_period_for_quarterly_form(self):
        serializer = self.get_serializer(self.get_serializer_params(form_id=self.form_quarterly.id, period="2026Q1"))
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_parent_org_unit_not_found(self):
        serializer = self.get_serializer(self.get_serializer_params(parent_org_unit_id=999999))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"parent_org_unit_id": ['Invalid pk "999999" - object does not exist.']})

    def test_parent_org_unit_of_another_account(self):
        org_unit_id = self.other_account_ou.id
        serializer = self.get_serializer(self.get_serializer_params(parent_org_unit_id=org_unit_id))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors, {"parent_org_unit_id": [f'Invalid pk "{org_unit_id}" - object does not exist.']}
        )

    def test_parent_org_unit_outside_of_user_org_units(self):
        # user_restricted only has access to Oromia and its descendants
        serializer = self.get_serializer(
            self.get_serializer_params(parent_org_unit_id=self.ethiopia.id), user=self.user_restricted
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors, {"parent_org_unit_id": [f'Invalid pk "{self.ethiopia.id}" - object does not exist.']}
        )

    def test_parent_org_unit_within_user_org_units(self):
        serializer = self.get_serializer(
            self.get_serializer_params(parent_org_unit_id=self.jimma.id), user=self.user_restricted
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["parent_org_unit"], self.jimma)

    def test_org_unit_types_not_found(self):
        serializer = self.get_serializer(self.get_serializer_params(org_unit_type_ids=f"{self.type_region.id},999999"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"org_unit_type_ids": ['Invalid pk "999999" - object does not exist.']})

    def test_org_unit_types_of_another_account(self):
        org_unit_type_id = self.type_other_account.id
        serializer = self.get_serializer(self.get_serializer_params(org_unit_type_ids=str(org_unit_type_id)))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors, {"org_unit_type_ids": [f'Invalid pk "{org_unit_type_id}" - object does not exist.']}
        )

    def test_org_unit_types_not_integers(self):
        serializer = self.get_serializer(self.get_serializer_params(org_unit_type_ids="abc"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"org_unit_type_ids": ["Incorrect type. Expected pk value, received str."]})

    def test_invalid_status(self):
        serializer = self.get_serializer(self.get_serializer_params(status="ON_TIME,RECEIVED"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"status": ['"RECEIVED" is not a valid choice.']})

    def test_empty_status(self):
        serializer = self.get_serializer(self.get_serializer_params(status=""))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors, {"status": ['"" is not a valid choice.']})

    def test_duplicated_status(self):
        serializer = self.get_serializer(self.get_serializer_params(status="MISSING,ON_TIME,MISSING"))
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["status"], {"ON_TIME", "MISSING"})

    def test_several_errors_are_reported_together(self):
        serializer = self.get_serializer(self.get_serializer_params(period="not a period", status="RECEIVED"))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors,
            {"period": ["Invalid period"], "status": ['"RECEIVED" is not a valid choice.']},
        )


class PromptnessPeriodSerializerTestCase(TestCase):
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
            data,
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


def fake_org_unit_with_counts(
    expected,
    received,
    on_time,
    late,
    missing,
    completeness_percent,
    on_time_percent,
    late_percent,
    missing_percent,
    **attributes,
):
    """Fake org unit, with the annotations of `annotate_counts()` (the percentages are `Decimal`, as returned by the
    database) and the given attributes"""
    return SimpleNamespace(
        expected=expected,
        received=received,
        on_time=on_time,
        late=late,
        missing=missing,
        completeness_percent=completeness_percent,
        on_time_percent=on_time_percent,
        late_percent=late_percent,
        missing_percent=missing_percent,
        **attributes,
    )


def fake_ethiopia_totals():
    return fake_org_unit_with_counts(
        expected=7,
        received=4,
        on_time=2,
        late=2,
        missing=3,
        completeness_percent=Decimal("57.1"),
        on_time_percent=Decimal("28.6"),
        late_percent=Decimal("28.6"),
        missing_percent=Decimal("42.9"),
    )


class PromptnessStatsTotalsSerializerTestCase(PromptnessStatsTestCase):
    def test_all_statuses(self):
        data = PromptnessStatsTotalsSerializer(fake_ethiopia_totals(), context={"status": PROMPTNESS_STATUSES}).data
        self.assertEqual(set(data.keys()), TOTALS_KEYS)
        self.assertEqual(
            data,
            {
                "is_applicable": True,
                "expected": 7,
                "received": 4,
                "completeness_percent": Decimal("57.1"),
                "on_time": 2,
                "on_time_percent": Decimal("28.6"),
                "late": 2,
                "late_percent": Decimal("28.6"),
                "missing": 3,
                "missing_percent": Decimal("42.9"),
            },
        )
        for key in ["completeness_percent", "on_time_percent", "late_percent", "missing_percent"]:
            self.assertIsInstance(data[key], Decimal, key)

    def test_values_are_not_recomputed(self):
        # The counts and the percentages are computed by the database only: inconsistent values are returned as is
        org_unit = fake_org_unit_with_counts(
            expected=7,
            received=99,
            on_time=2,
            late=2,
            missing=3,
            completeness_percent=Decimal("12.3"),
            on_time_percent=Decimal("45.6"),
            late_percent=Decimal("78.9"),
            missing_percent=Decimal("0.1"),
        )
        data = PromptnessStatsTotalsSerializer(org_unit, context={"status": PROMPTNESS_STATUSES}).data
        self.assertEqual(data["received"], 99)
        self.assertEqual(data["completeness_percent"], Decimal("12.3"))
        self.assertEqual(data["on_time_percent"], Decimal("45.6"))
        self.assertEqual(data["late_percent"], Decimal("78.9"))
        self.assertEqual(data["missing_percent"], Decimal("0.1"))

    def test_nothing_expected_is_not_applicable(self):
        org_unit = fake_org_unit_with_counts(
            expected=0,
            received=0,
            on_time=0,
            late=0,
            missing=0,
            completeness_percent=None,
            on_time_percent=None,
            late_percent=None,
            missing_percent=None,
        )
        data = PromptnessStatsTotalsSerializer(org_unit, context={"status": PROMPTNESS_STATUSES}).data
        self.assertEqual(data, self.not_applicable_counts())

    def test_excluded_statuses(self):
        data = PromptnessStatsTotalsSerializer(fake_ethiopia_totals(), context={"status": ["LATE", "MISSING"]}).data
        # ON_TIME is hidden, but still counted in `received` and `completeness_percent`
        self.assertEqual(
            data,
            {
                "is_applicable": True,
                "expected": 7,
                "received": 4,
                "completeness_percent": Decimal("57.1"),
                "on_time": None,
                "on_time_percent": None,
                "late": 2,
                "late_percent": Decimal("28.6"),
                "missing": 3,
                "missing_percent": Decimal("42.9"),
            },
        )


class PromptnessStatsRowSerializerTestCase(PromptnessStatsTestCase):
    def fake_oromia(self):
        return fake_org_unit_with_counts(
            expected=4,
            received=3,
            on_time=2,
            late=1,
            missing=1,
            completeness_percent=Decimal("75.0"),
            on_time_percent=Decimal("50.0"),
            late_percent=Decimal("25.0"),
            missing_percent=Decimal("25.0"),
            id=12,
            name="Oromia",
            org_unit_type_id=3,
            parent=SimpleNamespace(id=1, name="Ethiopia"),
            has_children=True,
        )

    def test_serialize(self):
        data = PromptnessStatsRowSerializer(self.fake_oromia(), context={"status": PROMPTNESS_STATUSES}).data
        self.assertEqual(set(data.keys()), ROW_KEYS)
        self.assertEqual(
            data,
            {
                "id": 12,
                "name": "Oromia",
                "org_unit_type_id": 3,
                "parent_org_unit": {"id": 1, "name": "Ethiopia"},
                "has_children": True,
                "is_applicable": True,
                "expected": 4,
                "received": 3,
                "completeness_percent": Decimal("75.0"),
                "on_time": 2,
                "on_time_percent": Decimal("50.0"),
                "late": 1,
                "late_percent": Decimal("25.0"),
                "missing": 1,
                "missing_percent": Decimal("25.0"),
            },
        )

    def test_without_children_and_nothing_expected(self):
        org_unit = fake_org_unit_with_counts(
            expected=0,
            received=0,
            on_time=0,
            late=0,
            missing=0,
            completeness_percent=None,
            on_time_percent=None,
            late_percent=None,
            missing_percent=None,
            id=15,
            name="Somali",
            org_unit_type_id=3,
            parent=SimpleNamespace(id=1, name="Ethiopia"),
            has_children=False,
        )
        data = PromptnessStatsRowSerializer(org_unit, context={"status": PROMPTNESS_STATUSES}).data
        self.assertEqual(
            data,
            {
                "id": 15,
                "name": "Somali",
                "org_unit_type_id": 3,
                "parent_org_unit": {"id": 1, "name": "Ethiopia"},
                "has_children": False,
                **self.not_applicable_counts(),
            },
        )

    def test_root_org_unit_has_no_parent(self):
        org_unit = fake_org_unit_with_counts(
            expected=7,
            received=4,
            on_time=2,
            late=2,
            missing=3,
            completeness_percent=Decimal("57.1"),
            on_time_percent=Decimal("28.6"),
            late_percent=Decimal("28.6"),
            missing_percent=Decimal("42.9"),
            id=1,
            name="Ethiopia",
            org_unit_type_id=1,
            parent=None,
            has_children=True,
        )
        data = PromptnessStatsRowSerializer(org_unit, context={"status": PROMPTNESS_STATUSES}).data
        self.assertIsNone(data["parent_org_unit"])

    def test_excluded_statuses(self):
        data = PromptnessStatsRowSerializer(self.fake_oromia(), context={"status": ["ON_TIME", "MISSING"]}).data
        self.assertEqual(data["late"], None)
        self.assertEqual(data["late_percent"], None)
        self.assertEqual(data["on_time"], 2)
        self.assertEqual(data["on_time_percent"], Decimal("50.0"))
        self.assertEqual(data["missing"], 1)
        self.assertEqual(data["received"], 3)  # LATE is hidden, but still counted in `received`
