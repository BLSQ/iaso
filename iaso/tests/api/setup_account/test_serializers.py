from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError

from iaso.api.setup_account.serializers import SetupAccountSerializer
from iaso.models import Account, DataSource, FeatureFlag, Project
from iaso.modules import MODULES
from iaso.test import TestCase


class SetupAccountSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.modules = [module.codename for module in MODULES]
        cls.password = "super-secret-password-that-is-very-secure"

    def test_email_formats(self):
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org",
            "123@numbers.com",
            "user@subdomain.example.com",
        ]

        for email in valid_emails:
            with self.subTest(email=email):
                data = {
                    "account_name": f"unittest_account_{email.replace('@', '_').replace('.', '_')}",
                    "user_username": f"unittest_username_{email.replace('@', '_').replace('.', '_')}",
                    "user_email": email,
                    "password": self.password,
                    "modules": self.modules,
                }
                serializer = SetupAccountSerializer(data=data)
                self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_email_formats(self):
        invalid_emails = [
            "invalid-email-format",
            "testexample.com",
            "test@",
        ]

        for invalid_email in invalid_emails:
            with self.subTest(invalid_email=invalid_email):
                data = {
                    "account_name": "account_name",
                    "user_username": "user_username",
                    "modules": self.modules,
                    "password": self.password,
                    "user_email": invalid_email,
                }

                serializer = SetupAccountSerializer(data=data)
                self.assertFalse(serializer.is_valid())

                self.assertIn("user_email", serializer.errors)
                self.assertEqual("Enter a valid email address.", serializer.errors["user_email"][0])

    def test_mandatory_fields(self):
        data = {}
        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        errors = serializer.errors

        # mandatory fields
        self.assertIn("account_name", errors)
        self.assertEqual("This field is required.", errors["account_name"][0])
        self.assertIn("user_username", errors)
        self.assertEqual("This field is required.", errors["user_username"][0])
        self.assertIn("modules", errors)
        self.assertEqual("This field is required.", errors["modules"][0])

        # optional fields
        self.assertNotIn("user_first_name", errors)
        self.assertNotIn("user_last_name", errors)
        self.assertNotIn("user_email", errors)
        self.assertNotIn("password", errors)
        self.assertNotIn("user_manual_path", errors)
        self.assertNotIn("email_invitation", errors)
        self.assertNotIn("language", errors)
        self.assertNotIn("feature_flags", errors)
        self.assertNotIn("create_main_org_unit", errors)
        self.assertNotIn("create_demo_form", errors)
        self.assertNotIn("enforce_password_validation", errors)

    def test_optional_fields(self):
        data = {
            "account_name": "account_name",
            "user_username": "user_username",
            "modules": self.modules,
            "user_first_name": "user_first_name",
            "user_last_name": "user_last_name",
            "user_email": "user_email@email.com",
            "password": self.password,
            "user_manual_path": "user_manual_path",
            "language": "fr",
            "feature_flags": [
                "ALLOW_CATCHMENT_EDITION",
                "SHOW_LINK_INSTANCE_REFERENCE",
                "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
                "SHOW_HOME_ONLINE",
            ],
            "create_main_org_unit": True,
            "create_demo_form": True,
            "enforce_password_validation": True,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_validate_account_name(self):
        existing_account = Account.objects.create(name="existing_account")
        data = {
            "account_name": existing_account.name,
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("account_name", serializer.errors)
        self.assertEqual("account_name_already_exist", serializer.errors["account_name"][0])

        existing_data_source = DataSource.objects.create(name="existing_data_source")
        new_data = {
            "account_name": existing_data_source.name,
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=new_data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("account_name", serializer.errors)
        self.assertEqual("data_source_name_already_exist", serializer.errors["account_name"][0])

    def test_validate_user_username(self):
        existing_user = User.objects.create(username="existing_user")
        data = {
            "account_name": "account_name",
            "user_username": existing_user.username,
            "modules": self.modules,
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("user_username", serializer.errors)
        self.assertEqual("user_name_already_exist", serializer.errors["user_username"][0])

    def test_validate_user_email(self):
        existing_user = User.objects.create(username="existing_user", email="existing_email@email.com")
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "user_email": existing_user.email,
            "modules": self.modules,
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("user_email", serializer.errors)
        self.assertEqual("user_email_already_exist", serializer.errors["user_email"][0])

    def test_validate_modules_no_module(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": [],
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("modules", serializer.errors)
        self.assertEqual("modules_empty", serializer.errors["modules"][0])

    def test_validate_modules_unknown_module(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": [*self.modules, "unknown_module"],
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("modules", serializer.errors)
        self.assertEqual("module_not_exist", serializer.errors["modules"][0])

    def test_validate_feature_flags_empty(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "feature_flags": [],
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("feature_flags", serializer.errors)
        self.assertEqual("feature_flags_empty", serializer.errors["feature_flags"][0])

    def test_validate_feature_flags_unknown_flag(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "feature_flags": ["Unknown", "Test", "SHOW_HOME_ONLINE"],
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("feature_flags", serializer.errors)
        self.assertEqual("invalid_account_feature_flag", serializer.errors["feature_flags"][0])

    def test_validate_email_invitation_no_email(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "email_invitation": True,
        }

        serializer = SetupAccountSerializer(data=data)
        with self.assertRaisesMessage(ValidationError, "Email is required when email_invitation is True"):
            serializer.is_valid(raise_exception=True)

    def test_validate_not_email_invitation_no_password(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
        }

        serializer = SetupAccountSerializer(data=data)
        with self.assertRaisesMessage(ValidationError, "Password is required when email_invitation is False"):
            serializer.is_valid(raise_exception=True)

    def test_email_invitation_and_password(self):
        """
        both email_invitation and password can be provided, an email will be sent even if a password is set
        """
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "email_invitation": True,
            "user_email": "user@email.com",
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_modules_default_value(self):
        serializer = SetupAccountSerializer()
        self.assertEqual(serializer.fields["modules"].initial, ["DATA_COLLECTION_FORMS"])

    def test_language_invalid_value(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "language": "es",
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        self.assertIn("language", serializer.errors)
        self.assertIn("is not a valid choice", serializer.errors["language"][0])

    def test_language_possible_values(self):
        languages = settings.LANGUAGES
        serializer = SetupAccountSerializer()
        language_field = serializer.fields["language"]

        self.assertCountEqual(language_field.choices.items(), languages)

    def test_create_without_default_module(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": [module for module in self.modules if module != "DEFAULT"],
            "password": self.password,
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        validated_data = serializer.validated_data
        self.assertNotIn("DEFAULT", validated_data["modules"])

        serializer.save()  # create objects

        new_account = Account.objects.get(name="account_name")
        self.assertIn("DEFAULT", new_account.modules)

    def test_create_language_french(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "language": "fr",
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        serializer.save()  # create objects

        user = User.objects.get(username="username")
        self.assertEqual(user.iaso_profile.language, "fr")

    def test_create_default_feature_flags(self):
        data = {
            "account_name": "account_name",
            "user_username": "username",
            "modules": self.modules,
            "password": self.password,
            "language": "fr",
        }

        serializer = SetupAccountSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        serializer.save()  # create objects

        project = Project.objects.get(name="Main Project")
        self.assertTrue(project.has_feature(FeatureFlag.REQUIRE_AUTHENTICATION))
        self.assertTrue(project.has_feature(FeatureFlag.MOBILE_SYNCHRONIZE_WITH_ZIP))
        self.assertTrue(project.has_feature(FeatureFlag.TAKE_GPS_ON_FORM))
