import os

import requests
from django.http import HttpResponse, JsonResponse
from requests.auth import HTTPBasicAuth


def dhis2_callback(request):
    if request.GET.get("code"):

        DHIS2_SERVER = str(os.environ.get("DHIS2_SERVER"))

        code = request.GET.get("code", None)

        payload = {
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "/api/Oauth/dhis2/",
            "client_id": "iaso-org",
        }

        response = requests.post(
            DHIS2_SERVER + "/uaa/oauth/token",
            auth=HTTPBasicAuth("iaso-org", os.environ.get("IASO_DHIS2_OAUTH_SECRET")),
            headers={"Content-Type": "Accept: application/json"},
            params=payload,
        )

        access_token = response.json()["access_token"]

        user_info = requests.get(
            DHIS2_SERVER + "/api/33/me", headers={"Authorization": "Bearer {0}".format(access_token)}
        )
        return JsonResponse(user_info.json(), safe=False)

    return HttpResponse("ok")
