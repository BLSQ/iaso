"""Demo users, teams and plannings to exercise the planning assignments screen.

The planning is rooted at the first org unit of the default version that has several children,
and covers up to three levels below it. The team tree mirrors those levels: the root team
splits the first level between its sub-teams, which split the second level between their
brigades, whose users get the third level. Assignments are left partial on purpose so that
every state of the screen shows up: done, in progress, not started, unassigned and a team
without any area.

Standard library only, as the IASO MCP imports it too. API calls go through a
`request(method, path, params=None, json=None)` callable, `path` being relative to `/api/`.
"""

from __future__ import annotations

import colorsys

from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from functools import partial
from typing import Any


Request = Callable[..., Any]

MAX_LEVELS = 3
DRAFT_PLANNING_NAME = "CPS 2026 – Planning assignments demo"
PUBLISHED_PLANNING_NAME = "CPS 2026 – Planning assignments demo (published)"

PEOPLE = [
    ("coord", "Aminata", "Ouédraogo"),
    ("nord.sup", "Issouf", "Sawadogo"),
    ("centre.sup", "Mariam", "Traoré"),
    ("sud.sup", "Salif", "Kaboré"),
    ("reserve.sup", "Rasmata", "Zongo"),
    ("n1.a", "Boukary", "Compaoré"),
    ("n1.b", "Fatimata", "Ilboudo"),
    ("n1.c", "Hamidou", "Diallo"),
    ("n2.a", "Awa", "Ouattara"),
    ("n2.b", "Seydou", "Sanou"),
    ("n2.c", "Adjaratou", "Tapsoba"),
    ("n3.a", "Moussa", "Barry"),
    ("n3.b", "Clarisse", "Nikiéma"),
    ("c1.a", "Inoussa", "Kiemdé"),
    ("c1.b", "Safiatou", "Bationo"),
    ("c1.c", "Ousmane", "Coulibaly"),
    ("c2.a", "Haoua", "Yaméogo"),
    ("c2.b", "Lassina", "Konaté"),
    ("s.a", "Pauline", "Somé"),
    ("s.b", "Abdoulaye", "Dao"),
    ("s.c", "Nafissatou", "Sorgho"),
    ("s.d", "Yacouba", "Kambou"),
    ("r1.a", "Bintou", "Zerbo"),
    ("r1.b", "Daouda", "Belem"),
]


@dataclass(frozen=True)
class TeamSpec:
    key: str
    name: str
    manager: str
    parent: str | None = None
    users: tuple[str, ...] = ()


# Parents come before their sub-teams. "n1.c" is in two brigades on purpose.
TEAMS = [
    TeamSpec("root", "Regional coordination", "coord"),
    TeamSpec("nord", "North team", "nord.sup", "root"),
    TeamSpec("centre", "Centre team", "centre.sup", "root"),
    TeamSpec("sud", "South team", "sud.sup", "root", ("s.a", "s.b", "s.c", "s.d")),
    TeamSpec("reserve", "Mobile reserve team", "reserve.sup", "root"),
    TeamSpec("n1", "North – Brigade 1", "nord.sup", "nord", ("n1.a", "n1.b", "n1.c")),
    TeamSpec("n2", "North – Brigade 2", "nord.sup", "nord", ("n2.a", "n2.b", "n2.c")),
    TeamSpec("n3", "North – Flying brigade", "nord.sup", "nord", ("n3.a", "n3.b", "n1.c")),
    TeamSpec("c1", "Centre – Brigade 1", "centre.sup", "centre", ("c1.a", "c1.b", "c1.c")),
    TeamSpec("c2", "Centre – Brigade 2", "centre.sup", "centre", ("c2.a", "c2.b")),
    TeamSpec("r1", "Reserve – Brigade 1", "reserve.sup", "reserve", ("r1.a", "r1.b")),
]


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


def distinct_colors(palette: list[str], count: int, start: int = 0) -> list[str]:
    """`count` different colors: the palette first, then evenly spread hues once it runs out."""
    colors = []
    for index in range(start, start + count):
        if index < len(palette):
            colors.append(palette[index])
            continue
        hue = ((index - len(palette)) * 0.618033988749895) % 1
        red, green, blue = colorsys.hls_to_rgb(hue, 0.42, 0.65)
        colors.append(f"#{round(red * 255):02X}{round(green * 255):02X}{round(blue * 255):02X}")
    return colors


def fetch_palette(request: Request) -> list[str]:
    return [color["value"].upper() for color in request("GET", "colors/", params={"dispersed": "true"})]


def _tree_children(request: Request, parent_id: int | None) -> list[OrgUnitNode]:
    params = {"validation_status": "VALID"}
    if parent_id is not None:
        params["parent_id"] = parent_id
    return [
        OrgUnitNode(item["id"], item["name"], item.get("org_unit_type_id"))
        for item in request("GET", "orgunits/tree/", params=params)
        if parent_id is not None or item.get("has_children")
    ]


def load_pyramid(request: Request) -> Pyramid:
    """Picks the first root with children, skipping single-child levels (e.g. country → its only region)."""
    roots = _tree_children(request, None)
    if not roots:
        raise ValueError("The default version of the account has no org unit with children.")
    root = roots[0]
    root.children = _tree_children(request, root.id)
    while len(root.children) == 1:
        root = root.children[0]
        root.children = _tree_children(request, root.id)

    level_type_ids = []
    level = root.children
    for _ in range(MAX_LEVELS):
        if not level:
            break
        level_type_ids.append(sorted({node.org_unit_type_id for node in level if node.org_unit_type_id}))
        if len(level_type_ids) == MAX_LEVELS:
            break
        for node in level:
            node.children = _tree_children(request, node.id)
        level = [child for node in level for child in node.children]
    return Pyramid(root, level_type_ids)


def create_users(request: Request, prefix: str, project_id: int, colors: list[str]) -> dict[str, int]:
    user_ids = {}
    for (key, first_name, last_name), color in zip(PEOPLE, colors):
        name = username(prefix, key)
        profile = request(
            "POST",
            "profiles/",
            json={
                "user_name": name,
                "password": name,
                "first_name": first_name,
                "last_name": last_name,
                "email": "",
                "color": color,
                "projects": [project_id],
                "send_email_invitation": False,
            },
        )
        user_ids[key] = request("GET", f"profiles/{profile['id']}/")["user_id"]
    return user_ids


def create_teams(request: Request, project_id: int, user_ids: dict[str, int], colors: list[str]) -> dict[str, int]:
    team_ids: dict[str, int] = {}
    for spec, color in zip(TEAMS, colors):
        team = request(
            "POST",
            "teams/",
            json={
                "name": spec.name,
                "description": "Planning assignments demo data",
                "project": project_id,
                "manager": user_ids[spec.manager],
                "type": "TEAM_OF_USERS" if spec.users else "TEAM_OF_TEAMS",
                "color": color,
                "parent": team_ids.get(spec.parent),
                "users": [user_ids[key] for key in spec.users],
            },
        )
        team_ids[spec.key] = team["id"]
    return team_ids


def create_planning(
    request: Request, *, name: str, project_id: int, team_id: int, pyramid: Pyramid, published: bool
) -> int:
    now = datetime.now(timezone.utc)
    today = now.date()
    planning = request(
        "POST",
        "microplanning/plannings/",
        json={
            "name": name,
            "description": "Seasonal malaria chemoprevention, door-to-door distribution.",
            "project": project_id,
            "team": team_id,
            "org_unit": pyramid.root.id,
            "target_org_unit_types": pyramid.level_type_ids[-1],
            "started_at": today.isoformat(),
            "ended_at": (today + timedelta(days=120)).isoformat(),
            "published_at": now.isoformat() if published else None,
        },
    )
    request(
        "PUT",
        f"microplanning/plannings/{planning['id']}/configs/bulk/",
        json=[
            {"level": level, "org_unit_types": type_ids, "org_unit_groups": []}
            for level, type_ids in enumerate(pyramid.level_type_ids, start=1)
        ],
    )
    return planning["id"]


def round_robin(
    org_units: list[OrgUnitNode], assignees: list[Assignee], ratio: float = 1.0
) -> list[tuple[OrgUnitNode, Assignee]]:
    """Hands out the first `ratio` of the org units to the assignees in turn."""
    picked = org_units[: round(len(org_units) * ratio)]
    return [(org_unit, assignees[index % len(assignees)]) for index, org_unit in enumerate(picked)]


def assign(request: Request, planning_id: int, pairs: list[tuple[OrgUnitNode, Assignee]]) -> int:
    """Callers assign parents before children, as the API requires the parent to be owned by a team first."""
    org_unit_ids_by_assignee = defaultdict(list)
    for org_unit, assignee in pairs:
        org_unit_ids_by_assignee[(assignee.team_id, assignee.user_id)].append(org_unit.id)
    for (team_id, user_id), org_unit_ids in org_unit_ids_by_assignee.items():
        request(
            "POST",
            f"microplanning/plannings/{planning_id}/assignments/assign/",
            json={"org_unit_ids": org_unit_ids, "team": team_id, "user": user_id},
        )
    return len(pairs)


def _team(team_ids: dict[str, int], key: str) -> Assignee:
    return Assignee(team_id=team_ids[key])


def _members(user_ids: dict[str, int], team_key: str) -> list[Assignee]:
    spec = next(team for team in TEAMS if team.key == team_key)
    return [Assignee(user_id=user_ids[key]) for key in spec.users]


def seed_draft_assignments(
    request: Request, planning_id: int, pyramid: Pyramid, team_ids: dict[str, int], user_ids: dict[str, int]
) -> int:
    """North is well advanced, Centre has one finished and one untouched org unit, South (a team of users)
    is partly done, the rest of the first level stays unassigned and the reserve team gets nothing."""
    first = pyramid.first_level
    team = partial(_team, team_ids)
    count = assign(
        request,
        planning_id,
        [(node, team("nord")) for node in first[0:2]]
        + [(node, team("centre")) for node in first[2:4]]
        + [(node, team("sud")) for node in first[4:5]],
    )

    north_split = [team("n1"), team("n1"), team("n3")]
    north_areas = [pair for node in first[0:1] for pair in round_robin(node.children, north_split)]
    second_areas = [pair for node in first[1:2] for pair in round_robin(node.children, [team("n2")], 0.5)]
    centre_areas = [pair for node in first[2:3] for pair in round_robin(node.children, [team("c1")])]
    south_areas = [
        pair
        for node in first[4:5]
        for pair in round_robin(node.children, [Assignee(user_id=user_ids[k]) for k in ("s.a", "s.b", "s.c")], 0.7)
    ]
    count += assign(request, planning_id, north_areas + second_areas + centre_areas + south_areas)

    facilities = []
    for area, assignee in north_areas:
        brigade = "n1" if assignee.team_id == team_ids["n1"] else "n3"
        facilities += round_robin(area.children, _members(user_ids, brigade), 0.8 if brigade == "n1" else 0.4)
    for area, _assignee in centre_areas:
        facilities += round_robin(area.children, _members(user_ids, "c1"))
    return count + assign(request, planning_id, facilities)


def seed_published_assignments(request: Request, planning_id: int, pyramid: Pyramid, team_ids: dict[str, int]) -> int:
    first = pyramid.first_level
    team = partial(_team, team_ids)
    count = assign(
        request,
        planning_id,
        [(node, team("nord")) for node in first[0:2]]
        + [(node, team("centre")) for node in first[2:4]]
        + [(node, team("sud")) for node in first[4:]],
    )
    areas = [pair for node in first[0:1] for pair in round_robin(node.children, [team("n1"), team("n3")])]
    areas += [pair for node in first[2:3] for pair in round_robin(node.children, [team("c1")])]
    return count + assign(request, planning_id, areas)


def username(prefix: str, key: str) -> str:
    return f"{prefix}.{key}"


def run(request: Request, *, prefix: str, project_id: int) -> dict[str, Any]:
    pyramid = load_pyramid(request)
    palette = fetch_palette(request)
    user_ids = create_users(request, prefix, project_id, distinct_colors(palette, len(PEOPLE)))
    team_ids = create_teams(request, project_id, user_ids, distinct_colors(palette, len(TEAMS)))

    draft_id = create_planning(
        request,
        name=DRAFT_PLANNING_NAME,
        project_id=project_id,
        team_id=team_ids["root"],
        pyramid=pyramid,
        published=False,
    )
    draft_count = seed_draft_assignments(request, draft_id, pyramid, team_ids, user_ids)
    published_id = create_planning(
        request,
        name=PUBLISHED_PLANNING_NAME,
        project_id=project_id,
        team_id=team_ids["root"],
        pyramid=pyramid,
        published=True,
    )
    published_count = seed_published_assignments(request, published_id, pyramid, team_ids)
    return {
        "planning_root": {"id": pyramid.root.id, "name": pyramid.root.name},
        "user_ids": user_ids,
        "team_ids": team_ids,
        "planning_ids": {"draft": draft_id, "published": published_id},
        "assignments": {"draft": draft_count, "published": published_count},
    }


def client_request(iaso_client) -> Request:
    """Adapts the setuper `IasoClient` to the `request` callable."""

    def request(method: str, path: str, params: dict | None = None, json: Any = None) -> Any:
        response = iaso_client.request(method, "/api/" + path.lstrip("/"), params=params, json=json)
        if not response.ok:
            print(method, path, response.status_code, response.text[:500])
            response.raise_for_status()
        return response.json() if response.content else None

    return request


def setup_planning_assignments(account_name: str, iaso_client, project_id: int) -> None:
    print("-- Planning assignments demo")
    result = run(client_request(iaso_client), prefix=account_name, project_id=project_id)
    print(
        f"\t{len(result['user_ids'])} users, {len(result['team_ids'])} teams, "
        f"plannings {result['planning_ids']} with {result['assignments']} assignments, "
        f"rooted at {result['planning_root']['name']}"
    )
