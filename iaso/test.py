import typing
from unittest import mock
from django.core.files import File
from django.test import TestCase as BaseTestCase
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework.response import Response
from rest_framework.test import APITestCase as BaseAPITestCase, APIClient

from iaso import models as m


class IasoTestCaseMixin:
    @staticmethod
    def create_user_with_profile(*, username: str, account: m.Account, **kwargs):
        User = get_user_model()

        user = User.objects.create(username=username, **kwargs)
        m.Profile.objects.create(user=user, account=account)

        return user

    @staticmethod
    def create_form_instance(*, form: m.Form, period: str, org_unit: m.OrgUnit):
        instance_file_mock = mock.MagicMock(spec=File)
        instance_file_mock.name = 'test.xml'

        return m.Instance.objects.create(form=form, period=period, org_unit=org_unit, file=instance_file_mock)


class TestCase(BaseTestCase, IasoTestCaseMixin):
    pass


class APITestCase(BaseAPITestCase, IasoTestCaseMixin):
    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""

        self.client = APIClient()

    def assertJSONResponse(self, response: typing.Any, expected_status_code: int):
        self.assertIsInstance(response, Response)
        self.assertEqual(expected_status_code, response.status_code)

        if expected_status_code != 204:
            self.assertEqual('application/json', response['Content-Type'])

    def assertFileResponse(self, response: typing.Any, expected_status_code: int, expected_content_type: str, *,
                           expected_attachment_filename: str = None, streaming: bool = False):
        if streaming:
            self.assertIsInstance(response, StreamingHttpResponse)
            # we need to force the reading of the whole content stream - some errors might be hidden in the generator
            self.assertIsInstance(list(response.streaming_content), list)
        else:
            self.assertIsInstance(response, HttpResponse)
        self.assertEqual(expected_status_code, response.status_code)
        self.assertEqual(expected_content_type, response['Content-Type'])

        if expected_attachment_filename is not None:
            self.assertEquals(
                response.get("Content-Disposition"),
                f"attachment; filename={expected_attachment_filename}"
            )

    def assertValidListData(self, *, list_data: typing.Mapping, results_key: str, expected_length: int,
                            paginated: bool = False):
        self.assertIn(results_key, list_data)
        self.assertIsInstance(list_data[results_key], list)
        self.assertEqual(expected_length, len(list_data[results_key]))

        if paginated:
            self.assertHasField(list_data, "has_next", bool)
            self.assertHasField(list_data, "has_previous", bool)
            self.assertHasField(list_data, "page", int)
            self.assertHasField(list_data, "pages", int)
            self.assertHasField(list_data, "limit", int)

    def assertHasField(self, data: typing.Mapping, field_name: str, cls: type, *, optional: bool = False):
        self.assertIn(field_name, data)
        if not optional:
            self.assertIsInstance(data[field_name], cls)

    def assertHasError(self, data: typing.Mapping, field_name: str, error_message: str = None):
        self.assertIn(field_name, data)
        if error_message is not None:
            self.assertIn(error_message, data[field_name])
