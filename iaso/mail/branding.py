"""Context variables shared by core HTML/plain email templates."""

import base64
import mimetypes
import os

from email.utils import parseaddr
from typing import Optional, Tuple
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.staticfiles import finders


def _user_manual_url(*, protocol: str, domain: str) -> str:
    path = (getattr(settings, "USER_MANUAL_PATH", None) or "").strip()
    if not path:
        return ""
    if path.startswith(("http://", "https://", "//")):
        return path
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{protocol}://{domain}{path}"


def _resolve_logo_filesystem_path() -> Optional[str]:
    """Return absolute path to ``LOGO_PATH`` on disk, or None (same asset as ``email_logo_url``)."""
    rel = settings.LOGO_PATH.lstrip("/")
    found = finders.find(settings.LOGO_PATH)
    if found and os.path.isfile(found):
        return found
    for root in getattr(settings, "STATICFILES_DIRS", ()) or ():
        candidate = os.path.join(root, rel)
        if os.path.isfile(candidate):
            return candidate
    static_root = getattr(settings, "STATIC_ROOT", None)
    if static_root:
        candidate = os.path.join(static_root, rel)
        if os.path.isfile(candidate):
            return candidate
    return None


def _static_logo_data_uri() -> Optional[str]:
    """Return a data: URI for the configured logo, for offline HTML previews."""
    path = _resolve_logo_filesystem_path()
    if not path:
        return None
    mime, _ = mimetypes.guess_type(path)
    mime = mime or "application/octet-stream"
    try:
        with open(path, "rb") as f:
            raw = f.read()
    except OSError:
        return None
    if len(raw) > 1_500_000:
        return None
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _contact_from_default_from_email() -> Tuple[str, str]:
    """Return (mailto_href, display_label) derived from ``DEFAULT_FROM_EMAIL``."""
    raw = settings.DEFAULT_FROM_EMAIL or ""
    name, addr = parseaddr(raw)
    addr = (addr or "").strip()
    if addr:
        mailto = f"mailto:{addr}"
        display = f"{name} <{addr}>" if name else addr
        return mailto, display
    return "mailto:", raw or ""


def core_email_branding_context(*, protocol: str, domain: str, embed_static_logo: bool = False) -> dict:
    """
    Values for ``emails/base_iaso_email.*`` wrappers.

    ``protocol`` and ``domain`` are used to build an absolute logo URL when
    ``STATIC_URL`` is a site-relative path (typical in development).

    When ``embed_static_logo`` is True, the logo is inlined as a data URI so
    ``render_core_email_previews`` HTML files show images without a running server.
    """
    static_url = settings.STATIC_URL
    logo_path = settings.LOGO_PATH.lstrip("/")

    if static_url.startswith(("http://", "https://", "//")):
        base = static_url if static_url.endswith("/") else f"{static_url}/"
        email_logo_url = urljoin(base, logo_path)
    else:
        if not static_url.startswith("/"):
            static_url = f"/{static_url}"
        if not static_url.endswith("/"):
            static_url = f"{static_url}/"
        email_logo_url = f"{protocol}://{domain}{static_url}{logo_path}"

    if embed_static_logo:
        data_uri = _static_logo_data_uri()
        if data_uri:
            email_logo_url = data_uri

    email_contact_mailto, email_contact_display = _contact_from_default_from_email()

    return {
        "email_app_title": settings.APP_TITLE,
        "email_theme_primary": settings.THEME_PRIMARY_COLOR,
        "email_theme_secondary": settings.THEME_SECONDARY_COLOR,
        "email_theme_background": settings.THEME_PRIMARY_BACKGROUND_COLOR,
        "email_logo_url": email_logo_url,
        "email_contact_mailto": email_contact_mailto,
        "email_contact_display": email_contact_display,
        "email_user_manual_url": _user_manual_url(protocol=protocol, domain=domain),
    }
