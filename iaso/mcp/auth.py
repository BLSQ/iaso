"""OAuth2 Bearer authentication limited to the MCP endpoint.

The mobile app and scripts send simplejwt tokens as `Authorization: Bearer`, handled by DRF.
Checking them as OAuth tokens would run `authenticate()` on every such request:
an access token lookup, then `user_login_failed` and the axes failure queries.
"""

from __future__ import annotations

from oauth2_provider.backends import OAuth2Backend
from oauth2_provider.middleware import OAuth2TokenMiddleware


MCP_ENDPOINT_PATHS = ("/mcp", "/mcp/")


def is_mcp_endpoint(request) -> bool:
    return request is not None and request.path_info in MCP_ENDPOINT_PATHS


class McpOAuth2TokenMiddleware(OAuth2TokenMiddleware):
    def __call__(self, request):
        if not is_mcp_endpoint(request):
            return self.get_response(request)
        return super().__call__(request)


class McpOAuth2Backend(OAuth2Backend):
    def authenticate(self, request=None, **credentials):
        if not is_mcp_endpoint(request):
            return None
        return super().authenticate(request, **credentials)
