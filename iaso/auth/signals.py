from axes.signals import user_locked_out
from django.conf import settings
from django.dispatch import receiver
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.request import Request


class TooManyRequestsException(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = settings.AXES_COOLOFF_MESSAGE
    default_code = "too_many_requests"


@receiver(user_locked_out)
def raise_rate_limit_exception(sender, request, *args, **kwargs):
    """Raise 429 Too Many Request after too many failed login attempts.

    The `user_locked_out` signal is sent by django-axes and required for DRF integration.
    https://github.com/jazzband/django-axes/blob/8.0.0/docs/6_integration.rst#integration-with-django-rest-framework
    """
    if isinstance(request, Request):
        raise TooManyRequestsException()
