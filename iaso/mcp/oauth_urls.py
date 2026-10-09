from django.urls import path

from iaso.mcp import oauth


urlpatterns = [
    path("authorize/", oauth.OAuthAuthorizeView.as_view(), name="oauth2_authorize"),
    path("register/", oauth.dynamic_client_registration, name="oauth_register"),
    path("register", oauth.dynamic_client_registration, name="oauth_register_no_slash"),
    path(
        "token/.well-known/openid-configuration",
        oauth.openid_configuration,
        name="oauth_token_openid_configuration",
    ),
]
