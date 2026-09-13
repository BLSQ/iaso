from __future__ import annotations

from pathlib import Path
from typing import Any

from iaso.mcp.client import IasoClient
from iaso.mcp.paths import allowed_xlsx_roots, is_inside, mcp_media_root
from iaso.mcp.recipes.fill_account.apply import (
    connection_prompt,
    current_account,
    ensure_data_source,
    ensure_org_unit_types,
    ensure_org_units,
    ensure_project,
    ensure_source_version,
    set_account_default_version,
)
from iaso.mcp.recipes.fill_account.collection import (
    ensure_entities_and_instances,
    ensure_entity_types,
    ensure_forms,
)
from iaso.mcp.recipes.fill_account.report import write_fill_report
from iaso.mcp.recipes.fill_account.workbook import (
    DEFAULT_XLSX_PATH,
    read_workbook,
    sample_workbook,
    summarize_workbook,
    write_sample_template,
    write_workbook,
)
from iaso.mcp.recipes.fill_account.workflows import ensure_workflows


DRY_RUN = False

__all__ = [
    "DEFAULT_XLSX_PATH",
    "DRY_RUN",
    "connection_prompt",
    "current_account",
    "load_plan",
    "resolve_xlsx_path",
    "_mcp_media_root",
    "run_fill",
    "sample_workbook",
    "summarize_fill",
    "write_sample_template",
    "write_workbook",
]


def _mcp_media_root() -> Path:
    return mcp_media_root()


def resolve_xlsx_path(xlsx_path: str | Path | None) -> Path:
    """Resolve a workbook path inside the MCP jail (recipe dir + MEDIA_ROOT/mcp)."""
    if xlsx_path is None or str(xlsx_path).strip() == "":
        return DEFAULT_XLSX_PATH
    raw = str(xlsx_path).strip()
    if raw.startswith("file:"):
        from urllib.parse import unquote, urlparse

        parsed = urlparse(raw)
        if parsed.scheme != "file":
            raise ValueError("Only file: URLs are accepted.")
        raw = unquote(parsed.path)
    candidate = Path(raw).expanduser()
    if ".." in candidate.parts:
        raise ValueError("Workbook path must not contain '..'.")
    if not candidate.is_absolute():
        candidate = _mcp_media_root() / candidate.name
    resolved = candidate.resolve()
    if not any(is_inside(resolved, root) for root in allowed_xlsx_roots()):
        raise ValueError("Workbook path is outside the allowed MCP directories.")
    return resolved


def load_plan(xlsx_path: str | Path | None = None) -> dict[str, Any]:
    path = resolve_xlsx_path(xlsx_path)
    return read_workbook(path)


def summarize_fill(xlsx_path: str | Path | None = None) -> dict[str, Any]:
    """Local parse of the workbook. Does not call IASO."""
    return summarize_workbook(load_plan(xlsx_path))


def run_fill(
    client: IasoClient,
    *,
    xlsx_path: str | Path | None = None,
    dry_run: bool,
) -> dict[str, Any]:
    data = load_plan(xlsx_path)
    summary = summarize_workbook(data)
    account = current_account(client)
    settings = data["settings"]
    project_id, project_action = ensure_project(client, settings, dry_run=dry_run)
    source, source_action = ensure_data_source(client, settings, project_id, dry_run=dry_run)
    version_id, version_actions = ensure_source_version(
        client,
        source,
        settings,
        project_id,
        dry_run=dry_run,
        set_as_default=data["set_as_default"],
    )
    account_action = set_account_default_version(
        client,
        account.get("account_id"),
        version_id,
        account.get("default_version_id"),
        dry_run=dry_run,
        set_as_default=data["set_as_default"],
    )
    type_ids, type_actions = ensure_org_unit_types(client, data["org_unit_types"], project_id, dry_run=dry_run)
    org_units = ensure_org_units(
        client,
        data["org_unit_types"],
        data["org_units"],
        type_ids,
        source.get("id"),
        version_id,
        dry_run=dry_run,
        org_unit_geo=data.get("org_unit_geo") or [],
    )
    type_ids_by_name = {data["org_unit_types"][index]["name"]: type_id for index, type_id in type_ids.items()}
    form_ids, form_versions, form_actions = ensure_forms(
        client,
        data.get("forms") or [],
        project_id,
        type_ids_by_name,
        data.get("entities") or [],
        data.get("instances") or [],
        dry_run=dry_run,
    )
    entity_type_ids, entity_type_actions = ensure_entity_types(
        client,
        data.get("entity_types") or [],
        form_ids,
        account.get("account_id"),
        dry_run=dry_run,
    )
    workflow_actions = ensure_workflows(
        client,
        data.get("workflows") or [],
        data.get("workflow_followups") or [],
        data.get("workflow_changes") or [],
        forms=data.get("forms") or [],
        form_ids=form_ids,
        entity_types=data.get("entity_types") or [],
        entity_type_ids=entity_type_ids,
        entities=data.get("entities") or [],
        instances=data.get("instances") or [],
        dry_run=dry_run,
    )
    collection = ensure_entities_and_instances(
        client,
        app_id=settings["project_app_id"],
        forms=data.get("forms") or [],
        form_ids=form_ids,
        form_versions=form_versions,
        entity_types=data.get("entity_types") or [],
        entity_type_ids=entity_type_ids,
        entities=data.get("entities") or [],
        instances=data.get("instances") or [],
        org_unit_ids=org_units.get("ids_by_name") or {},
        dry_run=dry_run,
    )
    if data["set_as_default"] and not dry_run:
        live = current_account(client)
        live_default = live.get("default_version_id")
        if live_default is None or (version_id is not None and live_default != version_id):
            raise ValueError(
                f"Account {live.get('account_name')} ({live.get('account_id')}) "
                f"default_version is {live_default!r}, expected {version_id}. "
                "IASO /api/groups/dropdown/?defaultVersion=true will 500 until this is set."
            )
        account["default_version_id"] = live_default
    payload = {
        **summary,
        **account,
        "base_url": client.transport.base_url.rstrip("/"),
        "project_id": project_id,
        "data_source_id": source.get("id"),
        "source_version_id": version_id,
        "project_action": project_action,
        "source_action": source_action,
        "version_actions": version_actions,
        "account_action": account_action,
        "type_actions": type_actions,
        "org_unit_results": org_units,
        "form_actions": form_actions,
        "entity_type_actions": entity_type_actions,
        "workflow_actions": workflow_actions,
        "collection_results": collection,
        "dry_run": dry_run,
    }
    report_path = write_fill_report(payload)
    payload["report_path"] = str(report_path)
    return payload
