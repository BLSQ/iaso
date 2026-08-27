from unittest.mock import patch

from django.contrib.auth.models import Permission, User
from rest_framework import status

from hat.audit.models import SETUP_ACCOUNT_API, Modification
from iaso import models as m
from iaso.api.setup_account.utils import DEFAULT_ACCOUNT_FEATURE_FLAGS, DEFAULT_PROJECT_FEATURE_FLAGS
from iaso.modules import MODULES
from iaso.test import APITestCase


class SetupAccountApiTestCase(APITestCase):
    BASE_URL = "/api/setupaccount/"

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account(name="Zelda")
        cls.modules = [module.codename for module in MODULES]
        cls.source = m.DataSource.objects.create(name="Korogu")
        version = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        cls.account.default_version = version
        cls.account.save()
        cls.user = m.User.objects.create(username="link")
        cls.user.set_password("tiredofplayingthesameagain")
        cls.user.save()
        p = m.Profile(user=cls.user, account=cls.account)
        p.save()

        cls.admin = m.User.objects.create_superuser(username="zelda", password="tiredofplayingthesameagain")
        cls.user1 = m.User.objects.create_superuser(username="user1", password="tiredofplayingthesameagain")
        cls.password = "0123456789-password-####''''test-something-something'"

    def test_setupaccount_unauthorized(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.BASE_URL, data={}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_setupaccount_create(self):
        # Count audit logs before
        initial_logs_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "initial_project_account test-appid",
            "user_username": "unittest_username",
            "password": self.password,
            "modules": self.modules,
            "user_email": "test@example.com",
            "email_invitation": False,
            "user_first_name": "unittest_first_name",
            "user_last_name": "unittest_last_name",
            "feature_flags": [
                "ALLOW_CATCHMENT_EDITION",
                "SHOW_LINK_INSTANCE_REFERENCE",
                "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
                "SHOW_HOME_ONLINE",
            ],
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        result = self.assertJSONResponse(response, status.HTTP_201_CREATED)

        created_account = m.Account.objects.get(name="initial_project_account test-appid")
        self.assertEqual(result["created_account_id"], created_account.id)
        self.assertTrue(created_account.enforce_password_validation)  # checking default value
        self.assertEqual(result["feature_flags"], data["feature_flags"])
        self.assertCountEqual(created_account.feature_flags.values_list("code", flat=True), data["feature_flags"])

        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.first_name, "unittest_first_name")
        self.assertEqual(user.last_name, "unittest_last_name")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.iaso_profile.language, "en")

        created_project = m.Project.objects.filter(name="Main Project")
        created_data_source = m.DataSource.objects.filter(name="initial_project_account test-appid")
        self.assertEqual(len(created_project), 1)

        project = created_project.first()
        # Check if the project has the correct app_id
        self.assertEqual(project.app_id, "initial_project_account.test.appid")
        # Check if the project is linked to the correct account
        self.assertEqual(project.account, created_account)
        # Check if the project is linked to the correct data source
        self.assertTrue(created_data_source.exists())
        data_source = created_data_source.first()
        project_data_sources = project.data_sources.filter(pk=data_source.id)
        self.assertEqual(project_data_sources.first(), data_source)

        org_unit_type = m.OrgUnitType.objects.filter(name="Main org unit type").first()
        self.assertIsNotNone(org_unit_type)
        self.assertEqual(org_unit_type.short_name, "Main ou type")
        self.assertEqual(org_unit_type.depth, 0)
        self.assertIn(org_unit_type, project.unit_types.all())

        org_unit = m.OrgUnit.objects.filter(name="Main org unit").first()
        self.assertIsNotNone(org_unit)
        self.assertEqual(org_unit.validation_status, "VALID")
        self.assertEqual(org_unit.org_unit_type, org_unit_type)

        form = m.Form.objects.filter(name="Demo Form").first()
        self.assertIsNotNone(form)
        # The form_id is automatically generated from the Excel file, so we just check it exists
        self.assertIsNotNone(form.form_id)
        self.assertEqual(form.location_field, "gps")
        self.assertIsNotNone(form.possible_fields)
        self.assertIn(org_unit_type, form.org_unit_types.all())
        self.assertIn(project, form.projects.all())

        self.assertEqual(form.form_versions.count(), 1)
        form_version = form.form_versions.first()
        self.assertIsNotNone(form_version.xls_file)
        self.assertIsNotNone(form_version.file)
        self.assertIsNotNone(form_version.form_descriptor)

        # Check that an audit log was created
        audit_logs = Modification.objects.filter(source=SETUP_ACCOUNT_API)
        self.assertEqual(audit_logs.count(), initial_logs_count + 1)

        # Get the latest audit log
        latest_log = audit_logs.latest("id")
        self.assertEqual(latest_log.user, self.admin)
        self.assertEqual(latest_log.source, SETUP_ACCOUNT_API)

        # Check audit data content
        audit_data = latest_log.new_value[0]
        self.assertEqual(audit_data["account_name"], data["account_name"])
        self.assertEqual(audit_data["user_username"], data["user_username"])
        self.assertEqual(audit_data["user_first_name"], data["user_first_name"])
        self.assertEqual(audit_data["user_last_name"], data["user_last_name"])
        self.assertEqual(audit_data["user_email"], data["user_email"])
        self.assertEqual(audit_data["email_invitation"], False)
        self.assertEqual(audit_data["language"], "en")
        self.assertEqual(audit_data["status"], "success")
        self.assertEqual(audit_data["modules"], self.modules)
        self.assertEqual(audit_data["feature_flags"], data["feature_flags"])
        self.assertEqual(audit_data["requesting_user"], self.admin.username)
        self.assertEqual(audit_data["requesting_user_id"], self.admin.id)
        self.assertIn("created_account_id", audit_data)
        self.assertNotEqual(audit_data["created_account_id"], "0")  # Should be a real account ID
        # Verify modules and feature_flags are proper arrays (not JSON strings)
        self.assertIsInstance(audit_data["modules"], list)
        self.assertIsInstance(audit_data["feature_flags"], list)
        self.assertIn("project_feature_flags", audit_data)
        self.assertCountEqual(
            audit_data["project_feature_flags"],
            DEFAULT_PROJECT_FEATURE_FLAGS,
        )

    def test_setup_account_without_email(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": self.password,
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "")  # Empty string when no email provided

    def test_setup_account_email_invitation_without_password(self):
        """Test that email invitation works when only email_invitation is True"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "user_email": "test@example.com",
            "email_invitation": True,
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = m.User.objects.get(username="unittest_username")
        self.assertEqual(user.email, "test@example.com")
        # User should have unusable password since no password was provided
        self.assertFalse(user.has_usable_password())

    def test_setup_account_has_all_perms(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")

        user = User.objects.get(username="unittest_username")

        has_all_perms = True

        account = m.Account.objects.filter(name="unittest_account")
        modules_permissions = account.first().permissions_from_active_modules
        codenames = [perm.codename for perm in modules_permissions]

        for perm in Permission.objects.filter(codename__in=codenames):
            if perm not in user.user_permissions.all():
                has_all_perms = False

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(account.count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)
        self.assertEqual(has_all_perms, True)

    def test_setup_account_without_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": self.password,
            "email_invitation": False,
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_account = m.Account.objects.filter(name="account with no feature test-featureappid")
        feature_flags = created_account.first().feature_flags.values_list("code", flat=True)
        self.assertEqual(sorted(feature_flags), sorted(DEFAULT_ACCOUNT_FEATURE_FLAGS))

    def test_create_new_account_with_user_multi_account(self):
        new_user = m.User.objects.create(username="multi_account_user", is_superuser=True)
        m.TenantUser.objects.create(main_user=self.user1, account_user=new_user)

        self.client.force_authenticate(new_user)

        data = {
            "account_name": "account_multi_account",
            "user_username": "username",
            "password": self.password,
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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
            "modules": self.modules,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.json()["detail"],
            "You do not have permission to perform this action.",
        )

    def test_setup_account_audit_logging_validation_error(self):
        """Test that validation errors create an audit log"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Zelda",  # This will fail because account already exists
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
            "language": "en",
            "modules": self.modules,
        }

        # Count audit logs before
        initial_count = Modification.objects.filter(source=SETUP_ACCOUNT_API).count()

        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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

    def test_setup_account_create_main_org_unit_false(self):
        """Test that setting create_main_org_unit to False skips org unit creation"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
            "modules": self.modules,
            "create_main_org_unit": False,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check that main org unit was NOT created
        org_unit = m.OrgUnit.objects.filter(name="Main org unit").first()
        self.assertIsNone(org_unit)

        # Check that main org unit type was NOT created
        org_unit_type = m.OrgUnitType.objects.filter(name="Main org unit type").first()
        self.assertIsNone(org_unit_type)

    def test_setup_account_create_demo_form_false(self):
        """Test that setting create_demo_form to False skips demo form creation"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
            "modules": self.modules,
            "create_demo_form": False,
        }
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check that demo form was NOT created
        form = m.Form.objects.filter(name="Demo Form").first()
        self.assertIsNone(form)

    def test_setup_account_enforce_password_validation_false(self):
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "a",
            "modules": self.modules,
            "enforce_password_validation": False,
        }
        self.client.force_authenticate(self.admin)
        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_account = m.Account.objects.get(name="unittest_account")
        self.assertFalse(new_account.enforce_password_validation)

        new_user = User.objects.get(username="unittest_username")
        self.assertTrue(new_user.check_password("a"))

    @patch("iaso.api.setup_account.views.logger")
    def test_400_does_not_log(self, mock_logger):
        # to avoid sentry catching error on 400
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "Zelda",
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
        }

        response = self.client.post(self.BASE_URL, data=data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        mock_logger.error.assert_not_called()

    @patch("iaso.api.setup_account.views.logger")
    @patch("iaso.models.Account.objects.create")
    def test_500_does_log(self, mock_account_create, mock_logger):
        # so sentry catches it

        self.client.raise_request_exception = False
        mock_account_create.side_effect = Exception("Boum")

        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": self.password,
            "email_invitation": False,
            "modules": self.modules,
        }

        response = self.client.post(self.BASE_URL, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

        args, kwargs = mock_logger.error.call_args

        self.assertEqual(
            args[0],
            "Account setup failed: unittest_account by user zelda: Boum",
        )

        self.assertEqual(
            kwargs["extra"]["audit_data"]["status"],
            "error",
        )

        self.assertEqual(
            kwargs["extra"]["audit_data"]["error_message"],
            "Boum",
        )
