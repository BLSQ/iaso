from copy import copy
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.conf import settings

from hat.audit.models import log_modification, PASSWORD_API
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm


@login_required()
def change_password(request):
    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            original_user = copy(request.user)
            user = form.save()
            user.profile.password_reset = False
            user.save()
            update_session_auth_hash(request, user)
            log_modification(original_user, user, PASSWORD_API, original_user)
            messages.success(request, _("Your password was successfully updated"))
            return redirect("/dashboard/home")
    else:
        form = PasswordChangeForm(request.user)
    return render(request, "dashboard/change_password.html", {"form": form})


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
