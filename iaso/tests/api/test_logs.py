from copy import deepcopy

from hat.audit.models import log_modification
from iaso import models as m
from iaso.test import APITestCase


class LogsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = ghi = m.Account.objects.create(name="Global Health Initiative")
        wha = m.Account.objects.create(name="Worldwide Health Aid")
        cls.ead = m.Project.objects.create(name="End All Diseases", account=ghi)
        cls.esd = m.Project.objects.create(name="End Some Diseases", account=wha)

        cls.jane = cls.create_user_with_profile(username="janedoe", account=ghi, permissions=["iaso_forms"])
        cls.reference_form = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )
        cls.reference_form_update = m.Form.objects.create(
            name="Reference form update", period_type=m.MONTH, single_per_period=True
        )
        cls.reference_form_wrong_project = m.Form.objects.create(
            name="Reference form with wrong project", period_type=m.MONTH, single_per_period=True
        )
        cls.org_unit_type_1 = m.OrgUnitType.objects.create(
            name="Plop", short_name="Pl", reference_form_id=cls.reference_form_update.id
        )
        cls.org_unit_type_2 = m.OrgUnitType.objects.create(name="Boom", short_name="Bo")
        cls.ead.unit_types.set([cls.org_unit_type_1, cls.org_unit_type_2])

        cls.ead.forms.add(cls.reference_form)
        cls.ead.forms.add(cls.reference_form_update)
        cls.ead.save()

        cls.esd.forms.add(cls.reference_form_wrong_project)
        cls.esd.save()

    def test_logs_list_without_auth_or_app_id(self):
        """GET /logs/ without auth or app id should result in a 403 requiring authentication"""

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 403)

    def test_logs_list_with_auth_no_params(self):
        """GET /logs/ with a normal user and no object instance specified should return a 400 explaining the
        requested parameters"""

        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 400)

    def test_logs_list_with_superuser_but_no_logs(self):
        """GET /logs/ with a superuser should return an empty paginated list if no modification in db"""
        self.jane.is_superuser = True
        self.jane.save()

        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(
            response.json(),
            {"count": 0, "list": [], "has_next": False, "has_previous": False, "page": 1, "pages": 1, "limit": 50},
        )

    def test_logs_list_with_superuser_with_data_without_param(self):
        """GET /logs/ with superuser should return an empty paginated list if no modification in db"""
        self.maxDiff = None
        self.jane.is_superuser = True
        self.jane.save()
        self.client.force_authenticate(self.jane)

        copy = deepcopy(self.reference_form)
        copy.name = "New form Name 1"
        log_modification(copy, self.reference_form, user=self.jane, source="myunittest")

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")

    def test_logs_list_with_app_and_params_without_fields(self):
        """GET /logs/ for an object should return list of modification"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        copy_modified = deepcopy(self.reference_form)
        copy_modified.name = "New form Name 1"
        log_modification(self.reference_form, copy_modified, user=self.jane, source="myunittest")

        response = self.client.get(
            "/api/logs/",
            {
                "fields": "new_value,past_value,field_diffs",
                "contentType": "iaso.form",
                "objectId": self.reference_form.id,
            },
        )
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")
        self.assertEqual(
            log_entry["field_diffs"]["modified"]["name"], {"before": "Hydroponics study", "after": "New form Name 1"}
        )

    def test_logs_list_with_auth_with_delete(self):
        """GET /logs/ with auth for user, with the fields for a deleted field"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        log_modification(self.reference_form, None, user=self.jane, source="myunittest")

        response = self.client.get(
            "/api/logs/",
            {
                "fields": "new_value,past_value,field_diffs",
                "contentType": "iaso.form",
                "objectId": self.reference_form.id,
            },
        )
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")
        self.assertEqual(log_entry["field_diffs"]["removed"]["name"], {"before": "Hydroponics study", "after": None})

    def test_logs_list_with_auth_with_create(self):
        """GET /logs/ with auth for user, with the fields for a filled field"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        log_modification(None, self.reference_form, user=self.jane, source="myunittest")

        response = self.client.get(
            "/api/logs/",
            {
                "fields": "new_value,past_value,field_diffs",
                "contentType": "iaso.form",
                "objectId": self.reference_form.id,
            },
        )
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")
        self.assertEqual(log_entry["field_diffs"]["added"]["name"], {"before": None, "after": "Hydroponics study"})

    def test_perm_individual_log(self):
        self.client.force_authenticate(self.jane)
        modification = log_modification(None, self.reference_form, user=self.jane, source="myunittest")

        response = self.client.get(f"/api/logs/{modification.id}/")
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(r["id"], modification.id)
        self.assertEqual(r["content_type"], "iaso")
        self.assertEqual(r["object_id"], str(self.reference_form.id))
        self.assertEqual(r["past_value"], [])

        other_account = m.Account.objects.create(name="other")
        jim = self.create_user_with_profile(username="jim", account=other_account)

        self.client.force_authenticate(jim)
        response = self.client.get(f"/api/logs/{modification.id}/")
        r = self.assertJSONResponse(response, 401)
        self.assertEqual(r, {"error": "Unauthorized"})

    def test_perm_instance(self):
        """To read instance history the user need the additional perm iaso_submission"""
        instance = self.create_form_instance(form=self.reference_form, project=self.reference_form.projects.first())
        modification = log_modification(None, instance, user=self.jane, source="myunittest")
        user_with_instance_perm = self.create_user_with_profile(
            username="bob", account=self.ghi, permissions=["iaso_submissions"]
        )
        user_no_instance_perm = self.create_user_with_profile(username="bob2", account=self.ghi, permissions=[])
        user_superuser = self.create_user_with_profile(username="superuser", account=self.ghi, is_superuser=True)

        self.client.force_authenticate(user_with_instance_perm)
        response = self.client.get(f"/api/logs/{modification.id}/")
        self.assertJSONResponse(response, 200)

        self.client.force_authenticate(user_no_instance_perm)
        response = self.client.get(f"/api/logs/{modification.id}/")
        r = self.assertJSONResponse(response, 401)
        self.assertEqual(r, {"error": "Unauthorized"})

        self.client.force_authenticate(user_superuser)
        response = self.client.get(f"/api/logs/{modification.id}/")
        self.assertJSONResponse(response, 200)
