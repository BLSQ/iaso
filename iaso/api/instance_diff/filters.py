import django_filters

from hat.audit.models import Modification


class InstanceDiffFilter(django_filters.FilterSet):
    date = django_filters.DateTimeFromToRangeFilter(field_name="created_at")

    class Meta:
        model = Modification
        fields = ["date"]
