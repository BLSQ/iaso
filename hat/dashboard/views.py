from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.http.request import HttpRequest
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from hat.__version__ import VERSION


def _base_iaso(request: HttpRequest) -> HttpResponse:
    try:
        USER_HOME_PAGE = request.user.iaso_profile.home_page if request.user.is_authenticated else ""
    except ObjectDoesNotExist:
        return HttpResponse(
            f"User {request.user.username} has no iaso_profile. Please contact your administrator.", status=403
        )
    return render(
        request,
        "iaso/index.html",
        {
            "PLUGINS_ENABLED": settings.PLUGINS,
            "STATIC_URL": settings.STATIC_URL,
            "USER_HOME_PAGE": USER_HOME_PAGE,
            "VERSION": VERSION,
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
