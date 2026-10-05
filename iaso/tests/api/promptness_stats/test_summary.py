import time_machine

from django.contrib.auth.models import User
from rest_framework import status

from iaso import models as m
from iaso.tests.api.promptness_stats.common import (
    PERIOD_KEYS,
    SUMMARY_KEYS,
    TOTALS_KEYS,
    PromptnessStatsTestCase,
    aware,
)


@time_machine.travel(PromptnessStatsTestCase.TODAY, tick=False)
class PromptnessStatsSummaryTestCase(PromptnessStatsTestCase):
    def test_num_queries(self):
        # The user is reloaded from the database, like in a real request: its profile and account are not cached yet
        user = User.objects.get(id=self.user.id)
        self.client.force_authenticate(user)

        with self.assertNumQueries(8):
            # 1-2: PERMISSION (user and group permissions)
            # 3: SELECT PROFILE of the user
            # 4: SELECT ACCOUNT of the user
            # 5: EXISTS ORG UNITS of the user (restriction of the accessible org units)
            # 6: SELECT FORM (validation of form_id)
            # 7: SELECT PARENT ORG UNIT (validation of parent_org_unit_id)
            # 8: SELECT the parent org unit with its totals (CTE of the targets, joined to the parent)
            response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        self.assertJSONResponse(response, status.HTTP_200_OK)

    # Response shape
    def test_response_shape(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(set(data.keys()), SUMMARY_KEYS)
        self.assertEqual(set(data["period"].keys()), PERIOD_KEYS)
        self.assertEqual(set(data["totals"].keys()), TOTALS_KEYS)

    def test_happy_path(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(
            data["period"],
            {
                "value": self.PERIOD,
                "start": "2026-01-01",
                "end": "2026-01-31",
                "grace_period_days": 10,
                "deadline": "2026-02-10",
                "is_current": False,
                "is_provisional": False,
            },
        )
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    # Period
    def test_period_during_the_period(self):
        self.client.force_authenticate(self.user)
        with time_machine.travel(aware(2026, 1, 20, 12, 0), tick=False):
            response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertTrue(data["period"]["is_current"])
        self.assertTrue(data["period"]["is_provisional"])

    def test_period_during_the_grace_period(self):
        self.client.force_authenticate(self.user)
        with time_machine.travel(aware(2026, 2, 10, 12, 0), tick=False):
            response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertFalse(data["period"]["is_current"])
        self.assertTrue(data["period"]["is_provisional"])

    def test_zero_grace_period(self):
        self.client.force_authenticate(self.user)

        # With the 10 days grace period: HF D (submitted on 2026-02-10) is on time
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["period"]["deadline"], "2026-02-10")
        self.assertEqual(data["totals"]["on_time"], 2)
        self.assertEqual(data["totals"]["late"], 1)

        self.form.promptness_grace_period_days = 0
        self.form.save()

        # Without grace period: the deadline is the end of the period, HF D becomes late
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["period"]["deadline"], "2026-01-31")
        self.assertEqual(data["totals"]["on_time"], 1)
        self.assertEqual(data["totals"]["late"], 2)

    # Totals
    def test_invariants(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        totals = data["totals"]
        self.assertEqual(totals["on_time"] + totals["late"] + totals["missing"], totals["expected"])
        self.assertEqual(totals["on_time"] + totals["late"], totals["received"])

    def test_totals_are_computed_for_the_parent_org_unit(self):
        # Oromia: 4 expected, 2 on time, 1 late, 1 missing
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(4, 2, 1, 1, 3, 75.0, 50.0, 25.0, 25.0))

    def test_parent_org_unit_itself_is_counted(self):
        # HF A is a target itself: it is counted in its own totals
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.hf_a.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0))

    def test_org_unit_without_target_is_not_applicable(self):
        # Somali has no org unit expected to submit the form
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.somali.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.not_applicable_counts())

    def test_not_applicable_section_of_the_pyramid(self):
        # Borena (Zone, same level as districts) and its health post HP J are not expected to submit the form
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.borena.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.not_applicable_counts())

    def test_org_unit_not_expected_to_submit_is_not_counted(self):
        # Awsi: HP H is expected (target group), HP I is not (and its on time submission is ignored)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.awsi.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0))

    def test_rejected_org_units_are_ignored(self):
        # North Gondar: HF E (late) and HF F (missing) are counted, HF G is rejected (its on time submission is ignored)
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(parent_org_unit_id=self.north_gondar.id)
        response = self.client.get(self.SUMMARY_URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"]["expected"], 2)
        self.assertEqual(data["totals"]["on_time"], 0)

    def test_new_org_units_are_ignored(self):
        self.create_ou("HF New", self.type_facility, self.north_gondar, validation_status=m.OrgUnit.VALIDATION_NEW)
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(parent_org_unit_id=self.north_gondar.id)
        response = self.client.get(self.SUMMARY_URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"]["expected"], 2)

    def test_percentages_are_rounded_half_up(self):
        # A region with 16 facilities, 1 of them on time: 1 / 16 = 6.25% and 15 / 16 = 93.75%, rounded half up by the database
        region = self.create_ou("Half up region", self.type_region, self.ethiopia)
        facilities = [self.create_ou(f"Half up facility {i}", self.type_facility, region) for i in range(16)]
        self.create_submission(facilities[0], aware(2026, 1, 15, 10, 0))

        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=region.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(16, 1, 0, 15, 1, 6.3, 6.3, 0.0, 93.8))

    def test_percentages_are_json_numbers(self):
        # The percentages are `Decimal` values, rendered as numbers (not as strings)
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        for key in ["completeness_percent", "on_time_percent", "late_percent", "missing_percent"]:
            self.assertIsInstance(data["totals"][key], float, key)

    def test_excluded_statuses(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(status="LATE,MISSING"))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # ON_TIME is hidden, the other values are unchanged (expected, received and completeness_percent still
        # include the on time submissions)
        self.assertEqual(data["totals"], {**self.expected_ethiopia_totals(), "on_time": None, "on_time_percent": None})

    def test_totals_dont_depend_on_the_org_unit_types_of_the_rows(self):
        # The totals are not the sum of the rows: they are always computed for the parent org unit
        self.client.force_authenticate(self.user)
        params = self.get_serializer_params(org_unit_type_ids=f"{self.type_region.id},{self.type_district.id}")
        response = self.client.get(self.SUMMARY_URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.expected_ethiopia_totals())

    def test_summary_doesnt_depend_on_the_order_and_the_page_of_the_rows(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params())
        default_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        params = self.get_serializer_params(order="-missing", limit=1, page=2)
        response = self.client.get(self.SUMMARY_URL, params)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data, default_data)

    # Access
    def test_user_restricted_to_org_units(self):
        # user_restricted only has access to Oromia and its descendants
        self.client.force_authenticate(self.user_restricted)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.oromia.id))
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["totals"], self.counts(4, 2, 1, 1, 3, 75.0, 50.0, 25.0, 25.0))

    def test_user_restricted_to_org_units_cannot_see_parent(self):
        # user_restricted only has access to Oromia and its descendants
        self.client.force_authenticate(self.user_restricted)
        response = self.client.get(self.SUMMARY_URL, self.get_serializer_params(parent_org_unit_id=self.ethiopia.id))
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parent_org_unit_id", data)
