from django.contrib.auth.models import Permission, User

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
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
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
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(m.Account.objects.filter(name="unittest_account").count(), 1)
        self.assertEqual(m.Profile.objects.filter(user__username="unittest_username").count(), 1)
        self.assertEqual(m.User.objects.filter(username="unittest_username").count(), 1)

    def test_setup_account_has_all_perms(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
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

    def test_setup_account_without_feature_flags(self):
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "account with no feature test-featureappid",
            "user_username": "username",
            "user_first_name": "firstname",
            "user_last_name": "lastname",
            "password": "password",
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
        new_user = m.User.objects.create(username=self.account, is_superuser=True)
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
        self.assertEqual(response.json()["account_name"], data["account_name"])

    def test_create_new_account_via_no_super_user_multi_account(self):
        new_user = m.User.objects.create(
            username=self.account,
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

    def test_setup_account_links_profile_to_project(self):
        """Test that setup account links the user profile to the project"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": self.MODULES,
        }
        response = self.client.post("/api/setupaccount/", data=data, format="json")
        self.assertEqual(response.status_code, 201)

        # Check that profile is linked to the project
        user = m.User.objects.get(username="unittest_username")
        profile = user.iaso_profile
        project = m.Project.objects.filter(name="Main Project").first()
        self.assertIn(project, profile.projects.all())

    def test_setup_account_default_modules(self):
        """Test that setup account uses default modules when none provided"""
        self.client.force_authenticate(self.admin)
        data = {
            "account_name": "unittest_account",
            "user_username": "unittest_username",
            "password": "unittest_password",
            "modules": ["DEFAULT", "DATA_COLLECTION_FORMS"],  # Explicitly provide default modules
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
        self.assertEqual(serializer.fields["modules"].initial, ["DEFAULT", "DATA_COLLECTION_FORMS"])

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

        # Check profile-project relationship
        self.assertIn(project, profile.projects.all())

        # Check user has permissions
        self.assertTrue(user.user_permissions.count() > 0)
