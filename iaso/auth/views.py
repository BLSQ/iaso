from django.conf import settings
from django.contrib.auth.views import LogoutView, PasswordResetView
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import url_has_allowed_host_and_scheme

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
    ``settings.LOGOUT_NEXT_ALLOWED_PATHS`` (and is a same-host relative URL).
    Anything else falls back to the default redirect (``next_page`` or
    ``settings.LOGOUT_REDIRECT_URL``).

    Strict allow-listing (rather than just a same-host check) closes
    CWE-601 / OWASP "Unvalidated Redirects and Forwards": an internal page
    on the same host can still be weaponised for phishing.

    Plugins extend the allow-list via their ``plugin_settings.CONSTANTS``.
    """

    def get_redirect_url(self):
        candidate = (
            self.request.POST.get(self.redirect_field_name) or self.request.GET.get(self.redirect_field_name) or ""
        )
        if candidate:
            allowed_path = self._get_allowed_path(candidate)
            if allowed_path:
                return allowed_path
        # Returning "" makes ``get_success_url`` fall through to
        # ``get_default_redirect_url`` (which uses ``next_page``).
        return ""

    def _get_allowed_path(self, candidate: str) -> str:
        """Return the matching allowlisted path, or empty string if not allowed.

        Strips trailing slashes before comparison; returns the configured path.
        """
        normalized = candidate.rstrip("/")
        allowed_paths = getattr(settings, "LOGOUT_NEXT_ALLOWED_PATHS", [])
        for allowed_path in allowed_paths:
            if normalized == allowed_path.rstrip("/") and url_has_allowed_host_and_scheme(
                allowed_path,
                allowed_hosts={self.request.get_host()},
                require_https=self.request.is_secure(),
            ):
                return allowed_path
        return ""
