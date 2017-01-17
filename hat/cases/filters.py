from enum import Enum
from datetime import datetime, timedelta
from calendar import monthrange
import pytz
from django.db.models import Q

Q_screening = Q(screening_result__isnull=False)
Q_screening_positive = Q(screening_result=True)
Q_confirmation = Q(confirmation_result__isnull=False)
Q_confirmation_positive = Q(confirmation_result=True)
Q_staging = Q(stage_result__isnull=False)
Q_staging_stage1 = Q(stage_result='stage1')
Q_staging_stage2 = Q(stage_result='stage2')


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
    since_five_years = 'since-five-years'


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
        to_month = td.month - ((td.month - 1) % 4)
        to_year = td.year
        if to_month == 1:
            # last trimester is the last trimester of last year
            from_month = 9
            from_year = to_year - 1
        else:
            # last trimester is in same year
            from_month = to_month - 4
            from_year = to_year
        date_from = datetime(from_year, from_month, 1, tzinfo=pytz.UTC)
        date_to = datetime(to_year, to_month, 1, tzinfo=pytz.UTC) \

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

    elif value == DatePeriod.since_five_years.value:
        date_from = datetime(td.year - 5, 1, 1, tzinfo=pytz.UTC)
        date_to = datetime(td.year, td.month, td.day, tzinfo=pytz.UTC) \
            + timedelta(days=1)

    else:
        raise ValueError('Unkown date period: ' + value)

    return (date_from, date_to)
