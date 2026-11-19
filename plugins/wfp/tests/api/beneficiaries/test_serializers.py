from datetime import date
from unittest import mock

from django.test import SimpleTestCase

from plugins.wfp.api.beneficiaries.serializers import EligibleExportParamsSerializer, VisitPeriodSerializer


TODAY = date(2026, 11, 13)


def _error_codes(serializer):
    """The codes of the errors of `serializer`, by field: they identify each error, whatever its language."""
    return {key: [error.code for error in errors] for key, errors in serializer.errors.items()}


class VisitPeriodSerializerTestCase(SimpleTestCase):
    def test_both_dates_are_optional(self):
        serializer = VisitPeriodSerializer(data={})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data, {})

    def test_dates_are_given_as_start_and_end_dates(self):
        data = {"visit_date_after": "2026-09-01", "visit_date_before": "2026-09-30", "search": "ignored"}
        serializer = VisitPeriodSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        expected = {"start_date": date(2026, 9, 1), "end_date": date(2026, 9, 30)}
        self.assertEqual(serializer.validated_data, expected)

    def test_a_single_day(self):
        serializer = VisitPeriodSerializer(data={"visit_date_after": "2026-09-01", "visit_date_before": "2026-09-01"})
        self.assertTrue(serializer.is_valid())

    def test_dates_in_the_future_are_valid(self):
        # the list shows the planned visits too
        serializer = VisitPeriodSerializer(data={"visit_date_before": "2999-12-31"})
        self.assertTrue(serializer.is_valid())

    def test_errors_are_on_the_field_to_correct(self):
        cases = {
            "wrong format": ({"visit_date_after": "01-09-2026"}, {"visit_date_after": ["invalid"]}),
            "day out of range": ({"visit_date_before": "2026-02-30"}, {"visit_date_before": ["invalid"]}),
            "end before start": (
                {"visit_date_after": "2026-10-01", "visit_date_before": "2026-09-01"},
                {"visit_date_before": ["end_before_start"]},
            ),
        }
        for case, (data, expected) in cases.items():
            with self.subTest(case):
                serializer = VisitPeriodSerializer(data=data)
                self.assertFalse(serializer.is_valid())
                self.assertEqual(_error_codes(serializer), expected)


@mock.patch("plugins.wfp.api.beneficiaries.serializers.timezone.localdate", lambda: TODAY)
class EligibleExportParamsSerializerTestCase(SimpleTestCase):
    def test_visit_date_filters_give_the_period_of_the_export(self):
        data = {"visit_date_after": "2026-09-01", "visit_date_before": "2026-09-30", "search": "ignored"}
        serializer = EligibleExportParamsSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        expected = {"start_date": date(2026, 9, 1), "end_date": date(2026, 9, 30)}
        self.assertEqual(serializer.validated_data, expected)

    def test_today_is_valid(self):
        serializer = EligibleExportParamsSerializer(data={"visit_date_before": TODAY.isoformat()})
        self.assertTrue(serializer.is_valid())

    def test_period_error_codes(self):
        cases = [
            ({"visit_date_after": "2026-11-14"}, {"visit_date_after": ["future_date"]}),
            ({"visit_date_before": "2026-11-14"}, {"visit_date_before": ["future_date"]}),
            (
                {"visit_date_after": "2026-11-14", "visit_date_before": "2026-11-15"},
                {"visit_date_after": ["future_date"], "visit_date_before": ["future_date"]},
            ),
            (
                {"visit_date_after": "2026-10-01", "visit_date_before": "2026-09-01"},
                {"visit_date_before": ["end_before_start"]},
            ),
            ({"visit_date_after": "01-09-2026"}, {"visit_date_after": ["invalid"]}),
        ]
        for data, expected in cases:
            with self.subTest(data):
                serializer = EligibleExportParamsSerializer(data=data)
                self.assertFalse(serializer.is_valid())
                self.assertEqual(_error_codes(serializer), expected)
