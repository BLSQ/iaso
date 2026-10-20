"""MCP Django settings. Applied from hat.settings when MCP_ENABLED is true."""

from __future__ import annotations

import os

from typing import Any, MutableMapping


LOGOUT_NEXT_PATHS = (
    "/mcp/",
    "/mcp",
    "/mcp/login",
    "/mcp/install",
    "/mcp/app/",
    "/mcp/app",
    "/mcp/app/login",
    "/mcp/app/install",
)

DEFAULT_REDIRECT_HOSTS = {
    "localhost",
    "127.0.0.1",
    "::1",
    "anysphere.cursor-mcp",
    "www.cursor.com",
    "cursor.com",
    "claude.ai",
    "chatgpt.com",
    "chat.openai.com",
}


def apply(settings: MutableMapping[str, Any]) -> None:
    """Mutate Django settings in-place (hat.settings globals)."""
    print("MCP enabled: /mcp JSON-RPC + OAuth (logged-in IASO user)")
    base_dir = settings["BASE_DIR"]
    env = settings["env"]

    settings["TEMPLATES"][0]["DIRS"].append(os.path.join(base_dir, "iaso", "mcp", "templates"))
    settings["STATICFILES_DIRS"].append(os.path.join(base_dir, "iaso", "mcp", "static"))
    frontend_dist = os.path.join(base_dir, "iaso", "mcp", "frontend", "dist")
    if os.path.isdir(frontend_dist):
        settings["STATICFILES_DIRS"].append(frontend_dist)

    middleware = settings["MIDDLEWARE"]
    try:
        axes_idx = middleware.index("axes.middleware.AxesMiddleware")
    except ValueError:
        axes_idx = len(middleware)
    middleware.insert(axes_idx, "oauth2_provider.middleware.OAuth2TokenMiddleware")
    settings["AUTHENTICATION_BACKENDS"].append("oauth2_provider.backends.OAuth2Backend")
    settings["LOGOUT_NEXT_ALLOWED_PATHS"] = list(settings["LOGOUT_NEXT_ALLOWED_PATHS"]) + list(LOGOUT_NEXT_PATHS)
    settings["OAUTH2_PROVIDER"] = {
        "SCOPES": {"iaso:mcp": "Access the IASO MCP server"},
        "DEFAULT_SCOPES": ["iaso:mcp"],
        "ACCESS_TOKEN_EXPIRE_SECONDS": env.int("OAUTH2_ACCESS_TOKEN_EXPIRE_SECONDS", default=3600),
        "REFRESH_TOKEN_EXPIRE_SECONDS": env.int("OAUTH2_REFRESH_TOKEN_EXPIRE_SECONDS", default=30 * 24 * 60 * 60),
        "ALLOWED_REDIRECT_URI_SCHEMES": [
            scheme.strip()
            for scheme in env.str("OAUTH2_ALLOWED_REDIRECT_URI_SCHEMES", default="https,http,cursor").split(",")
            if scheme.strip()
        ],
        "PKCE_REQUIRED": True,
    }
    redirect_hosts = set(DEFAULT_REDIRECT_HOSTS)
    extra = env.list("OAUTH2_ALLOWED_REDIRECT_URI_HOSTS", default=[], delimiter=",")
    redirect_hosts.update(host.strip() for host in extra if host.strip())
    settings["OAUTH2_ALLOWED_REDIRECT_URI_HOSTS"] = redirect_hosts
    settings["MCP_DCR_RATE_LIMIT"] = env.int("MCP_DCR_RATE_LIMIT", default=10)
    settings["MCP_DCR_RATE_WINDOW"] = env.int("MCP_DCR_RATE_WINDOW", default=3600)
