from unittest import TestCase
from iaso.periods import QuarterPeriod, MonthPeriod, YearPeriod, SemesterPeriod, Period


class PeriodTests(TestCase):
    def test_comparison(self):
        self.assertTrue(QuarterPeriod("2021Q2") < QuarterPeriod("2021Q3"))
        self.assertFalse(QuarterPeriod("2021Q2") < QuarterPeriod("2021Q2"))
        self.assertTrue(QuarterPeriod("2021Q2") <= QuarterPeriod("2021Q2"))

    def test_period(self):
        self.assertEqual(repr(QuarterPeriod("2021Q2")), "<QuarterPeriod 2021Q2>", repr(QuarterPeriod("2021Q2")))
        self.assertTrue(QuarterPeriod("2021Q2"))
        self.assertEqual(QuarterPeriod("2021Q2").next_period(), QuarterPeriod("2021Q3"))
        self.assertNotEqual(QuarterPeriod("2021Q1").next_period(), QuarterPeriod("2021Q3"))
        self.assertEqual(QuarterPeriod("2021Q4").next_period(), QuarterPeriod("2022Q1"))
        periods = QuarterPeriod("2021Q4").range_period_to(QuarterPeriod("2021Q4"))
        self.assertEqual(periods, ["2021Q4"], periods)
        periods = QuarterPeriod("2021Q4").range_period_to(QuarterPeriod("2022Q4"))
        self.assertEqual(periods, ["2021Q4", "2022Q1", "2022Q2", "2022Q3", "2022Q4"])
        self.assertEqual(YearPeriod("2014").range_period_to(YearPeriod("2017")), ["2014", "2015", "2016", "2017"])
        self.assertRaises(ValueError, lambda: YearPeriod("2014").range_period_to(QuarterPeriod("2022Q1")))
        self.assertEqual(MonthPeriod("202112").next_period(), MonthPeriod("202201"))
        self.assertEqual(MonthPeriod("202101").next_period(), MonthPeriod("202102"))
        self.assertEqual(MonthPeriod("202101").range_period_to(MonthPeriod("202101")), [MonthPeriod("202101")])
        self.assertEqual(
            MonthPeriod("202109").range_period_to(MonthPeriod("202202")),
            [MonthPeriod("202109"), "202110", "202111", "202112", "202201", "202202"],
        )

    def test_semester(self):
        self.assertEqual(
            SemesterPeriod("2018S1").range_period_to(SemesterPeriod("2021S1")),
            ["2018S1", "2018S2", "2019S1", "2019S2", "2020S1", "2020S2", "2021S1"],
        )

    def test_detection(self):
        self.assertEqual(type(Period.from_string("2021Q2")), QuarterPeriod)
        self.assertEqual(type(Period.from_string("2021")), YearPeriod)
        self.assertEqual(type(Period.from_string("202102")), MonthPeriod)
        self.assertRaises(Exception, lambda: Period.from_string("11111sww1"))
