"""MCP identity is the logged-in IASO Django user (OAuth Bearer). No stored tokens."""

from __future__ import annotations

from contextvars import ContextVar
from typing import Any

from django.conf import settings

from iaso.mcp.client import IasoClient


_current_user: ContextVar[Any] = ContextVar("mcp_user", default=None)
_current_request: ContextVar[Any] = ContextVar("mcp_request", default=None)


def set_current_user(user) -> None:
    _current_user.set(user)


def set_current_request(request) -> None:
    _current_request.set(request)


def get_user():
    user = _current_user.get()
    if user is None or not getattr(user, "is_authenticated", False):
        raise PermissionError("MCP request is not authenticated.")
    return user


def get_client() -> IasoClient:
    return IasoClient.for_user(get_user(), request=_current_request.get())


def build_client(*_args, **_kwargs) -> IasoClient:
    message = (
        "Stdio /.env IASO credentials are disabled. "
        "MCP tools run as the logged-in IASO user (OAuth or this server session)."
    )
    raise RuntimeError(message)


def account_info() -> dict[str, str]:
    user = get_user()
    profile = getattr(user, "iaso_profile", None)
    account = getattr(profile, "account", None) if profile is not None else None
    request = _current_request.get()
    if request is not None:
        from iaso.mcp.oauth import get_base_url

        base_url = get_base_url(request)
    else:
        domain = getattr(settings, "DNS_DOMAIN", "localhost:8081")
        scheme = "https" if getattr(settings, "SESSION_COOKIE_SECURE", False) else "http"
        base_url = f"{scheme}://{domain}"
    return {
        "base_url": base_url,
        "login": user.get_username(),
        "auth": "iaso_session",
        "account_id": str(getattr(account, "id", "") or ""),
        "account_name": getattr(account, "name", "") or "",
    }


def public_whoami_fields(user, request=None) -> dict[str, Any]:
    profile = getattr(user, "iaso_profile", None)
    account = getattr(profile, "account", None) if profile is not None else None
    full_name = " ".join(part for part in (user.first_name, user.last_name) if part).strip()
    if request is not None:
        from iaso.mcp.oauth import get_base_url

        base_url = get_base_url(request)
    else:
        domain = getattr(settings, "DNS_DOMAIN", "localhost:8081")
        scheme = "https" if getattr(settings, "SESSION_COOKIE_SECURE", False) else "http"
        base_url = f"{scheme}://{domain}"
    return {
        "ok": True,
        "login": user.get_username(),
        "base_url": base_url,
        "account_id": getattr(account, "id", None),
        "account_name": getattr(account, "name", "") or "",
        "user_full_name": full_name or user.get_username(),
        "auth_mode": "iaso_session",
    }
