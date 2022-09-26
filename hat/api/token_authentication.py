"""This module provides a way to generate links that will automatically log in an user  and redirect him to a page
The goal is to be able to send action email to the user where he will be automatically logged upon opening them."""

import urllib.parse

from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from rest_framework_simplejwt import authentication  # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore


def token_auth(request):
    token = request.GET.get("token")
    link = request.GET.get("next")

    jta = authentication.JWTTokenUserAuthentication()
    validated_token = jta.get_validated_token(token)
    user_id = validated_token["user_id"]
    user = User.objects.get(id=user_id)
    login(request, user, "django.contrib.auth.backends.ModelBackend")
    return HttpResponseRedirect(link)


def generate_auto_authentication_link(link, user):

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    domain = settings.DNS_DOMAIN
    encoded_link = urllib.parse.quote(link)

    final_link = "https://%s/api/token_auth/?token=%s&next=%s" % (domain, access_token, encoded_link)

    return final_link
