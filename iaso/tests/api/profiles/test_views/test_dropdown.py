from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status

from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase


class ProfileDropdownAPITestCase(BaseProfileAPITestCase):
    def test_dropdown_endpoint(self):
        self.jane.iaso_profile.organization = "Some organization"
        self.jane.iaso_profile.save()
        self.client.force_authenticate(self.jane)

        with self.subTest("should not be paginated by default"):
            response = self.client.get(reverse("profiles-dropdown"))

            response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertValidListData(list_data=response_data, results_key=None, expected_length=7, paginated=False)

        with self.subTest("should not be paginated if limit is provided"):
            response = self.client.get(reverse("profiles-dropdown"), {"limit": 1})
            response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertValidListData(list_data=response_data, results_key="results", expected_length=1, paginated=True)

        with self.subTest("Can still be filtered"):
            for parameter in ["so", "some org", "Some organization"]:
                with self.subTest(f"Searching with {parameter}"):
                    response = self.client.get(reverse("profiles-dropdown"), {"search": parameter})
                    response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
                    self.assertValidListData(
                        list_data=response_data, results_key=None, expected_length=1, paginated=False
                    )

        with self.subTest("Check response data"):
            response = self.client.get(reverse("profiles-dropdown"), {"search": parameter})
            response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertValidListData(list_data=response_data, results_key=None, expected_length=1, paginated=False)

            item = response_data[0]
            self.assertCountEqual(item.keys(), ["label", "value"])
            self.assertEqual(item["value"], self.jane.id)
            self.assertEqual(item["label"], f"{self.jane.username} ({self.jane.get_full_name()})")

    def test_dropdown_endpoint_does_not_trigger_n_plus_1_queries(self):
        # Re-fetch a fresh user instance before each measurement so Django's
        # permission cache (populated by the first `has_perm` call) can't
        # mask query growth on the second measurement.
        self.client.force_authenticate(User.objects.get(pk=self.jane.pk))

        with self.assertNumQueries(5):
            response = self.client.get(reverse("profiles-dropdown"))
            self.assertJSONResponse(response, status.HTTP_200_OK)

        for i in range(20):
            self.create_user_with_profile(username=f"extra_user_{i}", account=self.account)

        self.client.force_authenticate(User.objects.get(pk=self.jane.pk))

        # The number of queries must stay constant no matter how many profiles are returned,
        # otherwise the "user" relation is being fetched once per profile instead of via select_related.
        with self.assertNumQueries(5):
            response = self.client.get(reverse("profiles-dropdown"))
            self.assertJSONResponse(response, status.HTTP_200_OK)
