import os
import re

import requests
from django.http import HttpResponse
from django.views.generic import TemplateView
from rest_framework.authentication import SessionAuthentication
from rest_framework import permissions

from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider
import secrets
import base64
import hashlib
import urllib.parse

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


VOCAB = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-._~0123456789"


def generate_code_verifier() -> str:
    length = max(43, secrets.randbelow(129))
    return "".join([secrets.choice(VOCAB) for i in range(0, length)])


def generate_state() -> str:
    return secrets.token_urlsafe(32)


def callback(request):
    if request.GET.get("code"):
        code = request.GET.get("code", None)
        state = request.GET.get("state", None)
        session_state = request.GET.get("session_state", None)

        payload = {
            "client_id": "",
            "grant_type": "authorization_code",
            "redirect_uri": "https://bluesquare.eu.ngrok.io/api/auth0/login/callback/",
            "code": code,
            "code_verifier": settings.code_challenge,
        }

        print(payload)

        print(settings.code_verifier)

        response = requests.post(
            "https://ciam.auth.wfp.org/oauth2/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            params=payload,
        )
        print(response)
        print(response.content)

        return HttpResponse(response.status_code)
    return HttpResponse("OK")
