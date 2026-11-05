from typing import Any

import django_filters

from django.contrib.auth import get_user_model
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import BooleanField, Case, Exists, ExpressionWrapper, F, IntegerField, OuterRef, Q, Value, When
from django.db.models.functions import Cast
from django.utils.translation import gettext_lazy as _
from django_cte import With
from rest_framework import filters

from iaso.api.common import NumberInFilter
from iaso.models import PlanningConfig
from iaso.models.microplanning import Planning
from iaso.models.org_unit import OrgUnit, OrgUnitQuerySet


User = get_user_model()


class PlanningSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        return queryset


class PlanningDropdownFilterSet(django_filters.FilterSet):
    form_ids = NumberInFilter(field_name="missions__missionwithforms__forms__id", distinct=True)


class PlanningOrgUnitTreeFilterSet(django_filters.FilterSet):
    level = django_filters.NumberFilter(label="Level", min_value=1)
    max_depth = django_filters.NumberFilter(
        min_value=1,
        help_text=_(
            "The maximum depth of the tree to return, counting from the root of the entire hierarchy. Selecting a subtree does not reset the depth."
        ),
    )

    def __init__(self, *args: Any, planning: Planning, **kwargs: Any) -> None:
        self.planning = planning
        super().__init__(*args, **kwargs)

    @staticmethod
    def _get_config_filter(config: PlanningConfig) -> Q:
        """
        Return the conditions an OrgUnit must satisfy for this configuration.

        If a configuration has no type/group restrictions, every OrgUnit at
        that level is eligible.
        """
        condition = Q()

        type_ids = [obj.pk for obj in config.org_unit_types.all()]
        group_ids = [obj.pk for obj in config.org_unit_groups.all()]

        if type_ids:
            condition &= Q(org_unit_type_id__in=type_ids)

        if group_ids:
            matching_groups = OrgUnit.groups.through.objects.filter(orgunit_id=OuterRef("pk"), group_id__in=group_ids)

            condition &= Q(Exists(matching_groups))

        return condition

    def filter_queryset(self, queryset: OrgUnitQuerySet) -> OrgUnitQuerySet:
        planning = self.planning

        root = planning.org_unit
        root_level = len(str(root.path).split("."))

        level = self.form.cleaned_data.get("level")
        max_depth = self.form.cleaned_data.get("max_depth")

        if max_depth is not None:
            max_depth += root_level - 1

        scoped_ids = queryset.order_by().values("pk")

        configs = planning.configs.all()
        processed_levels = {root_level + config.level - 1 for config in configs}

        def make_tree(cte):
            roots = (
                OrgUnit.objects.filter(pk=root.pk, pk__in=scoped_ids)
                .order_by()
                .values(
                    "id",
                    depth=Value(root_level, output_field=IntegerField()),
                )
            )

            # A child is considered only if its parent is already in the CTE.
            children = (
                cte.join(OrgUnit, parent_id=cte.col.id)
                .filter(pk__in=scoped_ids)
                .annotate(
                    parent_depth=ExpressionWrapper(
                        cte.col.depth,
                        output_field=IntegerField(),
                    )
                )
            )

            # Stop recursion once the maximum requested depth is reached.
            if max_depth is not None:
                children = children.filter(parent_depth__lt=max_depth)

            # Nodes whose parent depth has no configuration are unrestricted.
            child_filter = ~Q(parent_depth__in=processed_levels)

            # Configuration restrictions
            for config in configs:
                parent_depth = root_level + config.level - 1

                child_filter |= Q(parent_depth=parent_depth) & self._get_config_filter(config)

            children = (
                children.filter(child_filter)
                .values(
                    "id",
                    depth=F("parent_depth")
                    + Value(
                        1,
                        output_field=IntegerField(),
                    ),
                )
                .order_by()
            )

            return roots.union(children, all=True)

        tree = With.recursive(make_tree)

        # Join the eligible tree back to the original queryset so that its
        # existing filters and annotations are retained.
        queryset = tree.join(queryset, pk=tree.col.id).with_cte(tree)

        if level is not None:
            queryset = queryset.filter(path__depth__gte=root_level + level)

        empty_point = GEOSGeometry("POINT EMPTY", srid=4326)

        return (
            queryset.only("id", "parent", "name", "path", "org_unit_type")
            .select_related("org_unit_type")
            .annotate(
                location_as_geom=Cast("location", PointField(dim=3)),
                depth=F("path__depth"),
                has_geo_json=Case(
                    When(
                        simplified_geom__isnull=False,
                        then=Value(True),
                    ),
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
