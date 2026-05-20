from django.conf import settings
from django.urls import path

from .views import SSOCallbackView, SSOLoginView, get_adapter_class, make_token_view


def get_sso_urlpatterns():
    """Generate URL patterns for all configured SSO providers."""
    patterns = []
    for provider_id, config in getattr(settings, "SSO_PROVIDERS", {}).items():
        adapter_cls = get_adapter_class(provider_id)

        login_path = config.get("login_path", f"{provider_id}/login/")
        callback_path = config.get("callback_path", f"{provider_id}/login/callback/")
        token_path = config.get("token_path", f"{provider_id}/token/")

        patterns += [
            path(login_path, SSOLoginView.adapter_view(adapter_cls), name=f"{provider_id}_login"),
            path(callback_path, SSOCallbackView.adapter_view(adapter_cls), name=f"{provider_id}_callback"),
            path(token_path, make_token_view(provider_id), name=f"{provider_id}_token"),
        ]
    return patterns
