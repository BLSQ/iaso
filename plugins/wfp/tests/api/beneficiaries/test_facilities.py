from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.wfp.tests.api.beneficiaries.common import FACILITIES_URL, INVALID_IDS, BeneficiariesTestData


class BeneficiaryFacilitiesAPITestCase(BeneficiariesTestData, APITestCase):
    """`/api/wfp/beneficiaries/facilities/`: the facilities of a cooperation partner, to choose the `facility` filter."""

    def _facilities(self, user, params=None):
        self.client.force_authenticate(user)
        response = self.client.get(FACILITIES_URL, params or {})
        return self.assertJSONResponse(response, status.HTTP_200_OK)["facilities"]

    def _labels(self, user, params=None):
        return [f["label"] for f in self._facilities(user, params)]

    def test_requires_the_export_permission(self):
        user = self.create_user_with_profile(username="no_permission", account=self.account)
        self.client.force_authenticate(user)
        response = self.client.get(FACILITIES_URL, {"org_unit_group": self.group.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_facilities_of_the_group(self):
        actual = self._facilities(self.user, {"org_unit_group": self.group.id})
        expected = [{"value": self.facility.id, "label": "Bentiu PHCC"}]
        self.assertEqual(actual, expected)

        actual = self._labels(self.user, {"org_unit_group": self.rubkona_group.id})
        expected = ["Rubkona PHCC"]
        self.assertEqual(actual, expected)

    def test_facilities_are_ordered_by_name(self):
        group = m.Group.objects.create(name="Both", source_version=self.group.source_version)
        group.org_units.set([self.other_facility, self.facility])

        actual = self._labels(self.user, {"org_unit_group": group.id})
        expected = ["Bentiu PHCC", "Rubkona PHCC"]
        self.assertEqual(actual, expected)

    def test_no_facility_without_a_group(self):
        actual = self._facilities(self.user)
        self.assertEqual(actual, [])

    def test_no_facility_for_a_group_that_does_not_exist(self):
        missing_group_id = self._missing_id(m.Group)
        actual = self._facilities(self.user, {"org_unit_group": missing_group_id})
        self.assertEqual(actual, [])

    def test_no_facility_for_a_group_of_another_account(self):
        params = {"org_unit_group": self.other_group.id}

        actual = self._facilities(self.user, params)
        self.assertEqual(actual, [])

        # the group is real: it has facilities for the users of its account
        actual = self._labels(self.other_user, params)
        expected = ["Other PHCC"]
        self.assertEqual(actual, expected)

    def test_restricted_user_only_gets_their_facilities(self):
        actual = self._labels(self.partner, {"org_unit_group": self.group.id})
        expected = ["Bentiu PHCC"]
        self.assertEqual(actual, expected)

        # restricted to Bentiu: no facility outside it
        actual = self._facilities(self.partner, {"org_unit_group": self.rubkona_group.id})
        self.assertEqual(actual, [])

    def test_invalid_group_ids(self):
        self.client.force_authenticate(self.user)
        for value in INVALID_IDS:
            with self.subTest(value=value):
                response = self.client.get(FACILITIES_URL, {"org_unit_group": value})
                self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
