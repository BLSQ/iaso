from __future__ import annotations

from django.test import SimpleTestCase

from iaso.mcp.client import DjangoUserTransport, IasoHTTPError, _raise_if_error


class _Redirect:
    status_code = 301
    content = b""

    def get(self, key, default=""):
        if key == "Location":
            return "https://testserver/api/profiles/me/"
        return default


class RedirectErrorTest(SimpleTestCase):
    def test_redirect_raises(self):
        with self.assertRaises(IasoHTTPError) as caught:
            _raise_if_error(_Redirect(), "/api/profiles/me/")
        self.assertEqual(caught.exception.status_code, 301)
        self.assertIn("https://testserver/api/profiles/me/", str(caught.exception))

    def test_post_root_redirect_raises(self):
        transport = DjangoUserTransport.__new__(DjangoUserTransport)

        class _Api:
            def post(self, *_args, **_kwargs):
                return _Redirect()

        transport._api = _Api()
        with self.assertRaises(IasoHTTPError) as caught:
            transport.post_root("tasks/")
        self.assertEqual(caught.exception.status_code, 301)
