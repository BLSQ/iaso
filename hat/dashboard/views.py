from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.http.request import HttpRequest
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from hat.__version__ import VERSION
from iaso.models.base import Account


def _base_iaso(request: HttpRequest, analytics_scripts: list[str] = None, analytics_data: dict = None) -> HttpResponse:
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

    if analytics_scripts:
        variables_to_render["ANALYTICS_SCRIPTS"] = list(analytics_scripts)

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

    # Check if analytics should be enabled
    if _should_enable_analytics(request):
        # Pass analytics data to template
        domain = request.get_host().split(":")[0]  # Remove port if present
        user_account = request.user.iaso_profile.account
        analytics_data = {
            "domain": domain,
            "username": request.user.username,
            "user_id": request.user.id,
            "account_name": user_account.name,
            "account_id": user_account.id,
        }

    return _base_iaso(request, analytics_data=analytics_data)


def _should_enable_analytics(request: HttpRequest) -> bool:
    """Check if analytics should be enabled based on environment variable"""
    from django.conf import settings

    # Only enable analytics if explicitly enabled via environment variable
    return getattr(settings, "ENABLE_ANALYTICS", False)


@require_http_methods(["GET"])
def embeddable_iaso(request: HttpRequest) -> HttpResponse:
    """Embeddable iaso page without login requirement and with correct header"""
    all_analytics_scripts = set(
        [account.analytics_script for account in Account.objects.all() if account.analytics_script]
    )
    response = _base_iaso(request, all_analytics_scripts)
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
