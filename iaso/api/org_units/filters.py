import django_filters

from iaso.models import Instance


class ReferenceInstancesFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")

    class Meta:
        model = Instance
        fields = []
