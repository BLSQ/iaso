import django_filters

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from iaso.api.filters import ScopedModelChoiceFilter, get_users_for_user
from iaso.models import DataSourceVersionsSynchronization


class DataSourceVersionsSynchronizationFilter(django_filters.rest_framework.FilterSet):
    created_at__gte = django_filters.IsoDateTimeFilter(
        field_name="created_at", lookup_expr="gte", label=_("Created at greater than or equal to")
    )

    created_by = ScopedModelChoiceFilter(
        field_name="created_by",
        queryset=get_user_model().objects.none(),  # safe default nothing visible
        scope_queryset=lambda request: get_users_for_user(request.user),
    )

    class Meta:
        model = DataSourceVersionsSynchronization
        fields = {
            "id": ["exact"],
            "name": ["icontains"],
            "created_by": ["exact"],
        }
