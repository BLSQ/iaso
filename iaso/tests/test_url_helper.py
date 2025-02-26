from django.test import TestCase

from ..dhis2.url_helper import clean_url


class Dhis2UrlHelperTests(TestCase):
    def test_none(self):
        self.assertEqual(clean_url(None), "")

    def test_no_trailing_slash(self):
        self.assertEqual(clean_url("https://play.dhis2.org/2.37.10"), "https://play.dhis2.org/2.37.10")

    def test_trailing_slash(self):
        self.assertEqual(clean_url("https://play.dhis2.org/2.37.10/"), "https://play.dhis2.org/2.37.10")

    def test_login_url(self):
        self.assertEqual(
            clean_url("https://play.dhis2.org/2.37.10/dhis-web-commons/security/login.action"),
            "https://play.dhis2.org/2.37.10",
        )
