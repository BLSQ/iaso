import datetime

from urllib.parse import parse_qs, urlparse

import time_machine

from django.core.signing import TimestampSigner
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.query_params import APP_ID, ENKETO_EXPIRES, ENKETO_SIGNED
from iaso.enketo.enketo_url import generate_signed_url, verify_signed_url
from iaso.test import TestCase


class EnketoUtilsTests(TestCase):
    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        cls.path = "/this/is/a/test/path/"
        cls.secret = "domo-arigato-mister-roboto"
        cls.factory = APIRequestFactory()

    @time_machine.travel(DT, tick=False)
    def test_generate_signed_url(self):
        extra_params = {
            APP_ID: self.project.app_id,
        }

        signed_url = generate_signed_url(
            path=self.path,
            secret=self.secret,
            extra_params=extra_params,
        )

        self.assertIn(ENKETO_SIGNED, signed_url)
        self.assertIn(ENKETO_EXPIRES, signed_url)
        self.assertIn(APP_ID, signed_url)
        self.assertIn(self.path, signed_url)

        # Decoding parameters before checking the signature
        parsed_url = urlparse(signed_url)
        query_params = parse_qs(parsed_url.query)

        # Checking ENKETO_SIGNED
        enketo_signed_param = query_params[ENKETO_SIGNED][0]
        signer = TimestampSigner(self.secret)
        decoded_path = signer.unsign(enketo_signed_param)
        self.assertEqual(self.path, decoded_path)

        # Checking ENKETO_EXPIRES
        enketo_expires_param = float(query_params[ENKETO_EXPIRES][0])
        now_plus_300_seconds = self.DT.timestamp() + 300  # default expiry for enketo is now + 300 seconds
        self.assertEqual(enketo_expires_param, now_plus_300_seconds)

    @time_machine.travel(DT, tick=False)
    def test_verify_signed_url_happy_path(self):
        # Building a signed URL to be decoded
        query_params = self._generate_signed_url_and_return_params()
        enketo_signed_param = query_params[ENKETO_SIGNED][0]

        # Building a request with the signed URL parameters
        request_params = {
            ENKETO_SIGNED: enketo_signed_param,
            ENKETO_EXPIRES: int(self.DT.timestamp()),
            APP_ID: self.project.app_id,
        }
        request = self._generate_request_with_params(self.path, request_params)

        result = verify_signed_url(request, self.secret)
        self.assertTrue(result)

    @time_machine.travel(DT, tick=False)
    def test_verify_signed_url_expired(self):
        # Generate a signed URL that has expired
        query_params = self._generate_signed_url_and_return_params()
        enketo_signed_param = query_params[ENKETO_SIGNED][0]

        request_params = {
            ENKETO_SIGNED: enketo_signed_param,
            ENKETO_EXPIRES: int(self.DT.timestamp()) - 10,  # 10 seconds before DT
        }
        request = self._generate_request_with_params(self.path, request_params)

        result = verify_signed_url(request, self.secret)
        self.assertFalse(result)

    @time_machine.travel(DT, tick=False)
    def test_verify_signed_url_invalid_signature(self):
        # Generate a valid signed URL and tamper with the signature
        query_params = self._generate_signed_url_and_return_params()
        enketo_signed_param = query_params[ENKETO_SIGNED][0]
        tampered_signature = enketo_signed_param[:-1] + ("A" if enketo_signed_param[-1] != "A" else "B")
        request_params = {
            ENKETO_SIGNED: tampered_signature,
            ENKETO_EXPIRES: int(self.DT.timestamp()),
        }
        request = self._generate_request_with_params(self.path, request_params)
        result = verify_signed_url(request, self.secret)
        self.assertFalse(result)

    @time_machine.travel(DT, tick=False)
    def test_verify_signed_url_missing_signed_param(self):
        # Generate valid params and remove ENKETO_SIGNED
        request_params = {
            ENKETO_EXPIRES: int(self.DT.timestamp()),
            # ENKETO_SIGNED is intentionally missing
        }
        request = self._generate_request_with_params(self.path, request_params)
        result = verify_signed_url(request, self.secret)
        self.assertFalse(result)

    def test_verify_signed_url_missing_expires_param(self):
        # Generate valid params and remove ENKETO_EXPIRES
        query_params = self._generate_signed_url_and_return_params()
        enketo_signed_param = query_params[ENKETO_SIGNED][0]
        request_params = {
            ENKETO_SIGNED: enketo_signed_param,
            # ENKETO_EXPIRES is intentionally missing
        }
        request = self._generate_request_with_params(self.path, request_params)
        result = verify_signed_url(request, self.secret)
        self.assertFalse(result)

    @time_machine.travel(DT, tick=False)
    def test_verify_signed_url_invalid_path(self):
        # Generate a valid signed URL and tamper with the path
        query_params = self._generate_signed_url_and_return_params()
        enketo_signed_param = query_params[ENKETO_SIGNED][0]
        request_params = {
            ENKETO_SIGNED: enketo_signed_param,
            ENKETO_EXPIRES: int(self.DT.timestamp()),
        }
        # Use a different path than the one signed
        invalid_path = "/this/is/a/WRONG/path/"
        request = self._generate_request_with_params(invalid_path, request_params)
        result = verify_signed_url(request, self.secret)
        self.assertFalse(result)

    def _generate_signed_url_and_return_params(self):
        """
        Generate a signed URL and return its decoded query parameters for further testing.
        """
        signed_url = generate_signed_url(
            path=self.path,
            secret=self.secret,
        )
        parsed_url = urlparse(signed_url)
        query_params = parse_qs(parsed_url.query)
        return query_params

    def _generate_request_with_params(self, path: str, params: dict):
        """
        Wrapping the APIRequestFactory to generate a DRF Request that has query_params.
        """
        request = Request(self.factory.get(path, params))
        return request
