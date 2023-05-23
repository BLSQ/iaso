from typing import Tuple, Optional, List

PERIOD_TYPE_DAY = "DAY"
PERIOD_TYPE_MONTH = "MONTH"
PERIOD_TYPE_QUARTER = "QUARTER"
PERIOD_TYPE_SIX_MONTH = "SIX_MONTH"
PERIOD_TYPE_YEAR = "YEAR"


def detect(dhis2_period: str):
    if len(dhis2_period) == 4:
        return PERIOD_TYPE_YEAR

    if "Q" in dhis2_period:
        return PERIOD_TYPE_QUARTER

    if "S" in dhis2_period:
        return PERIOD_TYPE_SIX_MONTH

    if len(dhis2_period) == 6:
        return PERIOD_TYPE_MONTH
    if len(dhis2_period) == 8:
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
        elif period_type == PERIOD_TYPE_MONTH:
            return MonthPeriod(period_string)
        elif period_type == PERIOD_TYPE_QUARTER:
            return QuarterPeriod(period_string)
        elif period_type == PERIOD_TYPE_SIX_MONTH:
            return SemesterPeriod(period_string)
        elif period_type == PERIOD_TYPE_DAY:
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
        raise NotImplemented()

    def gen_sub_periods(self):
        """Return this period as smaller periods, recursive.
        Eg for a semester we will return it expressed as 2 QuarterPeriod and 6 MonthPeriod
        """
        raise NotImplemented()

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
        quarter_to_months = {1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]}
        return [MonthPeriod.from_parts(year, month) for month in quarter_to_months[quarter]]


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
        semester_to_quarters = {
            1: [1, 2],
            2: [3, 4],
        }
        quarters = [QuarterPeriod.from_parts(year, quarter) for quarter in semester_to_quarters[semester]]
        months = []
        for quarter in quarters:
            months += quarter.gen_sub_periods()
        return quarters + months


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
