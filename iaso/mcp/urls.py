from django.urls import include, path

from iaso.mcp import oauth as oauth_views, views


app_name = "mcp"

urlpatterns = [
    path("mcp/tools.json", views.tools_json, name="tools_json"),
    path("mcp/me/", views.me, name="me"),
    path("mcp/app/assets/<path:path>", views.frontend_asset, name="spa_asset"),
    path("mcp/app/", views.spa, name="spa"),
    path("mcp/app/<path:rest>", views.spa, name="spa_rest"),
    path("mcp", views.mcp_endpoint, name="mcp_endpoint_no_slash"),
    path("mcp/", views.mcp_endpoint, name="mcp_endpoint"),
    path("mcp/<path:rest>", views.spa, name="spa_mcp_rest"),
    path("iaso-mark.png", views.frontend_mark, name="mcp_mark"),
    path("oauth/", include("iaso.mcp.oauth_urls")),
    path("oauth/", include("oauth2_provider.urls", namespace="oauth2_provider")),
    path(".well-known/", include("iaso.mcp.wellknown_urls")),
    path("register/", oauth_views.dynamic_client_registration, name="oauth_register_root"),
    path("register", oauth_views.dynamic_client_registration, name="oauth_register_root_no_slash"),
]
