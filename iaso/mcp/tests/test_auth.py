from __future__ import annotations

import contextlib

from datetime import timedelta

from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.signals import user_login_failed
from django.http import HttpResponse
from django.test import RequestFactory
from django.utils import timezone
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from iaso.mcp.auth import McpOAuth2Backend, McpOAuth2TokenMiddleware
from iaso.mcp.oauth import MCP_SCOPE
from iaso.test import APITestCase
from iaso.tests.utils.query_profiler import QueryProfiler


@contextlib.contextmanager
def capture_failed_logins():
    failed = []

    def receiver(sender, credentials, request=None, **kwargs):
        failed.append(request.path if request is not None else None)

    user_login_failed.connect(receiver)
    try:
        yield failed
    finally:
        user_login_failed.disconnect(receiver)


class McpOAuthScopeTest(APITestCase):
    """The MCP OAuth token is only checked on the MCP endpoint: mobile and scripts send simplejwt Bearer tokens."""

    @classmethod
    def setUpTestData(cls):
        cls.account, _source, _version, cls.project = cls.create_account_datasource_version_project(
            "belgium-src", "Belgium", "Belgium Project"
        )
        cls.user = cls.create_user_with_profile(username="belgium-user", account=cls.account)
        cls.application = Application.objects.create(
            name="test",
            client_id="mcp-client",
            client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
            redirect_uris="cursor://anysphere.cursor-mcp/oauth/callback",
        )
        cls.oauth_token = AccessToken.objects.create(
            user=cls.user,
            application=cls.application,
            token="mcp-oauth-access",
            expires=timezone.now() + timedelta(hours=1),
            scope=MCP_SCOPE,
        )

    def setUp(self):
        super().setUp()
        self.factory = RequestFactory()

    def jwt(self) -> str:
        return str(RefreshToken.for_user(self.user).access_token)

    def oauth_request(self, path: str):
        request = self.factory.post(path, HTTP_AUTHORIZATION=f"Bearer {self.oauth_token.token}")
        request.user = AnonymousUser()
        return request

    def assertJwtBearerQueries(self, method: str, url: str, expected_status: int, expected_queries: dict[str, int]):
        """Strict per-table bound: an OAuth token lookup or axes failure query would be an unexpected table."""
        with capture_failed_logins() as failed, QueryProfiler() as profiler:
            response = getattr(self.client, method)(url, HTTP_AUTHORIZATION=f"Bearer {self.jwt()}")

        self.assertEqual(response.status_code, expected_status)
        with profiler.report_on_failure():
            profiler.assertLessEqualQueryCount(expected_queries)
        self.assertEqual(failed, [], "a simplejwt Bearer request must not go through authenticate() (axes failure)")

    def test_jwt_bearer_outside_mcp_is_not_a_failed_login(self):
        with capture_failed_logins() as failed, QueryProfiler() as profiler:
            response = self.client.get("/api/profiles/me/", HTTP_AUTHORIZATION=f"Bearer {self.jwt()}")

        result = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(result["user_name"], "belgium-user")
        self.assertEqual(
            profiler.table_counts()[AccessToken._meta.db_table],
            0,
            "a simplejwt Bearer request must not look up an OAuth token",
        )
        self.assertEqual(failed, [], "a simplejwt Bearer request must not go through authenticate() (axes failure)")

    def test_mobile_head_form_upload_does_no_query(self):
        # the mobile connectivity probe before an upload
        self.assertJwtBearerQueries("head", "/sync/form_upload/", status.HTTP_405_METHOD_NOT_ALLOWED, {})

    def test_mobile_checkversion_queries(self):
        # 1 user (simplejwt), 1 project by app_id
        self.assertJwtBearerQueries(
            "get",
            f"/api/mobile/checkversion/?app_id={self.project.app_id}&app_version=1",
            status.HTTP_204_NO_CONTENT,
            {"auth_user": 1, "iaso_project": 1},
        )

    def test_middleware_authenticates_oauth_token_on_mcp_endpoint(self):
        for path in ("/mcp", "/mcp/"):
            with self.subTest(path=path):
                request = self.oauth_request(path)
                McpOAuth2TokenMiddleware(lambda _request: HttpResponse())(request)
                self.assertEqual(request.user, self.user)

    def test_middleware_ignores_oauth_token_outside_mcp_endpoint(self):
        for path in ("/sync/form_upload/", "/api/profiles/me/", "/mcp/me/", "/mcp/app/"):
            with self.subTest(path=path):
                request = self.oauth_request(path)
                McpOAuth2TokenMiddleware(lambda _request: HttpResponse())(request)
                self.assertIsInstance(request.user, AnonymousUser)

    def test_backend_authenticates_oauth_token_on_mcp_endpoint_only(self):
        backend = McpOAuth2Backend()
        self.assertEqual(backend.authenticate(self.oauth_request("/mcp")), self.user)
        self.assertIsNone(backend.authenticate(self.oauth_request("/sync/form_upload/")))
        self.assertIsNone(backend.authenticate(None))
