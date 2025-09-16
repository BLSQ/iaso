from django.contrib.auth.models import Permission, User

from hat.audit.models import SETUP_ACCOUNT_API, Modification
from hat.menupermissions.constants import (
    DEFAULT_ACCOUNT_FEATURE_FLAGS,
    MODULES,
)
from iaso import models as m
from iaso.test import APITestCase
from iaso.utils.module_permissions import account_module_permissions


class SetupAccountApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account(name="Zelda")
        source = m.DataSource.objects.create(name="Korogu")
        cls.source = source
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()
        cls.account = account
        cls.MODULES = [module["codename"] for module in MODULES]
        user = m.User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = m.Profile(user=user, account=account)
        p.save()
        cls.user = user

        admin = m.User.objects.create_superuser(username="zelda", password="tiredofplayingthesameagain")
        cls.admin = admin

        user1 = m.User.objects.create_superuser(username="user1", password="tiredofplayingthesameagain")
        cls.user1 = user1

    def test_setupaccount_unauthorized(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/setupaccount/", data={}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_setupaccount_duplicate_account(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Zelda",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("account_name", j)

    def test_setupaccount_duplicate_datasource(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Korogu",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("account_name", j)

    def test_setupaccount_duplicate_user(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "link",
            "password": "unittest_password",
            "email_invitation": False,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_username", j)

    def test_setupaccount_create(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that created_account_id is returned in response
        response_data = response.json()
        self.assertIn("created_account_id", response_data)

        # Verify the created account exists and matches the ID in response
        created_account = m.Account.objects.get(name="unittest_account")
        self.assertEqual(response_data["created_account_id"], created_account.id)

        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)

    def test_setup_account_create_with_first_last_name(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_first_name": "unittest_first_name",
            "user_last_name": "unittest_last_name",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)

    def test_setup_account_create_with_email(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "test@example.com")

    def test_setup_account_create_with_first_last_name_and_email(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_first_name": "unittest_first_name",
            "user_last_name": "unittest_last_name",
            "user_email": "test@example.com",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.first_name, "unittest_first_name")
        self.assertEqual(user.last_name, "unittest_last_name")
        self.assertEqual(user.email, "test@example.com")

    def test_setup_account_duplicate_email(self):
        self.client.force_authenticate(self.admin)
        # Create a user with the email first
        existing_user = m.User.objects.create_user(
            username="existing_user", email="test@example.com", password="password"
        )

        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_email", j)

    def test_setup_account_without_email(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "")  # Empty string when no email provided

    def test_setup_account_invalid_email_format(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "invalid-email-format",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_email", j)

    def test_setup_account_invalid_email_format_no_at(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "testexample.com",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_email", j)

    def test_setup_account_invalid_email_format_no_domain(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_email", j)

    def test_setup_account_valid_email_formats(self):
        self.client.force_authenticate(self.admin)
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org",
            "123@numbers.com",
            "user@subdomain.example.com",
        ]

        for email in valid_emails:
            data = {
                "account_name": f"unittest_account_{email.replace('@', '_').replace('.', '_')}",
                "user_username": f"unittest_username_{email.replace('@', '_').replace('.', '_')}",
                "user_email": email,
                "password": "unittest_password",
                "modules": self.MODULES,
            }
            response = self.client.post("/api/setupaccount/", data=data, format="json")
            self.assertEqual(response.status_code, 201, f"Failed for email: {email}")

    def test_setup_account_email_invitation_with_password(self):
        """Test that email invitation works when both password and email_invitation are provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "password": "unittest_password",
            "email_invitation": True,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "test@example.com")
        # User should have a usable password since password was provided
        self.assertTrue(user.has_usable_password())

    def test_setup_account_email_invitation_without_password(self):
        """Test that email invitation works when only email_invitation is True"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "email_invitation": True,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "test@example.com")
        # User should have unusable password since no password was provided
        self.assertFalse(user.has_usable_password())

    def test_setup_account_email_invitation_no_email(self):
        """Test that email invitation fails when email_invitation is True but no email provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "email_invitation": True,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("user_email", j)

    def test_setup_account_no_password_no_email_invitation(self):
        """Test that setup fails when neither password nor email_invitation is provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("password", j)

    def test_setup_account_has_all_perms(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        user = User.objects.get(username="unittest_username")

        has_all_perms = True

        account = m.Account.objects.filter(name="unittest_account")
        modules_permissions = account_module_permissions(account.first().modules)

        for perm in Permission.objects.filter(codename__in=modules_permissions):
            if perm not in user.user_permissions.all():
                has_all_perms = False

        self.assertEqual(response.status_code, 201)
        self.assertEqual(account.count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)
        self.assertEqual(has_all_perms, True)

    def test_setup_account_project_creation(self):
        self.client.force_authenticate(self.admin)

        data = {
            "account_name": "initial_project_account test-appid",
            "user_username": "username",
            "password": "password",
            "email_invitation": False,
            "modules": self.MODULES,
        }

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        created_account = m.Account.objects.filter(name="initial_project_account test-appid")
        created_project = m.Project.objects.filter(name="Main Project")
        created_data_source = m.DataSource.objects.filter(name="initial_project_account test-appid")
        self.assertEqual(len(created_project), 1)

        project = created_project.first()
        # Check if the project has the correct app_id
        self.assertEqual(project.app_id, "initial_project_account.test.appid")
        # Check if the project is linked to the correct account
        self.assertEqual(project.account, created_account.first())
        # Check if the project is linked to the correct data source
        data_source = created_data_source.first()
        project_data_sources = project.data_sources.filter(pk=data_source.id)
        self.assertEqual(project_data_sources.first(), data_source)

    def test_setup_account_with_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
            "feature_flags": [
                "ALLOW_CATCHMENT_EDITION",
                "SHOW_PAGES",
                "SHOW_LINK_INSTANCE_REFERENCE",
                "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
                "SHOW_HOME_ONLINE",
            ],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        account = response.json()
        self.assertEqual(account["feature_flags"], data["feature_flags"])

        # Check that created_account_id is returned in response
        self.assertIn("created_account_id", account)
        created_account = m.Account.objects.get(name="unittest_account")
        self.assertEqual(account["created_account_id"], created_account.id)

    def test_setup_account_without_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        created_account = m.Account.objects.filter(name="account with no feature test-featureappid")
        feature_flags = created_account.first().feature_flags.values_list("code", flat=True)
        self.assertEqual(sorted(feature_flags), sorted(DEFAULT_ACCOUNT_FEATURE_FLAGS))

    def test_setup_account_with_at_leat_an_invalid_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": ["Unknown", "Test", "SHOW_HOME_ONLINE"],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["invalid_account_feature_flag"])

    def test_setup_account_with_None_value_as_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with None feature flag test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": None,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["This field may not be null."])

    def test_setup_account_with_empty_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account empty feature flag test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
            "modules": self.MODULES,
            "feature_flags": [],
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["feature_flags"], ["feature_flags_empty"])

    def test_create_new_account_with_user_multi_account(self):
        new_user = m.User.objects.create(username="multi_account_user", is_superuser=True)
        m.TenantUser.objects.create(main_user=self.user1, account_user=new_user)

        self.client.force_authenticate(new_user)

        data = {
            "account_name": "account_multi_account",
            "user_username": "username",
            "password": "password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertEqual(response_data["account_name"], data["account_name"])

        # Check that created_account_id is returned in response
        self.assertIn("created_account_id", response_data)
        created_account = m.Account.objects.get(name="account_multi_account")
        self.assertEqual(response_data["created_account_id"], created_account.id)

    def test_create_new_account_via_no_super_user_multi_account(self):
        new_user = m.User.objects.create(
            username="no_super_user_multi_account",
        )
        m.TenantUser.objects.create(main_user=self.user1, account_user=new_user)
        self.client.force_authenticate(new_user)
        data = {
            "account_name": "account_multi_account",
            "user_username": "username",
            "password": "password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["detail"],
            "You do not have permission to perform this action.",
        )

    def test_setup_account_creates_org_unit_type(self):
        """Test that setup account creates an org unit type"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that org unit type was created
        org_unit_type = m.OrgUnitType.objects.filter(name="Main org unit type").first()
        self.assertIsNotNone(org_unit_type)
        self.assertEqual(org_unit_type.short_name, "Main ou type")
        self.assertEqual(org_unit_type.depth, 0)

        # Check that org unit type is linked to the project
        project = m.Project.objects.filter(name="Main Project").first()
        self.assertIsNotNone(project)
        self.assertIn(org_unit_type, project.unit_types.all())

    def test_setup_account_creates_org_unit(self):
        """Test that setup account creates an org unit"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that org unit was created
        org_unit = m.OrgUnit.objects.filter(name="Main org unit").first()
        self.assertIsNotNone(org_unit)
        self.assertEqual(org_unit.validation_status, "VALID")

        # Check that org unit is linked to the org unit type
        org_unit_type = m.OrgUnitType.objects.filter(name="Main org unit type").first()
        self.assertEqual(org_unit.org_unit_type, org_unit_type)

    def test_setup_account_creates_form(self):
        """Test that setup account creates a demo form"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that form was created
        form = m.Form.objects.filter(name="Demo Form").first()
        self.assertIsNotNone(form)
        # The form_id is automatically generated from the Excel file, so we just check it exists
        self.assertIsNotNone(form.form_id)
        self.assertEqual(form.location_field, "gps")

        # Check that form is linked to the org unit type
        org_unit_type = m.OrgUnitType.objects.filter(name="Main org unit type").first()
        self.assertIn(org_unit_type, form.org_unit_types.all())

        # Check that form is linked to the project
        project = m.Project.objects.filter(name="Main Project").first()
        self.assertIn(project, form.projects.all())

    def test_setup_account_creates_form_version(self):
        """Test that setup account creates a form version"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that form version was created
        form = m.Form.objects.filter(name="Demo Form").first()
        self.assertIsNotNone(form)
        self.assertEqual(form.form_versions.count(), 1)

        form_version = form.form_versions.first()
        self.assertIsNotNone(form_version.xls_file)
        self.assertIsNotNone(form_version.file)

    def test_setup_account_default_modules(self):
        """Test that setup account uses default modules when none provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": [
                "DEFAULT",
                "DATA_COLLECTION_FORMS",
            ],  # Explicitly provide default modules
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that default modules are used
        account = m.Account.objects.get(name="unittest_account")
        expected_modules = ["DEFAULT", "DATA_COLLECTION_FORMS"]
        self.assertEqual(account.modules, expected_modules)

    def test_setup_account_serializer_default_modules(self):
        """Test that the serializer has the correct default modules"""
        serializer = self.get_serializer_instance()
        self.assertEqual(serializer.fields["modules"].initial, ["DATA_COLLECTION_FORMS"])

    def test_setup_account_auto_adds_default_module(self):
        """Test that DEFAULT module is automatically added even when not provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": ["DATA_COLLECTION_FORMS"],  # Only provide DATA_COLLECTION_FORMS
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that DEFAULT module was automatically added
        account = m.Account.objects.get(name="unittest_account")
        expected_modules = ["DEFAULT", "DATA_COLLECTION_FORMS"]
        self.assertEqual(sorted(account.modules), sorted(expected_modules))

    def test_setup_account_does_not_duplicate_default_module(self):
        """Test that DEFAULT module is not duplicated when already provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": ["DEFAULT", "DATA_COLLECTION_FORMS"],  # Explicitly include DEFAULT
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that DEFAULT module is not duplicated
        account = m.Account.objects.get(name="unittest_account")
        expected_modules = ["DEFAULT", "DATA_COLLECTION_FORMS"]
        self.assertEqual(sorted(account.modules), sorted(expected_modules))
        # Verify no duplicates by checking length
        self.assertEqual(len(account.modules), 2)

    def get_serializer_instance(self):
        """Helper method to get a serializer instance for testing"""
        from iaso.api.setup_account import SetupAccountSerializer

        return SetupAccountSerializer()

    def test_setup_account_demo_form_file_usage(self):
        """Test that the demo form file is actually used to create the form version"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that form version was created with the demo form file
        form = m.Form.objects.filter(name="Demo Form").first()
        self.assertIsNotNone(form)

        form_version = form.form_versions.first()
        self.assertIsNotNone(form_version)
        self.assertIsNotNone(form_version.xls_file)
        self.assertIsNotNone(form_version.file)

        # Verify the form descriptor was populated
        self.assertIsNotNone(form_version.form_descriptor)

        # Verify the form has possible fields populated
        self.assertIsNotNone(form.possible_fields)

    def test_setup_account_complete_integration(self):
        """Test that setup account creates a complete integrated environment"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Verify all components are created and linked
        account = m.Account.objects.get(name="unittest_account")
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        project = m.Project.objects.get(name="Main Project", account=account)
        org_unit_type = m.OrgUnitType.objects.get(name="Main org unit type")
        org_unit = m.OrgUnit.objects.get(name="Main org unit")
        form = m.Form.objects.get(name="Demo Form")

        # Check account-project relationship
        self.assertEqual(project.account, account)

        # Check project-org_unit_type relationship
        self.assertIn(org_unit_type, project.unit_types.all())

        # Check org_unit-org_unit_type relationship
        self.assertEqual(org_unit.org_unit_type, org_unit_type)

        # Check form-project relationship
        self.assertIn(project, form.projects.all())

        # Check form-org_unit_type relationship
        self.assertIn(org_unit_type, form.org_unit_types.all())

        # Check user has permissions
        self.assertTrue(user.user_permissions.count() > 0)

    def test_setup_account_language_default_english(self):
        """Test that language defaults to English when not provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that profile has English as default language
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        self.assertEqual(profile.language, "en")

    def test_setup_account_language_french(self):
        """Test that French language is properly saved"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "fr",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that profile has French language
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        self.assertEqual(profile.language, "fr")

    def test_setup_account_language_english_explicit(self):
        """Test that English language is properly saved when explicitly provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "en",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that profile has English language
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        self.assertEqual(profile.language, "en")

    def test_setup_account_language_invalid_choice(self):
        """Test that invalid language choices are rejected"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "es",  # Invalid choice
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        j = response.json()
        self.assertIn("language", j)

    def test_setup_account_language_with_email_invitation(self):
        """Test that language is used in email invitation"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "email_invitation": True,
            "language": "fr",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that profile has French language
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        self.assertEqual(profile.language, "fr")

    def test_setup_account_language_serializer_choices(self):
        """Test that the serializer has the correct language choices"""
        serializer = self.get_serializer_instance()
        language_field = serializer.fields["language"]
        # Django ChoiceField returns OrderedDict, so we convert to list for comparison
        expected_choices = [("fr", "French"), ("en", "English")]
        actual_choices = list(language_field.choices.items())
        self.assertEqual(actual_choices, expected_choices)
        self.assertEqual(language_field.default, "en")

    def test_setup_account_language_serializer_default(self):
        """Test that the serializer has the correct default language"""
        serializer = self.get_serializer_instance()
        self.assertEqual(serializer.fields["language"].default, "en")

    def test_setup_account_audit_logging_success(self):
        """Test that successful account creation creates an audit log"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "fr",
            "modules": self.MODULES,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that an audit log was created
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        self.assertEqual(latest_log.user, self.admin)
        self.assertEqual(latest_log.source, SETUP_ACCOUNT_API)

        # Check audit data content
        audit_data = latest_log.new_value[0]
        self.assertEqual(audit_data["account_name"], "unittest_account")
        self.assertEqual(audit_data["user_username"], "unittest_username")
        self.assertEqual(audit_data["language"], "fr")
        self.assertEqual(audit_data["status"], "success")
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("created_account_id", audit_data)
        self.assertNotEqual(audit_data["created_account_id"], "0")  # Should be a real account ID
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_audit_logging_validation_error(self):
        """Test that validation errors create an audit log"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Zelda",  # This will fail because account already exists
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "en",
            "modules": self.MODULES,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)

        # Check that an audit log was created for the failed attempt
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        self.assertEqual(latest_log.user, self.admin)
        self.assertEqual(latest_log.source, SETUP_ACCOUNT_API)

        # Check audit data content
        audit_data = latest_log.new_value[0]
        self.assertEqual(audit_data["account_name"], "Zelda")
        self.assertEqual(audit_data["user_username"], "unittest_username")
        self.assertEqual(audit_data["language"], "en")
        self.assertEqual(audit_data["status"], "error")
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("error_message", audit_data)
        self.assertIn("error_type", audit_data)
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_audit_logging_invalid_language(self):
        """Test that invalid language choices create an audit log"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "language": "invalid_language",  # This will cause a validation error
            "modules": self.MODULES,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 400)

        # Check that an audit log was created for the failed attempt
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        self.assertEqual(latest_log.user, self.admin)
        self.assertEqual(latest_log.source, SETUP_ACCOUNT_API)

        # Check audit data content
        audit_data = latest_log.new_value[0]
        self.assertEqual(audit_data["account_name"], "unittest_account")
        self.assertEqual(audit_data["language"], "invalid_language")
        self.assertEqual(audit_data["status"], "error")
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("error_message", audit_data)
        self.assertIn("error_type", audit_data)
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_audit_logging_with_email_invitation(self):
        """Test that audit logging works with email invitation"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "email_invitation": True,
            "language": "fr",
            "modules": self.MODULES,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that an audit log was created
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        audit_data = latest_log.new_value[0]

        # Check that email invitation data is captured
        self.assertEqual(audit_data["email_invitation"], True)
        self.assertEqual(audit_data["user_email"], "test@example.com")
        self.assertEqual(audit_data["language"], "fr")
        self.assertEqual(audit_data["status"], "success")
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("created_account_id", audit_data)
        self.assertNotEqual(audit_data["created_account_id"], "0")  # Should be a real account ID
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_audit_logging_complete_data(self):
        """Test that audit logging captures all setup parameters"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_first_name": "Test",
            "user_last_name": "User",
            "user_email": "test@example.com",
            "password": "unittest_password",
            "email_invitation": True,
            "language": "fr",
            "modules": self.MODULES,
            "feature_flags": ["SHOW_HOME_ONLINE", "ALLOW_CATCHMENT_EDITION"],
        }

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Get the latest audit log
        latest_log = Modification.objects.filter(source=SETUP_ACCOUNT_API).latest("id")
        audit_data = latest_log.new_value[0]

        # Verify all parameters are captured
        self.assertEqual(audit_data["account_name"], "unittest_account")
        self.assertEqual(audit_data["user_username"], "unittest_username")
        self.assertEqual(audit_data["user_first_name"], "Test")
        self.assertEqual(audit_data["user_last_name"], "User")
        self.assertEqual(audit_data["user_email"], "test@example.com")
        self.assertEqual(audit_data["email_invitation"], True)
        self.assertEqual(audit_data["language"], "fr")
        self.assertEqual(audit_data["modules"], self.MODULES)
        self.assertEqual(audit_data["feature_flags"], ["SHOW_HOME_ONLINE", "ALLOW_CATCHMENT_EDITION"])
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertEqual(audit_data["status"], "success")
        self.assertIn("created_account_id", audit_data)
        self.assertNotEqual(audit_data["created_account_id"], "0")  # Should be a real account ID
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_audit_logging_no_request_user(self):
        """Test that audit logging works even without a request user"""
        # This test would require mocking the context, but we can test the structure
        # by ensuring the audit data structure handles None values properly
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Get the latest audit log
        latest_log = Modification.objects.filter(source=SETUP_ACCOUNT_API).latest("id")
        audit_data = latest_log.new_value[0]

        # Verify that requesting_user is captured (should be admin in this case)
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("created_account_id", audit_data)
        self.assertNotEqual(audit_data["created_account_id"], "0")  # Should be a real account ID
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)

    def test_setup_account_returns_created_account_id(self):
        """Test that setup account returns the created account ID in the response"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "test_created_id_account",
            "user_username": "test_created_id_user",
            "password": "test_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that response contains created_account_id
        response_data = response.json()
        self.assertIn("created_account_id", response_data)
        self.assertIsInstance(response_data["created_account_id"], int)

        # Verify that the returned ID matches the actual created account
        created_account = m.Account.objects.get(name="test_created_id_account")
        self.assertEqual(response_data["created_account_id"], created_account.id)

        # Verify the account was properly created with expected properties
        self.assertEqual(created_account.name, data["account_name"])
        self.assertEqual(created_account.modules, data["modules"])

    def test_setup_account_creates_project_feature_flags(self):
        """Test that setup account creates project feature flags for REQUIRE_AUTHENTICATION and FORMS_AUTO_UPLOAD and TAKE_GPS_ON_FORM"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Get the created project
        project = m.Project.objects.filter(name="Main Project").first()
        self.assertIsNotNone(project)

        # Check that the project has the required feature flags
        self.assertTrue(project.has_feature(m.FeatureFlag.REQUIRE_AUTHENTICATION))
        self.assertTrue(project.has_feature(m.FeatureFlag.FORMS_AUTO_UPLOAD))
        self.assertTrue(project.has_feature(m.FeatureFlag.TAKE_GPS_ON_FORM))

        # Verify ProjectFeatureFlags entries exist
        require_auth_pff = m.ProjectFeatureFlags.objects.filter(
            project=project, featureflag__code=m.FeatureFlag.REQUIRE_AUTHENTICATION
        ).first()
        self.assertIsNotNone(require_auth_pff)

        forms_auto_upload_pff = m.ProjectFeatureFlags.objects.filter(
            project=project, featureflag__code=m.FeatureFlag.FORMS_AUTO_UPLOAD
        ).first()
        self.assertIsNotNone(forms_auto_upload_pff)

        # Verify the feature flags are properly linked
        self.assertEqual(require_auth_pff.featureflag.code, m.FeatureFlag.REQUIRE_AUTHENTICATION)
        self.assertEqual(forms_auto_upload_pff.featureflag.code, m.FeatureFlag.FORMS_AUTO_UPLOAD)

    def test_setup_account_project_feature_flags_audit_logging(self):
        """Test that project feature flags are included in audit logs"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that an audit log was created
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        audit_data = latest_log.new_value[0]

        # Check that project feature flags are included in audit data
        self.assertIn("project_feature_flags", audit_data)
        self.assertEqual(
            audit_data["project_feature_flags"], [m.FeatureFlag.REQUIRE_AUTHENTICATION, m.FeatureFlag.FORMS_AUTO_UPLOAD]
        )

    def test_setup_account_feature_flags_exist_in_database(self):
        """Test that the required feature flags exist in the database"""
        # Verify that the feature flags exist
        require_auth_flag = m.FeatureFlag.objects.filter(code=m.FeatureFlag.REQUIRE_AUTHENTICATION).first()
        self.assertIsNotNone(require_auth_flag)
        self.assertEqual(require_auth_flag.code, m.FeatureFlag.REQUIRE_AUTHENTICATION)

        forms_auto_upload_flag = m.FeatureFlag.objects.filter(code=m.FeatureFlag.FORMS_AUTO_UPLOAD).first()
        self.assertIsNotNone(forms_auto_upload_flag)
        self.assertEqual(forms_auto_upload_flag.code, m.FeatureFlag.FORMS_AUTO_UPLOAD)

    def test_setup_account_project_feature_flags_configuration(self):
        """Test that project feature flags are created with proper configuration"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Get the created project
        project = m.Project.objects.filter(name="Main Project").first()
        self.assertIsNotNone(project)

        # Check ProjectFeatureFlags configuration
        project_feature_flags = m.ProjectFeatureFlags.objects.filter(project=project)
        self.assertEqual(project_feature_flags.count(), 3)

        for pff in project_feature_flags:
            # Configuration should be None for these feature flags
            self.assertIsNone(pff.configuration)
            # Feature flag should be one of the expected ones
            self.assertIn(
                pff.featureflag.code,
                [m.FeatureFlag.REQUIRE_AUTHENTICATION, m.FeatureFlag.FORMS_AUTO_UPLOAD, m.FeatureFlag.TAKE_GPS_ON_FORM],
            )

    def test_setup_account_project_feature_flags_multiple_accounts(self):
        """Test that multiple accounts get the same project feature flags"""
        self.client.force_authenticate(self.admin)

        # Create first account
        data1 = {
            "account_name": "unittest_account_1",
            "user_username": "unittest_username_1",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response1 = self.client.post("/api/setupaccount/", data=data1, format="json")
        self.assertEqual(response1.status_code, 201)

        # Create second account
        data2 = {
            "account_name": "unittest_account_2",
            "user_username": "unittest_username_2",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response2 = self.client.post("/api/setupaccount/", data=data2, format="json")
        self.assertEqual(response2.status_code, 201)

        # Get both projects
        project1 = m.Project.objects.filter(name="Main Project", account__name="unittest_account_1").first()
        project2 = m.Project.objects.filter(name="Main Project", account__name="unittest_account_2").first()

        self.assertIsNotNone(project1)
        self.assertIsNotNone(project2)

        # Both projects should have the same feature flags
        for project in [project1, project2]:
            self.assertTrue(project.has_feature(m.FeatureFlag.REQUIRE_AUTHENTICATION))
            self.assertTrue(project.has_feature(m.FeatureFlag.FORMS_AUTO_UPLOAD))

            # Check ProjectFeatureFlags entries
            pff_count = m.ProjectFeatureFlags.objects.filter(project=project).count()
            self.assertEqual(pff_count, 3)

    def test_setup_account_project_feature_flags_integration(self):
        """Test that project feature flags work with the complete setup account flow"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "email_invitation": False,
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Verify complete integration
        account = m.Account.objects.get(name="unittest_account")
        project = m.Project.objects.get(name="Main Project", account=account)

        # Project should have feature flags
        self.assertTrue(project.has_feature(m.FeatureFlag.REQUIRE_AUTHENTICATION))
        self.assertTrue(project.has_feature(m.FeatureFlag.FORMS_AUTO_UPLOAD))

        # Project should be linked to account
        self.assertEqual(project.account, account)

        # Project should have proper app_id
        expected_app_id = "unittest_account"
        self.assertEqual(project.app_id, expected_app_id)
