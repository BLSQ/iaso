import jsonschema

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.urls import reverse

from iaso.models import Profile, Project, UserRole
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.tests.api.profiles.test_views.common import PROFILE_LOG_SCHEMA, BaseProfileAPITestCase


class ProfileCreateAPITestCase(BaseProfileAPITestCase):
    def test_user_with_managed_permission_cannot_create_users(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        self.assertJSONResponse(response, 403)

    def test_create_profile_no_perm(self):
        self.client.force_authenticate(self.jane)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        self.assertJSONResponse(response, 403)

    def test_create_user_with_user_roles_and_permissions(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "email": "john.doe@test.com",
            "userPermissions": [CORE_FORMS_PERMISSION.codename],
            "userRoles": [self.user_role.id],
        }

        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)

        user_user_role = UserRole.objects.get(pk=response_data["userRoles"][0])
        self.assertEqual(user_user_role.id, self.user_role.id)
        self.assertEqual(user_user_role.group.name, self.group.name)

        user = get_user_model().objects.get(username="unittest_user_name")
        self.assertEqual(user.user_permissions.count(), 1)
        self.assertEqual(user.user_permissions.first().codename, "iaso_forms")

    def test_create_user_with_not_allowed_user_roles(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "email": "john.doe@test.com",
            "userPermissions": [CORE_FORMS_PERMISSION.codename],
            "userRoles": [self.user_role.id, self.user_role_another_account.id],
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "userRoles", "One or more user roles do not belong to the provided account.")

    def test_create_profile_duplicate_user(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "janedoe",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 400)
        self.assertEqual(response_data["userName"], ["Username already exists for this account."])

    def test_create_profile_duplicate_user_with_capital_letters(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "JaNeDoE",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "janedoe@test.com",
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 400)
        self.assertEqual(response_data["userName"], ["Username already exists for this account."])

    def test_create_profile_with_org_units_and_perms(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "email": "john.doe@test.com",
            "orgUnits": [self.org_unit_from_parent_type.id],
            "userPermissions": [CORE_FORMS_PERMISSION.codename],
            "editableOrgUnitTypeIds": [self.sub_unit_type.id],
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)

        profile = Profile.objects.get(pk=response_data["id"])
        self.assertEqual(profile.editable_org_unit_types.count(), 1)
        self.assertEqual(profile.editable_org_unit_types.first(), self.sub_unit_type)

        user = profile.user
        self.assertEqual(user.username, data["userName"])
        self.assertEqual(user.first_name, data["firstName"])

        self.assertEqual(get_user_model().objects.filter(username=data["userName"]).count(), 1)
        self.assertEqual(profile.account, self.account)

        self.assertQuerySetEqual(
            user.user_permissions.all(),
            ["<Permission: iaso | core permission support | Formulaires>"],
            transform=repr,
        )
        org_units = profile.org_units.all()
        self.assertEqual(org_units.count(), 1)
        self.assertEqual(org_units[0].name, "Corruscant Jedi Council")

    def test_create_profile_with_color(self):
        self.client.force_authenticate(self.jim)
        color = "#123abc"
        data = {
            "userName": "color_user",
            "password": "unittest_password",
            "firstName": "color_first_name",
            "lastName": "color_last_name",
            "email": "color@example.com",
            "color": color,
        }

        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)

        self.assertEqual(response_data["color"], color.upper())

        profile = Profile.objects.get(pk=response_data["id"])
        self.assertEqual(profile.color, color.upper())

    @override_settings(DEFAULT_FROM_EMAIL="sender@test.com", DNS_DOMAIN="iaso-test.bluesquare.org")
    def test_create_profile_with_send_email(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "userTest",
            "password": "",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "sendEmailInvitation": True,
            "email": "test@test.com",
        }

        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        response_data = self.assertJSONResponse(response, 201)
        self.assertEqual(len(callbacks), 1)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        profile = Profile.objects.get(pk=response_data["id"])

        # check plain text

        # should not be translated
        self.assertIn("Hello", email.body)
        self.assertNotIn("Bonjour", email.body)

        # checking variables in plain text
        self.assertIn("iaso-test.bluesquare.org", email.body)
        self.assertIn("http://", email.body)
        self.assertIn("userTest", email.body)
        self.assertIn(profile.account.name, email.body)
        self.assertIn("http://iaso-test.bluesquare.org/reset-password-confirmation", email.body)

        # check html

        self.assertEqual(len(email.alternatives), 1)

        html_content = email.alternatives[0][0]
        self.assertIn("<p> Hello", html_content)

        self.assertIn("iaso-test.bluesquare.org", html_content)
        self.assertIn("http://", html_content)
        self.assertIn("userTest", html_content)
        self.assertIn(profile.account.name, html_content)
        self.assertIn("http://iaso-test.bluesquare.org/reset-password-confirmation", html_content)

        # check senders and receivers
        self.assertEqual(email.from_email, "sender@test.com")
        self.assertEqual(email.to, ["test@test.com"])

        self.assertEqual(email.subject, "Set up a password for your new account on iaso-test.bluesquare.org")
        self.assertEqual(email.from_email, "sender@test.com")
        self.assertEqual(email.to, ["test@test.com"])
        self.assertIn("http://iaso-test.bluesquare.org", email.body)
        self.assertIn("The iaso-test.bluesquare.org Team.", email.body)

    @override_settings(DEFAULT_FROM_EMAIL="sender@test.com", DNS_DOMAIN="iaso-test.bluesquare.org")
    def test_create_profile_with_send_email_in_french(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "userTest",
            "password": "",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "sendEmailInvitation": True,
            "email": "test@test.com",
            "language": "fr",
        }

        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        result = self.assertJSONResponse(response, 201)
        self.assertEqual(len(callbacks), 1)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(
            email.subject, "Configurer un mot de passe pour votre nouveau compte sur iaso-test.bluesquare.org"
        )

        profile = Profile.objects.get(pk=result["id"])

        # check plain text

        # should be translated
        self.assertNotIn("Hello", email.body)
        self.assertIn("Bonjour", email.body)

        # checking variables in plain text
        self.assertIn("iaso-test.bluesquare.org", email.body)
        self.assertIn("http://", email.body)
        self.assertIn("userTest", email.body)
        self.assertIn(profile.account.name, email.body)
        self.assertIn("http://iaso-test.bluesquare.org/reset-password-confirmation", email.body)

        # check html

        self.assertEqual(len(email.alternatives), 1)

        html_content = email.alternatives[0][0]
        self.assertIn("<p>Bonjour", html_content)

        self.assertIn("iaso-test.bluesquare.org", html_content)
        self.assertIn("http://", html_content)
        self.assertIn("userTest", html_content)
        self.assertIn(profile.account.name, html_content)
        self.assertIn("http://iaso-test.bluesquare.org/reset-password-confirmation", html_content)

        # check senders and receivers
        self.assertEqual(email.from_email, "sender@test.com")
        self.assertEqual(email.to, ["test@test.com"])

    def test_create_profile_with_no_password_and_not_send_email(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "userTest",
            "password": "",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "sendEmailInvitation": False,
            "email": "test@test.com",
        }

        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        result = self.assertJSONResponse(response, 400)

        self.assertHasError(result, "password", "This field is required.")

    def test_create_profile_with_managed_geo_limit(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "john.doe@test.com",
            "org_units": [self.child_org_unit.id],
            "user_permissions": [CORE_FORMS_PERMISSION.codename],
        }

        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)

        profile = Profile.objects.get(pk=response_data["id"])
        user = profile.user
        self.assertEqual(user.username, data["user_name"])
        self.assertEqual(user.first_name, data["first_name"])

        self.assertEqual(get_user_model().objects.filter(username=data["user_name"]).count(), 1)
        self.assertEqual(profile.account, self.account)

        self.assertQuerySetEqual(
            user.user_permissions.all(),
            ["<Permission: iaso | core permission support | Formulaires>"],
            transform=repr,
        )
        org_units = profile.org_units.all()
        self.assertEqual(org_units.count(), 1)
        self.assertEqual(org_units[0].name, "Corruscant Jedi Council")

    def test_create_profile_without_org_unit_with_managed_geo_limit(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "email": "john.doe@test.com",
            "user_permissions": [CORE_FORMS_PERMISSION.codename],
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        self.assertJSONResponse(response, 403)

    def test_create_user_is_atomic(self):
        project_1 = Project.objects.create(name="Project 1", app_id="project.1", account=self.account)
        project_2 = Project.objects.create(name="Project 2", app_id="project.2", account=self.account)

        username = "john_doe"

        user = self.user_managed_geo_limit
        user.iaso_profile.projects.set([project_1])

        self.client.force_authenticate(user)

        self.assertEqual(get_user_model().objects.filter(username=username).count(), 0)

        data = {
            "user_name": username,
            "password": "password",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@doe.com",
            "projects": [project_2.id],
            "org_units": [self.org_unit_from_parent_type.id],
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        self.assertJSONResponse(response, 403)

        self.assertEqual(
            response.data["detail"],
            "Some projects are outside your scope.",
        )

        # If the creation is not successfully completed, no changes should be committed to the database.
        self.assertEqual(get_user_model().objects.filter(username=username).count(), 0)

    def test_create_user_with_invitation_sets_random_password(self):
        """
        Test that creating a user with send_email_invitation=True sets a random password instead of an unusable one.
        """
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "invited_user_empty_password",
            "password": "",
            "firstName": "Invited",
            "lastName": "User",
            "sendEmailInvitation": True,
            "email": "invited1@test.com",
        }

        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        self.assertEqual(len(callbacks), 1)
        self.assertJSONResponse(response, 201)

        user = get_user_model().objects.get(username="invited_user_empty_password")
        self.assertTrue(user.has_usable_password(), "Invited user should have a usable password")

        data = {
            "userName": "invited_user_missing_password",
            "firstName": "Invited",
            "lastName": "User",
            "sendEmailInvitation": True,
            "email": "invited2@test.com",
        }

        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        self.assertEqual(len(callbacks), 1)
        self.assertJSONResponse(response, 201)

        user = get_user_model().objects.get(username="invited_user_missing_password")
        self.assertTrue(user.has_usable_password())

        data = {
            "userName": "invited_user_password_is_none",
            "password": None,
            "firstName": "Invited",
            "lastName": "User",
            "sendEmailInvitation": True,
            "email": "invited3@test.com",
        }

        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        self.assertJSONResponse(response, 201)
        self.assertEqual(len(callbacks), 1)

        user = get_user_model().objects.get(username="invited_user_password_is_none")
        self.assertTrue(user.has_usable_password())

        self.assertEqual(len(mail.outbox), 3)
        self.assertEqual(mail.outbox[0].to, ["invited1@test.com"])
        self.assertEqual(mail.outbox[1].to, ["invited2@test.com"])
        self.assertEqual(mail.outbox[2].to, ["invited3@test.com"])

    def test_log_on_user_create(self):
        self.client.force_authenticate(self.john)

        data = self.get_new_user_data()
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)
        new_profile_id = response_data["id"]

        new_user_id = Profile.objects.get(pk=new_profile_id).user_id

        response = self.client.get(
            reverse("logs-list"),
            {
                "contentType": "iaso.profile",
                "fields": ",".join(["past_value", "new_value"]),
                "objectId": new_profile_id,
            },
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(log["past_value"], [])
        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_profile = log["new_value"][0]["fields"]
        self.assertEqual(new_profile["user"], new_user_id)
        self.assertEqual(new_profile["username"], data["userName"])
        self.assertEqual(new_profile["first_name"], data["firstName"])
        self.assertEqual(new_profile["last_name"], data["lastName"])
        self.assertEqual(new_profile["email"], data["email"])
        self.assertEqual(new_profile["organization"], data["organization"])
        self.assertEqual(len(new_profile["user_permissions"]), 1)
        self.assertEqual(new_profile["user_permissions"], data["userPermissions"])
        self.assertTrue(new_profile["password_updated"])
        self.assertNotIn("password", new_profile.keys())

        self.assertEqual(new_profile["dhis2_id"], data["dhis2Id"])
        self.assertEqual(new_profile["language"], data["language"])
        self.assertEqual(new_profile["home_page"], data["homePage"])
        self.assertEqual(new_profile["phone_number"], f"{data['phoneNumber']}")
        self.assertEqual(len(new_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, new_profile["org_units"])
        self.assertEqual(len(new_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_profile["user_roles"])
        self.assertEqual(len(new_profile["projects"]), 1)
        self.assertIn(self.project.id, new_profile["projects"])

    def test_create_profile_then_delete(self):
        self.client.force_authenticate(self.jim)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "email": "jane.doe@test.com",
        }
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)

        profile = Profile.objects.get(pk=response_data["id"])
        user = profile.user
        self.assertEqual(user.username, data["userName"])
        self.assertEqual(user.first_name, data["firstName"])
        self.assertQuerySetEqual(user.user_permissions.all(), [])
        self.assertEqual(get_user_model().objects.filter(username=data["userName"]).count(), 1)
        # check that we have copied the account from the creator account
        self.assertEqual(profile.account, self.account)

        profile_id = profile.id
        user_id = user.id
        response = self.client.delete(reverse("profiles-detail", kwargs={"pk": profile_id, "version": "v2"}))

        self.assertJSONResponse(response, 204)
        self.assertQuerySetEqual(get_user_model().objects.filter(id=user_id), [])
        self.assertQuerySetEqual(Profile.objects.filter(id=profile_id), [])
