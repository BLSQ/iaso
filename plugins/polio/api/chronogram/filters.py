import django_filters

from django.db.models import QuerySet
from django.utils.translation import gettext as _

from iaso.models import OrgUnit

from plugins.polio.models import Chronogram, Campaign


def countries(request) -> QuerySet[OrgUnit]:
    if request is None:
        return OrgUnit.objects.none()
    country_ids = Campaign.polio_objects.filter_for_user(request.user).values_list("country_id", flat=True)
    return OrgUnit.objects.filter(id__in=country_ids).select_related("org_unit_type").order_by("name")


class ChronogramFilter(django_filters.rest_framework.FilterSet):
    country = django_filters.ModelMultipleChoiceFilter(
        field_name="round__campaign__country", queryset=countries, label=_("Country")
    )
    on_time = django_filters.BooleanFilter(field_name="is_on_time", method="filter_on_time")
    search = django_filters.CharFilter(field_name="round__campaign__obr_name", lookup_expr="icontains")

    class Meta:
        model = Chronogram
        fields = ["search", "country"]

    def filter_on_time(self, queryset: QuerySet, name: str, value: bool) -> QuerySet:
        """
        Filter by @property.
        Filtering on `on_time` will generate a N+1 but I haven't found an easy
        way to do this with `annotate()` yet…
        """
        if value is True:
            pks = [chronogram.pk for chronogram in queryset if chronogram.is_on_time]
            return queryset.filter(pk__in=pks)
        if value is False:
            pks = [chronogram.pk for chronogram in queryset if not chronogram.is_on_time]
            return queryset.filter(pk__in=pks)
        return queryset
