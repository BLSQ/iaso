from django.conf import settings
from django.contrib.auth.views import LogoutView, PasswordResetView
from django.contrib.sites.shortcuts import get_current_site

from iaso.mail.branding import core_email_branding_context


class IasoPasswordResetView(PasswordResetView):
    """Password reset emails get the same branding context as other core IASO mail."""

    def form_valid(self, form):
        protocol = "https" if self.request.is_secure() else "http"
        domain = get_current_site(self.request).domain
        self.extra_email_context = core_email_branding_context(protocol=protocol, domain=domain)
        return super().form_valid(form)


class IasoLogoutView(LogoutView):
    """LogoutView that honours ``?next=<path>`` only when it appears in
    ``settings.LOGOUT_NEXT_ALLOWED_PATHS``. Anything else falls back to
    the default redirect (``next_page`` or ``settings.LOGOUT_REDIRECT_URL``).

    Strict allow-listing (rather than just the same-host check Django's
    ``LogoutView`` already does) closes CWE-601 / OWASP "Unvalidated
    Redirects and Forwards": an internal page on the same host can still
    be weaponised for phishing.

    Allow-list entries are matched after trailing-slash normalisation, so
    ``/foo`` and ``/foo/`` both match a configured ``/foo``.
    """

    def get_redirect_url(self):
        redirect = super().get_redirect_url()
        normalized = redirect.rstrip("/")
        allowlist = {p.rstrip("/") for p in settings.LOGOUT_NEXT_ALLOWED_PATHS}
        if normalized and normalized in allowlist:
            return normalized
        return ""
