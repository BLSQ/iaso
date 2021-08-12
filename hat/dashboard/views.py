from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.conf import settings


@login_required(login_url="/login/")
@require_http_methods(["GET"])
def iaso(request: HttpRequest) -> HttpResponse:
    return render(
        request,
        "iaso/index.html",
        {
            "STATIC_URL": settings.STATIC_URL,
            "PLUGIN_POLIO_ENABLED": settings.PLUGIN_POLIO_ENABLED,
        },
    )
