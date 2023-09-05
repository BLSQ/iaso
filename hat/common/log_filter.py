import logging

from django.conf import settings


class StaticUrlFilter(logging.Filter):
    """Used in our logging configuration to not print static request in dev"""

    # Filter out request that start with the static url
    def filter(self, record):  # type: ignore
        if record.module == "basehttp":
            if len(record.args) > 0 and isinstance(record.args[0], str):
                return record.args[0].find(" {}".format(settings.STATIC_URL)) < 0

        return True
