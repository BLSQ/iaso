import re

from django.conf import settings
from django.test import Client, override_settings
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework import status

from iaso.test import TestCase


# clearly don't really know what todo
# about other Http methods ?
#  - "options" for cors and other
#  - "trace" normally used for debugging, I guess shouldn't be supported
#  - "head"  - generally used for caching, perhaps some metadata/dropdown ?

HTTP_METHODS = ["get", "post", "put", "delete", "patch"]


def any_methods(path):
    return {(path, m.upper()) for m in HTTP_METHODS}


PUBLIC_ENDPOINTS = {
    # login, admin login and bearer token
    ("/admin/login/", "GET"),
    ("/admin/login/", "POST"),
    ("/admin/login/", "PUT"),
    ("/login/", "GET"),
    ("/login/", "POST"),
    ("/login/", "PUT"),
    ("/api/token/", "POST"),
    ("/api/token/refresh/", "POST"),
    # allow redirect to login
    ("/dashboard/home/", "GET"),
    # dhis2 oauth
    *any_methods("/api/dhis2/demo.dhis2.org/login/"),
    # link mail authenticated redirect
    *any_methods("/api/token_auth/"),
    # enketo
    ("/api/enketo/public_create_url/", "GET"),
    ("/api/enketo/formList", "GET"),
    ("/api/enketo/formDownload/", "GET"),
    ("/api/enketo/submission", "GET"),
    ("/api/enketo/submission", "POST"),
    # verify signature but return 400 to not interfere with enketo
    ("/api/forms/1/manifest_enketo/", "GET"),
    ("/api/mobile/forms/1/manifest_enketo/", "GET"),
    # captchas
    *any_methods("/api/captcha/image/"),
    *any_methods("/api/captcha/audio/"),
    *any_methods("/api/captcha/refresh/"),
    # task worker endpoints
    *any_methods("/tasks/launch_task/export_task/my_user_name/"),
    *any_methods("/tasks/cron/"),
    *any_methods("/tasks/task/"),
    # reset password related
    *any_methods("/robots.txt"),
    *any_methods("/_health/"),
    *any_methods("/_health"),
    *any_methods("/health/"),
    *any_methods("/health-clamav/"),
    # reset password related
    *any_methods("/forgot-password/"),
    *any_methods("/forgot-password-confirmation/"),
    *any_methods("/reset-password-confirmation/"),
    *any_methods("/reset-password-confirmation/dsfsdfsdf==/456fdg-sdf546sdf-dsf54/"),
    *any_methods("/reset-password-complete/"),
    # polio embbed
    *any_methods("/dashboard/polio/embeddedCalendar/.*"),
    *any_methods("/dashboard/polio/embeddedVaccineRepository/.*"),
    *any_methods("/dashboard/polio/embeddedVaccineStock/.*"),
    *any_methods("/dashboard/polio/embeddedLqasCountry/.*"),
    *any_methods("/dashboard/polio/embeddedLqasMap/.*"),
    # documentation
    ("/api/colors/", "GET"),
    # okish
    ("/sync/form_upload/", "POST"),
}


CONVERTER_SAMPLES = {
    "id": "45",
    "int": "1",
    "str": "dummy",
    "slug": "dummy-slug",
    "path": "field",
    "uuid": "385689b3b55f4739b80dcba5540c5f87",
    "form_uuid": "385689b3b55f4739b80dcba5540c5f87",
    "url": "https://demo.com",
    "org_unit_id": "99",
    "period": "2025Q1",
    "instance_uuid": "6937c994-42a8-832d-9a9d-05c76baebb05",
    "instance_file_id": "141",
    "file_name": "demo_54564.jpg",
    "workflow_id": "222",
    "dhis2_slug": "demo.dhis2.org",
    "datasource_id": "333",
    "format": "csv",
    "page_slug": "cps_campaign_microplan",
    "uidb64": "dsfsdfsdf==",
    "token": "456fdg-sdf546sdf-dsf54",
    "task_name": "export_task",
    "user_name": "my_user_name",
    "key": "1",  # used by captchas URLs
}

DEFAULT_SAMPLE = "1"


def replace_path_converters(path):
    def repl(match):
        full = match.group(0)
        inside = match.group(1)

        if ":" in inside:
            conv, name = inside.split(":", 1)
        else:
            conv = inside
        try:
            return CONVERTER_SAMPLES[conv]
        except KeyError as e:
            print(path, e)
            raise e

    return re.sub(r"<([^>]+)>", repl, path)


def expand_regex_pattern(regex_str):
    cleaned = regex_str.lstrip("^").rstrip("$")

    # (?P<format>[a-z0-9]+) → dummy
    cleaned = re.sub(r"\(\?P<[^>]+>[^)]+\)", DEFAULT_SAMPLE, cleaned)

    # remove optional markers, escapes
    cleaned = cleaned.replace("\\", "")
    cleaned = cleaned.replace("?", "")
    cleaned = cleaned.replace("(", "").replace(")", "")

    return cleaned


def list_all_real_paths(resolver=None, prefix=""):
    if resolver is None:
        resolver = get_resolver()

    for pattern in resolver.url_patterns:
        if isinstance(pattern, URLPattern):
            raw = str(pattern.pattern)

            if raw.startswith("^"):  # regex
                path = expand_regex_pattern(raw)
            else:  # path() pattern
                path = replace_path_converters(raw)

            yield "/" + prefix + path

        elif isinstance(pattern, URLResolver):
            new_prefix = prefix + str(pattern.pattern)
            yield from list_all_real_paths(pattern, new_prefix)


def add_sso_paths_to_public_paths(public_paths: set):
    """Paths registered by the SSO plugin (login / callback / token) for each configured provider.

    These are third-party authentication endpoints (analogous to /wfp_auth/...) and are
    legitimately reachable without authentication, so they're out of scope for this check.
    The paths are configurable per provider, so we derive them from settings rather than hardcode.
    """
    for provider_id, config in getattr(settings, "SSO_PROVIDERS", {}).items():
        token_path = "/" + config.get("token_path", f"{provider_id}/token/")
        public_paths.add(("/" + config.get("login_path", f"{provider_id}/login/"), "GET"))
        public_paths.add(("/" + config.get("callback_path", f"{provider_id}/login/callback/"), "GET"))
        public_paths.add((token_path, "GET"))
        public_paths.add((token_path, "POST"))


add_sso_paths_to_public_paths(PUBLIC_ENDPOINTS)


def add_mcp_paths_to_public_paths(public_paths: set):
    """MCP OAuth discovery, DCR, catalog UI, and token endpoints.

    JSON-RPC writes stay authenticated (POST /mcp requires Bearer). These paths
    must be reachable before login, like /login/ and /api/token/.
    """
    if not getattr(settings, "MCP_ENABLED", False):
        return
    public_paths.update(
        {
            *any_methods("/.well-known/oauth-protected-resource"),
            *any_methods("/.well-known/oauth-protected-resource/mcp"),
            *any_methods("/.well-known/oauth-protected-resource/mcp/"),
            *any_methods("/.well-known/oauth-authorization-server"),
            *any_methods("/.well-known/oauth-authorization-server/mcp"),
            *any_methods("/.well-known/oauth-authorization-server/mcp/"),
            *any_methods("/.well-known/openid-configuration"),
            *any_methods("/oauth/token/.well-known/openid-configuration"),
            *any_methods("/oauth/.well-known/openid-configuration/"),
            *any_methods("/oauth/.well-known/jwks.json"),
            *any_methods("/register/"),
            *any_methods("/register"),
            *any_methods("/oauth/register/"),
            *any_methods("/oauth/register"),
            *any_methods("/oauth/token/"),
            *any_methods("/oauth/revoke_token/"),
            ("/mcp/tools.json", "GET"),
            ("/mcp", "GET"),
            ("/mcp/", "GET"),
            *any_methods("/mcp/app/"),
            *any_methods("/mcp/app/field"),
            *any_methods("/mcp/field"),
            ("/iaso-mark.png", "GET"),
        }
    )


add_mcp_paths_to_public_paths(PUBLIC_ENDPOINTS)


# polio endpoints are out of scope
# and wfp auth / SSO auth urls
def should_skip(path):
    return path.startswith(("/api/polio", "/wfp_auth", "/dashboard/polio/")) or path == "/dashboard/home/"


AUTH_REQUIRED_STATUS_CODES = [
    status.HTTP_302_FOUND,  # redirect to login
    status.HTTP_401_UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN,
    status.HTTP_404_NOT_FOUND,  # don't care if path does not exist
    status.HTTP_405_METHOD_NOT_ALLOWED,
]

PUBLIC_STATUS_CODES = [
    status.HTTP_200_OK,  # everything is fine
    status.HTTP_204_NO_CONTENT,
    status.HTTP_400_BAD_REQUEST,  # missing params
    status.HTTP_404_NOT_FOUND,  # don't care if path does not exist
    status.HTTP_405_METHOD_NOT_ALLOWED,
]


class TestAuthEnforcement(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.client = Client()
        cls.paths = list(list_all_real_paths())

    @override_settings(AUTHENTICATION_ENFORCED=True)
    def test_with_authentification_enforced_all_endpoints_require_auth_except_some_exceptions(self):
        unauthenticated_endpoints = []
        for path in self.paths:
            # polio endpoints are out of scope
            if should_skip(path):
                continue

            for method in HTTP_METHODS:
                key = (path, method.upper())
                if key in PUBLIC_ENDPOINTS:
                    continue
                try:
                    resp = getattr(self.client, method)(path)
                    self.assertIn(
                        resp.status_code,
                        AUTH_REQUIRED_STATUS_CODES,
                        msg=f"{method.upper()} {path} should require auth",
                    )

                except Exception as e:
                    print(key[0], "\t", key[1], "\t", str(e))
                    unauthenticated_endpoints.append((key, "\t", e))

        self.assertEqual(unauthenticated_endpoints, [])

    @override_settings(AUTHENTICATION_ENFORCED=True)
    def test_with_authentification_enforced_all_public_endpoints_should_stay_public(self):
        public_endpoints = []
        for path in self.paths:
            if should_skip(path):
                continue

            for method in HTTP_METHODS:
                key = (path, method.upper())

                if key not in PUBLIC_ENDPOINTS:
                    continue

                # skip task and sync/upload either need a less generic way to test
                if path in ["/tasks/task/", "/sync/form_upload/"]:
                    continue

                try:
                    resp = getattr(self.client, method)(path)
                    # print(key, resp)
                    self.assertIn(
                        resp.status_code,
                        PUBLIC_STATUS_CODES,
                        msg=f"{method.upper()} {path} should not require auth",
                    )

                except Exception as e:
                    print(key[0], "\t", key[1], "\t", e.__class__.__name__, str(e))
                    public_endpoints.append((key, "\t", e))

        self.assertEqual(public_endpoints, [])
