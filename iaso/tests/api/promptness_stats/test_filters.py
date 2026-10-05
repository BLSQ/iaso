from types import SimpleNamespace

from django.db.models import BooleanField, IntegerField, Value
from django.test import SimpleTestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.promptness_stats.filters import PromptnessStatsOrderingFilter, StableOrderingFilter
from iaso.api.promptness_stats.views import PromptnessStatsViewSet
from iaso.models import OrgUnit


class StableOrderingFilterTestCase(SimpleTestCase):
    """`id` is always the last ordering key. Uses the promptness viewset by default: `ordering = ["name"]`, and `id`
    is not one of its `ordering_fields`."""

    def get_ordering(self, params=None, view=None):
        request = Request(APIRequestFactory().get("/", params or {}))
        return StableOrderingFilter().get_ordering(request, OrgUnit.objects.all(), view or PromptnessStatsViewSet())

    def test_default_ordering_ends_with_id(self):
        ordering = self.get_ordering()
        expected = ["name", "id"]
        self.assertEqual(ordering, expected)

    def test_requested_ordering_ends_with_id(self):
        ordering = self.get_ordering({"order": "-late"})
        expected = ["-late", "id"]
        self.assertEqual(ordering, expected)

    def test_requested_ordering_on_several_fields_ends_with_id(self):
        ordering = self.get_ordering({"order": "-late,name"})
        expected = ["-late", "name", "id"]
        self.assertEqual(ordering, expected)

    def test_unsupported_ordering_falls_back_to_the_default_one_ending_with_id(self):
        ordering = self.get_ordering({"order": "foo"})
        expected = ["name", "id"]
        self.assertEqual(ordering, expected)

    def test_id_is_not_added_twice(self):
        # A view on which `id` can be requested
        view = SimpleNamespace(ordering_fields=["name", "id"], ordering=["name"])

        ordering = self.get_ordering({"order": "-id"}, view=view)
        expected = ["-id"]
        self.assertEqual(ordering, expected)

        ordering = self.get_ordering({"order": "name,id"}, view=view)
        expected = ["name", "id"]
        self.assertEqual(ordering, expected)


class PromptnessStatsOrderingFilterTestCase(SimpleTestCase):
    """The not applicable rows come last when ordering on a figure: `-is_applicable` is added before the first figure.
    Uses the promptness viewset: the figures are its `not_applicable_last_fields`."""

    def get_ordering(self, params=None):
        request = Request(APIRequestFactory().get("/", params or {}))
        return PromptnessStatsOrderingFilter().get_ordering(request, OrgUnit.objects.all(), PromptnessStatsViewSet())

    def test_default_ordering_is_not_changed(self):
        ordering = self.get_ordering()
        expected = ["name", "id"]
        self.assertEqual(ordering, expected)

    def test_ordering_on_names_is_not_changed(self):
        ordering = self.get_ordering({"order": "-name"})
        expected = ["-name", "id"]
        self.assertEqual(ordering, expected)

        ordering = self.get_ordering({"order": "org_unit_type__name,name"})
        expected = ["org_unit_type__name", "name", "id"]
        self.assertEqual(ordering, expected)

    def test_descending_ordering_on_a_figure(self):
        ordering = self.get_ordering({"order": "-completeness_percent"})
        expected = ["-is_applicable", "-completeness_percent", "id"]
        self.assertEqual(ordering, expected)

    def test_ascending_ordering_on_a_figure(self):
        ordering = self.get_ordering({"order": "missing"})
        # Also descending on `is_applicable`: the not applicable rows come last in both directions
        expected = ["-is_applicable", "missing", "id"]
        self.assertEqual(ordering, expected)

    def test_every_figure(self):
        for field in PromptnessStatsViewSet.not_applicable_last_fields:
            with self.subTest(field=field):
                ordering = self.get_ordering({"order": field})
                expected = ["-is_applicable", field, "id"]
                self.assertEqual(ordering, expected)

    def test_added_once_with_several_figures(self):
        ordering = self.get_ordering({"order": "-late,-missing"})
        expected = ["-is_applicable", "-late", "-missing", "id"]
        self.assertEqual(ordering, expected)

    def test_figure_after_a_name(self):
        ordering = self.get_ordering({"order": "name,-missing"})
        # The name comes first: `-is_applicable` is added just before the figure
        expected = ["name", "-is_applicable", "-missing", "id"]
        self.assertEqual(ordering, expected)

    def test_name_after_a_figure(self):
        ordering = self.get_ordering({"order": "-late,name"})
        expected = ["-is_applicable", "-late", "name", "id"]
        self.assertEqual(ordering, expected)

    def test_queryset_is_ordered_by_is_applicable_first(self):
        # The request and the queryset are used by `filter_queryset()`: not built by `get_ordering()`
        queryset = OrgUnit.objects.annotate(
            is_applicable=Value(True, output_field=BooleanField()), missing=Value(0, output_field=IntegerField())
        )
        request = Request(APIRequestFactory().get("/", {"order": "missing"}))

        ordered_queryset = PromptnessStatsOrderingFilter().filter_queryset(request, queryset, PromptnessStatsViewSet())

        expected = ("-is_applicable", "missing", "id")
        self.assertEqual(ordered_queryset.query.order_by, expected)
