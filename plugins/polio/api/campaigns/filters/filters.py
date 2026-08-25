from typing import Optional

import django_filters

from django.db.models import BooleanField, ExpressionWrapper, OuterRef, Q, QuerySet, Subquery, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import filters

from iaso.models import OrgUnit, OrgUnitType
from plugins.polio.models.base import ON_HOLD, PLANNED, PREVENTIVE, REGULAR, Campaign, Round


# search query shared with legacy SearchFilter. Regrouped here to avoid code duplication and ensure consistent behaviour
def search_queryset(queryset, value):
    if value:
        country_types = OrgUnitType.objects.countries().only("id")
        org_units = OrgUnit.objects.filter(
            name__icontains=value, org_unit_type__in=country_types, path__isnull=False
        ).only("id")

        query = Q(obr_name__icontains=value) | Q(epid__icontains=value)
        if len(org_units) > 0:
            query.add(
                Q(initial_org_unit__path__descendants=OrgUnit.objects.query_for_related_org_units(org_units)), Q.OR
            )

        return queryset.filter(query)
    return queryset


def filter_queryset_by_campaign_category(
    queryset: QuerySet,
    value: Optional[str],
    *,
    prefix: str = "",
) -> QuerySet:
    """
    Filter a queryset by campaign category using campaign-level boolean fields.

    Works on Campaign querysets (`prefix=""`) or related models such as Round
    (`prefix="campaign"`). Unknown / empty / `"all"` values leave the queryset unchanged.

    Possible values: ``regular``, ``is_preventive``, ``on_hold``, ``is_planned``.

    Note: ``CampaignFilter`` uses a richer ON_HOLD definition (round-level). Prefer that
    FilterSet when listing Campaigns; use this helper for Round-based or other endpoints.
    """
    if not value or value == "all":
        return queryset

    def field(name: str) -> str:
        return f"{prefix}__{name}" if prefix else name

    if value == ON_HOLD:
        return queryset.filter(**{field("on_hold"): True})
    if value == PREVENTIVE:
        return queryset.filter(**{field("is_preventive"): True})
    if value == REGULAR:
        return queryset.filter(
            **{
                field("is_preventive"): False,
                field("is_test"): False,
                field("on_hold"): False,
                field("is_planned"): False,
            }
        )
    if value == PLANNED:
        return queryset.filter(**{field("is_planned"): True})
    return queryset


class CampaignCategoryFilterBackend(filters.BaseFilterBackend):
    """
    DRF filter backend for ``campaign_category``.

    Configure the relation to Campaign via ``campaign_category_prefix`` on the view
    (e.g. ``\"campaign\"`` for Round querysets, ``\"\"`` for Campaign querysets).
    """

    def filter_queryset(self, request, queryset, view):
        value = request.query_params.get("campaign_category")
        prefix = getattr(view, "campaign_category_prefix", "campaign")
        return filter_queryset_by_campaign_category(queryset, value, prefix=prefix)


class CampaignFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = Campaign
        fields = {
            "country__name": ["exact"],
            "country__id": ["in"],
            "grouped_campaigns__id": ["in", "exact"],
            "obr_name": ["exact", "contains"],
            "cvdpv2_notified_at": ["gte", "lte", "range"],
            "created_at": ["gte", "lte", "range"],
            "rounds__started_at": ["gte", "lte", "range"],
        }

    search = django_filters.CharFilter(method="search_filter", label=_("Search"))
    org_unit_groups = django_filters.CharFilter(method="filter_org_unit_groups", label=_("Country groups"))
    campaign_groups = django_filters.CharFilter(method="filter_campaign_groups", label=_("Campaign groups"))
    campaign_types = django_filters.CharFilter(method="filter_campaign_types", label=_("Campaign types"))
    campaign_category = django_filters.CharFilter(method="filter_campaign_category", label=_("Campaign category"))
    show_test = django_filters.BooleanFilter(method="filter_show_test", label=_("Show test"))

    def search_filter(self, queryset: QuerySet, _, value: str) -> QuerySet:
        return search_queryset(queryset, value)

    def filter_org_unit_groups(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if not value:
            return queryset
        return queryset.filter(country__groups__in=value.split(","))

    def filter_campaign_groups(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if not value:
            return queryset
        return queryset.filter(grouped_campaigns__in=value.split(","))

    def filter_campaign_types(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if not value:
            return queryset
        campaign_types_list = value.split(",")
        if all(item.isdigit() for item in campaign_types_list):
            return queryset.filter(campaign_types__id__in=campaign_types_list)
        return queryset.filter(campaign_types__slug__in=campaign_types_list)

    def filter_campaign_category(self, queryset: QuerySet, _, value: str) -> QuerySet:
        """
        PLANNED and ON_HOLD are mutually exclusive on the business side (not on the model yet)
        ON_HOLD returns a campaign when:
          - it is on hold at campaign level, or
          - it is not finished and its ongoing-or-next active round is on hold, or
          - it is finished and its last round (highest `number`) was on hold.
        An active round is one that has not ended yet (ended_at >= today); a campaign is finished
        once its last round has ended (ended_at < today). A NULL ended_at means the campaign is
        still unfinished, so it cannot match the "finished" branch.
        PREVENTIVE and REGULAR are "the same" except for the is_preventive field
        There is no fine-grained filtering for e.g preventive on hold campaigns at the moment as it would clutter the already
        charged UI

        Individual filters for each boolean would make more sense, but that would require some UI design first
        """

        today = timezone.localdate()

        # ongoing-or-next active round on hold: earliest (by started_at) round not yet ended.
        # With ended_at >= today, a round ending today still counts as active/ongoing.
        next_active_round_on_hold = Subquery(
            Round.objects.filter(
                campaign_id=OuterRef("pk"),
                ended_at__gte=today,
            )
            .order_by("started_at")  # earliest not-yet-ended round; pick first
            .values("on_hold")[:1]
        )

        queryset = queryset.annotate(
            has_round_on_hold=Coalesce(next_active_round_on_hold, Value(False), output_field=BooleanField())
        )
        if value == REGULAR:
            return (
                queryset.filter(is_preventive=False)
                .filter(is_planned=False)
                .filter(Q(on_hold=False) & Q(has_round_on_hold=False))
            )
        if value == PREVENTIVE:
            return (
                queryset.filter(is_preventive=True)
                .filter(is_planned=False)
                .filter(Q(on_hold=False) & Q(has_round_on_hold=False))
            )
        if value == ON_HOLD:
            # finished campaign whose last round (highest `number`) was on hold.
            # A single subquery returns the precomputed boolean to avoid a redundant scan;
            # a NULL ended_at yields NULL here and is coalesced to False (unfinished -> excluded).
            last_round_on_hold_finished = Subquery(
                Round.objects.filter(campaign_id=OuterRef("pk"))
                .order_by("-number")
                .annotate(
                    finished_on_hold=ExpressionWrapper(
                        Q(on_hold=True) & Q(ended_at__lt=today),
                        output_field=BooleanField(),
                    )
                )
                .values("finished_on_hold")[:1]
            )
            queryset = queryset.annotate(
                has_last_round_on_hold_finished=Coalesce(
                    last_round_on_hold_finished, Value(False), output_field=BooleanField()
                )
            )
            return queryset.filter(
                Q(on_hold=True) | Q(has_round_on_hold=True) | Q(has_last_round_on_hold_finished=True)
            )
        if value == PLANNED:
            return queryset.filter(is_planned=True)
        return queryset

    def filter_show_test(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        if not value:
            return queryset.filter(is_test=False)
        return queryset
