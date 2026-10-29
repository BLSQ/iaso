from typing import Optional

import django_filters

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django_filters import CharFilter

from hat.settings import API_DATE_INPUT_FORMATS
from iaso.api.utils.filters import NumberInFilter
from iaso.models import Device, Team


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
    team = django_filters.NumberFilter(field_name="logs__team", method="team_search")
    project_ids = NumberInFilter(field_name="projects__id", lookup_expr="in")

    @staticmethod
    def team_search(queryset: QuerySet[Device], _: str, value: Optional[int]) -> QuerySet[Device]:
        if value is None:
            return queryset

        team = get_object_or_404(Team, id=value)
        return queryset.with_current_owner().filter(current_owner_id__in=[user.id for user in team.users.all()])
