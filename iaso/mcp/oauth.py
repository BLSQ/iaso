"""MCP OAuth 2.1 + PKCE + DCR, aligned with OpenHEXA.

Cursor uses ``cursor://anysphere.cursor-mcp/oauth/callback``. That host and
scheme must be allowlisted here.
"""

from __future__ import annotations

import json
import uuid

from urllib.parse import urlparse

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from oauth2_provider.models import Application
from oauth2_provider.views import AuthorizationView


MCP_SCOPE = "iaso:mcp"
LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})
DEFAULT_DCR_RATE_LIMIT = 10
DEFAULT_DCR_RATE_WINDOW = 3600


def get_base_url(request: HttpRequest) -> str:
    scheme = "https" if request.is_secure() else request.scheme
    host = request.get_host()
    if request.headers.get("X-Forwarded-Proto") == "https":
        scheme = "https"
    forwarded_host = request.headers.get("X-Forwarded-Host")
    if forwarded_host:
        host = forwarded_host.split(",")[0].strip()
    return f"{scheme}://{host}"


def mcp_tools() -> list[dict]:
    from iaso.mcp.protocol import get_tools_list

    return [{"name": item["name"], "description": item.get("description", "")} for item in get_tools_list()]


def _server_metadata(request: HttpRequest) -> dict:
    base_url = get_base_url(request)
    return {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/oauth/authorize/",
        "token_endpoint": f"{base_url}/oauth/token/",
        "registration_endpoint": f"{base_url}/oauth/register/",
        "scopes_supported": [MCP_SCOPE],
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": [
            "client_secret_basic",
            "client_secret_post",
            "none",
        ],
    }


@require_GET
def protected_resource_metadata(request: HttpRequest) -> JsonResponse:
    base_url = get_base_url(request)
    return JsonResponse(
        {
            # Cursor canonicalizes the MCP URL without a trailing slash.
            "resource": f"{base_url}/mcp",
            "authorization_servers": [base_url],
            "scopes_supported": [MCP_SCOPE],
            "bearer_methods_supported": ["header"],
        }
    )


@require_GET
def oauth_server_metadata(request: HttpRequest) -> JsonResponse:
    return JsonResponse(_server_metadata(request))


@require_GET
def openid_configuration(request: HttpRequest) -> JsonResponse:
    return JsonResponse(_server_metadata(request))


def _client_ip(request: HttpRequest) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    return request.META.get("REMOTE_ADDR") or "unknown"


def dcr_rate_limited(request: HttpRequest) -> bool:
    """True when this client IP has exceeded the DCR registration cap."""
    from django.core.cache import cache

    limit = int(getattr(settings, "MCP_DCR_RATE_LIMIT", DEFAULT_DCR_RATE_LIMIT))
    window = int(getattr(settings, "MCP_DCR_RATE_WINDOW", DEFAULT_DCR_RATE_WINDOW))
    if limit <= 0:
        return False
    key = f"mcp.dcr.{_client_ip(request)}"
    if cache.add(key, 1, window):
        return False
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, window)
        return False
    return count > limit


def redirect_uri_error(uri: str) -> str | None:
    parsed = urlparse(uri)
    host = parsed.hostname
    scheme = parsed.scheme
    allowed_hosts = settings.OAUTH2_ALLOWED_REDIRECT_URI_HOSTS
    allowed_schemes = set(settings.OAUTH2_PROVIDER.get("ALLOWED_REDIRECT_URI_SCHEMES", []))
    if not host or host not in allowed_hosts:
        return f"Redirect URI host '{host}' is not allowed"
    if scheme not in allowed_schemes:
        return f"Redirect URI scheme '{scheme}' is not allowed"
    if scheme == "http" and host not in LOOPBACK_HOSTS:
        return "HTTP scheme is only allowed for loopback redirect URIs"
    return None


@csrf_exempt
@require_POST
def dynamic_client_registration(request: HttpRequest) -> JsonResponse:
    if dcr_rate_limited(request):
        window = int(getattr(settings, "MCP_DCR_RATE_WINDOW", DEFAULT_DCR_RATE_WINDOW))
        response = JsonResponse(
            {
                "error": "too_many_requests",
                "error_description": "Client registration rate limit exceeded",
            },
            status=429,
        )
        response["Retry-After"] = str(window)
        return response

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "invalid_request"}, status=400)

    redirect_uris = data.get("redirect_uris", [])
    client_name = data.get("client_name", "MCP Client")

    if not redirect_uris:
        return JsonResponse(
            {
                "error": "invalid_client_metadata",
                "error_description": "redirect_uris is required",
            },
            status=400,
        )

    for uri in redirect_uris:
        error = redirect_uri_error(uri)
        if error:
            return JsonResponse({"error": "invalid_redirect_uri", "error_description": error}, status=400)

    token_endpoint_auth_method = data.get("token_endpoint_auth_method", "none")
    if token_endpoint_auth_method == "none":
        client_type = Application.CLIENT_PUBLIC
        client_secret = ""
    else:
        client_type = Application.CLIENT_CONFIDENTIAL
        client_secret = uuid.uuid4().hex

    application = Application.objects.create(
        name=client_name[:255],
        client_id=uuid.uuid4().hex,
        client_secret=client_secret,
        client_type=client_type,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris=" ".join(redirect_uris),
        skip_authorization=False,
    )

    response_data = {
        "client_id": application.client_id,
        "client_name": client_name,
        "redirect_uris": redirect_uris,
        "grant_types": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_method": token_endpoint_auth_method,
    }
    if client_secret:
        response_data["client_secret"] = client_secret
    return JsonResponse(response_data, status=201)


class OAuthAuthorizeView(AuthorizationView):
    login_url = "/login/"

    def get_login_url(self):
        next_url = self.request.get_full_path()
        return f"{self.login_url}?next={next_url}"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        scopes = (self.request.GET.get("scope") or self.request.POST.get("scope") or "").split()
        if MCP_SCOPE in scopes or not scopes:
            context["tools"] = mcp_tools()
        return context

    def redirect(self, redirect_to, application):
        html = render_to_string(
            "oauth2_provider/authorized.html",
            {"redirect_uri": redirect_to, "tools": mcp_tools()},
            request=self.request,
        )
        return HttpResponse(html)
