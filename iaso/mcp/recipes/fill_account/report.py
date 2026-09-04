from __future__ import annotations

import re

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from iaso.mcp.paths import mcp_media_root


_PACKAGE_DIR = Path(__file__).resolve().parent
REPORTS_DIR = _PACKAGE_DIR / "reports"


def default_report_path(result: dict[str, Any]) -> Path:
    account = (
        re.sub(
            r"[^a-z0-9]+",
            "-",
            str(result.get("account_name") or "account").lower(),
        ).strip("-")
        or "account"
    )
    mode = "dry-run" if result.get("dry_run") else "applied"
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest_dir = mcp_media_root() / "reports"
    dest_dir.mkdir(parents=True, exist_ok=True)
    return dest_dir / f"{stamp}_{account}_{mode}.md"


def _cell(value: object) -> str:
    text = "" if value is None else str(value)
    return text.replace("|", "\\|").replace("\n", " ")


def _op_counts(actions: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for action in actions:
        op = str(action.get("op") or "?")
        counts[op] = counts.get(op, 0) + 1
    return counts


def _counts_line(counts: dict[str, int]) -> str:
    if not counts:
        return "none"
    order = ("create", "reuse", "link", "skip", "validate", "fail")
    parts = [f"{key}={counts[key]}" for key in order if key in counts]
    extra = [f"{key}={value}" for key, value in sorted(counts.items()) if key not in order]
    return "  ".join(parts + extra)


def _action_table(actions: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    if not actions:
        return "_None._\n"
    header = "| " + " | ".join(label for _key, label in columns) + " |"
    sep = "| " + " | ".join("---" for _ in columns) + " |"
    rows = []
    for action in actions:
        cells = []
        for key, _label in columns:
            cells.append(_cell(action.get(key, "")))
        rows.append("| " + " | ".join(cells) + " |")
    return "\n".join([header, sep, *rows]) + "\n"


def render_fill_report(result: dict[str, Any]) -> str:
    dry_run = bool(result.get("dry_run"))
    mode = "dry-run (nothing written)" if dry_run else "applied"
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    stats = result.get("org_unit_results") or {}
    type_ops = result.get("type_actions") or []
    form_ops = result.get("form_actions") or []
    et_ops = result.get("entity_type_actions") or []
    wf_ops = result.get("workflow_actions") or []
    collection = result.get("collection_results") or {}
    collection_actions = collection.get("actions") or []
    failed = (
        list(stats.get("failed") or [])
        + list(collection.get("failed") or [])
        + [item for item in wf_ops if item.get("op") == "fail"]
    )
    default_id = result.get("default_version_id")

    lines = [
        f"# Fill account report — {mode}",
        "",
        f"Generated **{now}**.",
        "",
        "## Connection",
        "",
        "| | |",
        "| --- | --- |",
        f"| URL | {_cell(result.get('base_url'))} |",
        f"| User | {_cell(result.get('user_name'))} |",
        f"| Account | {_cell(result.get('account_name'))} ({_cell(result.get('account_id'))}) |",
        f"| Default version | {_cell(default_id if default_id else 'none')} |",
        f"| Workbook | {_cell(result.get('xlsx_path') or result.get('xlsx'))} |",
        f"| Project | {_cell(result.get('project_name'))} (`{_cell(result.get('project_app_id'))}`) |",
        f"| Data source | {_cell(result.get('data_source_name'))} |",
        f"| Dry-run | `{dry_run}` |",
        "",
        "## Summary",
        "",
        "| Area | Result |",
        "| --- | --- |",
        f"| Org unit types | {_counts_line(_op_counts(type_ops))} |",
        (
            f"| Org units | create={stats.get('created', 0)}  "
            f"skip={stats.get('skipped', 0)}  "
            f"validate={stats.get('validated', 0)}  "
            f"geo={stats.get('geocoded', 0)}  "
            f"fail={len(stats.get('failed') or [])} |"
        ),
        f"| Forms | {_counts_line(_op_counts(form_ops))} |",
        f"| Entity types | {_counts_line(_op_counts(et_ops))} |",
        f"| Workflows | {_counts_line(_op_counts(wf_ops))} |",
        (
            f"| Entities / submissions | planned={collection.get('planned') or 0}  "
            f"created={collection.get('created') or 0}  "
            f"fail={len(collection.get('failed') or [])} |"
        ),
        "",
    ]

    if failed:
        lines.extend(["## Failures", ""])
        for item in failed:
            lines.append(
                f"- **{_cell(item.get('step') or item.get('path') or item.get('name'))}**: {_cell(item.get('error'))}"
            )
        lines.append("")

    project_rows = [
        result.get("project_action") or {},
        result.get("source_action") or {},
        *(result.get("version_actions") or []),
        result.get("account_action") or {},
    ]
    lines.extend(
        [
            "## Project / data source",
            "",
            _action_table(project_rows, [("op", "Op"), ("label", "What")]),
            "## Org unit types",
            "",
            _action_table(
                type_ops,
                [
                    ("op", "Op"),
                    ("depth", "Depth"),
                    ("name", "Name"),
                    ("short_name", "Short"),
                    ("id", "Id"),
                    ("child_name", "Child"),
                ],
            ),
            "## Org units",
            "",
            _action_table(
                stats.get("actions") or [],
                [
                    ("op", "Op"),
                    ("depth", "Depth"),
                    ("type", "Type"),
                    ("name", "Name"),
                    ("parent", "Parent"),
                    ("geo", "Geo"),
                    ("id", "Id"),
                    ("error", "Error"),
                ],
            ),
            "## Forms",
            "",
            _action_table(
                form_ops,
                [
                    ("op", "Op"),
                    ("name", "Name"),
                    ("kind", "Kind"),
                    ("form_id", "ODK id"),
                    ("version_op", "XLSForm"),
                    ("id", "Id"),
                ],
            ),
            "## Entity types",
            "",
            _action_table(
                et_ops,
                [("op", "Op"), ("name", "Name"), ("id", "Id"), ("label", "What")],
            ),
            "## Workflows",
            "",
            _action_table(
                wf_ops,
                [
                    ("op", "Op"),
                    ("kind", "Kind"),
                    ("name", "Name"),
                    ("id", "Id"),
                    ("status", "Status"),
                    ("label", "What"),
                    ("error", "Error"),
                ],
            ),
            "## Entities / submissions",
            "",
            _action_table(
                collection_actions,
                [
                    ("op", "Op"),
                    ("kind", "Kind"),
                    ("name", "Name"),
                    ("org_unit", "Org unit"),
                    ("uuid", "Uuid"),
                    ("error", "Error"),
                ],
            ),
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def write_fill_report(result: dict[str, Any], path: Path | None = None) -> Path:
    target = path or default_report_path(result)
    target.parent.mkdir(parents=True, exist_ok=True)
    body = render_fill_report(result)
    target.write_text(body, encoding="utf-8")
    latest = target.parent / "last.md"
    latest.write_text(body, encoding="utf-8")
    return target
