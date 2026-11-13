from typing import Any

import django_filters

from django_filters import CharFilter

from hat.settings import API_DATE_INPUT_FORMATS
from iaso.api.utils.filters import NumberInFilter
from iaso.models import Team
from iaso.models.device import DeviceQuerySet


class DeviceFilter(django_filters.FilterSet):
    search = CharFilter(field_name="installation_id", lookup_expr="icontains")
    synced = django_filters.BooleanFilter(field_name="last_synced_at", lookup_expr="isnull")
    active_before = django_filters.DateFilter(
        field_name="last_synced_at", lookup_expr="lte", input_formats=API_DATE_INPUT_FORMATS
    )
    active_after = django_filters.DateFilter(
        field_name="last_synced_at", lookup_expr="gte", input_formats=API_DATE_INPUT_FORMATS
    )
    app_version = CharFilter(field_name="logs__app_version", lookup_expr="icontains")
    app_id = CharFilter(field_name="logs__app_id", lookup_expr="icontains")
    team = django_filters.ModelChoiceFilter(queryset=Team.objects.none(), method="team_search")
    project_ids = NumberInFilter(field_name="projects__id", lookup_expr="in", distinct=True)

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(kwargs.get("request"), "user", None)
        if user:
            self.form.fields["team"].queryset = Team.objects.filter_for_user(user=user).prefetch_related("users")

    @staticmethod
    def team_search(queryset: DeviceQuerySet, _: str, value: Team | None) -> DeviceQuerySet:
        if not value:
            return queryset

        return queryset.with_current_owner().filter(current_owner_id__in=[user.id for user in value.users.all()])
