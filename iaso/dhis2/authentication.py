import requests
from django.http import HttpResponse


def dhis2_callback(request):
    if request.GET.get("code"):
        code = request.GET.get("code", None)

        payload = {
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "https://bluesquare.eu.ngrok.io/api/Oauth/dhis2/",
        }

        response = requests.post(
            "https://sandbox.bluesquare.org/uaa/oauth/token",
            headers={"Content-Type": "Accept: application/json"},
            params=payload,
        )
        print(response.headers)
        return HttpResponse(response)

    return HttpResponse("ok")
