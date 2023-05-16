import requests
from allauth.socialaccount.providers.auth0.views import Auth0OAuth2Adapter
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)

from allauth.socialaccount import app_settings

from .provider import WFPProvider


class WFP2Adapter(Auth0OAuth2Adapter):
    provider_id = WFPProvider.id
    supports_state = True

    settings = app_settings.PROVIDERS.get(provider_id, {})
    provider_base_url = settings.get("AUTH0_URL")

    access_token_url = "{0}/token".format(provider_base_url)
    authorize_url = "{0}/authorize".format(provider_base_url)
    profile_url = "{0}/userinfo".format(provider_base_url)

    def get_callback_url(self, request, app):
        return "http://localhost:8000/accounts/wfp/login/callback"

    def complete_login(self, request, app, token, response):
        extra_data = requests.get(self.profile_url, params={"access_token": token.token}).json()
        extra_data_mod = {
            "user_id": extra_data["sub"],
            "id": extra_data["sub"],
            # "name": extra_data["name"],
            "email": extra_data["email"],
            **extra_data,
        }

        return self.get_provider().sociallogin_from_response(request, extra_data_mod)


oauth2_login = OAuth2LoginView.adapter_view(WFP2Adapter)
oauth2_callback = OAuth2CallbackView.adapter_view(WFP2Adapter)
