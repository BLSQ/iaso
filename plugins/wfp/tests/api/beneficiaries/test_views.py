from datetime import date, datetime, timezone

from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.models import Beneficiary, Journey, Step, Visit
from plugins.wfp.permissions import WFP_BENEFICIARY_EXPORT_PERMISSION
from plugins.wfp.tests.api.beneficiaries.common import (
    BENEFICIARIES_URL,
    CODA_EXPORT_URL,
    RAW_EXPORT_URL,
    BeneficiariesTestData,
)


class BeneficiaryViewSetTestCase(BeneficiariesTestData, APITestCase):
    """The endpoints of `BeneficiaryViewSet`, except the facilities (`test_facilities`) and the exports (`test_exports`).

    The filters of the list are tested in `test_filters`.
    """

    def test_requires_authentication(self):
        for url in [BENEFICIARIES_URL, CODA_EXPORT_URL, RAW_EXPORT_URL]:
            with self.subTest(url):
                self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

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

    def test_list_in_the_browsable_api(self):
        # the browsable API (opened in a browser) builds the queryset of the view to render its filter form
        self.client.force_authenticate(self.user)
        response = self.client.get(
            BENEFICIARIES_URL, {"order": "-journeys_count", "page": 1, "limit": 50}, HTTP_ACCEPT="text/html"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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

    def test_options_of_another_account(self):
        self.client.force_authenticate(self.other_user)
        data = self.assertJSONResponse(self.client.get(f"{BENEFICIARIES_URL}options/"), status.HTTP_200_OK)
        self.assertEqual([t["value"] for t in data["entity_types"]], [self.other_entity.entity_type_id])
        self.assertEqual([g["value"] for g in data["org_unit_groups"]], [self.other_group.id])

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

    def test_invalid_visit_period(self):
        # the list and every export: each error on the date field to correct (shown next to it by the page)
        self.client.force_authenticate(self.user)
        wrong_format = ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."]
        cases = {
            "wrong format": (
                {"visit_date_after": "01-09-2026"},
                {"visit_date_after": wrong_format},
            ),
            "day out of range": (  # was a 500: parsed but not a date
                {"visit_date_before": "2026-02-30"},
                {"visit_date_before": wrong_format},
            ),
            "end before start": (
                {"visit_date_after": "2026-10-01", "visit_date_before": "2026-09-01"},
                {"visit_date_before": ["The end date must be after the start date."]},
            ),
        }
        for path in ["", "export/coda/", "export/raw/", "export/eligible/"]:
            for case, (params, errors) in cases.items():
                with self.subTest(path=path, case=case):
                    response = self.client.get(f"{BENEFICIARIES_URL}{path}", params)
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    self.assertEqual(response.json(), errors)

    def test_visit_period_in_the_future(self):
        # the list shows the planned visits too: only the eligible export refuses the future
        self.client.force_authenticate(self.user)
        params = {"visit_date_after": "2026-01-01", "visit_date_before": "2999-12-31"}
        self.assertJSONResponse(self.client.get(BENEFICIARIES_URL, params), status.HTTP_200_OK)
        response = self.client.get(f"{BENEFICIARIES_URL}export/eligible/", params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"visit_date_before": ["The date cannot be in the future."]})


class BeneficiaryNestedDataTestCase(APITestCase):
    """A beneficiary whose reference submission has nested answers, and a visit with a step."""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="WFP")
        cls.other_account = m.Account.objects.create(name="Other")
        cls.form = m.Form.objects.create(name="Reference", form_id="reference")
        cls.entity_type = m.EntityType.objects.create(name="Child", reference_form=cls.form, account=cls.account)
        cls.other_entity_type = m.EntityType.objects.create(
            name="Other child", reference_form=cls.form, account=cls.other_account
        )
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[WFP_BENEFICIARY_EXPORT_PERMISSION]
        )

        cls.reference = m.Instance.objects.create(form=cls.form, json={"first_name": "Amina", "household": {"size": 5}})
        cls.entity = m.Entity.objects.create(entity_type=cls.entity_type, account=cls.account, attributes=cls.reference)
        cls.reference.entity = cls.entity
        cls.reference.save()
        cls.visit_instance = m.Instance.objects.create(
            form=cls.form, entity=cls.entity, json={"muac": "13.1", "referrer_name": "Fatou"}
        )
        cls.beneficiary = Beneficiary.objects.create(
            entity=cls.entity, account=cls.account, birth_date=date(2024, 1, 1), gender="Female"
        )
        cls.journey = Journey.objects.create(
            beneficiary=cls.beneficiary, nutrition_programme="BSFP", programme_type="U5", start_date=date(2026, 5, 1)
        )
        cls.visit = Visit.objects.create(
            journey=cls.journey,
            date=datetime(2026, 5, 1, 12, tzinfo=timezone.utc),
            muac_size="13.1",
            instance_id=cls.visit_instance.id,
        )
        Step.objects.create(
            visit=cls.visit, assistance_type="lns", quantity_given=14, instance_id=cls.visit_instance.id
        )

        cls.other_entity = m.Entity.objects.create(entity_type=cls.other_entity_type, account=cls.other_account)
        cls.other_beneficiary = Beneficiary.objects.create(
            entity=cls.other_entity, account=cls.other_account, birth_date=date(2023, 1, 1), gender="Male"
        )

    def _beneficiaries(self, params=None):
        self.client.force_authenticate(self.user)
        return self.assertJSONResponse(self.client.get(BENEFICIARIES_URL, params or {}), status.HTTP_200_OK)

    def test_list_is_limited_to_the_user_account(self):
        data = self._beneficiaries()
        self.assertEqual([b["id"] for b in data["results"]], [self.beneficiary.id])
        self.assertEqual(data["results"][0]["uuid"], str(self.entity.uuid))

    def test_list_shows_visits_and_counts(self):
        [beneficiary] = self._beneficiaries()["results"]
        self.assertEqual((beneficiary["journeys_count"], beneficiary["visits_count"]), (1, 1))
        [visit] = beneficiary["journeys"][0]["visits"]
        self.assertEqual(visit["id"], self.visit.id)
        self.assertEqual(visit["instance_id"], self.visit_instance.id)
        self.assertEqual([(s["assistance_type"], s["quantity_given"]) for s in visit["steps"]], [("lns", 14.0)])

    def test_beneficiary_data_shows_reference_and_submissions(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}{self.entity.id}/data/"), status.HTTP_200_OK
        )
        self.assertIn({"key": "first_name", "value": "Amina"}, data["attributes"])
        self.assertIn({"key": "household/size", "value": 5}, data["attributes"])
        self.assertEqual({s["id"] for s in data["submissions"]}, {self.reference.id, self.visit_instance.id})
        visit_submission = next(s for s in data["submissions"] if s["id"] == self.visit_instance.id)
        self.assertIn({"key": "referrer_name", "value": "Fatou"}, visit_submission["rows"])

    def test_submission_fields(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(f"{BENEFICIARIES_URL}submissions/{self.visit_instance.id}/fields/"), status.HTTP_200_OK
        )
        self.assertEqual(data["submission"]["id"], self.visit_instance.id)
        self.assertIn({"key": "referrer_name", "value": "Fatou"}, data["rows"])
