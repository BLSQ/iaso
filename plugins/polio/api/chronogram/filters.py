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
    search = django_filters.CharFilter(field_name="round__campaign__obr_name", lookup_expr="icontains")

    class Meta:
        model = Chronogram
        fields = ["search", "country"]
