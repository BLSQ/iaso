import django_filters

from django.db.models import Exists, OuterRef, Q, QuerySet
from django.utils.translation import gettext_lazy as _

from plugins.polio.api.campaigns.filters.filters import search_queryset
from plugins.polio.models.base import Campaign, Round


class CampaignFiltersForDashboards(django_filters.rest_framework.FilterSet):
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
    is_test = django_filters.BooleanFilter(method="filter_is_test", label=_("Test campaign"))
    is_planned = django_filters.BooleanFilter(method="filter_is_planned", label=_("Planned"))
    is_preventive = django_filters.BooleanFilter(method="filter_is_preventive", label=_("Preventive"))
    on_hold = django_filters.BooleanFilter(method="filter_on_hold", label=_("On hold"))

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

    def filter_is_test(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        if value == False:
            return queryset.filter(is_test=False)
        return queryset

    def filter_is_preventive(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        if value == False:
            return queryset.filter(is_preventive=False)
        return queryset

    def filter_is_planned(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        if value == False:
            return queryset.filter(is_planned=False)
        return queryset

    def filter_on_hold(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        rounds_on_hold = Round.objects.filter(
            campaign_id=OuterRef("pk"),
            on_hold=True,
        )
        queryset = queryset.annotate(has_round_on_hold=Exists(rounds_on_hold))
        if value == False:
            return queryset.filter(Q(on_hold=False) & Q(has_round_on_hold=False))
        return queryset
