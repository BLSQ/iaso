"""Helpers to build plannings that follow the planning v2 assignment rules."""

from __future__ import annotations

import colorsys

from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class OrgUnitNode:
    id: int
    name: str
    org_unit_type_id: int | None
    children: list[OrgUnitNode] = field(default_factory=list)


@dataclass
class Pyramid:
    root: OrgUnitNode
    level_type_ids: list[list[int]]

    @property
    def first_level(self) -> list[OrgUnitNode]:
        return self.root.children


@dataclass
class Assignee:
    team_id: int | None = None
    user_id: int | None = None


def fetch_palette(iaso_client) -> list[str]:
    return [color["value"].upper() for color in iaso_client.get("/api/colors/", params={"dispersed": "true"})]


def distinct_colors(palette: list[str], count: int) -> list[str]:
    """`count` different colors: the palette first, then evenly spread hues once it runs out."""
    colors = palette[:count]
    for index in range(count - len(colors)):
        hue = (index * 0.618033988749895) % 1
        red, green, blue = colorsys.hls_to_rgb(hue, 0.42, 0.65)
        colors.append(f"#{round(red * 255):02X}{round(green * 255):02X}{round(blue * 255):02X}")
    return colors


def _tree_children(iaso_client, parent_id: int | None) -> list[OrgUnitNode]:
    params = {"validation_status": "VALID"}
    if parent_id is not None:
        params["parent_id"] = parent_id
    return [
        OrgUnitNode(item["id"], item["name"], item.get("org_unit_type_id"))
        for item in iaso_client.get("/api/orgunits/tree/", params=params)
        if parent_id is not None or item.get("has_children")
    ]


def load_pyramid(iaso_client, levels: int) -> Pyramid:
    """Loads `levels` levels below the first root with children."""
    roots = _tree_children(iaso_client, None)
    if not roots:
        raise ValueError("The default version of the account has no org unit with children.")
    root = roots[0]
    root.children = _tree_children(iaso_client, root.id)

    level_type_ids = []
    level = root.children
    while level and len(level_type_ids) < levels:
        level_type_ids.append(sorted({node.org_unit_type_id for node in level if node.org_unit_type_id}))
        if len(level_type_ids) == levels:
            break
        for node in level:
            node.children = _tree_children(iaso_client, node.id)
        level = [child for node in level for child in node.children]
    return Pyramid(root, level_type_ids)


def round_robin(
    org_units: list[OrgUnitNode], assignees: list[Assignee], ratio: float = 1.0
) -> list[tuple[OrgUnitNode, Assignee]]:
    """Hands out the first `ratio` of the org units to the assignees in turn."""
    picked = org_units[: round(len(org_units) * ratio)]
    return [(org_unit, assignees[index % len(assignees)]) for index, org_unit in enumerate(picked)]


def assign(iaso_client, planning_id: int, pairs: list[tuple[OrgUnitNode, Assignee]]) -> int:
    """Callers assign parents before children, as the API requires the parent to be owned by a team first."""
    org_unit_ids_by_assignee = defaultdict(list)
    for org_unit, assignee in pairs:
        org_unit_ids_by_assignee[(assignee.team_id, assignee.user_id)].append(org_unit.id)
    for (team_id, user_id), org_unit_ids in org_unit_ids_by_assignee.items():
        iaso_client.post(
            f"/api/microplanning/plannings/{planning_id}/assignments/assign/",
            json={"org_unit_ids": org_unit_ids, "team": team_id, "user": user_id},
        )
    return len(pairs)
