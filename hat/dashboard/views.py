from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.http.request import HttpRequest
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from hat.__version__ import VERSION


def _should_enable_analytics(request: HttpRequest) -> bool:
    """Check if analytics should be enabled based on environment variable"""
    return getattr(settings, "ENABLE_ANALYTICS", False)


def _get_domain_from_request(request: HttpRequest) -> str:
    return request.get_host().split(":")[0]


def _base_iaso(request: HttpRequest, analytics_data: dict = None) -> HttpResponse:
    try:
        USER_HOME_PAGE = request.user.iaso_profile.home_page if request.user.is_authenticated else ""
    except ObjectDoesNotExist:
        USER_HOME_PAGE = ""
    variables_to_render = {
        "PLUGINS_ENABLED": settings.PLUGINS,
        "STATIC_URL": settings.STATIC_URL,
        "USER_HOME_PAGE": USER_HOME_PAGE,
        "VERSION": VERSION,
    }

    if analytics_data:
        variables_to_render["ANALYTICS_DATA"] = analytics_data

    return render(
        request,
        "iaso/index.html",
        variables_to_render,
    )


@login_required(login_url="/login/")
@require_http_methods(["GET"])
def iaso(request: HttpRequest) -> HttpResponse:
    analytics_data = None

    if _should_enable_analytics(request):
        try:
            domain = _get_domain_from_request(request)
            user_account = request.user.iaso_profile.account
            analytics_data = {
                "domain": domain,
                "username": request.user.username,
                "user_id": request.user.id,
                "account_name": user_account.name,
                "account_id": user_account.id,
            }
        except (ObjectDoesNotExist, AttributeError):
            # User doesn't have an iaso_profile or account, skip analytics
            analytics_data = None

    return _base_iaso(request, analytics_data=analytics_data)


@require_http_methods(["GET"])
def embeddable_iaso(request: HttpRequest) -> HttpResponse:
    """Embeddable iaso page without login requirement and with correct header"""
    analytics_data = None

    if _should_enable_analytics(request):
        domain = _get_domain_from_request(request)
        analytics_data = {
            "domain": domain,
        }

    response = _base_iaso(request, analytics_data=analytics_data)
    response["X-Frame-Options"] = "ALLOW"
    return response


@require_http_methods(["GET"])
def home_iaso(request: HttpRequest) -> HttpResponse:
    """Iaso home page without login requirement"""
    response = _base_iaso(request)
    return response


@require_http_methods(["GET"])
def public_iaso(request: HttpRequest) -> HttpResponse:
    """Public pages without login requirement"""
    response = _base_iaso(request)
    return response
