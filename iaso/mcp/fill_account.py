from __future__ import annotations

import base64

from datetime import datetime
from pathlib import Path
from typing import Any

from iaso.mcp.client import IasoClient
from iaso.mcp.paths import mcp_media_root
from iaso.mcp.recipes.fill_account import (
    resolve_xlsx_path,
    run_fill,
    sample_workbook,
    summarize_fill,
    write_sample_template,
    write_workbook,
)
from iaso.mcp.recipes.fill_account.workbook import DEFAULT_XLSX_PATH


XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
TEMPLATE_RESOURCE_URI = "iaso://account-setup/template.xlsx"
TEMPLATE_FILENAME = "iaso-account-setup-template.xlsx"


def _uploads_dir() -> Path:
    dest = mcp_media_root() / "uploads"
    dest.mkdir(parents=True, exist_ok=True)
    return dest


def _downloads_dir() -> Path:
    dest = mcp_media_root() / "downloads"
    dest.mkdir(parents=True, exist_ok=True)
    return dest


def template_xlsx_bytes() -> bytes:
    """Sample workbook bytes from the packaged template (never writes outside the jail)."""
    return DEFAULT_XLSX_PATH.read_bytes()


def download_template(save_path: str | Path | None = None) -> dict[str, Any]:
    """Write the sample Excel into MEDIA_ROOT/mcp/downloads (filename only)."""
    name = TEMPLATE_FILENAME
    if save_path is not None and str(save_path).strip():
        name = Path(str(save_path).strip()).name
        if not name.lower().endswith(".xlsx"):
            name = f"{name}.xlsx"
    dest = resolve_xlsx_path(_downloads_dir() / name)
    dest.parent.mkdir(parents=True, exist_ok=True)
    write_sample_template(dest)
    summary = summarize_fill(dest)
    return {
        "ok": True,
        "filename": dest.name,
        "saved_to": str(dest),
        "resource": TEMPLATE_RESOURCE_URI,
        "next": (
            "Open the file in Excel, fill the yellow cells, save, then "
            "preview_fill_account with xlsx_base64 (preferred) or an xlsx_path "
            "inside MEDIA_ROOT/mcp. apply_fill_account needs confirm=true."
        ),
        **summary,
    }


def write_template(xlsx_path: str | None = None) -> dict[str, Any]:
    dest = resolve_xlsx_path(xlsx_path) if xlsx_path else _downloads_dir() / TEMPLATE_FILENAME
    path = write_sample_template(dest)
    summary = summarize_fill(path)
    return {"wrote": str(path), **summary}


def write_custom_workbook(
    *,
    xlsx_path: str | None = None,
    settings: dict[str, Any] | None = None,
    org_unit_types: list[dict[str, Any]] | None = None,
    org_units: list[dict[str, Any]] | None = None,
    org_unit_geo: list[dict[str, Any]] | None = None,
    forms: list[dict[str, Any]] | None = None,
    entity_types: list[dict[str, Any]] | None = None,
    entities: list[dict[str, Any]] | None = None,
    instances: list[dict[str, Any]] | None = None,
    workflows: list[dict[str, Any]] | None = None,
    workflow_followups: list[dict[str, Any]] | None = None,
    workflow_changes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    sample = sample_workbook()
    data = {
        "settings": settings or sample["settings"],
        "org_unit_types": org_unit_types or sample["org_unit_types"],
        "org_units": org_units or sample["org_units"],
        "org_unit_geo": sample["org_unit_geo"] if org_unit_geo is None else org_unit_geo,
        "forms": sample["forms"] if forms is None else forms,
        "entity_types": sample["entity_types"] if entity_types is None else entity_types,
        "entities": sample["entities"] if entities is None else entities,
        "instances": sample["instances"] if instances is None else instances,
        "workflows": sample["workflows"] if workflows is None else workflows,
        "workflow_followups": (sample["workflow_followups"] if workflow_followups is None else workflow_followups),
        "workflow_changes": (sample["workflow_changes"] if workflow_changes is None else workflow_changes),
    }
    path = write_workbook(resolve_xlsx_path(xlsx_path), data)
    summary = summarize_fill(path)
    return {"wrote": str(path), **summary}


def _decode_xlsx_base64(xlsx_base64: str) -> bytes:
    raw = xlsx_base64.strip()
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        data = base64.b64decode(raw, validate=False)
    except Exception as exc:
        msg = "xlsx_base64 is not valid base64."
        raise ValueError(msg) from exc
    if len(data) < 4 or data[:2] != b"PK":
        msg = "Uploaded file is not an .xlsx workbook (expected Office Open XML / zip)."
        raise ValueError(msg)
    return data


def resolve_uploaded_workbook(
    *,
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
) -> tuple[Path, str]:
    """Return (path, source). source is upload, path, or sample."""
    if xlsx_base64 and str(xlsx_base64).strip():
        data = _decode_xlsx_base64(str(xlsx_base64))
        name = Path(xlsx_path).name if xlsx_path and str(xlsx_path).strip() else "uploaded.xlsx"
        if not name.lower().endswith(".xlsx"):
            name = f"{name}.xlsx"
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        dest = _uploads_dir() / f"{stamp}_{name}"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return dest, "upload"
    if xlsx_path and str(xlsx_path).strip():
        path = resolve_xlsx_path(xlsx_path)
        if not path.is_file():
            msg = (
                f"Workbook not found: {path}. "
                "Attach the filled .xlsx or pass xlsx_base64. "
                "Call download_account_setup_template if you still need the blank template."
            )
            raise FileNotFoundError(msg)
        return path, "path"
    return DEFAULT_XLSX_PATH, "sample"


def preview_fill(xlsx_path: str | None = None) -> dict[str, Any]:
    """Dry-run: GET existing IASO objects, no writes."""
    return run_fill_with_client(xlsx_path=xlsx_path, dry_run=True)


def apply_fill(client: IasoClient, xlsx_path: str | None = None) -> dict[str, Any]:
    return run_fill(client, xlsx_path=xlsx_path, dry_run=False)


def run_fill_with_client(
    *,
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
    dry_run: bool,
) -> dict[str, Any]:
    from iaso.mcp.session import get_client

    path, source = resolve_uploaded_workbook(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64)
    result = run_fill(get_client(), xlsx_path=path, dry_run=dry_run)
    result["workbook_source"] = source
    result["xlsx_path"] = str(path)
    return result


def slim_fill_result(result: dict[str, Any]) -> dict[str, Any]:
    """Drop the full org-unit action list from MCP payloads."""
    org_units = dict(result.get("org_unit_results") or {})
    actions = org_units.get("actions") or []
    org_units["actions_sample"] = actions[:25]
    org_units["action_count"] = len(actions)
    org_units.pop("actions", None)
    org_units.pop("ids_by_path", None)
    slim = dict(result)
    slim["org_unit_results"] = org_units
    collection = dict(result.get("collection_results") or {})
    c_actions = collection.get("actions") or []
    collection["actions_sample"] = c_actions[:25]
    collection["action_count"] = len(c_actions)
    collection.pop("actions", None)
    slim["collection_results"] = collection
    return slim
