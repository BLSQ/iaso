from datetime import datetime

from django.utils import timezone


# TODO: We need to be consistent in the APIs, sometimes we use %Y-%m-%d format
DATE_FORMAT = "%d-%m-%Y"


def timestamp_to_datetime(timestamp):
    date = datetime.fromtimestamp(timestamp, tz=timezone.get_default_timezone())
    return date.strftime("%Y-%m-%d %H:%M:%S")


def date_string_to_start_of_day(date_str, date_format=DATE_FORMAT):
    date_dt = datetime.strptime(date_str, date_format).replace(tzinfo=timezone.get_default_timezone())
    return date_dt.replace(hour=0, minute=0, second=0)


def date_string_to_end_of_day(date_str, date_format=DATE_FORMAT):
    date_dt = datetime.strptime(date_str, date_format).replace(tzinfo=timezone.get_default_timezone())
    return date_dt.replace(hour=23, minute=59, second=59)
