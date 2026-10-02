from __future__ import annotations

import json

from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from oauth2_provider.models import AccessToken, Application

from iaso.mcp.oauth import MCP_SCOPE, redirect_uri_error
from iaso.mcp.recipes.fill_account import resolve_xlsx_path
from iaso.test import TestCase


CURSOR_REDIRECT = "cursor://anysphere.cursor-mcp/oauth/callback"


class RedirectUriAllowlistTest(TestCase):
    def test_allows_cursor_and_loopback(self):
        self.assertIsNone(redirect_uri_error(CURSOR_REDIRECT))
        self.assertIsNone(redirect_uri_error("https://www.cursor.com/oauth/callback"))
        self.assertIsNone(redirect_uri_error("http://127.0.0.1:8787/oauth/callback"))
        self.assertIsNone(redirect_uri_error("http://localhost:3335/oauth/callback"))

    def test_rejects_unknown_host(self):
        error = redirect_uri_error("https://evil.example/callback")
        self.assertIn("evil.example", error or "")

    def test_rejects_http_on_public_host(self):
        error = redirect_uri_error("http://claude.ai/callback")
        self.assertIn("loopback", error or "")


class WellKnownMetadataTest(TestCase):
    def test_protected_resource_and_authorization_server(self):
        resource = self.client.get("/.well-known/oauth-protected-resource")
        self.assertEqual(resource.status_code, 200)
        body = resource.json()
        self.assertTrue(body["resource"].endswith("/mcp"))
        self.assertFalse(body["resource"].endswith("/mcp/"))
        self.assertEqual(body["scopes_supported"], [MCP_SCOPE])

        server = self.client.get("/.well-known/oauth-authorization-server")
        self.assertEqual(server.status_code, 200)
        meta = server.json()
        self.assertTrue(meta["authorization_endpoint"].endswith("/oauth/authorize/"))
        self.assertTrue(meta["token_endpoint"].endswith("/oauth/token/"))
        self.assertTrue(meta["registration_endpoint"].endswith("/oauth/register/"))


class DynamicClientRegistrationTest(TestCase):
    def test_registers_cursor_redirect(self):
        response = self.client.post(
            "/register",
            data=json.dumps(
                {
                    "client_name": "Cursor",
                    "redirect_uris": [CURSOR_REDIRECT],
                    "token_endpoint_auth_method": "none",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertTrue(data["client_id"])
        app = Application.objects.get(client_id=data["client_id"])
        self.assertEqual(app.client_type, Application.CLIENT_PUBLIC)

    def test_rejects_disallowed_host(self):
        response = self.client.post(
            "/oauth/register/",
            data=json.dumps({"redirect_uris": ["https://not-allowed.example/cb"]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "invalid_redirect_uri")

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "mcp-dcr-test",
            }
        },
        MCP_DCR_RATE_LIMIT=2,
        MCP_DCR_RATE_WINDOW=3600,
    )
    def test_rate_limits_repeated_registration(self):
        from django.core.cache import cache

        cache.clear()
        payload = json.dumps(
            {
                "client_name": "Cursor",
                "redirect_uris": [CURSOR_REDIRECT],
                "token_endpoint_auth_method": "none",
            }
        )
        first = self.client.post("/register", data=payload, content_type="application/json")
        second = self.client.post("/register", data=payload, content_type="application/json")
        limited = self.client.post("/register", data=payload, content_type="application/json")
        self.assertEqual(first.status_code, 201, first.content)
        self.assertEqual(second.status_code, 201, second.content)
        self.assertEqual(limited.status_code, 429, limited.content)
        self.assertEqual(limited.json()["error"], "too_many_requests")
        self.assertEqual(limited["Retry-After"], "3600")


class McpEndpointAuthTest(TestCase):
    def setUp(self):
        self.account, _source, _version, _project = self.create_account_datasource_version_project(
            "mcp-src", "MCP", "MCP Project"
        )
        self.user = self.create_user_with_profile(username="mcp-user", account=self.account)
        self.app = Application.objects.create(
            name="test",
            client_id="mcp-client",
            client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
            redirect_uris=CURSOR_REDIRECT,
        )
        self.token = AccessToken.objects.create(
            user=self.user,
            application=self.app,
            token="mcp-oauth-access",
            expires=timezone.now() + timedelta(hours=1),
            scope=MCP_SCOPE,
        )

    def test_authorize_requires_login(self):
        response = self.client.get(
            "/oauth/authorize/",
            {
                "response_type": "code",
                "client_id": self.app.client_id,
                "redirect_uri": CURSOR_REDIRECT,
                "scope": MCP_SCOPE,
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response["Location"])

    def test_mcp_post_rejects_anonymous_and_session(self):
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "ping"})
        anon = self.client.post("/mcp", data=body, content_type="application/json")
        self.assertEqual(anon.status_code, 401)

        self.client.force_login(self.user)
        session_only = self.client.post("/mcp", data=body, content_type="application/json")
        self.assertEqual(session_only.status_code, 401)

        deleted = self.client.delete("/mcp")
        self.assertEqual(deleted.status_code, 401)

    def test_mcp_ping_with_bearer(self):
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "ping"})
        response = self.client.post(
            "/mcp",
            data=body,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token.token}",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["result"], {})

    def test_whoami_uses_iaso_user(self):
        body = json.dumps(
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {"name": "iaso_whoami", "arguments": {}},
            }
        )
        response = self.client.post(
            "/mcp",
            data=body,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token.token}",
        )
        self.assertEqual(response.status_code, 200, response.content)
        payload = json.loads(response.json()["result"]["content"][0]["text"])
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["user_name"], "mcp-user")
        self.assertEqual(payload["account_name"], "MCP")

    def test_me_uses_django_session(self):
        self.client.force_login(self.user)
        response = self.client.get("/mcp/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["login"], "mcp-user")
        self.assertEqual(response.json()["account_name"], "MCP")

    def test_get_mcp_json_for_clients(self):
        response = self.client.get("/mcp", HTTP_ACCEPT="application/json")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["server_name"], "IASO")
        self.assertTrue(any(tool["name"] == "iaso_whoami" for tool in body["tools"]))

        slash = self.client.get("/mcp/", HTTP_ACCEPT="application/json, text/event-stream")
        self.assertEqual(slash.status_code, 200)
        self.assertEqual(slash.json()["server_name"], "IASO")

    def test_get_mcp_html_for_browsers(self):
        response = self.client.get("/mcp", HTTP_ACCEPT="text/html,application/xhtml+xml")
        self.assertIn(response.status_code, {200, 302})
        if response.status_code == 302:
            self.assertIn("/mcp/app/", response["Location"])
        else:
            self.assertIn("text/html", response["Content-Type"])


class XlsxPathJailTest(TestCase):
    def test_rejects_parent_and_absolute_escape(self):
        with self.assertRaises(ValueError):
            resolve_xlsx_path("../secrets.xlsx")
        with self.assertRaises(ValueError):
            resolve_xlsx_path("/etc/passwd")

    def test_sample_and_media_are_allowed(self):
        sample = resolve_xlsx_path(None)
        self.assertTrue(sample.name.endswith(".xlsx"))
        allowed = resolve_xlsx_path("demo.xlsx")
        self.assertEqual(allowed.name, "demo.xlsx")
        self.assertIn("mcp", str(allowed))
