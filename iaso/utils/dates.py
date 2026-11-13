from datetime import UTC, date, datetime, time

from rest_framework.exceptions import ValidationError


def get_beginning_of_day(date_str: str, parameter_name: str) -> datetime | None:
    if date_str:
        parsed_date = _parse_date(date_str, parameter_name)
        return datetime.combine(parsed_date, time.min).replace(tzinfo=UTC)
    return None


def get_end_of_day(date_str: str, parameter_name: str) -> datetime | None:
    if date_str:
        parsed_date = _parse_date(date_str, parameter_name)
        return datetime.combine(parsed_date, time.max).replace(tzinfo=UTC)
    return None


def _parse_date(date_str: str, key: str) -> date:
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        raise ValidationError(f"Parameter '{key}' must be a valid ISO date (yyyy-MM-dd), received '{date_str}'")
