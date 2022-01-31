from django.http import HttpResponse
from django.views.generic import TemplateView
from rest_framework.authentication import SessionAuthentication
from rest_framework import permissions

from iaso.api.openid_pkce import pkce_generator
import requests
from rest_framework.response import Response


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

