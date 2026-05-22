import jsonschema

from django.urls import reverse

from iaso.models import Profile
from iaso.tests.api.profiles.test_views.common import PROFILE_LOG_SCHEMA, BaseProfileAPITestCase


class ProfileDeleteAPITestCase(BaseProfileAPITestCase):
    def test_delete_profile_no_perm(self):
        self.client.force_authenticate(self.jane)
        response = self.client.delete(reverse("profiles-detail", kwargs={"pk": 1}))

        self.assertJSONResponse(response, 403)

    def test_log_on_user_delete(self):
        self.client.force_authenticate(self.john)
        data = self.get_new_user_data()
        response = self.client.post(reverse("profiles-list"), data=data, format="json")
        response_data = self.assertJSONResponse(response, 201)
        new_profile_id = response_data["id"]
        # todo : really needed in the response ?
        # new_user_id = response_data["user_id"]
        new_user_id = Profile.objects.get(pk=new_profile_id).user_id

        response = self.client.delete(reverse("profiles-detail", kwargs={"pk": new_profile_id}))
        self.assertJSONResponse(response, 204)

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

        self.assertEqual(log["new_value"][0]["pk"], new_profile_id)
        new_profile = log["new_value"][0]["fields"]
        self.assertEqual(new_profile["user"], new_user_id)
        self.assertEqual(new_profile["username"], data["user_name"])
        self.assertEqual(new_profile["first_name"], data["first_name"])
        self.assertEqual(new_profile["last_name"], data["last_name"])
        self.assertEqual(new_profile["email"], data["email"])
        self.assertEqual(len(new_profile["user_permissions"]), 1)
        self.assertEqual(new_profile["user_permissions"], data["user_permissions"])
        self.assertIsNotNone(new_profile["deleted_at"])
        self.assertFalse(new_profile["password_updated"])
        self.assertNotIn("password", new_profile.keys())

        self.assertEqual(new_profile["dhis2_id"], data["dhis2_id"])
        self.assertEqual(new_profile["language"], data["language"])
        self.assertEqual(new_profile["home_page"], data["home_page"])
        self.assertEqual(new_profile["phone_number"], data["phone_number"])
        self.assertEqual(len(new_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, new_profile["org_units"])
        self.assertEqual(len(new_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, new_profile["user_roles"])
        self.assertEqual(len(new_profile["projects"]), 1)
        self.assertIn(self.project.id, new_profile["projects"])
        self.assertIsNotNone(new_profile["deleted_at"])

        self.assertEqual(log["past_value"][0]["pk"], new_profile_id)
        past_profile = log["past_value"][0]["fields"]
        self.assertEqual(past_profile["user"], new_user_id)
        self.assertEqual(past_profile["username"], data["user_name"])
        self.assertEqual(past_profile["first_name"], data["first_name"])
        self.assertEqual(past_profile["last_name"], data["last_name"])
        self.assertEqual(past_profile["email"], data["email"])
        self.assertEqual(len(past_profile["user_permissions"]), 1)
        self.assertEqual(past_profile["user_permissions"], data["user_permissions"])
        self.assertIsNone(past_profile["deleted_at"])
        self.assertNotIn("password", past_profile.keys())

        self.assertEqual(past_profile["dhis2_id"], data["dhis2_id"])
        self.assertEqual(past_profile["language"], data["language"])
        self.assertEqual(past_profile["home_page"], data["home_page"])
        self.assertEqual(past_profile["phone_number"], data["phone_number"])
        self.assertEqual(len(past_profile["org_units"]), 1)
        self.assertIn(self.org_unit_from_parent_type.id, past_profile["org_units"])
        self.assertEqual(len(past_profile["user_roles"]), 1)
        self.assertIn(self.user_role.id, past_profile["user_roles"])
        self.assertEqual(len(past_profile["projects"]), 1)
        self.assertIn(self.project.id, past_profile["projects"])
        self.assertIsNone(past_profile["deleted_at"])

    def test_user_with_managed_permission_cannot_delete_users(self):
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.client.force_authenticate(self.jam)
        jum = Profile.objects.get(user=self.jum)
        response = self.client.delete(reverse("profiles-detail", kwargs={"pk": jum.id}))
        self.assertJSONResponse(response, 403)
