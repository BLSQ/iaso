from __future__ import annotations

import logging
import time
import uuid

from typing import Any

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.recipes.fill_account.apply import _error_message, _paginate, _write
from iaso.mcp.recipes.fill_account.xlsforms import (
    RESERVED_ENTITY,
    RESERVED_INSTANCE,
    build_xlsform_bytes,
    infer_fields,
    instance_xml,
    xlsform_version_today,
)


logger = logging.getLogger(__name__)

_NAMESPACE = uuid.UUID("8f2c1d6e-4b7a-4e31-9c0f-1a2b3c4d5e6f")


def stable_uuid(*parts: object) -> str:
    return str(uuid.uuid5(_NAMESPACE, "|".join(str(part) for part in parts)))


def _post_multipart(
    client: IasoClient,
    path: str,
    *,
    data: dict[str, Any],
    files: dict[str, Any],
    params: dict[str, Any] | None = None,
    dry_run: bool,
) -> Any:
    if dry_run:
        return None
    return client.transport.post_multipart(path, data=data, files=files, params=params)


def _post_root_file(
    client: IasoClient,
    path: str,
    *,
    files: dict[str, Any],
    params: dict[str, Any] | None = None,
) -> tuple[int, object]:
    return client.transport.post_root(path, files=files, params=params)


def ensure_forms(
    client: IasoClient,
    forms: list[dict[str, str]],
    project_id: int | None,
    type_ids_by_name: dict[str, int],
    entities: list[dict[str, str]],
    instances: list[dict[str, str]],
    *,
    dry_run: bool,
) -> tuple[dict[str, int], dict[str, str], list[dict[str, Any]]]:
    existing = {item.get("name"): item for item in _paginate(client, "forms/", "forms")}
    ids: dict[str, int] = {}
    versions: dict[str, str] = {}
    actions: list[dict[str, Any]] = []
    version = xlsform_version_today()

    for form in forms:
        name = form["name"]
        found = existing.get(name)
        type_name = form.get("org_unit_type") or ""
        type_id = type_ids_by_name.get(type_name)
        body = {
            "name": name,
            "period_type": None,
            "periods_before_allowed": 0,
            "periods_after_allowed": 0,
            "single_per_period": False,
            "project_ids": [project_id] if project_id is not None else [],
            "org_unit_type_ids": [type_id] if type_id is not None else [],
            "device_field": "deviceid",
        }
        if found:
            form_id = int(found["id"])
            op = "reuse"
        else:
            created = _write(client, "POST", "forms/", body, dry_run=dry_run)
            form_id = None if dry_run else int(created["id"])
            op = "create"
        ids[name] = form_id if form_id is not None else -len(ids) - 1

        fields = (
            infer_fields(entities, RESERVED_ENTITY)
            if form["kind"] in {"profile", "update"}
            else infer_fields(
                [row for row in instances if row.get("form") == name],
                RESERVED_INSTANCE,
            )
        )
        has_version = bool((found or {}).get("latest_form_version"))
        if has_version:
            version_op = "reuse"
        else:
            xls_bytes = build_xlsform_bytes(
                form_title=name,
                form_id=form["form_id"],
                version=version,
                fields=fields,
            )
            try:
                _post_multipart(
                    client,
                    "formversions/",
                    data={"form_id": str(form_id)},
                    files={
                        "xls_file": (
                            f"{form['form_id']}.xlsx",
                            xls_bytes,
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        )
                    },
                    dry_run=dry_run or form_id is None,
                )
                version_op = "create"
            except IasoHTTPError as exc:
                actions.append(
                    {
                        "op": "fail",
                        "name": name,
                        "label": f"form {name} xlsform ({_error_message(exc)})",
                    }
                )
                versions[name] = version
                continue
        versions[name] = version
        actions.append(
            {
                "op": op,
                "name": name,
                "form_id": form["form_id"],
                "kind": form["kind"],
                "id": form_id,
                "version_op": version_op,
                "label": f"form {name} ({form['kind']})",
            }
        )
    return ids, versions, actions


def ensure_entity_types(
    client: IasoClient,
    entity_types: list[dict[str, Any]],
    form_ids: dict[str, int],
    account_id: int | None,
    *,
    dry_run: bool,
) -> tuple[dict[str, int], list[dict[str, Any]]]:
    existing = {item.get("name"): item for item in _paginate(client, "entitytypes/", "types")}
    ids: dict[str, int] = {}
    actions: list[dict[str, Any]] = []
    for item in entity_types:
        name = item["name"]
        found = existing.get(name)
        if found:
            type_id = int(found["id"])
            ids[name] = type_id
            actions.append(
                {
                    "op": "reuse",
                    "name": name,
                    "id": type_id,
                    "label": f"entity type {name} ({type_id})",
                }
            )
            continue
        body = {
            "name": name,
            "account": account_id,
            "reference_form": form_ids.get(item["reference_form"]),
            "fields_list_view": item.get("list_fields") or [],
            "fields_detail_info_view": item.get("detail_fields") or item.get("list_fields") or [],
            "fields_duplicate_search": item.get("duplicate_fields") or [],
            "prevent_add_if_duplicate_found": False,
        }
        created = _write(client, "POST", "entitytypes/", body, dry_run=dry_run)
        type_id = None if dry_run else int(created.get("id") or created.get("entity_type", {}).get("id") or 0) or None
        if type_id is None and not dry_run:
            # as_dict() may omit id; re-list
            refreshed = {row.get("name"): row for row in _paginate(client, "entitytypes/", "types")}
            match = refreshed.get(name)
            type_id = int(match["id"]) if match else None
        ids[name] = type_id if type_id is not None else -len(ids) - 1
        actions.append(
            {
                "op": "create",
                "name": name,
                "id": type_id,
                "label": f"entity type {name}",
            }
        )
    return ids, actions


def _answers(row: dict[str, str], reserved: frozenset[str]) -> dict[str, str]:
    return {key: value for key, value in row.items() if key not in reserved and value}


def ensure_entities_and_instances(
    client: IasoClient,
    *,
    app_id: str,
    forms: list[dict[str, str]],
    form_ids: dict[str, int],
    form_versions: dict[str, str],
    entity_types: list[dict[str, Any]],
    entity_type_ids: dict[str, int],
    entities: list[dict[str, str]],
    instances: list[dict[str, str]],
    org_unit_ids: dict[str, int],
    dry_run: bool,
) -> dict[str, Any]:
    forms_by_name = {item["name"]: item for item in forms}
    profile_by_entity_type = {
        item["name"]: forms_by_name.get(item.get("reference_form") or "") for item in entity_types
    }
    fallback_profile = next((item for item in forms if item["kind"] == "profile"), None)

    payloads: list[dict[str, Any]] = []
    xml_jobs: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []
    entity_uuids: dict[str, str] = {}
    now = int(time.time())

    for row in entities:
        name = row["name"]
        entity_uuid = stable_uuid("entity", app_id, name)
        entity_uuids[name] = entity_uuid
        entity_type_name = row.get("entity_type") or ""
        entity_type_id = entity_type_ids.get(entity_type_name)
        form = profile_by_entity_type.get(entity_type_name) or fallback_profile
        if not form:
            actions.append(
                {
                    "op": "fail",
                    "kind": "entity",
                    "name": name,
                    "org_unit": row.get("org_unit"),
                    "error": "no profile form for this entity type",
                }
            )
            continue
        form_pk = form_ids.get(form["name"])
        org_unit_id = org_unit_ids.get(row.get("org_unit") or "")
        if form_pk is None or org_unit_id is None or entity_type_id is None:
            actions.append(
                {
                    "op": "fail",
                    "kind": "entity",
                    "name": name,
                    "org_unit": row.get("org_unit"),
                    "error": "missing form, org unit, or entity type id",
                }
            )
            continue
        instance_uuid = stable_uuid("profile", app_id, name)
        file_name = f"{instance_uuid}.xml"
        payloads.append(
            {
                "id": instance_uuid,
                "created_at": now,
                "updated_at": now,
                "name": form["form_id"],
                "file": file_name,
                "formId": form_pk,
                "orgUnitId": org_unit_id,
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type_id,
            }
        )
        xml_jobs.append(
            {
                "kind": "entity",
                "name": name,
                "uuid": instance_uuid,
                "form_id": form["form_id"],
                "version": form_versions.get(form["name"]) or xlsform_version_today(),
                "answers": _answers(row, RESERVED_ENTITY),
                "file_name": file_name,
            }
        )
        actions.append(
            {
                "op": "create",
                "kind": "entity",
                "name": name,
                "org_unit": row.get("org_unit"),
                "uuid": entity_uuid,
            }
        )

    for row in instances:
        entity_name = row.get("entity") or ""
        form_name = row.get("form") or ""
        form = forms_by_name.get(form_name)
        if not form:
            actions.append(
                {
                    "op": "fail",
                    "kind": "instance",
                    "name": f"{entity_name} / {form_name}",
                    "org_unit": row.get("org_unit"),
                    "error": "unknown form",
                }
            )
            continue
        form_pk = form_ids.get(form_name)
        org_unit_id = org_unit_ids.get(row.get("org_unit") or "")
        entity_uuid = entity_uuids.get(entity_name)
        entity_type_id = entity_type_ids.get(
            next(
                (ent.get("entity_type") or "" for ent in entities if ent.get("name") == entity_name),
                "",
            )
        )
        if form_pk is None or org_unit_id is None:
            actions.append(
                {
                    "op": "fail",
                    "kind": "instance",
                    "name": f"{entity_name} / {form_name}",
                    "org_unit": row.get("org_unit"),
                    "error": "missing form or org unit id",
                }
            )
            continue
        instance_uuid = stable_uuid("instance", app_id, entity_name, form_name, row.get("visit_date") or "")
        file_name = f"{instance_uuid}.xml"
        payloads.append(
            {
                "id": instance_uuid,
                "created_at": now,
                "updated_at": now,
                "name": form["form_id"],
                "file": file_name,
                "formId": form_pk,
                "orgUnitId": org_unit_id,
                "entityUuid": entity_uuid,
                "entityTypeId": entity_type_id,
            }
        )
        xml_jobs.append(
            {
                "kind": "instance",
                "name": f"{entity_name} / {form_name}",
                "uuid": instance_uuid,
                "form_id": form["form_id"],
                "version": form_versions.get(form_name) or xlsform_version_today(),
                "answers": _answers(row, RESERVED_INSTANCE),
                "file_name": file_name,
            }
        )
        actions.append(
            {
                "op": "create",
                "kind": "instance",
                "name": f"{entity_name} / {form_name}",
                "org_unit": row.get("org_unit"),
                "uuid": instance_uuid,
            }
        )

    failed: list[dict[str, Any]] = []
    if payloads and not dry_run:
        try:
            _write(
                client,
                "POST",
                "instances/",
                payloads,
                dry_run=False,
                params={"app_id": app_id},
            )
        except IasoHTTPError as exc:
            failed.append({"step": "instances_create", "error": _error_message(exc)})
            for action in actions:
                action["op"] = "fail"
                action["error"] = _error_message(exc)
            return {
                "created": 0,
                "skipped": 0,
                "failed": failed,
                "actions": actions,
            }

        for job in xml_jobs:
            xml = instance_xml(
                form_id=job["form_id"],
                version=job["version"],
                instance_uuid=job["uuid"],
                answers=job["answers"],
            )
            uploaded = False
            last_error = ""
            for path in ("sync/form_upload/",):
                try:
                    status, payload = _post_root_file(
                        client,
                        path,
                        files={
                            "xml_submission_file": (
                                job["file_name"],
                                xml,
                                "text/xml",
                            )
                        },
                    )
                    if status < 400:
                        uploaded = True
                        break
                    last_error = f"{path} {status} {payload}"
                except (IasoHTTPError, OSError, ValueError) as exc:
                    last_error = str(exc)
            if not uploaded:
                failed.append(
                    {
                        "step": "xml_upload",
                        "name": job["name"],
                        "error": last_error or "no upload endpoint accepted the XML",
                    }
                )

    created = sum(1 for action in actions if action["op"] == "create")
    return {
        "created": 0 if dry_run else created,
        "planned": created if dry_run else created,
        "skipped": 0,
        "failed": failed,
        "actions": actions,
    }
