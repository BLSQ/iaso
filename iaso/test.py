import typing
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.test import APITestCase as BaseAPITestCase, APIClient

from iaso import models as m


class APITestCase(BaseAPITestCase):
    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""

        self.client = APIClient()

    @staticmethod
    def create_user_with_profile(*, username: str, account: m.Account, **kwargs):
        User = get_user_model()

        user = User.objects.create(username=username, **kwargs)
        m.Profile.objects.create(user=user, account=account)

        return user

    def assertApiResponse(self, response: typing.Any, expected_status_code: int):
        self.assertIsInstance(response, Response)
        self.assertEqual(expected_status_code, response.status_code)
        self.assertEqual('application/json', response['Content-Type'])

    def assertValidListData(self, *, list_data: typing.Mapping, results_key: str, expected_length: int,
                            paginated: bool = False):
        self.assertIn(results_key, list_data)
        self.assertIsInstance(list_data[results_key], list)
        self.assertEqual(expected_length, len(list_data[results_key]))

        if paginated:
            self.assertIn("has_next", list_data)
            self.assertIsInstance(list_data["has_next"], bool)
            self.assertIn("has_previous", list_data)
            self.assertIsInstance(list_data["has_previous"], bool)
            self.assertIn("page", list_data)
            self.assertIsInstance(list_data["page"], int)
            self.assertIn("pages", list_data)
            self.assertIsInstance(list_data["pages"], int)
            self.assertIn("limit", list_data)
            self.assertIsInstance(list_data["limit"], int)
