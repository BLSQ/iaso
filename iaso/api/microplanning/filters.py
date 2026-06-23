import django_filters

from django import forms
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers

from iaso.api import query_params as query
from iaso.api.common import parse_comma_separated_numeric_values
from iaso.models.microplanning import Planning
from iaso.models.org_unit import OrgUnit


def apply_selection_filter(queryset, select_all, selected_ids, unselected_ids):
    if not select_all:
        if selected_ids:
            queryset = queryset.filter(pk__in=selected_ids)
    elif unselected_ids:
        queryset = queryset.exclude(pk__in=unselected_ids)
    return queryset


def validate_planning_has_org_unit_scope(planning: Planning):
    sampling = planning.selected_sampling_result
    if sampling and sampling.group_id:
        return
    if planning.org_unit_id and planning.target_org_unit_types.exists():
        return
    raise serializers.ValidationError({"planning": [_("Planning is missing sampling group or target org unit scope")]})


def validate_planning_org_unit_type_ids(planning: Planning, org_unit_type_ids: list[int]):
    target_type_ids = [t.id for t in planning.target_org_unit_types.all()]
    if not target_type_ids or not org_unit_type_ids:
        return
    invalid_type_ids = [type_id for type_id in org_unit_type_ids if type_id not in target_type_ids]
    if invalid_type_ids:
        raise serializers.ValidationError(
            {"org_unit_type_ids": [_("One or more org unit types are not target types for this planning")]}
        )


class PlanningOrgUnitChildrenFilter(django_filters.rest_framework.FilterSet):
    orgUnitParentId = django_filters.NumberFilter(
        method="filter_org_unit_parent_id",
        label=_("Org unit parent ID"),
    )
    orgUnitTypeIds = django_filters.CharFilter(
        method="filter_org_unit_type_ids",
        label=_("Org unit type IDs (comma-separated)"),
    )

    class Meta:
        model = OrgUnit
        fields = []

    def __init__(self, *args, planning=None, base_queryset=None, **kwargs):
        self.planning = planning
        self.base_queryset = base_queryset
        super().__init__(*args, **kwargs)

    def filter_org_unit_parent_id(self, queryset, name, value):
        if value is None:
            return queryset
        parent = get_object_or_404(self.base_queryset, pk=value)
        return queryset.hierarchy(parent).exclude(pk=value)

    def filter_org_unit_type_ids(self, queryset, name, value):
        if not value or not value.strip():
            return queryset
        try:
            org_unit_type_ids = parse_comma_separated_numeric_values(value, query.ORG_UNIT_TYPE_IDS)
            validate_planning_org_unit_type_ids(self.planning, org_unit_type_ids)
        except serializers.ValidationError as exc:
            if isinstance(exc.detail, dict):
                messages = exc.detail.get(query.ORG_UNIT_TYPE_IDS, exc.detail.get("org_unit_type_ids", exc.detail))
            else:
                messages = exc.detail
            raise forms.ValidationError(messages) from exc
        return queryset.filter(org_unit_type_id__in=org_unit_type_ids)


class PlanningOrgUnitChildrenFilterBackend(DjangoFilterBackend):
    """Pass planning context into ``PlanningOrgUnitChildrenFilter``."""

    def get_filterset_kwargs(self, request, queryset, view):
        kwargs = super().get_filterset_kwargs(request, queryset, view)
        planning = view.get_planning_or_404()
        kwargs["planning"] = planning
        kwargs["base_queryset"] = OrgUnit.objects.filter_for_user(request.user).filter(
            validation_status=OrgUnit.VALIDATION_VALID
        )
        return kwargs


class PlanningSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        return queryset


class PublishingStatusFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        status = request.query_params.get("publishing_status", "all")
        form_ids = request.query_params.get("form_ids", None)

        if status == "draft":
            queryset = queryset.filter(published_at__isnull=True)
        if status == "published":
            queryset = queryset.exclude(published_at__isnull=True)
        if form_ids:
            queryset = queryset.filter(forms__id__in=form_ids.split(","))
        return queryset
