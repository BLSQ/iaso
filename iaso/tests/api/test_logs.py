import typing
from hat.audit.models import log_modification

from iaso.test import APITestCase
from iaso import models as m
from copy import deepcopy


class LogsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        ghi = m.Account.objects.create(name="Global Health Initiative")
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

    def test_logs_list_with_auth_or_app_id_but_no_logs(self):
        """GET /logs/ without auth should return an empty paginated list if no modification in db"""

        self.client.force_authenticate(self.jane)

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(
            response.json(),
            {"count": 0, "list": [], "has_next": False, "has_previous": False, "page": 1, "pages": 1, "limit": 50},
        )

    def test_logs_list_with_auth_or_app_id_with_data_without_params(self):
        """GET /logs/ without auth should return an empty paginated list if no modification in db"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        copy = deepcopy(self.reference_form)
        copy.name = "New form Name 1"
        log_modification(copy, self.reference_form, user=self.jane, source="myunittest")

        response = self.client.get("/api/logs/")
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")

    def test_logs_list_with_auth_or_app_id_with_data_without_fields(self):
        """GET /logs/ without auth should return an empty paginated list if no modification in db"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        copy_modified = deepcopy(self.reference_form)
        copy_modified.name = "New form Name 1"
        log_modification(self.reference_form, copy_modified, user=self.jane, source="myunittest")

        response = self.client.get("/api/logs/", {"fields": "new_value,past_value,field_diffs"})
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")
        self.assertEqual(
            log_entry["field_diffs"]["modified"]["name"], {"before": "Hydroponics study", "after": "New form Name 1"}
        )

    def test_logs_list_with_auth_or_app_id_with_delete(self):
        """GET /logs/ without auth should return an empty paginated list if no modification in db"""
        self.maxDiff = None
        self.client.force_authenticate(self.jane)

        log_modification(self.reference_form, None, user=self.jane, source="myunittest")

        response = self.client.get("/api/logs/", {"fields": "new_value,past_value,field_diffs"})
        self.assertJSONResponse(response, 200)

        log_entry = response.json()["list"][0]

        self.assertEqual(log_entry["user"]["user_name"], "janedoe")
        self.assertEqual(log_entry["field_diffs"]["removed"]["name"], {"before": "Hydroponics study", "after": None})
