from django.contrib.auth.models import User
from rest_framework import status

from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION
from iaso.test import APITestCase, PasswordValidationTestMixin


class BaseProfilesPasswordValidationTests(APITestCase, PasswordValidationTestMixin):
    BASE_URL = "/api/profiles/"

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
            username="user",
            account=self.account,
            permissions=[CORE_USERS_ADMIN_PERMISSION],
            first_name="first_name",
            last_name="last_name",
            email="valid@email.com",
        )
        self.user.set_password(self.password)
        self.user.save()
        self.profile_id = self.user.iaso_profile.id


class CreateProfilePasswordValidationTests(BaseProfilesPasswordValidationTests):
    def test_happy_path(self):
        password = "this-is-a-very-long-password-with-lots-of-stuff-7777azertyuiop#@@012345"
        payload = {
            "user_name": "username",
            "password": password,
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        self.assertJSONResponse(response, status.HTTP_201_CREATED)
        new_user = User.objects.filter(username="username").first()

        self.assertTrue(new_user.check_password(password))

    def test_create_profile_password_validation_too_short_too_common(self):
        payload = {
            "user_name": "username",
            "password": "a",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SHORT)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_COMMON)

    def test_create_profile_password_validation_too_similar_username(self):
        payload = {
            "user_name": "complex_username",
            "password": "complex_username2",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_USERNAME)

    def test_create_profile_password_validation_too_similar_email(self):
        payload = {
            "user_name": "complex_username",
            "password": "valid@email.com2",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_EMAIL)

    def test_create_profile_password_validation_too_similar_first_name(self):
        payload = {
            "user_name": "complex_username",
            "password": "first_name2",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_FIRST_NAME)

    def test_create_profile_password_validation_too_similar_last_name(self):
        payload = {
            "user_name": "complex_username",
            "password": "last_name2",
            "first_name": "azertyuiop",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_LAST_NAME)

    def test_create_profile_password_validation_not_only_numeric(self):
        self.account.enforce_password_validation = True
        self.account.save()
        payload = {
            "user_name": "complex_username",
            "password": "0123456789876543210",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "valid@email.com",
        }

        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_NUMERIC)


class UpdatePasswordValidationTests(BaseProfilesPasswordValidationTests):
    def setUp(self):
        super().setUp()
        self.UPDATE_URL = f"{self.BASE_URL}{self.profile_id}/update-password/"

    def test_happy_path(self):
        password = "this-is-a-very-long-password-with-lots-of-stuff-7777azertyuiop#@@012345"
        payload = {"password": password, "confirm_password": password}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(password))

    def test_update_password_validation_too_short_too_common(self):
        payload = {"password": "a", "confirm_password": "a"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SHORT)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_COMMON)

        self._check_password_was_not_updated()

    def test_update_password_validation_too_similar_username(self):
        payload = {"password": f"{self.user.username}2", "confirm_password": f"{self.user.username}2"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_USERNAME)

        self._check_password_was_not_updated()

    def test_update_password_validation_too_similar_email(self):
        payload = {"password": f"{self.user.email}2", "confirm_password": f"{self.user.email}2"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_EMAIL)

        self._check_password_was_not_updated()

    def test_update_password_validation_too_similar_first_name(self):
        payload = {"password": f"{self.user.first_name}2", "confirm_password": f"{self.user.first_name}2"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_FIRST_NAME)

        self._check_password_was_not_updated()

    def test_update_password_validation_too_similar_last_name(self):
        self.user.last_name = "azertyuiop"
        self.user.save()

        payload = {"password": f"{self.user.last_name}2", "confirm_password": f"{self.user.last_name}2"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_TOO_SIMILAR_LAST_NAME)

        self._check_password_was_not_updated()

    def test_update_password_validation_not_only_numeric(self):
        payload = {"password": "0123456789876543210", "confirm_password": "0123456789876543210"}

        self.client.force_authenticate(self.user)
        response = self.client.patch(self.UPDATE_URL, data=payload, format="json")

        result = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(result, "password", self.ERROR_PASSWORD_NUMERIC)

        self._check_password_was_not_updated()

    def _check_password_was_not_updated(self):
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))
