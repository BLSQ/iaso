import re

from django.test import Client, TestCase, override_settings
from django.urls import get_resolver
from rest_framework import status


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


from django.urls import URLPattern, URLResolver, get_resolver


CONVERTER_SAMPLES = {
    "id": "45",
    "int": "1",
    "str": "dummy",
    "slug": "dummy-slug",
    # "uuid": "11111111-1111-1111-1111-111111111111",
    "path": "field",  # important for <path:>
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


def supports_method(path, method):
    # naive checker: try calling, accept 405 as "supported"
    c = Client()
    resp = getattr(c, method)(path)
    return resp.status_code != 404


# polio endpoints are out of scope
# and wfp auth urls
def should_skip(path):
    return path.startswith(("/api/polio", "/wfp_auth", "/dashboard/polio/"))


class TestAuthEnforcement(TestCase):
    def setUp(self):
        self.client = Client()

    @override_settings(AUTHENTICATION_ENFORCED=True)
    def test_with_authentification_enforced_all_endpoints_require_auth_except_some_exceptions(self):
        unauthenticated_endpoints = []
        for path in list_all_real_paths():
            # polio endpoints are out of scope
            if should_skip(path) or path == "/dashboard/home/":
                continue

            for method in HTTP_METHODS:
                key = (path, method.upper())
                if key in PUBLIC_ENDPOINTS:
                    continue
                try:
                    if not supports_method(path, method):
                        continue
                    resp = getattr(self.client, method)(path)
                    self.assertIn(
                        resp.status_code,
                        [302, 401, 403, 405],
                        msg=f"{method.upper()} {path} should require auth",
                    )
                    # 401 Unauthorized
                    # 403 Forbidden
                    # 302 => redirect to login
                    # 405 allowed: method exists but not for this view

                except Exception as e:
                    print(key[0], "\t", key[1], "\t", str(e))
                    unauthenticated_endpoints.append((key, "\t", e))

        self.assertEqual(unauthenticated_endpoints, [])

    @override_settings(AUTHENTICATION_ENFORCED=True)
    def test_with_authentification_enforced_all_public_endpoints_should_stay_public(self):
        public_endpoints = []
        for path in list_all_real_paths():
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
                    if not supports_method(path, method):
                        continue
                    resp = getattr(self.client, method)(path)
                    # print(key, resp)
                    self.assertIn(
                        resp.status_code,
                        [
                            200,  # 200 everything is fine
                            status.HTTP_204_NO_CONTENT,
                            status.HTTP_400_BAD_REQUEST,  # 400 bad request missing params
                            405,  # 405 unsupported method]
                        ],
                        msg=f"{method.upper()} {path} should not require auth",
                    )
                    # 302 => redirect to login
                    # 405 allowed: method exists but not for this view

                except Exception as e:
                    print(key[0], "\t", key[1], "\t", e.__class__.__name__, str(e))
                    public_endpoints.append((key, "\t", e))

        self.assertEqual(public_endpoints, [])
