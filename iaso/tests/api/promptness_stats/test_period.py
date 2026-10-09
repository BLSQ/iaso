import datetime

from django.utils import timezone

from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.tests.api.promptness_stats.common import PromptnessStatsTestCase


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

    def test_deadline_end_is_the_start_of_the_day_after_the_deadline(self):
        period = PromptnessPeriod.build("202601", 10, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.deadline, datetime.date(2026, 2, 10))
        self.assertEqual(period.deadline_end, datetime.datetime(2026, 2, 11, 0, 0, tzinfo=datetime.timezone.utc))
        self.assertTrue(timezone.is_aware(period.deadline_end))

    def test_deadline_end_includes_the_whole_deadline_day(self):
        period = PromptnessPeriod.build("202601", 10, today=datetime.date(2026, 9, 28))
        first_instant_of_deadline_day = datetime.datetime(2026, 2, 10, 0, 0, tzinfo=datetime.timezone.utc)
        last_instant_of_deadline_day = datetime.datetime(2026, 2, 10, 23, 59, 59, 999999, tzinfo=datetime.timezone.utc)
        self.assertLess(first_instant_of_deadline_day, period.deadline_end)
        self.assertLess(last_instant_of_deadline_day, period.deadline_end)

    def test_deadline_end_without_grace_period(self):
        # Without grace period, the deadline is the last day of the period
        period = PromptnessPeriod.build("202601", 0, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.deadline, datetime.date(2026, 1, 31))
        self.assertEqual(period.deadline_end, datetime.datetime(2026, 2, 1, 0, 0, tzinfo=datetime.timezone.utc))

    def test_deadline_end_in_next_year(self):
        period = PromptnessPeriod.build("202612", 10, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.deadline, datetime.date(2027, 1, 10))
        self.assertEqual(period.deadline_end, datetime.datetime(2027, 1, 11, 0, 0, tzinfo=datetime.timezone.utc))

    def test_deadline_end_on_leap_year(self):
        # February 2028 has 29 days
        period = PromptnessPeriod.build("202802", 0, today=datetime.date(2026, 9, 28))
        self.assertEqual(period.deadline, datetime.date(2028, 2, 29))
        self.assertEqual(period.deadline_end, datetime.datetime(2028, 3, 1, 0, 0, tzinfo=datetime.timezone.utc))

    def test_deadline_end_uses_the_current_timezone(self):
        # The deadline day ends at midnight in the current timezone (UTC in the settings).
        # In Addis Ababa (UTC+3), midnight on 2026-02-11 is 2026-02-10 at 21:00 UTC.
        period = PromptnessPeriod.build("202601", 10, today=datetime.date(2026, 9, 28))
        with timezone.override("Africa/Addis_Ababa"):
            deadline_end = period.deadline_end
        self.assertEqual(deadline_end, datetime.datetime(2026, 2, 10, 21, 0, tzinfo=datetime.timezone.utc))
