"""URLconf used by the SSO tests.

The real root URLconf (``hat.urls``) only registers the SSO provider URLs when
``SSO_PROVIDERS`` is non-empty *at import time*, which is not the case in the CI
environment. The SSO tests point ``ROOT_URLCONF`` here (via ``override_settings``)
so the provider URLs are always built from the overridden ``SSO_PROVIDERS``,
making the tests self-contained regardless of the environment configuration.
"""

from hat.urls import get_sso_urlpatterns


urlpatterns = get_sso_urlpatterns()
