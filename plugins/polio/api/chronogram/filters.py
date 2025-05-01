import django_filters

from dateutil.relativedelta import relativedelta
from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnit
from plugins.polio.models import Campaign, Chronogram, ChronogramTask


def countries(request) -> QuerySet[OrgUnit]:
    if request is None:
        return OrgUnit.objects.none()
    return (
        OrgUnit.objects.filter_for_user(request.user)
        .filter(org_unit_type__category="COUNTRY")
        .select_related("org_unit_type")
        .order_by("name")
    )


def campaigns(request) -> QuerySet[Campaign]:
    if request is None:
        return Campaign.objects.none()
    return Campaign.polio_objects.filter_for_user(request.user)


def filter_for_power_bi(queryset: QuerySet) -> QuerySet:
    """
    The Power BI dashboard needs to fetch all the data available in the DB.

    Because such an operation is costly, we agreed on fetching only
    the last 3 months of data.

    However, it seems difficult to compute dynamic queries in Power BI.
    They can't compute "today - 3 months" and use `created_at__gte`.

    To solve this, we added a `power_bi_limit=true` param that returns only
    the last 3 months of data.
    """
    three_months_ago = timezone.now() - relativedelta(months=3)
    return queryset.filter(created_at__gte=three_months_ago)


class ChronogramFilter(django_filters.rest_framework.FilterSet):
    campaign = django_filters.ModelMultipleChoiceFilter(
        field_name="round__campaign", queryset=campaigns, label=_("Campaigns")
    )
    country = django_filters.ModelMultipleChoiceFilter(
        field_name="round__campaign__country", queryset=countries, label=_("Country")
    )
    on_time = django_filters.BooleanFilter(field_name="annotated_is_on_time", label=_("On time"))
    search = django_filters.CharFilter(
        field_name="round__campaign__obr_name", lookup_expr="icontains", label=_("Search")
    )
    created_at__gte = django_filters.IsoDateTimeFilter(
        field_name="created_at", lookup_expr="gte", label=_("Created at greater than or equal to")
    )
    power_bi_limit = django_filters.CharFilter(method="filter_power_bi_limit", label=_("Power BI limit"))

    class Meta:
        model = Chronogram
        fields = ["search", "country"]

    def filter_power_bi_limit(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if value and value.lower() in ["1", "true"]:
            return filter_for_power_bi(queryset)
        return queryset


class ChronogramTaskFilter(django_filters.rest_framework.FilterSet):
    created_at__gte = django_filters.IsoDateTimeFilter(
        field_name="created_at", lookup_expr="gte", label=_("Created at greater than or equal to")
    )
    power_bi_limit = django_filters.CharFilter(method="filter_power_bi_limit", label=_("Power BI limit"))

    class Meta:
        model = ChronogramTask
        fields = ["chronogram_id", "period", "status"]

    def filter_power_bi_limit(self, queryset: QuerySet, _, value: str) -> QuerySet:
        if value and value.lower() in ["1", "true"]:
            return filter_for_power_bi(queryset)
        return queryset
