"""Planning assignments demo data, shared with the setuper (see `setuper/planning_assignments.py`).

This recipe only adds what the MCP needs on top of it: a dry-run summary and a guard against
creating the same users twice in an existing account.
"""

from __future__ import annotations

from typing import Any

from setuper import planning_assignments as scenario
from setuper.planning_assignments import Request


def find_existing_usernames(request: Request, prefix: str) -> list[str]:
    profiles = request("GET", "profiles/", params={"search": f"{prefix}.", "limit": 100, "fields": "user_name"})
    planned = {scenario.username(prefix, key) for key, _first, _last in scenario.PEOPLE}
    found = profiles.get("profiles") or profiles.get("results") or []
    return sorted(profile["user_name"] for profile in found if profile.get("user_name") in planned)


def preview(request: Request, prefix: str) -> dict[str, Any]:
    pyramid = scenario.load_pyramid(request)
    return {
        "planning_root": {"id": pyramid.root.id, "name": pyramid.root.name},
        "levels": len(pyramid.level_type_ids),
        "level_org_unit_type_ids": pyramid.level_type_ids,
        "first_level_org_units": [node.name for node in pyramid.first_level],
        "users": [scenario.username(prefix, key) for key, _first, _last in scenario.PEOPLE],
        "teams": [team.name for team in scenario.TEAMS],
        "plannings": [scenario.DRAFT_PLANNING_NAME, scenario.PUBLISHED_PLANNING_NAME],
        "existing_usernames": find_existing_usernames(request, prefix),
    }


def run(request: Request, *, prefix: str, project_id: int) -> dict[str, Any]:
    existing = find_existing_usernames(request, prefix)
    if existing:
        raise ValueError(f"Users already exist: {', '.join(existing)}. Use another prefix.")
    return scenario.run(request, prefix=prefix, project_id=project_id)
