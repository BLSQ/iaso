from typing import Dict
from django.conf import settings
from django.http.request import HttpRequest


def appversions(request: HttpRequest) -> Dict[str, str]:
    prefix = "D-" if settings.DEBUG else ""
    return {"DEV_SERVER": settings.DEV_SERVER}


def environment(request: HttpRequest) -> Dict[str, str]:
    return {"environment": settings.ENVIRONMENT}


def app_title(request: HttpRequest) -> Dict[str, str]:
    return {"app_title": settings.APP_TITLE}


def theme_primary_color(request: HttpRequest) -> Dict[str, str]:
    return {"theme_primary_color": settings.THEME_PRIMARY_COLOR}


def theme_secondary_color(request: HttpRequest) -> Dict[str, str]:
    return {"theme_secondary_color": settings.THEME_SECONDARY_COLOR}


def favicon_path(request: HttpRequest) -> Dict[str, str]:
    return {"favicon_path": settings.FAVICON_PATH}


def logo_path(request: HttpRequest) -> Dict[str, str]:
    return {"logo_path": settings.LOGO_PATH}
