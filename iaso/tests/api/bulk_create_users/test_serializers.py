from django.test import RequestFactory

from iaso.api.bulk_create_users.serializers import BulkCreateItemSerializer
from iaso.models import Account
from iaso.test import TestCase


class Test(TestCase):
    def setUp(self):
        account = Account.objects.create(name="account")
        self.user = self.create_user_with_profile(username="test", account=account)
        request = RequestFactory()
        request.user = self.user
        self.context = {"request": request}

    def test_valid_phone_number(self):
        phone_number = "+12345678912"
        expected_output = "+12345678912"
        serializer = BulkCreateItemSerializer(data={"phone_number": phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertNotIn("phone_number", serializer.errors)

        self.assertEqual(serializer.validate_phone_number(phone_number), expected_output)

    def test_invalid_phone_number(self):
        invalid_phone_number = "+12345"

        serializer = BulkCreateItemSerializer(data={"phone_number": invalid_phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertIn("phone_number", serializer.errors)

        self.assertEqual(serializer.errors["phone_number"][0].code, "invalid")
        self.assertEqual(serializer.errors["phone_number"][0], "Invalid phone number: +12345")

    def test_number_parse_exception(self):
        phone_number = "This is not a phone number"

        serializer = BulkCreateItemSerializer(data={"phone_number": phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertIn("phone_number", serializer.errors)

        self.assertEqual(serializer.errors["phone_number"][0].code, "invalid")
        self.assertEqual(
            serializer.errors["phone_number"][0], "Invalid phone number format: This is not a phone number"
        )


class BulkCreateItemSerializerPasswordValidationTestCase(TestCase):
    ERROR_PASSWORD_TOO_SHORT = "This password is too short. It must contain at least 8 characters."
    ERROR_PASSWORD_TOO_COMMON = "This password is too common."
    ERROR_PASSWORD_TOO_SIMILAR_USERNAME = "The password is too similar to the username."
    ERROR_PASSWORD_TOO_SIMILAR_EMAIL = "The password is too similar to the email address."
    ERROR_PASSWORD_TOO_SIMILAR_FIRST_NAME = "The password is too similar to the first name."
    ERROR_PASSWORD_TOO_SIMILAR_LAST_NAME = "The password is too similar to the last name."
    ERROR_PASSWORD_NUMERIC = "This password is entirely numeric."

    def setUp(self):
        self.account, self.data_source, self.source_version, self.project = (
            self.create_account_datasource_version_project(
                account_name="account", project_name="project", source_name="source"
            )
        )
        self.account.enforce_password_validation = True
        self.account.save()

        self.password = "secret_password1234"
        self.user = self.create_user_with_profile(
            username="username",
            account=self.account,
            first_name="first_name",
            last_name="last_name",
            email="valid@email.com",
        )
        self.user.set_password(self.password)
        self.user.save()

        request = RequestFactory()
        request.user = self.user
        self.context = {"request": request}

    def test_happy_path(self):
        data = {
            "username": "new_user",
            "password": "a-complex-456789123-pass####word-with-lots-of-$$$stuff",
            "email": "valid@email.com",
            "first_name": "first_name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertTrue(serializer.is_valid())

    def test_password_validation_too_short_too_common(self):
        data = {
            "username": "new_user",
            "password": "a",
            "email": "valid@email.com",
            "first_name": "first_name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_TOO_SHORT, errors)
        self.assertIn(self.ERROR_PASSWORD_TOO_COMMON, errors)

    def test_password_validation_too_similar_username(self):
        data = {
            "username": "new_user",
            "password": "new_user2",
            "email": "valid@email.com",
            "first_name": "first_name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_TOO_SIMILAR_USERNAME, errors)

    def test_password_validation_too_similar_email(self):
        data = {
            "username": "new_user",
            "password": "valid@email.com4",
            "email": "valid@email.com",
            "first_name": "first_name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_TOO_SIMILAR_EMAIL, errors)

    def test_password_validation_too_similar_first_name(self):
        data = {
            "username": "new_user",
            "password": "first_name420",
            "email": "valid@email.com",
            "first_name": "first_name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_TOO_SIMILAR_FIRST_NAME, errors)

    def test_password_validation_too_similar_last_name(self):
        data = {
            "username": "new_user",
            "password": "last_name420",
            "email": "valid@email.com",
            "first_name": "long first and complex name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_TOO_SIMILAR_LAST_NAME, errors)

    def test_password_validation_not_only_numeric(self):
        data = {
            "username": "new_user",
            "password": "0123456789876543210",
            "email": "valid@email.com",
            "first_name": "long first and complex name",
            "last_name": "last_name",
        }
        serializer = BulkCreateItemSerializer(data=data, context=self.context)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertIn("password", serializer.errors)
        errors = serializer.errors["password"]
        self.assertIn(self.ERROR_PASSWORD_NUMERIC, errors)
