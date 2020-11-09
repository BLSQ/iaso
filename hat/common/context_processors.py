from typing import Dict
from django.conf import settings
from django.http.request import HttpRequest


def appversions(request: HttpRequest) -> Dict[str, str]:
    prefix = "D-" if settings.DEBUG else ""
    return {"DEV_SERVER": settings.DEV_SERVER}


def environment(request: HttpRequest) -> Dict[str, str]:
    return {"environment": settings.ENVIRONMENT}
