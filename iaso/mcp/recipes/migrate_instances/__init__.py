from __future__ import annotations

import csv
import logging

from pathlib import Path

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.session import build_client


DRY_RUN = True

_PACKAGE_DIR = Path(__file__).resolve().parent

INSTANCES_CSV = _PACKAGE_DIR / "instances-test.csv"
ORG_UNIT_MAPPING_CSV = _PACKAGE_DIR / "org_unit_mapping.csv"


def load_instances(path: Path) -> dict[int, int]:
    instances: dict[int, int] = {}
    with path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            instances[int(row["id"])] = int(row["org_unit_id"])
    return instances


def load_org_unit_mapping(path: Path) -> dict[int, int]:
    mapping: dict[int, int] = {}
    with path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            mapping[int(row["ID OU"])] = int(row["ID OU vers laquelle déplacer les soumissions"])
    return mapping


def patch_instance_org_unit(
    client: IasoClient,
    instance_id: int,
    org_unit_id: int,
) -> None:
    client.transport.patch(
        f"instances/{instance_id}/",
        json={"org_unit": org_unit_id},
    )


def _error_message(exc: IasoHTTPError) -> str:
    payload = exc.payload
    if isinstance(payload, dict):
        message = payload.get("error") or payload.get("detail")
        if message:
            return str(message)
        return str(payload)
    if payload:
        return str(payload)
    return str(exc)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    client = build_client(enable_logging=True)

    instances = load_instances(INSTANCES_CSV)
    org_unit_mapping = load_org_unit_mapping(ORG_UNIT_MAPPING_CSV)
    print(f"Loaded {len(instances)} instance(s) from {INSTANCES_CSV.name}")
    print(f"Loaded {len(org_unit_mapping)} org unit mapping(s) from {ORG_UNIT_MAPPING_CSV.name}")

    patched = 0
    skipped = 0
    failed = 0

    for instance_id, current_org_unit_id in instances.items():
        new_org_unit_id = org_unit_mapping.get(current_org_unit_id)
        if new_org_unit_id is None:
            print(f"SKIP instance {instance_id}: org unit {current_org_unit_id} has no mapping")
            skipped += 1
            continue
        if new_org_unit_id == current_org_unit_id:
            print(f"SKIP instance {instance_id}: already on {new_org_unit_id}")
            skipped += 1
            continue

        print(
            f"{'[DRY-RUN] ' if DRY_RUN else ''}PATCH instance {instance_id}: {current_org_unit_id} -> {new_org_unit_id}"
        )
        if DRY_RUN:
            patched += 1
            continue

        try:
            patch_instance_org_unit(client, instance_id, new_org_unit_id)
            patched += 1
        except IasoHTTPError as exc:
            failed += 1
            print(f"FAIL instance {instance_id}: {_error_message(exc)} (status {exc.status_code})")

    print("\n" + "=" * 50)
    print(f" patched={patched} skipped={skipped} failed={failed}")
    print(f" DRY_RUN={DRY_RUN}")
    print("=" * 50 + "\n")
