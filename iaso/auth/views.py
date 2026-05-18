from django.contrib.auth.views import PasswordResetView
from django.contrib.sites.shortcuts import get_current_site

from iaso.mail.branding import core_email_branding_context


class IasoPasswordResetView(PasswordResetView):
    """Password reset emails get the same branding context as other core IASO mail."""

    def form_valid(self, form):
        protocol = "https" if self.request.is_secure() else "http"
        domain = get_current_site(self.request).domain
        self.extra_email_context = core_email_branding_context(protocol=protocol, domain=domain)
        return super().form_valid(form)
