from __future__ import annotations

from typing import Any

import django_filters

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import BooleanField, Case, F, Q, Value, When
from django.db.models.functions import Cast
from django.utils.translation import gettext_lazy as _
from rest_framework import filters

from iaso.api.common import NumberInFilter
from iaso.models.microplanning import Planning
from iaso.models.org_unit import OrgUnitQuerySet


User = get_user_model()


class PlanningSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        return queryset


class PlanningDropdownFilterSet(django_filters.FilterSet):
    form_ids = NumberInFilter(field_name="missions__missionwithforms__forms__id", distinct=True)


class BasePlanningOrgUnitTreeFilterSet(django_filters.FilterSet):
    def __init__(self, planning: Planning, *args: Any, **kwargs: Any) -> None:
        self.planning = planning
        super().__init__(*args, **kwargs)

    def filter_queryset(self, queryset: OrgUnitQuerySet) -> OrgUnitQuerySet:
        planning = self.planning

        root = planning.org_unit
        root_level = len(str(root.path).split("."))

        level = self.form.cleaned_data.get("level")
        max_depth = self.form.cleaned_data.get("max_depth")

        if max_depth is not None:
            max_depth += root_level - 1

        if level is not None:
            nodes_level = root_level + level

            root = (
                queryset.hierarchy(root)
                .filter(path__depth=nodes_level)
                .only("id", "parent", "name", "path")
                .distinct("id")
            )

        queryset = queryset.hierarchy(root)

        if max_depth is not None:
            queryset = queryset.filter(path__depth__lte=max_depth)

        filter_qs = Q()
        processed_levels = []

        for config in planning.configs.all():
            config_level = config.level + root_level
            processed_levels.append(config_level)

            sub_filter = Q(path__depth=config_level)

            org_unit_types = list(config.org_unit_types.all())
            org_unit_groups = list(config.org_unit_groups.all())

            if org_unit_types:
                sub_filter &= Q(org_unit_type__in=[x.pk for x in org_unit_types])

            if org_unit_groups:
                sub_filter &= Q(groups__in=[x.pk for x in org_unit_groups])

            filter_qs |= sub_filter

        filter_qs |= ~Q(path__depth__in=processed_levels)

        return queryset.filter(filter_qs).annotate(
            depth=F("path__depth"),
        )


class BasePlanningOrgUnitTreeFilterSetForm(forms.Form):
    root_level: int = 0

    def clean(self) -> dict[str, Any] | None:
        cleaned_data = super().clean()
        if not cleaned_data:
            return cleaned_data

        # get level
        level: int = cleaned_data.get("level", 0)
        max_depth: int | None = cleaned_data.get("max_depth", None)

        root_level = self.root_level

        if level:
            root_level += level

        if max_depth is None:
            cleaned_data["max_depth"] = root_level + 1
        else:
            if max_depth > root_level + 1:
                self.add_error("max_depth", _("Max depth cannot exceed the root level you asked for plus one."))

        return cleaned_data


class PlanningOrgUnitTreeFilterSet(BasePlanningOrgUnitTreeFilterSet):
    level = django_filters.NumberFilter(label="Level", min_value=1)
    max_depth = django_filters.NumberFilter(
        min_value=1,
        help_text=_(
            "The maximum depth of the tree to return, counting from the root of the entire hierarchy. Selecting a subtree does not reset the depth."
        ),
    )

    def filter_queryset(self, queryset: OrgUnitQuerySet) -> OrgUnitQuerySet:
        queryset = super().filter_queryset(queryset)

        empty_point = GEOSGeometry("POINT EMPTY", srid=4326)

        return (
            queryset.only("id", "parent", "name", "path", "org_unit_type")
            .select_related("org_unit_type")
            .annotate(
                location_as_geom=Cast("location", PointField(dim=3)),
                has_geo_json=Case(
                    When(simplified_geom__isnull=False, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField(),
                ),
                has_location=Case(
                    When(
                        Q(location__isnull=False) & ~Q(location_as_geom=empty_point),
                        then=Value(True),
                    ),
                    default=Value(False),
                    output_field=BooleanField(),
                ),
            )
            .order_by("id")
        )


class PlanningOrgUnitTreeWithGeomFilterSet(BasePlanningOrgUnitTreeFilterSet):
    level = django_filters.NumberFilter(label="Level", min_value=1)
    max_depth = django_filters.NumberFilter(
        min_value=1,
        help_text=_(
            "The maximum depth of the tree to return, counting from the root of the entire hierarchy. Selecting a subtree does not reset the depth. It cannot be greater than the depth of the selected root + 1."
        ),
    )

    class Meta:
        form = BasePlanningOrgUnitTreeFilterSetForm

    def __init__(self, planning: Planning, *args: Any, **kwargs: Any) -> None:
        super().__init__(planning, *args, **kwargs)
        self.form.root_level = len(str(planning.org_unit.path).split("."))

    def filter_queryset(self, queryset: OrgUnitQuerySet) -> OrgUnitQuerySet:
        queryset = super().filter_queryset(queryset)
        # why the defer(None) ? because OrgUnitQuerySet filter_for_user_and_app_id has an hidden defer("geom")..
        return (
            queryset.defer(None)
            .only("id", "parent", "name", "path", "org_unit_type", "geom", "simplified_geom", "location")
            .select_related("org_unit_type")
            .order_by("id")
        )
