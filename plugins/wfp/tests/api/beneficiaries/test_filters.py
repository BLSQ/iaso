import uuid

from datetime import date, datetime, timezone

from django.core.exceptions import ValidationError
from django.db.models import F
from django.test import SimpleTestCase
from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.api.beneficiaries.filters import IdFilter, ordering_from_param
from plugins.wfp.models import Beneficiary, Journey, Visit
from plugins.wfp.tests.api.beneficiaries.common import (
    BENEFICIARIES_URL,
    CODA_EXPORT_URL,
    INVALID_IDS,
    BeneficiariesTestData,
)


class IdFilterTestCase(SimpleTestCase):
    def test_positive_integers_only(self):
        field = IdFilter().field
        self.assertEqual(field.clean("12"), 12)
        for value in INVALID_IDS:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    field.clean(value)


class OrderingFromParamTestCase(SimpleTestCase):
    def test_most_recent_visits_by_default(self):
        expected = [F("last_visit_date").desc(nulls_last=True), "-id"]
        self.assertEqual(ordering_from_param(""), expected)
        self.assertEqual(ordering_from_param(None), expected)

    def test_several_fields_ascending_and_descending(self):
        actual = ordering_from_param("gender,-birth_date")
        expected = [F("gender").asc(nulls_last=True), F("birth_date").desc(nulls_last=True), "-id"]
        self.assertEqual(actual, expected)

    def test_unknown_fields_are_ignored(self):
        actual = ordering_from_param("-password,entity_id")
        expected = [F("entity_id").asc(nulls_last=True), "-id"]
        self.assertEqual(actual, expected)


class BeneficiaryFilterTestCase(BeneficiariesTestData, APITestCase):
    """`BeneficiaryFilter` through the list (it reaches the view to hand it the visit scope)."""

    def _assert_invalid_ids(self, key):
        """Values that are not ids are rejected by the list and the exports."""
        self.client.force_authenticate(self.user)
        for value in INVALID_IDS:
            for url in (BENEFICIARIES_URL, CODA_EXPORT_URL):
                with self.subTest(key=key, value=value, url=url):
                    response = self.client.get(url, {key: value})
                    self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_list_is_ordered_by_last_visit_by_default(self):
        data = self._beneficiaries(self.user)
        # both have their last visit on the same day: the most recent beneficiary first
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.rubkona_entity.id, self.entity.id])
        data = self._beneficiaries(self.user, {"order": "entity_id"})
        self.assertEqual([b["entity_id"] for b in data["results"]], [self.entity.id, self.rubkona_entity.id])

    def test_programme_filter_keeps_all_journeys_in_counts(self):
        Journey.objects.create(
            beneficiary=Beneficiary.objects.get(entity=self.entity), nutrition_programme="BSFP", programme_type="U5"
        )
        data = self._beneficiaries(self.user, {"programme": "BSFP"})
        self.assertEqual([(b["entity_id"], b["journeys_count"]) for b in data["results"]], [(self.entity.id, 2)])
        self.assertEqual(self._beneficiaries(self.user, {"programme": "OTP"})["results"], [])

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

    def test_restricted_user_with_a_group(self):
        cases = {
            "group with their facility": (self.group.id, [self.entity.id]),
            "group outside their facilities": (self.rubkona_group.id, []),
            "group of another account": (self.other_group.id, []),
        }
        for case, (group_id, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.partner, {"org_unit_group": group_id}), expected)

    # ids passed to the filters: real ids, ids that do not exist, ids of another account and values that are not ids

    def test_entity_type_filter_ids(self):
        all_entities = sorted([self.entity.id, self.rubkona_entity.id])
        cases = {
            "real id": (self.entity.entity_type_id, all_entities),
            "missing id": (self._missing_id(m.EntityType), []),
            "id of another account": (self.other_entity.entity_type_id, []),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"entity_type": value}), expected)
        self._assert_invalid_ids("entity_type")

    def test_org_unit_group_filter_ids(self):
        cases = {
            "real id": (self.group.id, [self.entity.id]),
            "missing id": (self._missing_id(m.Group), []),
            "id of another account": (self.other_group.id, []),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"org_unit_group": value}), expected)
        self._assert_invalid_ids("org_unit_group")

    def test_group_of_another_account_is_valid_for_that_account(self):
        # the group is real: it only matches nothing for the users of other accounts
        self.assertEqual(
            self._entity_ids(self.other_user, {"org_unit_group": self.other_group.id}), [self.other_entity.id]
        )
        self.assertEqual(self._entity_ids(self.other_user, {"org_unit_group": self.group.id}), [])

    def test_search_ids(self):
        # fixed uuids, starting with digits only: random ones sometimes do. They start with 0, as no id does: a
        # number is searched both as an id and as the start of a uuid, so `search=<id>` must not match them by uuid
        self.entity.uuid = uuid.UUID("01234567-0000-4000-8000-000000000000")
        self.entity.save()
        self.other_entity.uuid = uuid.UUID("98765432-0000-4000-8000-000000000000")
        self.other_entity.save()
        lettered_entity = m.Entity.objects.create(
            entity_type=self.entity.entity_type,
            account=self.account,
            uuid=uuid.UUID("01234567-abcd-4ef0-8abc-def012345678"),
        )
        lettered_journey = Journey.objects.create(
            beneficiary=Beneficiary.objects.create(
                entity=lettered_entity, account=self.account, birth_date=date(2025, 1, 1)
            ),
            nutrition_programme="TSFP",
        )
        Visit.objects.create(
            journey=lettered_journey,
            date=datetime(2026, 5, 1, tzinfo=timezone.utc),
            number=1,
            org_unit=self.facility,
        )

        cases = {
            "real id": (self.entity.id, [self.entity.id]),
            "start of the uuid, digits only": ("01234567", [self.entity.id, lettered_entity.id]),
            "start of the uuid": ("01234567-abcd", [lettered_entity.id]),
            "missing id": (self._missing_id(m.Entity), []),
            "id of another account": (self.other_entity.id, []),
            "uuid of another account": ("98765432-0000-4000-8000-000000000000", []),
            "start of the uuid of another account": ("98765432", []),
            # not an id: searched as the start of a uuid
            "not a number": ("xyz", []),
            "negative": ("-1", []),
        }
        for case, (value, expected) in cases.items():
            with self.subTest(case):
                self.assertEqual(self._entity_ids(self.user, {"search": value}), expected)
