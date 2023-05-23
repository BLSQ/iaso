import typing

import requests
from allauth.account.utils import perform_login
from allauth.socialaccount import app_settings
from allauth.socialaccount.helpers import render_authentication_error
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.auth0.views import Auth0OAuth2Adapter
from allauth.socialaccount.providers.base import AuthError, ProviderException
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2LoginView,
    OAuth2View,
)
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from oauthlib.oauth2 import OAuth2Error
from requests import RequestException

from iaso.models import Account, Profile
from .provider import WFPProvider


class ExtraData(typing.TypedDict):
    email: str
    sub: str  # same as email
    given_name: typing.Optional[str]
    family_name: typing.Optional[str]


class WFP2Adapter(Auth0OAuth2Adapter):
    provider_id = WFPProvider.id
    supports_state = True

    settings = app_settings.PROVIDERS.get(provider_id, {})
    provider_base_url = settings.get("AUTH0_URL")

    access_token_url = "{0}/token".format(provider_base_url)
    authorize_url = "{0}/authorize".format(provider_base_url)
    profile_url = "{0}/userinfo".format(provider_base_url)

    def complete_login(self, request, app, token, response):
        # simplify the logic from django-allauth a lot so the flow is less flexible but more followable
        # search if we have a SocialAccount linked to this user
        # if not create one and connect it to an existing user if there is already one with this email
        # contrary to the all auth version it return a SocialAccount
        # Call the userinfo url with the identifying token to get more data on the user
        extra_data_get = requests.get(self.profile_url, params={"access_token": token.token})
        extra_data_get.raise_for_status()
        extra_data: ExtraData = extra_data_get.json()
        email = extra_data["email"].lower().strip()
        # the sub is the email, wfp verify it so let's trust this
        uid = extra_data["sub"].lower().strip()
        account = Account.objects.get(name=self.settings["IASO_ACCOUNT_NAME"])

        try:
            # user is required, can't use get_or_create
            socialaccount = SocialAccount.objects.get(uid=uid, provider=self.provider_id)
            # update extra data
            socialaccount.extra_data = extra_data
        except SocialAccount.DoesNotExist:
            users = User.objects.filter(iaso_profile__account=account).filter(email=email)
            user = users.first()
            if not user:
                user = User.objects.create(
                    email=email,
                    username=email,
                    first_name=extra_data.get("given_name"),
                    last_name=extra_data.get("family_name"),
                )
                user.set_unusable_password()
                iaso_profile = Profile.objects.create(
                    account=account,
                    user=user,
                )
                user.iaso_profile = iaso_profile
                user.save()

            socialaccount = SocialAccount(uid=uid, provider=self.provider_id, extra_data=extra_data, user=user)

        socialaccount.save()
        return socialaccount


class WFPCallbackView(OAuth2View):
    adapter: WFP2Adapter
    # request: Request

    def dispatch(self, request, *args, **kwargs):
        if "error" in request.GET or "code" not in request.GET:
            # Distinguish cancel from error
            auth_error = request.GET.get("error", None)
            if auth_error == self.adapter.login_cancelled_error:
                error = AuthError.CANCELLED
            else:
                error = AuthError.UNKNOWN
            return render_authentication_error(request, self.adapter.provider_id, error=error)
        app = self.adapter.get_provider().get_app(request)
        client = self.get_client(request, app)

        try:
            access_token = self.adapter.get_access_token_data(request, app, client)
            token = self.adapter.parse_token(access_token)
            token.app = app
            social_account = self.adapter.complete_login(request, app, token, response=access_token)
            return perform_login(
                request,
                social_account.user,
                email_verification=False,
                redirect_url=request.GET.get("next", "/dashboard/"),
            )
        except (
            PermissionDenied,
            OAuth2Error,
            RequestException,
            ProviderException,
        ) as e:
            return render_authentication_error(request, self.adapter.provider_id, exception=e)


oauth2_login = OAuth2LoginView.adapter_view(WFP2Adapter)
oauth2_callback = WFPCallbackView.adapter_view(WFP2Adapter)
