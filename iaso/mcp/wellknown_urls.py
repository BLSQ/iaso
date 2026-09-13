from django.urls import path

from iaso.mcp import oauth


urlpatterns = [
    path("oauth-protected-resource", oauth.protected_resource_metadata, name="oauth_protected_resource"),
    path("oauth-protected-resource/mcp", oauth.protected_resource_metadata, name="oauth_protected_resource_mcp"),
    path(
        "oauth-protected-resource/mcp/",
        oauth.protected_resource_metadata,
        name="oauth_protected_resource_mcp_slash",
    ),
    path("oauth-authorization-server", oauth.oauth_server_metadata, name="oauth_authorization_server"),
    path("oauth-authorization-server/mcp", oauth.oauth_server_metadata, name="oauth_authorization_server_mcp"),
    path(
        "oauth-authorization-server/mcp/",
        oauth.oauth_server_metadata,
        name="oauth_authorization_server_mcp_slash",
    ),
    path("openid-configuration", oauth.openid_configuration, name="openid_configuration"),
]
