import os

import requests
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from requests.auth import HTTPBasicAuth

from iaso.models import Profile


def dhis2_callback(request):
    if request.GET.get("code"):

        DHIS2_SERVER_URL = os.environ.get("DHIS2_SERVER_URL")
        REDIRECT_URI = os.environ.get("IASO_AUTH_DHIS2_URI")
        IASO_DHIS2_SECRET = os.environ.get("IASO_DHIS2_SECRET")

        code = request.GET.get("code", None)

        payload = {
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI + "api/Oauth/dhis2/",
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
            DHIS2_SERVER_URL + "api/33/me", headers={"Authorization": "Bearer {0}".format(access_token)}
        )

        dhis2_id = user_info.json()["userCredentials"]["id"]

        try:
            user = Profile.objects.get(dhis2_id=dhis2_id)
            return JsonResponse(user.as_dict())
        except ObjectDoesNotExist:
            return HttpResponse(
                "Iaso User with DHIS2 credentials < {0} > does not exists.".format(
                    user_info.json()["userCredentials"]["name"]
                )
            )

    return HttpResponse("ok")
