import os

import requests
from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import TemplateView
from rest_framework import permissions
from rest_framework.authentication import SessionAuthentication

from hat import settings


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # To not perform the csrf check previously happening


class UserAccessPermission(permissions.BasePermission):
    def has_permission(self, request, view):  # type: ignore
        user = request.user
        access_granted = False
        if hasattr(view, "permission_required"):
            for permission in view.permission_required:
                if user.has_perm(permission):
                    access_granted = True
        else:
            access_granted = True
        if access_granted:
            return user and user.is_authenticated
        else:
            return False


class WfpLogin(TemplateView):
    template_name = "iaso/pages/wfp_login.html"


# retrieve token for wfp auth
def wfp_callback(request):
    if request.GET.get("code"):
        code = request.GET.get("code", None)

        payload = {
            "client_id": os.environ.get("IASO_WFP_ID"),
            "grant_type": "authorization_code",
            "redirect_uri": os.environ.get("WFP_CALLBACK_URL"),
            "code": code,
            "code_verifier": settings.CODE_CHALLENGE,
        }

        response = requests.post(
            "https://ciam.auth.wfp.org/oauth2/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            params=payload,
        )

        token = response.json()["access_token"]

        token_decode = requests.get(
            "https://ciam.auth.wfp.org/oauth2/userinfo", headers={"Authorization": "Bearer {0}".format(token)}
        ).json()

        return render(request, "iaso/pages/wfp_login.html", {"user": token_decode})
    return HttpResponse("OK")
