import os

import requests
from django.contrib.auth import login
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from requests.auth import HTTPBasicAuth

from iaso.models import Profile, ExternalCredentials


def dhis2_callback(request, dhis2_slug):
    if request.GET.get("code"):

        ext_credentials = ExternalCredentials.objects.get(name=dhis2_slug)

        DHIS2_SERVER_URL = ext_credentials.login
        REDIRECT_URI = ext_credentials.url
        IASO_DHIS2_SECRET = ext_credentials.password

        code = request.GET.get("code", None)

        payload = {
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI + "api/dhis2/{0}/login/".format(dhis2_slug),
            "client_id": "iaso-org",
        }

        response = requests.post(
            DHIS2_SERVER_URL + "uaa/oauth/token",
            auth=HTTPBasicAuth("iaso-org", IASO_DHIS2_SECRET),
            headers={"Content-Type": "Accept: application/json"},
            params=payload,
        )

        access_token = response.json()["access_token"]

        user_info = requests.get(
            DHIS2_SERVER_URL + "api/me", headers={"Authorization": "Bearer {0}".format(access_token)}
        )

        user_dhis2_id = user_info.json()["userCredentials"]["id"]

        try:
            user = Profile.objects.get(dhis2_id=user_dhis2_id).user
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            return HttpResponseRedirect(redirect_to="/")
        except ObjectDoesNotExist:
            return HttpResponse(
                "Iaso User with DHIS2 credentials < {0} > does not exists.".format(
                    user_info.json()["userCredentials"]["name"]
                )
            )

    return HttpResponse("ok")
