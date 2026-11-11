import io

from unittest import mock

import openpyxl

from rest_framework.test import APIClient

from iaso import models as m
from iaso.test import APIAssertionsMixin
from plugins.wfp.tests.test_views import OrgUnitScopeTestData


BENEFICIARIES_URL = "/api/wfp/beneficiaries/"


class BeneficiariesAPITestCase(APIAssertionsMixin, OrgUnitScopeTestData):
    """Same data as the screen: a beneficiary visiting Bentiu (in the partner group) and Rubkona, another only Rubkona."""

    client_class = APIClient

    def _beneficiaries(self, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(BENEFICIARIES_URL, params or {})
        return self.assertJSONResponse(response, 200)

    def _workbook(self, response):
        self.assertEqual(response.status_code, 200)
        return openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))

    def test_requires_the_export_permission(self):
        user = self.create_user_with_profile(username="no_permission", account=self.account)
        self.client.force_authenticate(user)
        for path in ["", "options/", "export/coda/", "export/raw/"]:
            self.assertEqual(self.client.get(f"{BENEFICIARIES_URL}{path}").status_code, 403)

    def test_list_has_the_journeys_and_visits_of_the_account(self):
        data = self._beneficiaries(self.user)
        self.assertEqual(data["count"], 2)
        self.assertEqual({b["entity_id"] for b in data["results"]}, {self.entity.id, self.rubkona_entity.id})
        beneficiary = next(b for b in data["results"] if b["entity_id"] == self.entity.id)
        self.assertEqual((beneficiary["journeys_count"], beneficiary["visits_count"]), (1, 2))
        visits = beneficiary["journeys"][0]["visits"]
        self.assertEqual([v["org_unit_name"] for v in visits], ["Bentiu PHCC", "Rubkona PHCC"])
        self.assertEqual(visits[0]["steps"][0]["assistance_type"], "Soap")

    def test_visits_can_be_ordered_by_number(self):
        def numbers(params):
            beneficiary = self._beneficiaries(self.user, {"order": "-visits_count", **params})["results"][0]
            return [v["number"] for v in beneficiary["journeys"][0]["visits"]]

        self.assertEqual(numbers({"visits_order": "number"}), [1, 2])
        self.assertEqual(numbers({"visits_order": "-number"}), [2, 1])
        # unknown values fall back to the default ordering by date
        self.assertEqual(numbers({"visits_order": "unknown"}), [1, 2])

    def test_list_is_ordered_by_last_visit_by_default(self):
        data = self._beneficiaries(self.user)
        # both have their last visit on the same day: the most recent beneficiary first
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.rubkona_entity.id, self.entity.id])
        data = self._beneficiaries(self.user, {"order": "entity_id"})
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.entity.id, self.rubkona_entity.id])

    def test_list_in_the_browsable_api(self):
        # the browsable API (opened in a browser) builds the queryset of the view to render its filter form
        self.client.force_authenticate(self.user)
        response = self.client.get(
            BENEFICIARIES_URL, {"order": "-journeys_count", "page": 1, "limit": 50}, HTTP_ACCEPT="text/html"
        )
        self.assertEqual(response.status_code, 200)

    def test_org_unit_group_keeps_the_visits_in_the_group(self):
        data = self._beneficiaries(self.user, {"org_unit_group": self.group.id})
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.entity.id])
        self.assertEqual(data["results"][0]["visits_count"], 1)
        self.assertEqual(
            [v["org_unit_name"] for j in data["results"][0]["journeys"] for v in j["visits"]], ["Bentiu PHCC"]
        )

    def test_restricted_user_only_sees_their_facilities(self):
        data = self._beneficiaries(self.partner)
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.entity.id])
        self.assertEqual(data["results"][0]["visits_count"], 1)

    def test_options(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}options/"), 200)
        self.assertEqual(data["entity_types"], [{"value": self.entity.entity_type_id, "label": "Child"}])
        self.assertIn({"value": "TSFP", "label": "TSFP"}, data["programmes"])
        self.assertEqual(data["org_unit_groups"], [{"value": self.group.id, "label": "Friendship (South Sudan - 1)"}])

    def test_data_of_a_beneficiary(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), 200)
        self.assertEqual(data["entity"]["id"], self.entity.id)
        self.assertEqual(data["entity"]["reference_submission_id"], self.entity.attributes_id)
        self.assertEqual(data["beneficiary"]["guidelines"], "NEW")
        self.assertIn({"key": "is_twin", "value": "no"}, data["attributes"])
        self.assertEqual(len(data["submissions"]), 4)
        self.assertEqual(
            [s["org_unit_name"] for s in data["submissions"]],
            ["Bentiu PHCC", "Bentiu PHCC", "Bentiu PHCC", "Rubkona PHCC"],
        )
        self.assertIn({"key": "muac", "value": "12.4"}, data["submissions"][-1]["rows"])

    def test_data_of_a_beneficiary_is_restricted(self):
        self.client.force_authenticate(self.partner)
        self.assertEqual(self.client.get(f"{BENEFICIARIES_URL}{self.rubkona_entity.id}/data/").status_code, 404)
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), 200)
        self.assertNotIn(self.rubkona_instance.id, [s["id"] for s in data["submissions"]])
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(f"{BENEFICIARIES_URL}{self.other_entity.id}/data/").status_code, 404)

    def test_submission_fields(self):
        self.client.force_authenticate(self.user)
        url = f"{BENEFICIARIES_URL}submissions/{self.rubkona_instance.id}/fields/"
        data = self.assertJSONResponse(self.client.get(url), 200)
        self.assertEqual(data["submission"]["id"], self.rubkona_instance.id)
        self.assertEqual(data["submission"]["org_unit_name"], "Rubkona PHCC")
        self.assertEqual(data["rows"], [{"key": "muac", "value": "12.4"}])
        self.client.force_authenticate(self.partner)
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_coda_export_is_downloaded_right_away(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BENEFICIARIES_URL}export/coda/", {"org_unit_group": self.group.id})
        self.assertEqual(response.status_code, 200)
        self.assertIn('filename="coda-2-export-', response["Content-Disposition"])
        rows = list(self._workbook(response).active.iter_rows(values_only=True))
        column = rows[1].index("health center name")
        self.assertEqual([row[column] for row in rows[2:]], ["Bentiu PHCC"])
        self.assertFalse(m.Task.objects.exists())

    @mock.patch("plugins.wfp.coda_export.BATCH_SIZE", 1)
    def test_coda_export_of_several_batches(self):
        self.client.force_authenticate(self.user)
        rows = list(
            self._workbook(self.client.get(f"{BENEFICIARIES_URL}export/coda/")).active.iter_rows(values_only=True)
        )
        column = rows[1].index("health center name")
        self.assertEqual(sorted(row[column] for row in rows[2:]), ["Bentiu PHCC", "Rubkona PHCC", "Rubkona PHCC"])

    def test_raw_export_is_downloaded_right_away(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BENEFICIARIES_URL}export/raw/")
        self.assertEqual(response.status_code, 200)
        self.assertIn('filename="wfp-raw-data-', response["Content-Disposition"])
        visits = list(self._workbook(response)["visits"].iter_rows(values_only=True))
        self.assertEqual(len(visits) - 1, 3)

    def test_restricted_user_only_exports_their_facilities(self):
        self.client.force_authenticate(self.partner)
        response = self.client.get(f"{BENEFICIARIES_URL}export/raw/")
        visits = list(self._workbook(response)["visits"].iter_rows(values_only=True))
        self.assertEqual(len(visits) - 1, 1)

    def test_exports_do_not_contain_personal_data(self):
        self.client.force_authenticate(self.user)
        workbook = self._workbook(self.client.get(f"{BENEFICIARIES_URL}export/raw/"))
        values = {
            str(value) for sheet in workbook.worksheets for row in sheet.iter_rows(values_only=True) for value in row
        }
        self.assertNotIn("fever", values)
