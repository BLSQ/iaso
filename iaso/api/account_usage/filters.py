import django_filters

from iaso.api.common import NumberInFilter
from iaso.models import AccountUsage


class AccountUsageFilter(django_filters.FilterSet):
    account_ids = NumberInFilter(field_name="account_id", lookup_expr="in")
    vars()["from"] = django_filters.DateTimeFilter(field_name="period_starts_at", lookup_expr="gte")
    to = django_filters.DateTimeFilter(field_name="period_ends_at", lookup_expr="lt")

    class Meta:
        model = AccountUsage
        fields = ["period_type", "from", "to", "account_ids", "metric"]
