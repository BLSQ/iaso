from allauth.socialaccount.providers.base import ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider
from django.conf import settings


def _extract_common_fields(self, data):
    return dict(
        email=data.get("email"),
        username=data.get("username"),
        first_name=data.get("first_name") or data.get("given_name"),
        last_name=data.get("last_name") or data.get("family_name"),
    )


_provider_classes = {}


def get_provider_class(provider_id):
    """Create (or return cached) a dynamic allauth Provider class for the given SSO provider."""
    if provider_id not in _provider_classes:
        config = settings.SSO_PROVIDERS[provider_id]
        cls = type(
            f"SSOProvider_{provider_id}",
            (OAuth2Provider,),
            {
                "id": provider_id,
                "name": config.get("name", provider_id),
                "account_class": ProviderAccount,
                "extract_common_fields": _extract_common_fields,
            },
        )
        _provider_classes[provider_id] = cls
    return _provider_classes[provider_id]


# allauth discovers providers via this module-level list
provider_classes = [get_provider_class(pid) for pid in getattr(settings, "SSO_PROVIDERS", {})]
