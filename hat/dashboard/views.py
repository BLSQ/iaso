from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.conf import settings


def _base_iaso(request: HttpRequest) -> HttpResponse:
    return render(
        request,
        "iaso/index.html",
        {
            "PLUGINS_ENABLED": settings.PLUGINS,
            "STATIC_URL": settings.STATIC_URL,
        },
    )


@login_required(login_url="/login/")
@require_http_methods(["GET"])
def iaso(request: HttpRequest) -> HttpResponse:
    return _base_iaso(request)


@require_http_methods(["GET"])
def embeddable_iaso(request: HttpRequest) -> HttpResponse:
    """Embeddable iaso page without login requirement and with correct header"""
    response = _base_iaso(request)
    response["X-Frame-Options"] = "ALLOW"
    return response
