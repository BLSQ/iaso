import datetime

from unittest import TestCase

from iaso.periods import (
    FinancialNovPeriod,
    MonthPeriod,
    Period,
    QuarterNovPeriod,
    QuarterPeriod,
    SemesterPeriod,
    WeekPeriod,
    YearPeriod,
)


class PeriodTests(TestCase):
    def test_comparison(self):
        self.assertTrue(QuarterPeriod("2021Q2") < QuarterPeriod("2021Q3"))
        self.assertFalse(QuarterPeriod("2021Q2") < QuarterPeriod("2021Q2"))
        self.assertTrue(QuarterPeriod("2021Q2") <= QuarterPeriod("2021Q2"))
        self.assertEqual(YearPeriod("2001"), "2001")
        self.assertEqual([YearPeriod("2001"), YearPeriod("2002")], ["2001", "2002"])

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
        self.assertEqual(type(Period.from_string("2021Nov")), FinancialNovPeriod)
        self.assertEqual(type(Period.from_string("2021NovQ2")), QuarterNovPeriod)
        self.assertEqual(type(Period.from_string("2021Q2")), QuarterPeriod)
        self.assertEqual(type(Period.from_string("2021")), YearPeriod)
        self.assertEqual(type(Period.from_string("202102")), MonthPeriod)
        self.assertEqual(type(Period.from_string("2021W2")), WeekPeriod)
        self.assertRaises(Exception, lambda: Period.from_string("11111sww1"))

    def test_gen_sub(self):
        self.assertEqual(Period.from_string("2021Q2").gen_sub_periods(), ["202104", "202105", "202106"])
        self.assertEqual(
            Period.from_string("2021S2").gen_sub_periods(),
            ["2021Q3", "2021Q4", "202107", "202108", "202109", "202110", "202111", "202112"],
        )
        self.assertEqual(
            Period.from_string("202101").gen_sub_periods(),
            [],
        )
        self.assertEqual(
            Period.from_string("2021").gen_sub_periods(),
            [
                "2021S1",
                "2021S2",
                "2021Q1",
                "2021Q2",
                "202101",
                "202102",
                "202103",
                "202104",
                "202105",
                "202106",
                "2021Q3",
                "2021Q4",
                "202107",
                "202108",
                "202109",
                "202110",
                "202111",
                "202112",
            ],
        )

    def test_range_sub(self):
        from_period, to_period = Period.bound_range("2021Q1", "2021Q4")
        self.assertEqual(
            Period.range_string_with_sub_periods(from_period, to_period),
            [
                "2021Q1",
                "2021Q2",
                "2021Q3",
                "2021Q4",
                "202101",
                "202102",
                "202103",
                "202104",
                "202105",
                "202106",
                "202107",
                "202108",
                "202109",
                "202110",
                "202111",
                "202112",
            ],
        )

    def test_bound(self):
        self.assertEqual(Period.bound_range(None, "2005"), ("2000", "2005"))
        # should also work with empty string
        self.assertEqual(Period.bound_range("", "2005"), ("2000", "2005"))
        self.assertEqual(Period.bound_range("2005", ""), ("2005", "2030"))
        self.assertEqual(Period.range_string(None, "2005"), ["2000", "2001", "2002", "2003", "2004", "2005"])

        self.assertEqual(Period.bound_range(None, "2005Q2"), ("2000Q1", "2005Q2"))
        self.assertEqual(Period.bound_range("2005Q2", None), ("2005Q2", "2030Q4"))
        self.assertEqual(Period.bound_range("2010S1", None), ("2010S1", "2030S2"))
        self.assertEqual(Period.bound_range("2005S2", None), ("2005S2", "2030S2"))
        # month
        self.assertEqual(Period.bound_range(None, "200502"), ("200001", "200502"))
        self.assertEqual(Period.bound_range("200502", None), ("200502", "203012"))

    def test_bound_sanity(self):
        # this check is here as a reminder to update the higher bound once we approach the original 2030 bound
        current = datetime.datetime.now()
        self.assertLess(current.year + 2, int(YearPeriod.HIGHER_BOUND))
        year, _ = Period.from_string(MonthPeriod.HIGHER_BOUND).parts
        self.assertLess(current.year + 2, year)
        year, _ = Period.from_string(QuarterPeriod.HIGHER_BOUND).parts
        self.assertLess(current.year + 2, year)
        year, _ = Period.from_string(SemesterPeriod.HIGHER_BOUND).parts
        self.assertLess(current.year + 2, year)

    def test_start_date(self):
        test_data = [
            ["20240413", "2024-04-13"],
            ["20241231", "2024-12-31"],
            ["2024Q1", "2024-01-01"],
            ["2024Q2", "2024-04-01"],
            ["2024Q3", "2024-07-01"],
            ["2024Q4", "2024-10-01"],
            ["2016NovQ1", "2015-11-01"],
            ["2016NovQ2", "2016-02-01"],
            ["2016NovQ3", "2016-05-01"],
            ["2016NovQ4", "2016-08-01"],
            ["2024S1", "2024-01-01"],
            ["2024S2", "2024-07-01"],
            ["202403", "2024-03-01"],
            ["202407", "2024-07-01"],
            ["2024", "2024-01-01"],
            ["2016Nov", "2015-11-01"],
        ]

        for data in test_data:
            dhis2_period = Period.from_string(data[0])
            start_date = dhis2_period.start_date().strftime("%Y-%m-%d")
            self.assertEqual(start_date, data[1], data[0] + " to formatted start date " + start_date + " vs " + data[1])

    def test_quarterly_nov_range_period_to(self):
        calculated_periods = [
            str(x) for x in QuarterNovPeriod("2018NovQ1").range_period_to(QuarterNovPeriod("2021NovQ1"))
        ]
        expected_periods = [
            "2018NovQ1",
            "2018NovQ2",
            "2018NovQ3",
            "2018NovQ4",
            "2019NovQ1",
            "2019NovQ2",
            "2019NovQ3",
            "2019NovQ4",
            "2020NovQ1",
            "2020NovQ2",
            "2020NovQ3",
            "2020NovQ4",
            "2021NovQ1",
        ]

        self.assertEqual(calculated_periods, expected_periods)

    def test_quarterly_nov_range_string_with_sub_periods(self):
        from_period, to_period = Period.bound_range("2021NovQ1", "2021NovQ2")
        calculated_periods = Period.range_string_with_sub_periods(from_period, to_period)

        self.assertEqual(
            calculated_periods, ["2021NovQ1", "2021NovQ2", "202011", "202012", "202101", "202102", "202103", "202104"]
        )

    def test_financial_nov_range_period_to(self):
        calculated_periods = [
            str(x) for x in FinancialNovPeriod("2018Nov").range_period_to(FinancialNovPeriod("2021Nov"))
        ]
        expected_periods = ["2018Nov", "2019Nov", "2020Nov", "2021Nov"]

        self.assertEqual(calculated_periods, expected_periods)

    def test_financial_nov_range_string_with_sub_periods(self):
        from_period, to_period = Period.bound_range("2021Nov", "2021Nov")
        calculated_periods = Period.range_string_with_sub_periods(from_period, to_period)
        self.assertEqual(
            calculated_periods,
            [
                "2021Nov",
                "2021NovQ1",
                "2021NovQ2",
                "2021NovQ3",
                "2021NovQ4",
                "202011",
                "202012",
                "202101",
                "202102",
                "202103",
                "202104",
                "202105",
                "202106",
                "202107",
                "202108",
                "202109",
                "202110",
            ],
        )

    def test_week_period(self):
        self.assertEqual(repr(WeekPeriod("2023W12")), "<WeekPeriod 2023W12>", repr(WeekPeriod("2023W12")))
        self.assertTrue(WeekPeriod("2023W12"))
        self.assertEqual(WeekPeriod("2023W12").next_period(), WeekPeriod("2023W13"))
        self.assertNotEqual(WeekPeriod("2023W12").next_period(), WeekPeriod("2023W14"))
        self.assertEqual(WeekPeriod("2023W52").next_period(), WeekPeriod("2024W1"))
        self.assertEqual(WeekPeriod("2026W53").next_period(), WeekPeriod("2027W1"))

    def test_week_period_start_date_regular(self):
        self.assert_week_equal_and_monday("2022W1", datetime.date(2022, 1, 3))
        self.assert_week_equal_and_monday("2022W2", datetime.date(2022, 1, 10))
        self.assert_week_equal_and_monday("2022W3", datetime.date(2022, 1, 17))
        self.assert_week_equal_and_monday("2022W4", datetime.date(2022, 1, 24))
        self.assert_week_equal_and_monday("2022W5", datetime.date(2022, 1, 31))
        self.assert_week_equal_and_monday("2022W6", datetime.date(2022, 2, 7))

        self.assert_week_equal_and_monday("2022W50", datetime.date(2022, 12, 12))
        self.assert_week_equal_and_monday("2022W51", datetime.date(2022, 12, 19))
        self.assert_week_equal_and_monday("2022W52", datetime.date(2022, 12, 26))

    def test_week_period_start_date_first_week_of_year(self):
        self.assert_week_equal_and_monday("2022W1", datetime.date(2022, 1, 3))
        self.assert_week_equal_and_monday("2023W1", datetime.date(2023, 1, 2))
        self.assert_week_equal_and_monday("2024W1", datetime.date(2024, 1, 1))
        self.assert_week_equal_and_monday("2025W1", datetime.date(2024, 12, 30))
        self.assert_week_equal_and_monday("2026W1", datetime.date(2025, 12, 29))

    def test_week_period_start_date_last_week_of_year(self):
        self.assert_week_equal_and_monday("2022W52", datetime.date(2022, 12, 26))
        self.assert_week_equal_and_monday("2023W52", datetime.date(2023, 12, 25))
        self.assert_week_equal_and_monday("2024W52", datetime.date(2024, 12, 23))  # leap year so -2 days
        self.assert_week_equal_and_monday("2025W52", datetime.date(2025, 12, 22))
        self.assert_week_equal_and_monday("2026W52", datetime.date(2026, 12, 21))
        self.assert_week_equal_and_monday("2026W53", datetime.date(2026, 12, 28))  # leap week year

    def test_week_period_start_date_invalid_number_of_week(self):
        with self.assertRaisesRegex(ValueError, "Invalid week: 53"):
            WeekPeriod("2022W53").start_date()

    def test_bound_rannge_week(self):
        from_period, to_period = Period.bound_range("2025W51", "2026W2")
        periods = Period.range_string_with_sub_periods(from_period, to_period)
        self.assertEqual(periods, ["2025W51", "2025W52", "2026W1", "2026W2"])

    def test_bound_rannge_week_leap(self):
        from_period, to_period = Period.bound_range("2026W51", "2027W2")
        periods = Period.range_string_with_sub_periods(from_period, to_period)
        self.assertEqual(periods, ["2026W51", "2026W52", "2026W53", "2027W1", "2027W2"])

    def assert_week_equal_and_monday(self, week_period_str, expected_date):
        week_period = WeekPeriod(week_period_str)
        self.assertEqual(week_period.start_date(), expected_date)
        self.assertEqual(week_period.start_date().weekday(), 0)  # Monday is 0
