import datetime

from rest_framework.exceptions import ValidationError


def get_beginning_of_day(date_str: str, parameter_name: str):
    if date_str:
        date = _parse_date(date_str, parameter_name)
        return datetime.datetime.combine(date, datetime.time.min).replace(tzinfo=pytz.UTC)
    return None


def get_end_of_day(date_str: str, parameter_name: str):
    if date_str:
        date = _parse_date(date_str, parameter_name)
        return datetime.datetime.combine(date, datetime.time.max).replace(tzinfo=pytz.UTC)
    return None


def _parse_date(date: datetime.date, key: str):
    try:
        return datetime.date.fromisoformat(date)
    except ValueError:
        raise ValidationError(f"Parameter '{key}' must be a valid ISO date (yyyy-MM-dd), received '{date}'")
