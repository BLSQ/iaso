import base64
import hashlib
import html
import json
import os
import re
import urllib.parse
import requests
from django.http import HttpResponse


def pkce_generator():
    code_verifier = base64.urlsafe_b64encode(os.urandom(40)).decode('utf-8')
    code_verifier = re.sub('[^a-zA-Z0-9]+', '', code_verifier)
    code_verifier, len(code_verifier)
    code_challenge = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge).decode('utf-8')
    code_challenge = code_challenge.replace('=', '')

    return code_challenge


def wfp_opendId_connect(request):
    provider = "https://ciam.auth.wfp.org/oauth2"
    client_id = ""
    redirect_uri = "https://bluesquare.eu.ngrok.io/api"

    code_challenge = pkce_generator()

    resp = requests.get(
        url=provider,
        data={
            "response_type": "code",
            "client_id": client_id,
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            # "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        },
        allow_redirects=False
    )
    # resp.status_code

    return HttpResponse(resp)

    cookie = resp.headers['Set-Cookie']
    cookie = '; '.join(c.split(';')[0] for c in cookie.split(', '))

    page = resp.text
    form_action = html.unescape(re.search('<form\s+.*?\s+action="(.*?)"', page, re.DOTALL).group(1))
