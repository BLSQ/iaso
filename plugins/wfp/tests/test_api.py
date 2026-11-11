import io

from datetime import datetime, timezone
from unittest import mock

import openpyxl

from django.db.models import Max
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.models import Beneficiary, Journey, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.tests.test_views import OrgUnitScopeTestData


BENEFICIARIES_URL = "/api/wfp/beneficiaries/"


class BeneficiariesAPITestCase(OrgUnitScopeTestData, APITestCase):
    """Same data as the screen: a beneficiary visiting Bentiu (in the partner group) and Rubkona, another only Rubkona.

    Plus another account with its own project, pyramid, group and beneficiary, to check that its ids match nothing.
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # a group of the account with Rubkona only: outside the facilities of the partner
        cls.rubkona_group = m.Group.objects.create(name="Rubkona", source_version=cls.group.source_version)
        cls.rubkona_group.org_units.set([cls.other_facility])

        other_source = m.DataSource.objects.create(name="Other source")
        other_version = m.SourceVersion.objects.create(data_source=other_source, number=1)
        other_project = m.Project.objects.create(name="Other", app_id="other", account=cls.other_account)
        other_source.projects.set([other_project])
        other_facility = m.OrgUnit.objects.create(name="Other PHCC", version=other_version)
        cls.other_group = m.Group.objects.create(name="Other partner", source_version=other_version)
        cls.other_group.org_units.set([other_facility])
        other_journey = Journey.objects.create(
            beneficiary=Beneficiary.objects.get(entity=cls.other_entity), nutrition_programme="TSFP"
        )
        Visit.objects.create(
            journey=other_journey, date=datetime(2026, 5, 2, tzinfo=timezone.utc), number=1, org_unit=other_facility
        )
        cls.other_instance = m.Instance.objects.create(
            form=cls.visit_form, entity=cls.other_entity, org_unit=other_facility, json={"muac": "11.0"}
        )
        cls.other_user = cls.create_user_with_profile(
            username="other", account=cls.other_account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )

    @staticmethod
    def _missing_id(model):
        """An id that no row of `model` has."""
        return (model.objects.aggregate(Max("id"))["id__max"] or 0) + 1000

    def _entity_ids(self, user, params):
        return sorted(b["entity_id"] for b in self._beneficiaries(user, params)["results"])

    def _beneficiaries(self, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(BENEFICIARIES_URL, params or {})
        return self.assertJSONResponse(response, status.HTTP_200_OK)

    def _workbook(self, response):
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))

    def test_requires_the_export_permission(self):
        user = self.create_user_with_profile(username="no_permission", account=self.account)
        self.client.force_authenticate(user)
        for path in ["", "options/", "export/coda/", "export/raw/"]:
            self.assertEqual(self.client.get(f"{BENEFICIARIES_URL}{path}").status_code, status.HTTP_403_FORBIDDEN)

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}options/"), status.HTTP_200_OK)
        self.assertEqual(data["entity_types"], [{"value": self.entity.entity_type_id, "label": "Child"}])
        self.assertIn({"value": "TSFP", "label": "TSFP"}, data["programmes"])
        self.assertEqual(
            data["org_unit_groups"],
            [
                {"value": self.group.id, "label": "Friendship (South Sudan - 1)"},
                {"value": self.rubkona_group.id, "label": "Rubkona (South Sudan - 1)"},
            ],
        )

    def test_data_of_a_beneficiary(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), status.HTTP_200_OK
        )
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
        self.assertEqual(
            self.client.get(f"{BENEFICIARIES_URL}{self.rubkona_entity.id}/data/").status_code, status.HTTP_404_NOT_FOUND
        )
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), status.HTTP_200_OK
        )
        self.assertNotIn(self.rubkona_instance.id, [s["id"] for s in data["submissions"]])
        self.client.force_authenticate(self.user)
        self.assertEqual(
            self.client.get(f"{BENEFICIARIES_URL}{self.other_entity.id}/data/").status_code, status.HTTP_404_NOT_FOUND
        )

    def test_submission_fields(self):
        self.client.force_authenticate(self.user)
        url = f"{BENEFICIARIES_URL}submissions/{self.rubkona_instance.id}/fields/"
        data = self.assertJSONResponse(self.client.get(url), status.HTTP_200_OK)
        self.assertEqual(data["submission"]["id"], self.rubkona_instance.id)
        self.assertEqual(data["submission"]["org_unit_name"], "Rubkona PHCC")
        self.assertEqual(data["rows"], [{"key": "muac", "value": "12.4"}])
        self.client.force_authenticate(self.partner)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_coda_export_is_downloaded_right_away(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BENEFICIARIES_URL}export/coda/", {"org_unit_group": self.group.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('filename="coda-2-export-', response["Content-Disposition"])
        rows = list(self._workbook(response).active.iter_rows(values_only=True))
        column = rows[1].index("health center name")
        self.assertEqual([row[column] for row in rows[2:]], ["Bentiu PHCC"])
        self.assertFalse(m.Task.objects.exists())

    @mock.patch("plugins.wfp.utils.coda_export.BATCH_SIZE", 1)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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

    # ids passed to the filters: real ids, ids that do not exist, ids of another account and values that are not ids

    def test_entity_type_filter_ids(self):
        all_entities = sorted([self.entity.id, self.rubkona_entity.id])
        cases = {
            "real id": (self.entity.entity_type_id, all_entities),
            "missing id": (self._missing_id(m.EntityType), []),
            "id of another account": (self.other_entity.entity_type_id, []),
            # not an id: the filter is ignored
            "not a number": ("abc", all_entities),
            "negative": ("-1", all_entities),
            "decimal": ("1.5", all_entities),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"entity_type": value}), expected)

    def test_org_unit_group_filter_ids(self):
        all_entities = sorted([self.entity.id, self.rubkona_entity.id])
        cases = {
            "real id": (self.group.id, [self.entity.id]),
            "missing id": (self._missing_id(m.Group), []),
            "id of another account": (self.other_group.id, []),
            # not an id: the filter is ignored
            "not a number": ("abc", all_entities),
            "negative": ("-1", all_entities),
            "decimal": ("1.5", all_entities),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"org_unit_group": value}), expected)

    def test_group_of_another_account_is_valid_for_that_account(self):
        # the group is real: it only matches nothing for the users of other accounts
        self.assertEqual(
            self._entity_ids(self.other_user, {"org_unit_group": self.other_group.id}), [self.other_entity.id]
        )
        self.assertEqual(self._entity_ids(self.other_user, {"org_unit_group": self.group.id}), [])

    def test_search_ids(self):
        cases = {
            "real id": (self.entity.id, [self.entity.id]),
            "start of the uuid": (str(self.entity.uuid)[:8], [self.entity.id]),
            "missing id": (self._missing_id(m.Entity), []),
            "id of another account": (self.other_entity.id, []),
            "uuid of another account": (str(self.other_entity.uuid), []),
            # not an id: searched as the start of a uuid
            "not a number": ("xyz", []),
            "negative": ("-1", []),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"q": value}), expected)

    def test_restricted_user_with_a_group(self):
        cases = {
            "group with their facility": (self.group.id, [self.entity.id]),
            "group outside their facilities": (self.rubkona_group.id, []),
            "group of another account": (self.other_group.id, []),
        }
        for case, (group_id, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.partner, {"org_unit_group": group_id}), expected)

    def test_exports_with_a_group_of_another_account_are_empty(self):
        self.client.force_authenticate(self.user)
        params = {"org_unit_group": self.other_group.id}
        rows = list(
            self._workbook(self.client.get(f"{BENEFICIARIES_URL}export/coda/", params)).active.iter_rows(
                values_only=True
            )
        )
        self.assertEqual(rows[2:], [])  # the two header rows only
        visits = list(
            self._workbook(self.client.get(f"{BENEFICIARIES_URL}export/raw/", params))["visits"].iter_rows(
                values_only=True
            )
        )
        self.assertEqual(len(visits) - 1, 0)

    def test_options_of_another_account(self):
        self.client.force_authenticate(self.other_user)
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}options/"), status.HTTP_200_OK)
        self.assertEqual([t["value"] for t in data["entity_types"]], [self.other_entity.entity_type_id])
        self.assertEqual([g["value"] for g in data["org_unit_groups"]], [self.other_group.id])

    def test_path_ids(self):
        self.client.force_authenticate(self.user)
        cases = {
            "missing entity": f"{self._missing_id(m.Entity)}/data/",
            "entity of another account": f"{self.other_entity.id}/data/",
            "entity not a number": "abc/data/",
            "missing submission": f"submissions/{self._missing_id(m.Instance)}/fields/",
            "submission of another account": f"submissions/{self.other_instance.id}/fields/",
            "submission not a number": "submissions/abc/fields/",
        }
        for case, path in cases.items():
            with self.subTest(case):
                self.assertEqual(self.client.get(f"{BENEFICIARIES_URL}{path}").status_code, status.HTTP_404_NOT_FOUND)
