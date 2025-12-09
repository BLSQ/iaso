import re

from django.test import Client, TestCase
from django.urls import get_resolver


HTTP_METHODS = ["get", "post", "put", "delete"]


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
    ("/api/forms/1/manifest_enketo/", "GET"),
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
    ("/models/", "GET"),
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


class TestAuthEnforcement(TestCase):
    def setUp(self):
        self.client = Client()

    def test_all_endpoints_require_auth(self):
        unauthenticated_endpoints = []
        for path in list_all_real_paths():
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
                    # 302 => redirect to login
                    # 405 allowed: method exists but not for this view

                except Exception as e:
                    print(key[0], "\t", key[1], "\t", str(e))
                    unauthenticated_endpoints.append((key, "\t", e))

        print(unauthenticated_endpoints)

        self.assertEqual(unauthenticated_endpoints, [])
