from enum import Enum
from datetime import datetime, timedelta
from calendar import monthrange
import pytz


class DatePeriod(Enum):
    current_month = 'current-month'
    current_trimester = 'current-trimester'
    current_year = 'current-year'
    last_month = 'last-month'
    last_trimester = 'last-trimester'
    last_year = 'last-year'
    since_last_year = 'since-last-year'
    since_two_years = 'since-two-years'
    since_three_years = 'since-three-years'


def resolve_dateperiod(value):
    '''
    Expects value to one of the strings in the `DatePeriod` enum.
    Returns a tuple of datetime objects: `(date_from, date_to)`
    '''
    td = datetime.today()

    if value == DatePeriod.current_month.value:
        date_from = datetime(td.year, td.month, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.current_trimester.value:
        first_month = td.month - ((td.month - 1) % 4)
        date_from = datetime(td.year, first_month, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.current_year.value:
        date_from = datetime(td.year, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.last_month.value:
        if td.month == 1:
            date_from = datetime(td.year - 1, 12, 1, tzinfo=pytz.UTC)
        else:
            date_from = datetime(td.year, td.month - 1, 1, tzinfo=pytz.UTC)
        (_, last_day) = monthrange(date_from.year, date_from.month)
        date_to = datetime(date_from.year, date_from.month, last_day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.last_trimester.value:
        first_month = td.month - ((td.month - 1) % 4)
        first_year = td.year
        if first_month == 1:
            # last trimester is the last trimester of last year
            first_month = 9
            first_year = first_year - 1
        else:
            # last trimester is in same year
            first_month = first_month - 4
        date_from = datetime(first_year, first_month, 1, tzinfo=pytz.UTC)
        date_to = datetime(first_year, first_month + 4, 1, tzinfo=pytz.UTC) \

    elif value == DatePeriod.last_year.value:
        date_from = datetime(td.year - 1, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(date_from.year, 12, 31, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.since_last_year.value:
        td = datetime.today()
        date_from = datetime(td.year - 1, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.since_two_years.value:
        td = datetime.today()
        date_from = datetime(td.year - 2, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    elif value == DatePeriod.since_three_years.value:
        date_from = datetime(td.year - 3, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)
    else:
        raise ValueError('Unkown date period: ' + value)

    return (date_from, date_to)
