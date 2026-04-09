import django_filters

from django.utils.translation.trans_real import gettext as _
from django_filters import FilterSet

from hat.api_import.models import APIImport


class APIImportFilterSet(FilterSet):
    app_id = django_filters.CharFilter(field_name="app_id", lookup_expr="icontains")
    from_date = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    to_date = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")
    user_id = django_filters.NumberFilter(field_name="user_id", label=_("User ID"))

    class Meta:
        model = APIImport
        fields = ["from_date", "to_date", "user_id", "has_problem", "import_type", "app_id", "app_version"]
