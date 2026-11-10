from __future__ import annotations

from typing import TypedDict

from django.db.models import Exists, ExpressionWrapper, F, IntegerField, OuterRef, Q, Value
from django_cte import With

from iaso.models.microplanning.planning_configs import PlanningConfig, PlanningConfigQuerySet
from iaso.models.org_unit import OrgUnit, OrgUnitQuerySet


class PlanningConfigDict(TypedDict):
    level: int
    org_unit_groups: list[int] | None
    org_unit_types: list[int] | None


class PlanningOrgUnitTreeQuerySetBuilder:
    @staticmethod
    def get_level_from_config(config: PlanningConfig | PlanningConfigDict) -> int:
        if isinstance(config, PlanningConfig):
            return config.level
        return config["level"]

    @staticmethod
    def _get_config_filter(config: PlanningConfig | PlanningConfigDict) -> Q:
        """
        Return the conditions an OrgUnit must satisfy for this configuration.

        If a configuration has no type/group restrictions, every OrgUnit at
        that level is eligible.
        """
        condition = Q()

        type_ids = (
            [obj.pk for obj in config.org_unit_types.all()]
            if isinstance(config, PlanningConfig)
            else config.get("org_unit_types", [])
        )
        group_ids = (
            [obj.pk for obj in config.org_unit_groups.all()]
            if isinstance(config, PlanningConfig)
            else config.get("org_unit_groups", [])
        )

        if type_ids:
            condition &= Q(org_unit_type_id__in=type_ids)

        if group_ids:
            matching_groups = OrgUnit.groups.through.objects.filter(orgunit_id=OuterRef("pk"), group_id__in=group_ids)

            condition &= Q(Exists(matching_groups))

        return condition

    def build_queryset(
        self,
        *,
        queryset: OrgUnitQuerySet,
        root: OrgUnit,
        processed_levels: set[int],
        configs: PlanningConfigQuerySet | list[PlanningConfigDict],
        max_depth: int | None = None,
        level: int | None = None,
    ) -> OrgUnitQuerySet:
        root_level = len(str(root.path).split("."))

        if max_depth is not None:
            max_depth += root_level - 1

        scoped_ids = queryset.order_by().values("pk")

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
                parent_depth = root_level + self.get_level_from_config(config) - 1

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

        return queryset.annotate(
            depth=F("path__depth"),
        ).distinct()
