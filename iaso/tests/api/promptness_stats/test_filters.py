from types import SimpleNamespace

from django.test import SimpleTestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.promptness_stats.filters import StableOrderingFilter
from iaso.api.promptness_stats.views import PromptnessStatsViewSet
from iaso.models import OrgUnit


class StableOrderingFilterTestCase(SimpleTestCase):
    """`id` is always the last ordering key. Uses the promptness viewset: `ordering = ["name"]`, and `id` is not
    one of its `ordering_fields`."""

    def get_request(self, params=None):
        return Request(APIRequestFactory().get("/", params or {}))

    def test_default_ordering_ends_with_id(self):
        request = self.get_request()
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), PromptnessStatsViewSet())
        self.assertEqual(ordering, ["name", "id"])

    def test_requested_ordering_ends_with_id(self):
        request = self.get_request({"order": "-late"})
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), PromptnessStatsViewSet())
        self.assertEqual(ordering, ["-late", "id"])

    def test_requested_ordering_on_several_fields_ends_with_id(self):
        request = self.get_request({"order": "-late,name"})
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), PromptnessStatsViewSet())
        self.assertEqual(ordering, ["-late", "name", "id"])

    def test_unsupported_ordering_falls_back_to_the_default_one_ending_with_id(self):
        request = self.get_request({"order": "foo"})
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), PromptnessStatsViewSet())
        self.assertEqual(ordering, ["name", "id"])

    def test_id_is_not_added_twice(self):
        # A view on which `id` can be requested
        view = SimpleNamespace(ordering_fields=["name", "id"], ordering=["name"])

        request = self.get_request({"order": "-id"})
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), view)
        self.assertEqual(ordering, ["-id"])

        request = self.get_request({"order": "name,id"})
        ordering = StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), view)
        self.assertEqual(ordering, ["name", "id"])
