from datetime import UTC, datetime, time

from rest_framework.exceptions import ValidationError


def get_beginning_of_day(date_str: str, parameter_name: str) -> datetime | None:
    if date_str:
        date = _parse_date(date_str, parameter_name)
        return datetime.combine(date, time.min).replace(tzinfo=UTC)
    return None


def get_end_of_day(date_str: str, parameter_name: str) -> datetime | None:
    if date_str:
        date = _parse_date(date_str, parameter_name)
        return datetime.combine(date, time.max).replace(tzinfo=UTC)
    return None


def _parse_date(date: str, key: str) -> date:
    try:
        return date.fromisoformat(date)
    except ValueError:
        raise ValidationError(f"Parameter '{key}' must be a valid ISO date (yyyy-MM-dd), received '{date}'")
