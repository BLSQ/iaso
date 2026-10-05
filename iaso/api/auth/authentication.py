from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # To not perform the csrf check previously happening


class CsrfExemptSessionAuthenticationScheme(OpenApiAuthenticationExtension):
    """drf-spectacular's built-in `SessionScheme` only matches `SessionAuthentication` exactly (no
    `match_subclasses`), so it never picks up this subclass - without this, every endpoint using
    `CsrfExemptSessionAuthentication` (e.g. `OrgUnitViewSetV3`) generates an "unresolved authenticator"
    schema warning."""

    target_class = CsrfExemptSessionAuthentication
    name = "cookieAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "apiKey", "in": "cookie", "name": settings.SESSION_COOKIE_NAME}
