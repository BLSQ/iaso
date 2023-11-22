import django_filters

from django.utils.translation import gettext as _
from django.db.models import QuerySet

from plugins.polio.models import Notification
from iaso.models import OrgUnit


def countries(request) -> QuerySet[OrgUnit]:
    if request is None:
        return OrgUnit.objects.none()
    account = request.user.iaso_profile.account
    return Notification.objects.get_countries_for_account(account)


class NotificationFilter(django_filters.rest_framework.FilterSet):
    country = django_filters.ModelChoiceFilter(
        field_name="org_unit__parent__parent", queryset=countries, label=_("Country")
    )
    date_of_onset = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Notification
        fields = ["vdpv_category", "source"]
