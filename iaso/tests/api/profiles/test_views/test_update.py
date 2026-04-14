import jsonschema

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.urls import reverse

from iaso.api.profiles.constants import PK_ME
from iaso.models import Profile, Project, TenantUser, UserRole
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
)
from iaso.tests.api.profiles.test_views.common import PROFILE_LOG_SCHEMA, BaseProfileAPITestCase


class ProfileUpdateAPITestCase(BaseProfileAPITestCase):
    def test_update_profile_without_changing_username_should_succeed(self):
        """Test that updating profile without changing username succeeds."""
        self.client.force_authenticate(self.john)

        alice = self.create_user_with_profile(
            username="alice", account=self.account, first_name="Alice", last_name="Smith"
        )
        bob = self.create_user_with_profile(username="bob", account=self.account, first_name="Bob", last_name="Smith")

        alice_profile = Profile.objects.get(user=alice)
        data = {
            "userName": alice.username,
            "firstName": "Alice Changed",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": alice_profile.id, "version": "v2"}), data=data, format="json"
        )

        self.assertJSONResponse(response, 200)
        alice.refresh_from_db()
        self.assertEqual(alice.username, "alice")
        self.assertEqual(alice.first_name, "Alice Changed")

        bob_profile = Profile.objects.get(user=bob)
        data = {
            "firstName": "Bob Changed",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": bob_profile.id, "version": "v2"}), data=data, format="json"
        )

        self.assertJSONResponse(response, 200)
        bob.refresh_from_db()
        self.assertEqual(bob.username, "bob")
        self.assertEqual(bob.first_name, "Bob Changed")

    def test_update_profile_to_existing_username_should_fail(self):
        """Test that changing username to an existing one (case-insensitive) fails correctly."""
        self.client.force_authenticate(self.john)

        alice = self.create_user_with_profile(
            username="alice", account=self.account, first_name="Alice", last_name="Smith"
        )
        bob = self.create_user_with_profile(username="bob", account=self.account, first_name="Bob", last_name="Wilson")

        # Try to change bob's username to "Alice"
        bob_profile = Profile.objects.get(user=bob)
        data = {
            "userName": "Alice",
            "firstName": "Bob Updated",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": bob_profile.id, "version": "v2"}), data=data, format="json"
        )

        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "userName", "Username already exists")

        bob.refresh_from_db()
        self.assertEqual(bob.username, "bob")
        self.assertEqual(bob.first_name, "Bob")

    def test_update_profile_with_case_insensitive_username_should_succeed(self):
        """Test that updating profile without changing username succeeds even with case-insensitive matching usernames."""
        self.client.force_authenticate(self.john)

        alice_lower = self.create_user_with_profile(
            username="alice", account=self.account, first_name="Alice Lower", last_name="alice lower"
        )
        alice_upper = self.create_user_with_profile(
            username="Alice", account=self.account, first_name="Alice Upper", last_name="alice upper"
        )

        alice_lower_profile = Profile.objects.get(user=alice_lower)
        data = {
            "userName": alice_lower.username,
            "firstName": "Alice Lower Changed",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": alice_lower_profile.id, "version": "v2"}), data=data, format="json"
        )

        self.assertJSONResponse(response, 200)
        alice_lower.refresh_from_db()
        self.assertEqual(alice_lower.username, "alice")
        self.assertEqual(alice_lower.first_name, "Alice Lower Changed")

        alice_upper_profile = Profile.objects.get(user=alice_upper)
        data = {
            "userName": alice_upper.username,
            "firstName": "Alice Upper Changed",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": alice_upper_profile.id, "version": "v2"}), data=data, format="json"
        )

        self.assertJSONResponse(response, 200)
        alice_upper.refresh_from_db()
        self.assertEqual(alice_upper.username, "Alice")
        self.assertEqual(alice_upper.first_name, "Alice Upper Changed")

    def test_update_password_for_single_user(self):
        single_user = self.jim
        single_user.set_password("p4ssword")
        single_user.save()

        self.client.force_authenticate(single_user)
        new_data = {"password": "new_p4ssword", "confirmPassword": "new_p4ssword"}
        response = self.client.patch(
            reverse("profiles-update-password", kwargs={"pk": single_user.iaso_profile.pk, "version": "v2"}),
            data=new_data,
            format="json",
        )
        self.assertJSONResponse(response, 204)
        single_user.refresh_from_db()
        self.assertEqual(single_user.check_password("new_p4ssword"), True)

    def test_update_username_to_existing_case_variation_should_fail(self):
        """Test that changing username to case variation of another user's username fails."""
        self.client.force_authenticate(self.john)

        alice_lower = self.create_user_with_profile(
            username="alice", account=self.account, first_name="Alice Lower", last_name="Smith"
        )
        alice_upper = self.create_user_with_profile(
            username="Alice", account=self.account, first_name="Alice Upper", last_name="Jones"
        )

        alice_lower_profile = Profile.objects.get(user=alice_lower)
        data = {
            "userName": "Alice",
            "firstName": "Alice Changed",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": alice_lower_profile.id, "version": "v2"}), data=data, format="json"
        )

        # Should fail because another user already has "Alice"
        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "userName", "Username already exists")

        # Ensure original username wasn't changed
        alice_lower.refresh_from_db()
        self.assertEqual(alice_lower.username, "alice")
        self.assertEqual(alice_lower.first_name, "Alice Lower")

        # Ensure other username wasn't changed
        alice_upper.refresh_from_db()
        self.assertEqual(alice_upper.username, "Alice")
        self.assertEqual(alice_upper.first_name, "Alice Upper")

    def test_update_password_for_multi_user(self):
        """
        For tenant users, changing the password of an `account_user`
        should update the password of the `main_user`.
        """
        main_user = get_user_model().objects.create(username="main_user", email="main_user@health.org")
        main_user.set_password("p4ssword")
        main_user.save()
        account_user = self.create_user_with_profile(
            username="user_1",
            email="user_1@health.org",
            account=self.account,
            permissions=[CORE_USERS_ADMIN_PERMISSION],
        )
        TenantUser.objects.create(main_user=main_user, account_user=account_user)

        self.client.force_authenticate(account_user)
        new_data = {"password": "new_p4ssword", "confirmPassword": "new_p4ssword"}
        response = self.client.patch(
            reverse("profiles-update-password", kwargs={"pk": account_user.iaso_profile.pk, "version": "v2"}),
            data=new_data,
            format="json",
        )
        self.assertJSONResponse(response, 204)
        main_user.refresh_from_db()
        self.assertEqual(main_user.check_password("new_p4ssword"), True)

    def test_log_on_user_updates_own_profile(self):
        self.client.force_authenticate(self.jim)
        new_data = {"language": "fr"}
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": PK_ME, "version": "v2"}), data=new_data, format="json"
        )
        self.assertJSONResponse(response, 200)
        # Log as super user to access the logs API
        self.client.force_authenticate(self.john)
        response = self.client.get(
            reverse("logs-list"),
            data={
                "contentType": "iaso.profile",
                "fields": ",".join(["past_value", "new_value"]),
                "objectId": self.jim.iaso_profile.id,
            },
        )
        response_data = self.assertJSONResponse(response, 200)
        logs = response_data["list"]
        log = logs[0]

        try:
            jsonschema.validate(instance=log, schema=PROFILE_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        self.assertEqual(log["past_value"][0]["pk"], self.jim.iaso_profile.id)
        past_value = log["past_value"][0]["fields"]
        self.assertEqual(past_value["user"], self.jim.id)
        self.assertEqual(past_value["username"], self.jim.username)
        self.assertEqual(past_value["first_name"], "")
        self.assertEqual(past_value["language"], None)
        self.assertNotIn("password", past_value.keys())

        self.assertEqual(log["new_value"][0]["pk"], self.jim.iaso_profile.id)
        new_value = log["new_value"][0]["fields"]
        self.assertEqual(new_value["user"], self.jim.id)
        self.assertEqual(new_value["username"], self.jim.username)
        self.assertEqual(new_value["first_name"], "")
        self.assertEqual(new_value["language"], "fr")
        self.assertNotIn("password", new_value.keys())

    def test_log_on_user_update(self):
        self.client.force_authenticate(self.john)
        data = self.get_new_user_data()
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)
        new_profile_id = response_data["id"]
        new_user_id = Profile.objects.get(pk=new_profile_id).user_id
        new_user_name = Profile.objects.get(pk=new_profile_id).user.username

        new_data = {
            "id": new_profile_id,
            "orgUnits": [self.org_unit_from_parent_type.id, self.org_unit_from_sub_type.id],
            "language": "en",
            "password": "yolo",
            "homePage": "/orgunits/list",
            "organization": "Bluesquare",
            "userPermissions": [CORE_ORG_UNITS_READ_PERMISSION.codename, CORE_FORMS_PERMISSION.codename],
            "userRoles": [],
            "userRolesPermissions": [],
        }

        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": new_profile_id, "version": "v2"}), data=new_data, format="json"
        )
        self.assertJSONResponse(response, 200)

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
        self.assertEqual(log["past_value"][0]["pk"], new_profile_id)
        past_value = log["past_value"][0]["fields"]
        self.assertEqual(past_value["user"], new_user_id)
        self.assertEqual(past_value["username"], new_user_name)
        self.assertEqual(past_value["first_name"], data["firstName"])
        self.assertEqual(past_value["last_name"], data["lastName"])
        self.assertEqual(past_value["email"], data["email"])
        self.assertEqual(len(past_value["user_permissions"]), 1)
        self.assertEqual(past_value["user_permissions"], data["userPermissions"])
        self.assertNotIn("password", past_value.keys())

        self.assertEqual(past_value["dhis2_id"], data["dhis2Id"])
        self.assertEqual(past_value["language"], data["language"])
        self.assertEqual(past_value["home_page"], data["homePage"])
        self.assertEqual(past_value["phone_number"], data["phoneNumber"])
        self.assertEqual(len(past_value["org_units"]), 1)
        self.assertIn(
            self.org_unit_from_parent_type.id,
            past_value["org_units"],
        )
        self.assertEqual(len(past_value["user_roles"]), 1)
        self.assertIn(self.user_role.id, past_value["user_roles"])
        self.assertEqual(len(past_value["projects"]), 1)
        self.assertIn(self.project.id, past_value["projects"])
        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_value = log["new_value"][0]["fields"]
        self.assertEqual(len(new_value["user_permissions"]), 2)
        self.assertIn("iaso_forms", new_value["user_permissions"])
        self.assertIn("iaso_org_units_read", new_value["user_permissions"])
        self.assertEqual(new_value["language"], new_data["language"])
        self.assertEqual(new_value["home_page"], new_data["homePage"])
        self.assertEqual(new_value["organization"], new_data["organization"])
        self.assertEqual(len(new_value["org_units"]), 2)
        self.assertIn(self.org_unit_from_parent_type.id, new_value["org_units"])
        self.assertIn(self.org_unit_from_sub_type.id, new_value["org_units"])
        self.assertEqual(new_value["user_roles"], [])

    def test_update_user_with_projects_restrictions(self):
        new_project_1 = Project.objects.create(name="New project 1", app_id="new.project.1", account=self.account)
        new_project_2 = Project.objects.create(name="New project 2", app_id="new.project.2", account=self.account)
        profile_to_edit = Profile.objects.get(user=self.jum)
        profile_to_edit.projects.clear()
        user = self.jam
        self.client.force_authenticate(user)
        self.assertEqual(user.iaso_profile.projects.count(), 0)
        self.assertEqual(profile_to_edit.projects.count(), 0)

        # A user without `projects` restrictions can set any project.
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), self.project)
        self.assertEqual(profile_to_edit.user.username, "jum_new_user_name")

        # A user with `projects` restrictions can edit a user with the same `projects` restrictions.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project, new_project_1, new_project_2])
        profile_to_edit.projects.set([self.project, new_project_1, new_project_2])
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id, new_project_1.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 2)

        # A user with `projects` restrictions cannot edit a user who has broader access to projects.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.

        user.iaso_profile.projects.set([self.project])
        profile_to_edit.projects.set([self.project, new_project_1, new_project_2])
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [self.project.id],
            },
            format="json",
        )
        response_data = self.assertJSONResponse(response, 403)
        self.assertEqual(
            response_data["detail"],
            "You cannot edit a user who has broader access to projects.",
        )

        # A user with `projects` restrictions can edit a user who has narrower access to projects.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project, new_project_1])
        profile_to_edit.projects.set([self.project])
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_1.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)
        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), new_project_1)
        self.assertEqual(profile_to_edit.user.username, "jum_new_user_name")

        # A user with `projects` restrictions cannot create a user without restrictions.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project])
        self.assertEqual(user.iaso_profile.projects.count(), 1)
        profile_to_edit.projects.clear()
        self.assertEqual(profile_to_edit.projects.count(), 0)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={"user_name": "jum_new_user_name", "projects": []},
            format="json",
        )
        response_data = self.assertJSONResponse(response, 403)
        self.assertEqual(
            response_data["detail"],
            "You must specify which projects are authorized for this user.",
        )

        # A user with `projects` restrictions cannot assign projects outside his range.
        user.iaso_profile.projects.clear()
        profile_to_edit.projects.clear()
        del user.iaso_profile.projects_ids  # Refresh cached property.
        user.iaso_profile.projects.set([self.project])
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_2.id],
            },
            format="json",
        )
        response_data = self.assertJSONResponse(response, 403)
        self.assertEqual(
            response_data["detail"],
            "Some projects are outside your scope.",
        )

        # An "admin" user with `projects` restrictions can assign projects outside his range.
        user.user_permissions.add(Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.codename))
        del user._perm_cache
        del user._user_perm_cache
        self.assertTrue(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))
        user.iaso_profile.projects.set([self.project])
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "user_name": "jum_new_user_name",
                "projects": [new_project_2.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)

    def test_admin_should_be_able_to_bypass_projects_restrictions_for_himself(self):
        """
        An admin with `projects` restrictions should be able to assign himself to any project.
        """
        project_1 = Project.objects.create(name="Project 1", app_id="project.1", account=self.account)
        project_2 = Project.objects.create(name="Project 2", app_id="project.2", account=self.account)

        user_admin = self.jim
        self.assertFalse(user_admin.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertTrue(user_admin.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        profile_to_edit = user_admin.iaso_profile
        profile_to_edit.projects.set([project_1])
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), project_1)

        self.client.force_authenticate(user_admin)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}),
            data={
                "userName": user_admin.username,
                "projects": [project_2.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)

        profile_to_edit.refresh_from_db()
        self.assertEqual(profile_to_edit.projects.count(), 1)
        self.assertEqual(profile_to_edit.projects.first(), project_2)

    def test_update_user_with_malformed_phone_number(self):
        user = self.jam
        profile_to_edit = Profile.objects.get(user=self.jum)

        self.client.force_authenticate(user)

        data = {
            "userName": "new_name",
            "phoneNumber": "not_a_phone_number",
            "countryCode": "",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "phoneNumber", "Both phone number and country code must be provided")

        data = {
            "userName": "new_name",
            "phoneNumber": "not_a_phone_number",
            "countryCode": "US",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "phoneNumber", "Enter a valid phone number.")

        data = {
            "userName": "new_name",
            "phoneNumber": "03666666",
            "countryCode": "FR",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 400)
        self.assertHasError(response_data, "phoneNumber", "Enter a valid phone number.")

        data = {
            "userName": "new_name",
            "phoneNumber": "0612345678",
            "countryCode": "FR",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["phoneNumber"], "+33612345678")

        data = {"userName": "new_name"}
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["phoneNumber"], "+33612345678")

        data = {"userName": "new_name", "phoneNumber": ""}
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_edit.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["phoneNumber"], None)

    def test_update_profile_color(self):
        self.client.force_authenticate(self.john)
        profile = Profile.objects.get(user=self.jim)
        original_first_name = profile.user.first_name
        original_last_name = profile.user.last_name
        original_email = profile.user.email
        new_color = "#A1B2C3"
        data = {"color": new_color}

        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile.id, "version": "v2"}), data=data, format="json"
        )

        response_data = self.assertJSONResponse(response, 200)
        profile.refresh_from_db()
        profile.user.refresh_from_db()
        self.assertEqual(profile.color, new_color)
        self.assertEqual(response_data["color"], new_color)
        self.assertEqual(profile.user.first_name, original_first_name)
        self.assertEqual(profile.user.last_name, original_last_name)
        self.assertEqual(profile.user.email, original_email)

    def test_user_with_managed_permission_cannot_update_from_unmanaged_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.child_org_unit.id])
        self.jum.iaso_profile.org_units.set([self.org_unit_from_sub_type.id])
        self.client.force_authenticate(self.jam)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_update_user_add_phone_number(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.john)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "phoneNumber": "+32477123456",
            "countryCode": "be",
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)
        updated_jum = Profile.objects.get(user=self.jum)
        self.assertEqual(updated_jum.phone_number.as_e164, "+32477123456")

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}))
        response_data = self.assertJSONResponse(res, 200)
        self.assertEqual(response_data["phoneNumber"], "+32477123456")

    def test_update_user_should_succeed_with_restricted_editable_org_unit_types_when_modifying_another_field(self):
        """
        A user restricted to a given OrgUnitType should be able to edit another user as long as
        he's not modifying the `org_units` or `editable_org_unit_type_ids` fields.
        """
        user = self.jam

        self.assertTrue(user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertFalse(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        user.iaso_profile.org_units.set([self.org_unit_from_parent_type])
        user.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type is now writable.
            [self.sub_unit_type]
        )

        jum_profile = Profile.objects.get(user=self.jum)
        jum_profile.org_units.set([self.org_unit_from_parent_type])
        jum_profile.editable_org_unit_types.set(
            # Only org units of this type is now writable.
            [self.parent_org_unit_type]
        )

        self.client.force_authenticate(user)

        data = {
            "userName": "new_user_name",
            "orgUnits": [self.org_unit_from_parent_type.id],
            "editableOrgUnitTypeIds": [self.parent_org_unit_type.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum_profile.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)
        self.jum.refresh_from_db()
        self.assertEqual(self.jum.username, "new_user_name")

    def test_update_user_should_fail_when_assigning_an_org_unit_outside_of_the_author_own_health_pyramid(self):
        user = self.jam
        user.iaso_profile.org_units.set([self.org_unit_from_sub_type])

        self.assertTrue(user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()))
        self.assertFalse(user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()))

        profile_to_modify = Profile.objects.get(user=self.jum)
        profile_to_modify.org_units.set([self.org_unit_from_sub_type])

        self.client.force_authenticate(user)
        data = {
            "user_name": "new_user_name",
            "org_units": [self.org_unit_from_parent_type.pk, self.another_org_unit.pk],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile_to_modify.id, "version": "v2"}), data=data, format="json"
        )
        response_data = self.assertJSONResponse(response, 403)
        self.assertEqual(
            response_data["detail"],
            (
                f"User with {CORE_USERS_MANAGED_PERMISSION} cannot assign an OrgUnit outside "
                f"of their own health pyramid. Trying to assign {self.another_org_unit.pk}."
            ),
        )

    def test_user_with_managed_permission_can_update_profile_if_not_themselves_in_sub_org_unit(self):
        self.jum.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)

    def test_user_with_managed_permission_cannot_update_profile_of_user_not_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
        }
        jum = Profile.objects.get(user=self.jum)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_user_with_managed_permission_cannot_assign_org_unit_outside_of_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [self.org_unit_from_sub_type.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid_with_existing_ones_outside(
        self,
    ):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id, self.org_unit_from_sub_type])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [self.org_unit_from_parent_type.id, self.org_unit_from_sub_type.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)

    def test_user_with_managed_permission_can_assign_org_unit_within_their_health_pyramid(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "org_units": [self.org_unit_from_parent_type.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)

    def test_user_with_managed_permission_can_grant_user_roles(self):
        group = Group.objects.create(name="admin")
        group.permissions.set([Permission.objects.get(codename=CORE_FORMS_PERMISSION.codename)])
        role = UserRole.objects.create(account=self.account, group=group)
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_roles": [role.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)

    def test_user_with_managed_permission_cannot_grant_user_admin_permission_through_user_roles(self):
        group = Group.objects.create(name="admin")
        group.permissions.set([Permission.objects.get(codename=CORE_USERS_ADMIN_PERMISSION.codename)])
        role = UserRole.objects.create(account=self.account, group=group)
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_roles": [role.id],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_user_with_managed_permission_cannot_grant_user_admin_permission(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "jum",
            "user_permissions": [
                CORE_FORMS_PERMISSION.codename,
                CORE_USERS_MANAGED_PERMISSION.codename,
                CORE_USERS_ADMIN_PERMISSION.codename,
            ],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 403)

    def test_user_with_managed_permission_without_location_can_update_profile_of_user_in_whole_pyramid(self):
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "user_name": "unittest_user_name",
            "password": "unittest_password",
            "first_name": "unittest_first_name",
            "last_name": "unittest_last_name",
            "org_units": [self.org_unit_from_parent_type.id],
            "user_permissions": [CORE_FORMS_PERMISSION.codename, CORE_USERS_MANAGED_PERMISSION.codename],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.id, "version": "v2"}), data=data, format="json"
        )
        jum.refresh_from_db()
        self.assertJSONResponse(response, 200)
        self.assertEqual(list(jum.org_units.values_list("id", flat=True)), [self.org_unit_from_parent_type.id])

    def test_user_with_managed_permission_can_update_profile_of_user_in_sub_org_unit(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        data = {
            "userName": "unittest_user_name",
            "password": "unittest_password",
            "firstName": "unittest_first_name",
            "lastName": "unittest_last_name",
            "userPermissions": [CORE_FORMS_PERMISSION.codename, CORE_USERS_MANAGED_PERMISSION.codename],
        }
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jum.pk, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)

    def test_profile_error_dhis2_constraint(self):
        # Test for regression of IA-1249
        self.client.force_authenticate(self.jim)
        data = {"user_name": "unittest_user1", "password": "unittest_password", "dhis2_id": ""}
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")
        self.assertJSONResponse(response, 201)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": ""}
        response = self.client.post(reverse("profiles-list", kwargs={"version": "v2"}), data=data, format="json")

        self.assertJSONResponse(response, 201)
        profile1 = Profile.objects.get(user__username="unittest_user1")
        profile2 = Profile.objects.get(user__username="unittest_user2")
        self.assertNotEqual(profile1.account_id, None)
        self.assertEqual(profile2.account_id, profile1.account_id)
        self.assertEqual(profile2.dhis2_id, None)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": "", "first_name": "test"}
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile2.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)
        profile2.refresh_from_db()
        self.assertEqual(profile2.dhis2_id, None)

        data = {"user_name": "unittest_user2", "password": "unittest_password", "dhis2_id": "test_dhis2_id"}
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": profile2.id, "version": "v2"}), data=data, format="json"
        )
        self.assertJSONResponse(response, 200)
        profile2.refresh_from_db()
        self.assertEqual(profile2.dhis2_id, "test_dhis2_id")

    def test_profile_patchread_only_permissions(self):
        """GET /profiles/ with auth (user has read only permissions)"""

        self.client.force_authenticate(self.jane)
        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.id, "version": "v2"})
        )
        self.assertJSONResponse(response, 403)

    def test_can_delete_dhis2_id(self):
        self.client.force_authenticate(self.john)
        jim = Profile.objects.get(user=self.jim)
        jim.dhis2_id = "random_dhis2_id"
        jim.save()

        data = {"dhis2_id": ""}

        response = self.client.patch(
            reverse("profiles-detail", kwargs={"pk": jim.id, "version": "v2"}), data=data, format="json"
        )

        self.assertJSONResponse(response, 200)
