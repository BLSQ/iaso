import base64
import binascii
import json
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
from django.utils.translation import gettext_lazy as _


class SSOLoginView(OAuth2LoginView):
    """Override to skip the intermediate template and always redirect to the OAuth provider."""

    def dispatch(self, request, *args, **kwargs):
        return self.login(request, *args, **kwargs)


from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from oauthlib.oauth2 import OAuth2Error
from requests import HTTPError, RequestException
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from iaso.api.query_params import APP_ID
from iaso.models import Account, Project


logger = getLogger(__name__)


class ExtraData(typing.TypedDict):
    email: str
    sub: str
    given_name: typing.Optional[str]
    family_name: typing.Optional[str]


class InvalidAppIdException(Exception):
    def __init__(self, app_id: str):
        message = _("Invalid app id {}").format(app_id)
        super().__init__(message)


class InvalidAccountConfiguration(Exception):
    def __init__(self):
        message = _("Invalid configuration. Please contact the administrator")
        super().__init__(message)


class InvalidTokenException(Exception):
    def __init__(self):
        message = _("Token was not issued for this application")
        super().__init__(message)


class MultipleUsersWithSameEmailException(Exception):
    def __init__(self, email: str):
        message = _("Multiple users found with email {}").format(email)
        super().__init__(message)


class UnknownUserException(Exception):
    def __init__(self):
        message = _(
            "No account found for this email address. Accounts must be created by an "
            "administrator before you can sign in."
        )
        super().__init__(message)


def decode_jwt_claims(token: str) -> dict:
    """Decode a JWT payload WITHOUT verifying its signature.

    The token's authenticity is established separately by the Microsoft Graph
    userinfo call in ``complete_login`` (which rejects forged or expired tokens),
    so here we only decode the payload to read the ``appid``/``azp`` claim and
    confirm the token was issued for our own app registration. This must always
    stay paired with the userinfo call — on its own an unverified payload is
    forgeable.
    """
    try:
        payload_segment = token.split(".")[1]
        padding = "=" * (-len(payload_segment) % 4)
        decoded = base64.urlsafe_b64decode(payload_segment + padding)
        return json.loads(decoded)
    except (AttributeError, IndexError, ValueError, binascii.Error):
        raise InvalidTokenException()


class SSOBaseAdapter(OAuth2Adapter):
    """Base adapter for generic SSO providers. Subclasses are created dynamically via create_adapter_class()."""

    supports_state = True

    @property
    def sso_config(self):
        return settings.SSO_PROVIDERS[self.provider_id]

    def complete_login(self, request, app, token: str, response) -> SocialAccount:
        # Ensure the presented access token was issued for our own app registration
        # (client id), and not for another app or another tenant. Together with the
        # Graph userinfo call below (which proves the token is genuine), this blocks
        # token-replay / nOAuth-style impersonation on the unauthenticated token endpoint.
        claims = decode_jwt_claims(token)
        token_app_id = claims.get("appid") or claims.get("azp")
        if token_app_id != self.sso_config["client_id"]:
            raise InvalidTokenException()

        # Pin the tenant the token was issued from. This is the control that actually
        # stops nOAuth-style forgery: even a multi-tenant app would let an attacker mint
        # a token (with our appid) from their own tenant carrying a forged email, but its
        # `tid` would not match ours. Enforced only for providers that declare a tenant_id
        # (i.e. Entra); other OIDC providers should validate `iss` instead.
        expected_tenant_id = self.sso_config.get("tenant_id")
        if expected_tenant_id and claims.get("tid") != expected_tenant_id:
            raise InvalidTokenException()

        extra_data_get = requests.get(self.profile_url, headers={"Authorization": f"Bearer {token}"})
        extra_data_get.raise_for_status()
        extra_data: ExtraData = extra_data_get.json()
        try:
            email = extra_data["email"].lower().strip()
        except KeyError:
            email = extra_data["sub"].lower().strip()

        uid = extra_data["sub"].lower().strip()

        app_id: str = request.GET.get(APP_ID, None)
        account_id: int = self.sso_config["account_id"]

        if app_id:
            try:
                account = Project.objects.filter(account_id=account_id).get(app_id=app_id).account
            except Project.DoesNotExist:
                raise InvalidAppIdException(app_id)
        else:
            try:
                account = Account.objects.get(id=account_id)
            except Account.DoesNotExist:
                raise InvalidAccountConfiguration

        try:
            social_account = SocialAccount.objects.get(uid=uid, provider=self.provider_id)
            social_account.extra_data = extra_data
        except SocialAccount.DoesNotExist:
            # A multi-account (tenant) user authenticates through their `main_user`
            # (which has no profile of its own and drives the under-the-hood account
            # switch), so resolve to it when this email belongs to a tenant user.
            main_users = User.objects.filter(email=email, tenant_users__isnull=False).distinct()
            if main_users.count() > 1:
                raise MultipleUsersWithSameEmailException(email)
            user = main_users.first()

            if not user:
                # Otherwise expect at most one account-bound user for this email. More
                # than one *unlinked* user sharing it is ambiguous — fail rather than guess.
                account_users = User.objects.filter(email=email, iaso_profile__isnull=False)
                if account_users.count() > 1:
                    raise MultipleUsersWithSameEmailException(email)
                user = account_users.filter(iaso_profile__account=account).first()

            if not user:
                # SSO never provisions accounts: they must already exist, created ahead of
                # time by an administrator. Reject rather than silently creating one.
                raise UnknownUserException()

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
            InvalidTokenException,
            MultipleUsersWithSameEmailException,
            UnknownUserException,
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

            # just in case e.response.json() crashes
            try:
                data = e.response.json()
                error_code = data.get("error")
            except Exception:
                error_code = None

            if e.response.status_code == 401 and error_code == "invalid_token":
                return JsonResponse(
                    {"message": _("Access token validation failed"), "result": "error", "details": "invalid_token"},
                    status=401,
                )
            return JsonResponse(
                {
                    "result": "error",
                    "message": _("Error login to auth server"),
                    "details": _("Error login to auth server"),
                },
                status=500,
            )
        except InvalidTokenException as e:
            # Log the detail server-side; return a static message so we don't leak state to the client.
            logger.warning("SSO token rejected: %s", e)
            message = _("Token was not issued for this application")
            return JsonResponse({"result": "error", "message": message, "details": message}, status=401)
        except InvalidAppIdException as e:
            logger.warning("SSO login rejected: %s", e)
            message = _("Invalid app id")
            return JsonResponse({"result": "error", "message": message, "details": message}, status=400)
        except InvalidAccountConfiguration as e:
            logger.warning("SSO login rejected: %s", e)
            message = _("Invalid configuration. Please contact the administrator")
            return JsonResponse({"result": "error", "message": message, "details": message}, status=400)
        except MultipleUsersWithSameEmailException as e:
            logger.warning("SSO login rejected: %s", e)
            message = _("Could not log you in. Please contact the administrator")
            return JsonResponse({"result": "error", "message": message, "details": message}, status=409)
        except UnknownUserException as e:
            logger.warning("SSO login rejected: %s", e)
            message = _(
                "No account found for this email address. Accounts must be created by an "
                "administrator before you can sign in."
            )
            return JsonResponse({"result": "error", "message": message, "details": message}, status=404)
        except Exception as e:
            logger.exception(str(e))
            return JsonResponse(
                {"result": "error", "message": _("Error login account"), "details": _("Internal server error")},
                status=500,
            )

        user = social_account.user
        refresh = RefreshToken.for_user(user)
        return JsonResponse({"refresh": str(refresh), "access": str(refresh.access_token)}, status=200)

    return token_view
