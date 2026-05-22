from django.contrib.auth.models import User
from rest_framework import status

from iaso.modules import MODULES
from iaso.test import APITestCase, PasswordValidationTestMixin


class SetupAccountPasswordValidationAPITestCase(APITestCase, PasswordValidationTestMixin):
    BASE_URL = "/api/setupaccount/"

    def setUp(self):
        self.modules = [module.codename for module in MODULES]
        self.admin = User.objects.create_superuser(username="admin", password="super_secret")

    def test_setup_account_password_validation_error_too_short_too_common(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "abcd",
            "modules": self.modules,
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SHORT)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_COMMON)

    def test_setup_account_password_validation_error_too_similar_username(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "42unittest_username",
            "modules": self.modules,
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_USERNAME)

    def test_setup_account_password_validation_error_too_similar_email(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "modules": self.modules,
            "user_email": "this.is.my@email.com",
            "password": "this.is.my@email.com2",
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_EMAIL)

    def test_setup_account_password_validation_error_too_similar_first_name(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "modules": self.modules,
            "password": "first_name2",
            "user_first_name": "first_name",
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_FIRST_NAME)

    def test_setup_account_password_validation_error_too_similar_last_name(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "modules": self.modules,
            "user_first_name": "azertyuiop",
            "user_last_name": "last_name",
            "password": "last_name3",
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_LAST_NAME)

    def test_setup_account_password_validation_error_not_only_numeric(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "modules": self.modules,
            "password": "012345679887654054065198",
        }

        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_NUMERIC)
