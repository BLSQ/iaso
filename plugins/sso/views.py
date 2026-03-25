import typing

from logging import getLogger

import requests

from allauth.account.utils import perform_login
from allauth.socialaccount.helpers import render_authentication_error
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.base import AuthError, ProviderException
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2Adapter,
    OAuth2LoginView,
    OAuth2View,
)


class SSOLoginView(OAuth2LoginView):
    """Override to skip the intermediate template and always redirect to the OAuth provider."""

    def dispatch(self, request, *args, **kwargs):
        return self.login(request, *args, **kwargs)


from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import PermissionDenied
from django.core.mail import EmailMultiAlternatives
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.template import loader
from django.views.decorators.csrf import csrf_exempt
from oauthlib.oauth2 import OAuth2Error
from requests import HTTPError, RequestException
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.api.query_params import APP_ID
from iaso.models import Account, Profile, Project, TenantUser
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError


logger = getLogger(__name__)


class ExtraData(typing.TypedDict):
    email: str
    sub: str
    given_name: typing.Optional[str]
    family_name: typing.Optional[str]


def send_mail(subject_template_name, email_template_name, context, from_email, to_email, html_email_template_name=None):
    subject = loader.render_to_string(subject_template_name, context)
    subject = "".join(subject.splitlines())
    body = loader.render_to_string(email_template_name, context)

    email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
    if html_email_template_name is not None:
        html_email = loader.render_to_string(html_email_template_name, context)
        email_message.attach_alternative(html_email, "text/html")

    email_message.send()


class SSOBaseAdapter(OAuth2Adapter):
    """Base adapter for generic SSO providers. Subclasses are created dynamically via create_adapter_class()."""

    supports_state = True

    @property
    def sso_config(self):
        return settings.SSO_PROVIDERS[self.provider_id]

    def send_new_account_email(self, request: HttpRequest, user):
        to_emails = self.sso_config.get("email_recipients_new_account", [])
        if not to_emails:
            logger.warning(
                "no 'email_recipients_new_account' configured for SSO provider %s, not sending new account mail",
                self.provider_id,
            )
            return

        current_site = get_current_site(request=request)
        site_name = current_site.name
        domain = current_site.domain
        profile_url = request.build_absolute_uri(
            f"/dashboard/settings/users/management/accountId/1/search/{user.username}/order/user__username/pageSize/20/page/1"
        )
        context = {
            "new_user": user,
            "profile_url": profile_url,
            "domain": domain,
            "site_name": site_name,
            "user": user,
        }
        for email in to_emails:
            email = email.strip()
            if not email:
                continue
            send_mail(
                subject_template_name="sso/new_account_subject.txt",
                email_template_name="sso/new_account_email.html",
                from_email=None,
                to_email=email,
                context=context,
            )

    def complete_login(self, request, app, token: str, response) -> SocialAccount:
        extra_data_get = requests.get(self.profile_url, headers={"Authorization": f"Bearer {token}"})
        extra_data_get.raise_for_status()
        extra_data: ExtraData = extra_data_get.json()

        try:
            email = extra_data["email"].lower().strip()
        except KeyError:
            email = extra_data["sub"].lower().strip()

        uid = extra_data["sub"].lower().strip()

        app_id = request.GET.get(APP_ID, None)
        account_name = self.sso_config["account_name"]

        if app_id:
            account = get_object_or_404(Project, app_id=app_id).account
            if app_id != account_name:
                uid = f"{app_id}_{uid}"
        else:
            account = Account.objects.get(name=account_name)

        try:
            social_account = SocialAccount.objects.get(uid=uid, provider=self.provider_id)
            social_account.extra_data = extra_data
        except SocialAccount.DoesNotExist:
            user = User.objects.filter(iaso_profile__account=account, email=email).first()

            if not user:
                new_user, tenant_main_user, tenant_account_user = TenantUser.objects.create_user_or_tenant_user(
                    data=UserCreationData(
                        username=email,
                        email=email,
                        first_name=extra_data.get("given_name"),
                        last_name=extra_data.get("family_name"),
                        account=account,
                    )
                )
                user = new_user or tenant_account_user
                user.set_unusable_password()
                Profile.objects.create(account=account, user=user)
                self.send_new_account_email(request, user)

            social_account = SocialAccount(uid=uid, provider=self.provider_id, extra_data=extra_data, user=user)

        social_account.save()
        return social_account


class SSOCallbackView(OAuth2View):
    def dispatch(self, request, *args, **kwargs):
        if "error" in request.GET or "code" not in request.GET:
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
            social_account = self.adapter.complete_login(request, app, token=token.token, response=access_token)
            return perform_login(
                request,
                social_account.user,
                email_verification=False,
                redirect_url=request.GET.get("next", "/"),
            )
        except (
            PermissionDenied,
            OAuth2Error,
            RequestException,
            ProviderException,
        ) as e:
            return render_authentication_error(request, self.adapter.provider_id, exception=e)


# --- Dynamic adapter/view creation ---

_adapter_classes = {}


def get_adapter_class(provider_id):
    """Create (or return cached) a dynamic OAuth2Adapter subclass for the given SSO provider."""
    if provider_id not in _adapter_classes:
        config = settings.SSO_PROVIDERS[provider_id]
        cls = type(
            f"SSOAdapter_{provider_id}",
            (SSOBaseAdapter,),
            {
                "provider_id": provider_id,
                "access_token_url": config["token_url"],
                "authorize_url": config["authorize_url"],
                "profile_url": config["userinfo_url"],
            },
        )
        _adapter_classes[provider_id] = cls
    return _adapter_classes[provider_id]


def make_token_view(provider_id):
    """Create a token exchange view for mobile app login flow."""

    @csrf_exempt
    @api_view(http_method_names=["POST", "GET"])
    @authentication_classes([])
    @permission_classes([])
    def token_view(request):
        token = request.data.get("token")
        if not token:
            return JsonResponse({"result": "error", "message": "missing token"}, status=400)

        adapter_cls = get_adapter_class(provider_id)
        adapter = adapter_cls(request)
        try:
            social_account = adapter.complete_login(request, app=None, token=token, response=None)
        except HTTPError as e:
            logger.exception(str(e))
            if e.response.status_code == 401 and e.response.json()["error"] == "invalid_token":
                return JsonResponse(
                    {"message": "Access token validation failed", "result": "error", "error": "invalid_token"},
                    status=401,
                )
            return JsonResponse(
                {"result": "error", "message": "Error login to auth server", "details": e.response.text}, status=500
            )
        except UsernameAlreadyExistsError as e:
            return JsonResponse({"result": "error", "message": e.message, "details": e.message}, status=409)
        except Exception as e:
            logger.exception(str(e))
            return JsonResponse({"result": "error", "message": "Error login account", "details": str(e)}, status=500)

        user = social_account.user
        refresh = RefreshToken.for_user(user)
        return JsonResponse({"refresh": str(refresh), "access": str(refresh.access_token)}, status=200)

    return token_view
