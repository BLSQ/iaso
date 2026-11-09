import io

from unittest import mock

import requests
import responses
import urllib3

from django.test import SimpleTestCase

from iaso.utils.iaso_api_client import HttpClient, IasoClient


class DroppedConnection(io.RawIOBase):
    """A response body whose connection drops while it's read."""

    def readable(self):
        return True

    def readinto(self, buffer):
        raise urllib3.exceptions.ProtocolError("Connection broken")


SERVER = "https://iaso.test"


@mock.patch("time.sleep")
class IasoClientTest(SimpleTestCase):
    @responses.activate
    def test_get(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", json={"forms": []})
        client = IasoClient(SERVER)
        client.authenticate_with_token("token")

        self.assertEqual(client.get("/api/forms/", params={"app_id": "app"}), {"forms": []})
        self.assertEqual(responses.calls[0].request.url, f"{SERVER}/api/forms/?app_id=app")
        self.assertEqual(responses.calls[0].request.headers["Authorization"], "Bearer token")

    def test_backwards_compatible(self, _sleep):
        client = IasoClient("https://x")

        self.assertEqual(client.server_url, "https://x")
        self.assertEqual(client.headers, {})
        self.assertFalse(client.debug)
        for method in [
            "authenticate_with_username_and_password",
            "authenticate_with_token",
            "post",
            "patch",
            "put",
            "get",
            "wait_task_completion",
            "log",
        ]:
            self.assertTrue(callable(getattr(client, method)), method)

    @responses.activate
    def test_no_retries(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", status=503)

        with self.assertRaises(requests.HTTPError):
            IasoClient(SERVER, retries=0).get("/api/forms/")
        self.assertEqual(len(responses.calls), 1)

    @responses.activate
    def test_get_is_retried_on_server_errors(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", status=502)
        responses.add(responses.GET, f"{SERVER}/api/forms/", status=503)
        responses.add(responses.GET, f"{SERVER}/api/forms/", json={"forms": []})

        self.assertEqual(IasoClient(SERVER, retries=2).get("/api/forms/"), {"forms": []})
        self.assertEqual(len(responses.calls), 3)

    @responses.activate
    def test_get_raises_when_retries_are_exhausted(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", status=503, body="<html>Service unavailable</html>")

        with self.assertRaises(requests.HTTPError):
            IasoClient(SERVER, retries=2).get("/api/forms/")
        self.assertEqual(len(responses.calls), 3)

    @responses.activate
    def test_get_is_retried_when_the_connection_drops_mid_response(self, sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", body=io.BufferedReader(DroppedConnection()))
        responses.add(responses.GET, f"{SERVER}/api/forms/", body=b'{"forms": [')  # truncated
        responses.add(responses.GET, f"{SERVER}/api/forms/", json={"forms": []})

        self.assertEqual(IasoClient(SERVER, retries=2, backoff_factor=10).get("/api/forms/"), {"forms": []})
        self.assertEqual(len(responses.calls), 3)
        self.assertEqual([c.args for c in sleep.call_args_list], [(0,), (20,)])

    @responses.activate
    def test_get_raises_when_the_connection_keeps_dropping(self, _sleep):
        responses.add_callback(
            responses.GET,
            f"{SERVER}/api/forms/",
            callback=lambda request: (200, {}, io.BufferedReader(DroppedConnection())),
        )

        with self.assertRaises(requests.exceptions.ChunkedEncodingError):
            IasoClient(SERVER, retries=1).get("/api/forms/")
        self.assertEqual(len(responses.calls), 2)

    @responses.activate
    def test_get_bytes(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/1/manifest/", body=b"<manifest/>")

        self.assertEqual(IasoClient(SERVER).get_bytes("/api/forms/1/manifest/"), b"<manifest/>")

    @responses.activate
    def test_get_bytes_is_retried(self, sleep):
        url = "https://bucket.test/forms/form.xml"
        responses.add(responses.GET, url, status=503)
        responses.add(responses.GET, url, body=io.BufferedReader(DroppedConnection()))
        responses.add(responses.GET, url, body=b"<form/>")

        self.assertEqual(HttpClient(retries=2, backoff_factor=10).get_bytes(url), b"<form/>")
        self.assertEqual(len(responses.calls), 3)
        self.assertEqual([c.args for c in sleep.call_args_list], [(0,), (20,)])

    @responses.activate
    def test_get_bytes_client_errors_are_not_retried(self, _sleep):
        url = "https://bucket.test/forms/form.xml"
        responses.add(responses.GET, url, status=404)

        with self.assertRaises(requests.HTTPError):
            HttpClient(retries=2).get_bytes(url)
        self.assertEqual(len(responses.calls), 1)

    @responses.activate
    def test_connection_errors_are_retried(self, sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", body=requests.exceptions.ConnectionError("refused"))

        with self.assertRaises(requests.exceptions.ConnectionError):
            IasoClient(SERVER, retries=2, backoff_factor=10).get("/api/forms/")
        self.assertEqual(len(responses.calls), 3)
        self.assertEqual([c.args for c in sleep.call_args_list], [(0,), (20,)])

    @responses.activate
    def test_timeouts_are_retried(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", body=requests.exceptions.ReadTimeout("timeout"))
        responses.add(responses.GET, f"{SERVER}/api/forms/", json={"forms": []})

        self.assertEqual(IasoClient(SERVER, retries=1).get("/api/forms/"), {"forms": []})
        self.assertEqual(len(responses.calls), 2)

    @responses.activate
    def test_client_errors_are_not_retried(self, _sleep):
        responses.add(responses.GET, f"{SERVER}/api/forms/", status=404, json={"detail": "Not found."})

        with self.assertRaises(requests.HTTPError):
            IasoClient(SERVER, retries=2).get("/api/forms/")
        self.assertEqual(len(responses.calls), 1)

    @responses.activate
    def test_post_is_not_retried(self, _sleep):
        responses.add(responses.POST, f"{SERVER}/api/forms/", status=503)

        with self.assertRaises(requests.HTTPError):
            IasoClient(SERVER, retries=2).post("/api/forms/", json={"name": "Form"})
        self.assertEqual(len(responses.calls), 1)

    @responses.activate
    def test_post(self, _sleep):
        responses.add(responses.POST, f"{SERVER}/api/forms/", json={"id": 1})

        self.assertEqual(IasoClient(SERVER).post("/api/forms/", json={"name": "Form"}), {"id": 1})
        self.assertEqual(responses.calls[0].request.body, b'{"name": "Form"}')

    def test_timeout_is_passed_to_each_request(self, _sleep):
        client = IasoClient(SERVER, timeout=(1, 2))

        with mock.patch.object(client.session, "request") as request:
            client.request("GET", "/api/forms/")

        self.assertEqual(request.call_args.kwargs["timeout"], (1, 2))
