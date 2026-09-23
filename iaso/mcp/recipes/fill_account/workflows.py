from __future__ import annotations

from typing import Any

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.recipes.fill_account.apply import _error_message, _get, _paginate, _write
from iaso.mcp.recipes.fill_account.workbook import parse_condition
from iaso.mcp.recipes.fill_account.xlsforms import RESERVED_ENTITY, RESERVED_INSTANCE, infer_fields


def _as_list(response: Any, *keys: str) -> list[dict[str, Any]]:
    if isinstance(response, list):
        return [item for item in response if isinstance(item, dict)]
    if not isinstance(response, dict):
        return []
    for key in keys:
        chunk = response.get(key)
        if isinstance(chunk, list):
            return [item for item in chunk if isinstance(item, dict)]
    chunk = response.get("results")
    if isinstance(chunk, list):
        return [item for item in chunk if isinstance(item, dict)]
    return []


def _version_id(item: dict[str, Any]) -> int | None:
    raw = item.get("version_id") or item.get("id")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _form_ids_on_followup(followup: dict[str, Any]) -> set[int]:
    ids: set[int] = set()
    for form in followup.get("forms") or []:
        if isinstance(form, dict) and form.get("id") is not None:
            ids.add(int(form["id"]))
        elif isinstance(form, int):
            ids.add(form)
    for raw in followup.get("form_ids") or []:
        try:
            ids.add(int(raw))
        except (TypeError, ValueError):
            continue
    return ids


def _change_form_id(change: dict[str, Any]) -> int | None:
    form = change.get("form")
    if isinstance(form, dict) and form.get("id") is not None:
        return int(form["id"])
    try:
        return int(form)
    except (TypeError, ValueError):
        return None


def _question_names_from_workbook(
    form_name: str,
    forms: list[dict[str, str]],
    entities: list[dict[str, str]],
    instances: list[dict[str, str]],
) -> set[str]:
    kind = next((item.get("kind") for item in forms if item.get("name") == form_name), "")
    if kind in {"profile", "update"}:
        return {field["name"] for field in infer_fields(entities, RESERVED_ENTITY)}
    rows = [row for row in instances if row.get("form") == form_name]
    return {field["name"] for field in infer_fields(rows, RESERVED_INSTANCE)}


def _live_question_names(client: IasoClient, form_id: int | None, fallback: set[str]) -> set[str]:
    if form_id is None or form_id < 0:
        return fallback
    try:
        form = _get(client, f"forms/{form_id}/")
    except IasoHTTPError:
        return fallback
    fields = form.get("possible_fields") or []
    names = {str(item.get("name")) for item in fields if isinstance(item, dict) and item.get("name")}
    return names or fallback


def _identity_mapping(source_names: set[str], target_names: set[str]) -> dict[str, str]:
    return {name: name for name in sorted(source_names & target_names)}


def _list_versions(client: IasoClient, entity_type_id: int) -> list[dict[str, Any]]:
    return _paginate(
        client,
        "workflowversions/",
        "workflow_versions",
        params={"workflow__entity_type": entity_type_id},
    )


def _list_changes(client: IasoClient, version_id: int) -> list[dict[str, Any]]:
    response = _get(client, "workflowchanges/", params={"version_id": version_id, "limit": 50})
    return _as_list(response, "workflow_changes", "changes")


def ensure_workflows(
    client: IasoClient,
    workflows: list[dict[str, Any]],
    followups: list[dict[str, Any]],
    changes: list[dict[str, Any]],
    *,
    forms: list[dict[str, str]],
    form_ids: dict[str, int],
    entity_types: list[dict[str, Any]],
    entity_type_ids: dict[str, int],
    entities: list[dict[str, str]],
    instances: list[dict[str, str]],
    dry_run: bool,
) -> list[dict[str, Any]]:
    actions: list[dict[str, Any]] = []
    if not workflows:
        return actions

    reference_by_entity = {item["name"]: item.get("reference_form") or "" for item in entity_types}

    for workflow in workflows:
        name = workflow["name"]
        entity_type_name = workflow["entity_type"]
        entity_type_id = entity_type_ids.get(entity_type_name)
        if entity_type_id is None:
            actions.append(
                {
                    "op": "fail",
                    "kind": "workflow",
                    "name": name,
                    "label": f"workflow {name}",
                    "error": f"unknown entity type '{entity_type_name}'",
                }
            )
            continue

        try:
            versions = [] if entity_type_id < 0 else _list_versions(client, entity_type_id)
        except IasoHTTPError as exc:
            actions.append(
                {
                    "op": "fail",
                    "kind": "workflow",
                    "name": name,
                    "label": f"workflow {name}",
                    "error": (
                        "Cannot list workflow versions "
                        f"({_error_message(exc)}). The login needs the workflow permission."
                    ),
                }
            )
            continue

        published = [item for item in versions if item.get("status") == "PUBLISHED"]
        drafts = [item for item in versions if item.get("status") == "DRAFT"]
        named = [item for item in versions if item.get("name") == name]

        version: dict[str, Any] | None = None
        version_id: int | None = None
        op = "create"

        if published:
            version = next((item for item in published if item.get("name") == name), published[0])
            version_id = _version_id(version)
            op = "reuse"
            actions.append(
                {
                    "op": "reuse",
                    "kind": "workflow",
                    "name": name,
                    "id": version_id,
                    "status": "PUBLISHED",
                    "label": f"workflow {name} on {entity_type_name} (published)",
                }
            )
        elif named:
            version = named[0]
            version_id = _version_id(version)
            op = "reuse"
        elif drafts:
            version = drafts[0]
            version_id = _version_id(version)
            op = "reuse"
        else:
            created = _write(
                client,
                "POST",
                "workflowversions/",
                {"entity_type_id": entity_type_id, "name": name},
                dry_run=dry_run or entity_type_id < 0,
            )
            if dry_run or entity_type_id < 0:
                version_id = -len(actions) - 1
            else:
                version_id = _version_id(created or {})
            actions.append(
                {
                    "op": "create",
                    "kind": "workflow",
                    "name": name,
                    "id": version_id,
                    "status": "DRAFT",
                    "label": f"workflow {name} on {entity_type_name}",
                }
            )

        if op == "reuse" and version is not None and version.get("status") != "PUBLISHED":
            actions.append(
                {
                    "op": "reuse",
                    "kind": "workflow",
                    "name": name,
                    "id": version_id,
                    "status": version.get("status"),
                    "label": f"workflow {name} on {entity_type_name} ({version.get('status')})",
                }
            )

        editable = not (version is not None and version.get("status") == "PUBLISHED")
        detail: dict[str, Any] = version or {}
        existing_changes: list[dict[str, Any]] = []
        if version_id is not None and version_id > 0 and not dry_run:
            try:
                detail = _get(client, f"workflowversions/{version_id}/") or detail
            except IasoHTTPError:
                detail = version or {}
            try:
                existing_changes = _list_changes(client, version_id)
            except IasoHTTPError:
                existing_changes = []

        existing_followup_forms: set[int] = set()
        for followup in detail.get("follow_ups") or []:
            existing_followup_forms |= _form_ids_on_followup(followup)
        existing_change_forms = {
            form_id for form_id in (_change_form_id(item) for item in existing_changes) if form_id is not None
        }

        if editable and workflow.get("auto_first_step") and version_id is not None:
            _write(
                client,
                "PATCH",
                f"workflowversions/{version_id}/",
                {"auto_first_step": True},
                dry_run=dry_run or version_id < 0,
            )
            actions.append(
                {
                    "op": "link",
                    "kind": "auto_first_step",
                    "name": name,
                    "id": version_id,
                    "label": f"auto_first_step on {name}",
                }
            )
        elif workflow.get("auto_first_step") and not editable:
            actions.append(
                {
                    "op": "skip",
                    "kind": "auto_first_step",
                    "name": name,
                    "id": version_id,
                    "label": f"auto_first_step on {name} (published version is read-only)",
                }
            )

        related_followups = [item for item in followups if item.get("workflow") == name]
        related_changes = [item for item in changes if item.get("workflow") == name]

        for followup in related_followups:
            form_name = followup["form"]
            form_id = form_ids.get(form_name)
            if form_id is None:
                actions.append(
                    {
                        "op": "fail",
                        "kind": "followup",
                        "name": form_name,
                        "label": f"follow-up {form_name}",
                        "error": f"unknown form '{form_name}'",
                    }
                )
                continue
            if form_id in existing_followup_forms or not editable:
                actions.append(
                    {
                        "op": "skip",
                        "kind": "followup",
                        "name": form_name,
                        "id": form_id,
                        "label": (
                            f"follow-up {form_name}"
                            if form_id in existing_followup_forms
                            else f"follow-up {form_name} (published version is read-only)"
                        ),
                    }
                )
                continue
            condition = followup.get("condition")
            if not isinstance(condition, (dict, list, bool)):
                condition = parse_condition(condition)
            try:
                _write(
                    client,
                    "POST",
                    "workflowfollowups/",
                    {
                        "order": followup.get("order", 0),
                        "condition": condition,
                        "form_ids": [form_id],
                    },
                    dry_run=dry_run or version_id is None or version_id < 0,
                    params={"version_id": version_id},
                )
            except IasoHTTPError as exc:
                actions.append(
                    {
                        "op": "fail",
                        "kind": "followup",
                        "name": form_name,
                        "label": f"follow-up {form_name}",
                        "error": _error_message(exc),
                    }
                )
                continue
            existing_followup_forms.add(form_id)
            actions.append(
                {
                    "op": "create",
                    "kind": "followup",
                    "name": form_name,
                    "id": form_id,
                    "label": f"follow-up {form_name} (order {followup.get('order', 0)})",
                }
            )

        reference_form_name = reference_by_entity.get(entity_type_name) or ""
        reference_names = _question_names_from_workbook(reference_form_name, forms, entities, instances)
        if not dry_run:
            reference_names = _live_question_names(client, form_ids.get(reference_form_name), reference_names)

        for change in related_changes:
            form_name = change["form"]
            form_id = form_ids.get(form_name)
            if form_id is None:
                actions.append(
                    {
                        "op": "fail",
                        "kind": "change",
                        "name": form_name,
                        "label": f"change {form_name}",
                        "error": f"unknown form '{form_name}'",
                    }
                )
                continue
            if form_id == form_ids.get(reference_form_name):
                actions.append(
                    {
                        "op": "fail",
                        "kind": "change",
                        "name": form_name,
                        "label": f"change {form_name}",
                        "error": "change form cannot be the entity type reference form",
                    }
                )
                continue
            if form_id in existing_change_forms or not editable:
                actions.append(
                    {
                        "op": "skip",
                        "kind": "change",
                        "name": form_name,
                        "id": form_id,
                        "label": (
                            f"change {form_name}"
                            if form_id in existing_change_forms
                            else f"change {form_name} (published version is read-only)"
                        ),
                    }
                )
                continue

            mapping = dict(change.get("mapping") or {})
            source_names = _question_names_from_workbook(form_name, forms, entities, instances)
            if not dry_run:
                source_names = _live_question_names(client, form_id, source_names)
            if not mapping:
                mapping = _identity_mapping(source_names, reference_names)
            else:
                mapping = {
                    source: target
                    for source, target in mapping.items()
                    if source in source_names and target in reference_names
                }
            if not mapping:
                actions.append(
                    {
                        "op": "skip",
                        "kind": "change",
                        "name": form_name,
                        "id": form_id,
                        "label": (
                            f"change {form_name} (no overlapping questions with "
                            f"{reference_form_name or 'the reference form'})"
                        ),
                    }
                )
                continue
            try:
                _write(
                    client,
                    "POST",
                    "workflowchanges/",
                    {"form": form_id, "mapping": mapping},
                    dry_run=dry_run or version_id is None or version_id < 0,
                    params={"version_id": version_id},
                )
            except IasoHTTPError as exc:
                actions.append(
                    {
                        "op": "fail",
                        "kind": "change",
                        "name": form_name,
                        "label": f"change {form_name}",
                        "error": _error_message(exc),
                    }
                )
                continue
            existing_change_forms.add(form_id)
            mapped = ",".join(f"{src}={tgt}" for src, tgt in mapping.items())
            actions.append(
                {
                    "op": "create",
                    "kind": "change",
                    "name": form_name,
                    "id": form_id,
                    "label": f"change {form_name} ({mapped})",
                }
            )

        if workflow.get("publish") and editable and version_id is not None:
            try:
                _write(
                    client,
                    "PATCH",
                    f"workflowversions/{version_id}/",
                    {"status": "PUBLISHED"},
                    dry_run=dry_run or version_id < 0,
                )
            except IasoHTTPError as exc:
                actions.append(
                    {
                        "op": "fail",
                        "kind": "publish",
                        "name": name,
                        "id": version_id,
                        "label": f"publish {name}",
                        "error": _error_message(exc),
                    }
                )
                continue
            actions.append(
                {
                    "op": "link",
                    "kind": "publish",
                    "name": name,
                    "id": version_id,
                    "label": f"publish {name}",
                }
            )
        elif workflow.get("publish") and not editable:
            actions.append(
                {
                    "op": "skip",
                    "kind": "publish",
                    "name": name,
                    "id": version_id,
                    "label": f"publish {name} (already published)",
                }
            )

    return actions
