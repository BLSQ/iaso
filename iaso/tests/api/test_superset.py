import json

import responses

from django.test import override_settings

from iaso.test import APITestCase


class SupersetAPITestCase(APITestCase):
    maxDiff = None

    def test_should_validate_dashboard_id(self):
        resp = self.client.post("/api/superset/token/")
        self.assertEqual(resp.json(), {"error": "dashboard_id required"})
        self.assertEqual(resp.status_code, 400)

    @override_settings(SUPERSET_URL="")
    def test_should_verify_if_supertset_configured(self):
        resp = self.client.post("/api/superset/token/", {"dashboard_id": "aze456aze456az"})
        self.assertEqual(resp.json(), {"error": "no superset configured"})
        self.assertEqual(resp.status_code, 404)

    @override_settings(
        SUPERSET_URL="https://superset.demo.org",
        SUPERSET_ADMIN_USERNAME="admin",
        SUPERSET_ADMIN_PASSWORD="wellknownpassword",
    )
    @responses.activate
    def test_should_works(self):
        GUEST_TOKEN = "your_guest_token"

        def request_callback_login(request):
            return (200, {}, json.dumps({"access_token": "yourtoken"}))

        responses.add_callback(
            responses.POST,
            "https://superset.demo.org/api/v1/security/login",
            callback=request_callback_login,
            content_type="application/json",
        )

        def request_callback_csrf(request):
            return (200, {}, json.dumps({"result": "your_csrf_token"}))

        responses.add_callback(
            responses.GET,
            "https://superset.demo.org/api/v1/security/csrf_token/",
            callback=request_callback_csrf,
            content_type="application/json",
        )

        def request_callback_guest_token(request):
            return (200, {}, json.dumps({"token": GUEST_TOKEN}))

        responses.add_callback(
            responses.POST,
            "https://superset.demo.org/api/v1/security/guest_token/",
            callback=request_callback_guest_token,
            content_type="application/json",
        )

        resp = self.client.post("/api/superset/token/", {"dashboard_id": "aze456aze456az"})

        self.assertEqual(resp.json(), {"token": GUEST_TOKEN})
        self.assertEqual(resp.status_code, 201)
