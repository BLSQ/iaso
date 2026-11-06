from __future__ import annotations

from dataclasses import dataclass

from django.db.models import BooleanField, ExpressionWrapper, Q

from iaso.models.microplanning import Planning
from iaso.models.org_unit import OrgUnit, OrgUnitQuerySet


@dataclass
class LevelTreeNode:
    id: int
    name: str
    org_unit_type_id: int | None
    level: int
    parent_id: int | None
    has_geo_json: bool
    has_location: bool


def get_level_querysets(planning: Planning, base_queryset: OrgUnitQuerySet) -> list[OrgUnitQuerySet]:
    """Org units of each level, level 0 being the target geography.

    A level holds the org units of its types (and groups, when set) located below an org unit of the level above.
    The chain stops at the first missing or type-less level.
    """
    if not planning.org_unit_id:
        return []
    levels = [base_queryset.filter(pk=planning.org_unit_id)]
    configs = planning.configs.order_by("level").prefetch_related("org_unit_types", "org_unit_groups")
    for expected_level, config in enumerate(configs, start=1):
        org_unit_type_ids = [org_unit_type.id for org_unit_type in config.org_unit_types.all()]
        if config.level != expected_level or not org_unit_type_ids:
            break
        queryset = base_queryset.hierarchy(levels[-1]).filter(org_unit_type_id__in=org_unit_type_ids)
        group_ids = [group.id for group in config.org_unit_groups.all()]
        if group_ids:
            # A subquery rather than a join + distinct: the geometry query selects json columns distinct can't compare.
            queryset = queryset.filter(pk__in=OrgUnit.objects.filter(groups__id__in=group_ids).values("pk"))
        levels.append(queryset)
    return levels


def _closest_parent_id(path, parent_ids: set[int]) -> int | None:
    for label in reversed(list(path)[:-1]):
        if int(label) in parent_ids:
            return int(label)
    return None


def build_level_tree(planning: Planning, base_queryset: OrgUnitQuerySet) -> list[LevelTreeNode]:
    """Flat tree of the planning levels: each node points to its closest ancestor in the level above."""
    nodes: list[LevelTreeNode] = []
    parent_ids: set[int] = set()
    for level, queryset in enumerate(get_level_querysets(planning, base_queryset)):
        rows = (
            queryset.annotate(
                has_shape=ExpressionWrapper(Q(simplified_geom__isnull=False), output_field=BooleanField()),
                has_point=ExpressionWrapper(Q(location__isnull=False), output_field=BooleanField()),
            )
            .order_by("name", "id")
            .values("id", "name", "org_unit_type_id", "path", "has_shape", "has_point")
        )
        level_ids: set[int] = set()
        for row in rows:
            level_ids.add(row["id"])
            nodes.append(
                LevelTreeNode(
                    id=row["id"],
                    name=row["name"],
                    org_unit_type_id=row["org_unit_type_id"],
                    level=level,
                    parent_id=_closest_parent_id(row["path"], parent_ids) if level else None,
                    has_geo_json=row["has_shape"],
                    has_location=row["has_point"],
                )
            )
        parent_ids = level_ids
    return nodes


def build_level_geometry(planning: Planning, base_queryset: OrgUnitQuerySet, level: int) -> dict:
    """GeoJSON of a level: the simplified shape of each org unit, or its location when it has no shape."""
    levels = get_level_querysets(planning, base_queryset)
    features = []
    if level < len(levels):
        org_units = levels[level].with_geo_json().only("id", "name", "location")
        for org_unit in org_units:
            if org_unit.geo_json:
                geometry = org_unit.geo_json
            elif org_unit.location:
                geometry = {"type": "Point", "coordinates": [org_unit.location.x, org_unit.location.y]}
            else:
                continue
            features.append(
                {
                    "type": "Feature",
                    "id": org_unit.id,
                    "geometry": geometry,
                    "properties": {"id": org_unit.id, "name": org_unit.name},
                }
            )
    return {"type": "FeatureCollection", "features": features}
