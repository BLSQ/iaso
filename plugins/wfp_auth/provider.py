from allauth.socialaccount.providers.auth0.provider import Auth0Provider
from allauth.socialaccount.providers.base import ProviderAccount


class WFPProvider(Auth0Provider):
    id = "wfp"
    name = "WFP"
    account_class = ProviderAccount

    def extract_common_fields(self, data):
        return dict(
            email=data.get("email"),
            username=data.get("username"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
        )


provider_classes = [WFPProvider]
