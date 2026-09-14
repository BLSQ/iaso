from __future__ import annotations

from pathlib import Path
from typing import Any

from iaso.mcp.client import IasoClient
from iaso.mcp.recipes.create_pyramid import (
    XLSX_PATH,
    load_pyramid_spec,
    run_import,
    session_pyramid_target,
    summarize_pyramid,
)


def resolve_pyramid_xlsx(
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
) -> Path:
    """Packaged Org_Units.xlsx, or an uploaded workbook in the MCP jail."""
    if (not xlsx_path or not str(xlsx_path).strip()) and (not xlsx_base64 or not str(xlsx_base64).strip()):
        return XLSX_PATH
    from iaso.mcp.fill_account import resolve_uploaded_workbook

    path, _source = resolve_uploaded_workbook(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64)
    return path


def plan_pyramid(
    client: IasoClient | None = None,
    xlsx_path: Path | str | None = None,
) -> dict[str, Any]:
    """Dry-run the Excel pyramid. Session IDs are attached when a client is given."""
    spec = load_pyramid_spec(xlsx_path)
    summary = summarize_pyramid(spec)
    if client is not None:
        summary.update(session_pyramid_target(client))
    return summary


def apply_pyramid(
    client: IasoClient,
    xlsx_path: Path | str | None = None,
) -> dict[str, Any]:
    """Create missing types/org units from the Excel pyramid."""
    return run_import(client, dry_run=False, xlsx_path=xlsx_path)
