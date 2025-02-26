import django_filters

from django.conf import settings
from django.db.models import QuerySet
from django.utils.translation import gettext as _

from iaso.models import OrgUnit
from plugins.polio.models import Notification


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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.form.fields["date_of_onset"].fields[0].input_formats = settings.API_DATE_INPUT_FORMATS
        self.form.fields["date_of_onset"].fields[-1].input_formats = settings.API_DATE_INPUT_FORMATS

    class Meta:
        model = Notification
        fields = ["vdpv_category", "source"]
