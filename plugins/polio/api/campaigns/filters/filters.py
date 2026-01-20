import django_filters

from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnit, OrgUnitType
from plugins.polio.models.base import ON_HOLD, PLANNED, PREVENTIVE, REGULAR, Campaign


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


class CampaignFilterV2(django_filters.rest_framework.FilterSet):
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
    # campaign_types = django_filters.CharFilter(method="filter_campaign_types", label=_("Campaign types"))
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

    # def filter_campaign_types(self, queryset: QuerySet, _, value: str) -> QuerySet:
    #     if not value:
    #         return queryset
    #     campaign_types_list = value.split(",")
    #     if all(item.isdigit() for item in campaign_types_list):
    #         return queryset.filter(campaign_types__id__in=campaign_types_list)
    #     return queryset.filter(campaign_types__slug__in=campaign_types_list)

    def filter_campaign_category(self, queryset: QuerySet, _, value: str) -> QuerySet:
        """
        PLANNED and ON_HOLD are mutually exclusive on the business side (not on the model yet)
        PREVENTIVE and REGULAR are "the same" except for the is_preventive field
        There is no fine-grained filtering for e.g preventive on hold campaigns at the moment as it would clutter the already
        charged UI

        Individual filters for each boolean would make more sense, but that would require some UI design first
        """
        if value == REGULAR:
            return queryset.filter(is_preventive=False).filter(is_planned=False).filter(on_hold=False)
        if value == PREVENTIVE:
            return queryset.filter(is_preventive=True).filter(is_planned=False).filter(on_hold=False)
        if value == ON_HOLD:
            return queryset.filter(on_hold=True)
        if value == PLANNED:
            return queryset.filter(is_planned=True)
        return queryset

    def filter_show_test(self, queryset: QuerySet, _, value: bool) -> QuerySet:
        if not value:
            return queryset.filter(is_test=False)
        return queryset
