PERIOD_TYPE_MONTH = "MONTH"
PERIOD_TYPE_QUARTER = "QUARTER"
PERIOD_TYPE_SIX_MONTH = "SIX_MONTH"
PERIOD_TYPE_YEAR = "YEAR"


def detect(dhis2_period):
    if len(dhis2_period) == 4:
        return PERIOD_TYPE_YEAR

    if "Q" in dhis2_period:
        return PERIOD_TYPE_QUARTER

    if "S" in dhis2_period:
        return PERIOD_TYPE_SIX_MONTH

    if len(dhis2_period) == 6:
        return PERIOD_TYPE_MONTH

    raise Exception("unsupported dhis2 period format for '" + dhis2_period + "'")


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
        raise ValueError("unsupported period type: {period_type}")

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

    def range_period_to(self, other):
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
    def next_period(self):
        p = self.value
        year, quarter = p.split("Q")
        quarter = int(quarter)
        year = int(year)
        if quarter >= 4:
            n_year = year + 1
            n_quarter = 1
        else:
            n_quarter = quarter + 1
            n_year = year
        return QuarterPeriod(f"{n_year:04}Q{n_quarter}")


class YearPeriod(Period):
    def next_period(self):
        n_p = int(self.value) + 1
        return YearPeriod(f"{n_p:04}")


class SemesterPeriod(Period):
    def next_period(self):
        p = self.value
        year, semester = p.split("S")
        semester = int(semester)
        year = int(year)
        if semester >= 2:
            n_year = year + 1
            n_semester = 1
        else:
            n_year = year
            n_semester = semester + 1
        return SemesterPeriod(f"{n_year:04}S{n_semester}")


class MonthPeriod(Period):
    "Month start at 1"

    def next_period(self):
        year, month = int(self.value[:4]), int(self.value[4:])
        if month == 12:
            n_month = 1
            n_year = year + 1
        else:
            n_month = month + 1
            n_year = year

        return MonthPeriod(f"{n_year:04}{n_month:02}")
