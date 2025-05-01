from datetime import date
from typing import List, Optional, Tuple


PERIOD_TYPE_DAY = "DAY"
PERIOD_TYPE_MONTH = "MONTH"
PERIOD_TYPE_QUARTER = "QUARTER"
PERIOD_TYPE_QUARTER_NOV = "QUARTER_NOV"
PERIOD_TYPE_SIX_MONTH = "SIX_MONTH"
PERIOD_TYPE_YEAR = "YEAR"
PERIOD_TYPE_FINANCIAL_NOV = "FINANCIAL_NOV"


def detect(dhis2_period: str):
    if len(dhis2_period) == 4:
        return PERIOD_TYPE_YEAR

    if (len(dhis2_period) == 7) and "Nov" in dhis2_period:  # 2016Nov
        return PERIOD_TYPE_FINANCIAL_NOV

    if "NovQ" in dhis2_period:  # 2016NovQ1
        return PERIOD_TYPE_QUARTER_NOV

    if "Q" in dhis2_period:  # 2016Q1
        return PERIOD_TYPE_QUARTER

    if "S" in dhis2_period:  # 2018S1
        return PERIOD_TYPE_SIX_MONTH

    if len(dhis2_period) == 6:  # 201812
        return PERIOD_TYPE_MONTH

    if len(dhis2_period) == 8:  # 20181231
        return PERIOD_TYPE_DAY
    raise ValueError("unsupported dhis2 period format for '" + dhis2_period + "'")


class Period:
    def __init__(self, value: str):
        self.value = value

    @staticmethod
    def from_string(period_string):
        period_type = detect(period_string)
        if period_type == PERIOD_TYPE_YEAR:
            return YearPeriod(period_string)
        if period_type == PERIOD_TYPE_MONTH:
            return MonthPeriod(period_string)
        if period_type == PERIOD_TYPE_QUARTER:
            return QuarterPeriod(period_string)
        if period_type == PERIOD_TYPE_QUARTER_NOV:
            return QuarterNovPeriod(period_string)
        if period_type == PERIOD_TYPE_SIX_MONTH:
            return SemesterPeriod(period_string)
        if period_type == PERIOD_TYPE_FINANCIAL_NOV:
            return FinancialNovPeriod(period_string)
        if period_type == PERIOD_TYPE_DAY:
            return DayPeriod(period_string)
        raise ValueError(f"unsupported period type: {period_type}")

    @staticmethod
    def bound_range(from_string: Optional[str], to_string: Optional[str]) -> Tuple["Period", "Period"]:
        """convert to period and fill missing bound
        if we don't have a start or end value, provide one since we cant generate a range from infinity"""
        if not from_string and not to_string:
            raise ValueError("Should at least provide one bound")
        if not to_string:
            from_period = Period.from_string(from_string)
            to_period = Period.from_string(from_period.HIGHER_BOUND)
        elif not from_string:
            to_period = Period.from_string(to_string)
            from_period = Period.from_string(to_period.LOWER_BOUND)
        else:
            to_period = Period.from_string(to_string)
            from_period = Period.from_string(from_string)
        return (from_period, to_period)

    @staticmethod
    def range_string(from_string: str, to_string: str):
        from_period, to_period = Period.bound_range(from_string, to_string)
        range_periods = from_period.range_period_to(to_period)
        return [str(p) for p in range_periods]

    @staticmethod
    def range_string_with_sub_periods(from_period: "Period", to_period: "Period") -> List[str]:
        range_periods = from_period.range_period_to(to_period)
        sub_periods = []
        for period in range_periods:
            sub_periods += period.gen_sub_periods()
        periods = range_periods + sub_periods
        return [str(p) for p in periods]

    def __eq__(self, other):
        if isinstance(other, str):
            return self.value == other
        if not isinstance(other, Period):
            raise ValueError("unsupported type")
        return self.value == other.value

    def __str__(self):
        return self.value

    def __repr__(self):
        return f"<{self.__class__.__name__} {self.value}>"

    def __le__(self, other):
        assert type(self) == type(other)
        return self.value <= other.value

    def __lt__(self, other):
        assert type(self) == type(other)
        return self.value < other.value

    @property
    def period_type(self):
        return detect(self.value)

    def next_period(self):
        raise NotImplementedError()

    def gen_sub_periods(self):
        """Return this period as smaller periods, recursive.
        Eg for a semester we will return it expressed as 2 QuarterPeriod and 6 MonthPeriod
        """
        raise NotImplementedError()

    def range_period_to(self, other: "Period"):
        if not type(self) == type(other):
            raise ValueError(f"{self} not the same type as {other}")
        if not self <= other:
            raise ValueError(f"{self} not greater than {other}")
        r = []
        n = self
        while n <= other:
            r.append(n)
            n = n.next_period()
        return r


QUARTER_TO_MONTHS = {1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]}

QUARTER_NOV_TO_MONTHS = {1: [11, 12, 1], 2: [2, 3, 4], 3: [5, 6, 7], 4: [8, 9, 10]}


class QuarterPeriod(Period):
    LOWER_BOUND = "2000Q1"
    HIGHER_BOUND = "2030Q4"

    @staticmethod
    def from_parts(year, quarter):
        return QuarterPeriod(f"{year:04}Q{quarter}")

    @property
    def parts(self):
        year, quarter = self.value.split("Q")
        quarter = int(quarter)
        year = int(year)
        return year, quarter

    def next_period(self):
        year, quarter = self.parts
        if quarter >= 4:
            n_year = year + 1
            n_quarter = 1
        else:
            n_quarter = quarter + 1
            n_year = year
        return QuarterPeriod.from_parts(n_year, n_quarter)

    def gen_sub_periods(self):
        year, quarter = self.parts
        return [MonthPeriod.from_parts(year, month) for month in QUARTER_TO_MONTHS[quarter]]

    def start_date(self):
        year, quarter = self.parts
        month = QUARTER_TO_MONTHS[quarter][0]
        return date(year=year, month=month, day=1)


class QuarterNovPeriod(Period):
    LOWER_BOUND = "2000NovQ1"
    HIGHER_BOUND = "2030NovQ4"

    @staticmethod
    def from_parts(year, quarter):
        return QuarterNovPeriod(f"{year:04}NovQ{quarter}")

    @property
    def parts(self):
        year, quarter = self.value.split("NovQ")
        quarter = int(quarter)
        year = int(year)
        return year, quarter

    def next_period(self):
        year, quarter = self.parts
        if quarter >= 4:
            n_year = year + 1
            n_quarter = 1
        else:
            n_quarter = quarter + 1
            n_year = year
        return QuarterNovPeriod.from_parts(n_year, n_quarter)

    def gen_sub_periods(self):
        year, quarter = self.parts
        return [
            MonthPeriod.from_parts(year - 1 if month == 11 or month == 12 else year, month)
            for month in QUARTER_NOV_TO_MONTHS[quarter]
        ]

    def start_date(self):
        year, quarter = self.parts
        month = QUARTER_NOV_TO_MONTHS[quarter][0]
        if quarter == 1:
            year = year - 1
        return date(year=year, month=month, day=1)


class YearPeriod(Period):
    LOWER_BOUND = "2000"
    HIGHER_BOUND = "2030"

    def next_period(self):
        n_p = int(self.value) + 1
        return YearPeriod(f"{n_p:04}")

    def gen_sub_periods(self):
        year = int(self.value)
        semesters = [SemesterPeriod.from_parts(year, 1), SemesterPeriod.from_parts(year, 2)]
        sub_semesters = []
        for semester in semesters:
            sub_semesters += semester.gen_sub_periods()
        return semesters + sub_semesters

    def start_date(self):
        year = int(self.value)
        return date(year=year, month=1, day=1)


class FinancialNovPeriod(Period):
    LOWER_BOUND = "2000Nov"
    HIGHER_BOUND = "2030Nov"

    def next_period(self):
        n_p = int(self.value[0:4]) + 1
        return FinancialNovPeriod(f"{n_p:04}Nov")

    def gen_sub_periods(self):
        year = int(self.value[0:4])
        quarters = [
            QuarterNovPeriod.from_parts(year, 1),
            QuarterNovPeriod.from_parts(year, 2),
            QuarterNovPeriod.from_parts(year, 3),
            QuarterNovPeriod.from_parts(year, 4),
        ]
        sub_quarters = []
        for quarter_nov in quarters:
            sub_quarters += quarter_nov.gen_sub_periods()
        return quarters + sub_quarters

    def start_date(self):
        year = int(self.value[0:4])
        return date(year=year - 1, month=11, day=1)


SEMESTERS_TO_QUARTERS = {
    1: [1, 2],
    2: [3, 4],
}

SEMESTERS_TO_MONTHS = {
    1: [1, 2, 3, 4, 5, 6],
    2: [7, 8, 9, 10, 11, 12],
}


class SemesterPeriod(Period):
    LOWER_BOUND = "2000S1"
    HIGHER_BOUND = "2030S2"

    @staticmethod
    def from_parts(year, semester):
        return SemesterPeriod(f"{year:04}S{semester}")

    def next_period(self):
        year, semester = self.parts
        if semester >= 2:
            n_year = year + 1
            n_semester = 1
        else:
            n_year = year
            n_semester = semester + 1
        return SemesterPeriod.from_parts(n_year, n_semester)

    @property
    def parts(self):
        year, semester = self.value.split("S")
        return int(year), int(semester)

    def gen_sub_periods(self):
        year, semester = self.parts

        quarters = [QuarterPeriod.from_parts(year, quarter) for quarter in SEMESTERS_TO_QUARTERS[semester]]
        months = []
        for quarter in quarters:
            months += quarter.gen_sub_periods()
        return quarters + months

    def start_date(self):
        year, semester = self.parts
        month = SEMESTERS_TO_MONTHS[semester][0]
        return date(year=year, month=month, day=1)


class MonthPeriod(Period):
    "Month start at 1"

    LOWER_BOUND = "200001"
    HIGHER_BOUND = "203012"

    @staticmethod
    def from_parts(year, month):
        return MonthPeriod(f"{year:04}{month:02}")

    @property
    def parts(self):
        year, month = int(self.value[:4]), int(self.value[4:])
        return year, month

    def next_period(self):
        year, month = self.parts
        if month == 12:
            n_month = 1
            n_year = year + 1
        else:
            n_month = month + 1
            n_year = year

        return MonthPeriod.from_parts(n_year, n_month)

    def gen_sub_periods(self):
        return []

    def start_date(self):
        year, month = self.parts
        return date(year=year, month=month, day=1)


class DayPeriod(Period):
    LOWER_BOUND = "20000101"
    HIGHER_BOUND = "20301231"

    @staticmethod
    def from_parts(year, month, day):
        return DayPeriod(f"{year:04}{month:02}:{day:02}")

    @property
    def parts(self):
        year, month, day = int(self.value[:4]), int(self.value[4:6]), int(self.value[6:])
        return year, month

    def next_period(self):
        raise Exception

    def gen_sub_periods(self):
        return []

    def start_date(self):
        year, month, day = int(self.value[:4]), int(self.value[4:6]), int(self.value[6:])
        return date(year=year, month=month, day=day)
