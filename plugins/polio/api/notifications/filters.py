import django_filters

from plugins.polio.models import Notification


class NotificationFilter(django_filters.rest_framework.FilterSet):
    date_of_onset = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Notification
        fields = ["vdpv_category", "source", "org_unit__parent__parent__name"]
