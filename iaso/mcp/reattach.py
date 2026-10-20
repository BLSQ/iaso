from __future__ import annotations

from typing import Any, Literal

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.recipes.migrate_instances import (
    INSTANCES_CSV,
    ORG_UNIT_MAPPING_CSV,
    _error_message,
    load_instances,
    load_org_unit_mapping,
    patch_instance_org_unit,
)


ActionStatus = Literal["patch", "skip_no_mapping", "skip_already_there"]

_PREVIEW_SAMPLE = 25


def plan_reattach() -> list[dict[str, Any]]:
    instances = load_instances(INSTANCES_CSV)
    mapping = load_org_unit_mapping(ORG_UNIT_MAPPING_CSV)
    actions: list[dict[str, Any]] = []
    for instance_id, current_org_unit_id in instances.items():
        new_org_unit_id = mapping.get(current_org_unit_id)
        if new_org_unit_id is None:
            status: ActionStatus = "skip_no_mapping"
            dest = None
        elif new_org_unit_id == current_org_unit_id:
            status = "skip_already_there"
            dest = new_org_unit_id
        else:
            status = "patch"
            dest = new_org_unit_id
        actions.append(
            {
                "instance_id": instance_id,
                "from_org_unit_id": current_org_unit_id,
                "to_org_unit_id": dest,
                "status": status,
            }
        )
    return actions


def summarize_plan(actions: list[dict[str, Any]]) -> dict[str, Any]:
    counts = {
        "patch": 0,
        "skip_no_mapping": 0,
        "skip_already_there": 0,
    }
    for action in actions:
        counts[action["status"]] += 1
    sample = [a for a in actions if a["status"] == "patch"][:_PREVIEW_SAMPLE]
    return {
        "instances_csv": INSTANCES_CSV.name,
        "mapping_csv": ORG_UNIT_MAPPING_CSV.name,
        "total": len(actions),
        "counts": counts,
        "sample_patches": sample,
    }


def apply_plan(
    client: IasoClient,
    actions: list[dict[str, Any]],
) -> dict[str, Any]:
    patched = 0
    failed: list[dict[str, Any]] = []
    for action in actions:
        if action["status"] != "patch":
            continue
        try:
            patch_instance_org_unit(
                client,
                action["instance_id"],
                action["to_org_unit_id"],
            )
            patched += 1
        except IasoHTTPError as exc:
            failed.append(
                {
                    "instance_id": action["instance_id"],
                    "error": _error_message(exc),
                    "status_code": exc.status_code,
                }
            )
    return {
        "patched": patched,
        "failed": failed,
        "skipped": sum(1 for a in actions if a["status"] != "patch"),
    }
