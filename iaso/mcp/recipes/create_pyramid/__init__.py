from __future__ import annotations

import json
import logging
import os
import sys
import xml.etree.ElementTree as ET
import zipfile

from pathlib import Path
from typing import Any

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.session import build_client


logger = logging.getLogger(__name__)

_RESET = "\033[0m"
_BOLD = "\033[1m"
_DIM = "\033[2m"
_RED = "\033[31m"
_GREEN = "\033[32m"
_YELLOW = "\033[33m"
_CYAN = "\033[36m"
_MAGENTA = "\033[35m"


def _use_color() -> bool:
    if os.getenv("NO_COLOR"):
        return False
    if os.getenv("FORCE_COLOR"):
        return True
    return sys.stdout.isatty()


def _paint(text: str, *codes: str) -> str:
    if not _use_color() or not codes:
        return text
    return f"{''.join(codes)}{text}{_RESET}"


def _tag(op: str) -> str:
    labels = {
        "create": (_GREEN, "CREATE"),
        "reuse": (_DIM, "REUSE "),
        "link": (_CYAN, "LINK  "),
        "skip": (_DIM, "SKIP  "),
        "validate": (_MAGENTA, "VALID "),
        "fail": (_RED, "FAIL  "),
    }
    color, label = labels.get(op, (_RESET, op.upper().ljust(6)))
    return _paint(label, color)


DRY_RUN = True

# Target source/project/version come from the bound session (profiles/me/).
# GEO_LEVELS / LEAF_TYPES are inferred from the workbook (not hardcoded).

_PACKAGE_DIR = Path(__file__).resolve().parent
XLSX_PATH = _PACKAGE_DIR / "Org_Units.xlsx"
_PREVIEW_SAMPLE = 25
_META_SHEETS = frozenset({"readme", "org_unit_types", "types"})

_NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
_REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


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


def _col_row(cell_ref: str) -> tuple[int, int]:
    col = "".join(char for char in cell_ref if char.isalpha())
    row = int("".join(char for char in cell_ref if char.isdigit()))
    number = 0
    for char in col:
        number = number * 26 + (ord(char.upper()) - 64)
    return number, row


def _shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in root.findall("m:si", _NS):
        texts = [node.text or "" for node in si.findall(".//m:t", _NS)]
        strings.append("".join(texts))
    return strings


def _cell_value(cell: ET.Element, strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    value = cell.find("m:v", _NS)
    if value is None or value.text is None:
        inline = cell.find("m:is", _NS)
        if inline is not None:
            return "".join(node.text or "" for node in inline.findall(".//m:t", _NS))
        return None
    if cell_type == "s":
        return strings[int(value.text)]
    return value.text


def _text(raw: object | None) -> str:
    if raw is None:
        return ""
    return " ".join(str(raw).replace("\xa0", " ").split())


def _short_name(name: str) -> str:
    cleaned = _text(name)
    initials = "".join(part[0] for part in cleaned.replace("-", " ").split() if part)
    if len(initials) >= 2:
        return initials.upper()[:6]
    compact = "".join(char for char in cleaned if char.isalnum())
    return (compact[:4] or "TYPE").upper()


def list_sheet_names(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        return [sheet.attrib.get("name") or "" for sheet in workbook.findall("m:sheets/m:sheet", _NS)]


def read_sheet(path: Path, sheet_name: str) -> tuple[list[str], list[dict[str, str]]]:
    with zipfile.ZipFile(path) as archive:
        strings = _shared_strings(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets = [
            (
                sheet.attrib.get("name"),
                sheet.attrib.get(f"{_REL_NS}id"),
            )
            for sheet in workbook.findall("m:sheets/m:sheet", _NS)
        ]
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        match = next((item for item in sheets if item[0] == sheet_name), None)
        if match is None:
            known = ", ".join(name for name, _rid in sheets if name)
            msg = f"Sheet '{sheet_name}' not found. Known: {known}."
            raise ValueError(msg)

        _name, rid = match
        if not rid:
            msg = f"Sheet '{sheet_name}' has no relationship id."
            raise ValueError(msg)
        target = rid_to_target[rid]
        xml_path = target.lstrip("/")
        if not xml_path.startswith("xl/"):
            xml_path = "xl/" + xml_path
        root = ET.fromstring(archive.read(xml_path))
        rows: dict[int, dict[int, str | None]] = {}
        for cell in root.findall(".//m:c", _NS):
            ref = cell.attrib.get("r")
            if not ref:
                continue
            col, row = _col_row(ref)
            rows.setdefault(row, {})[col] = _cell_value(cell, strings)

    if 1 not in rows:
        msg = f"Sheet '{sheet_name}' has no header row."
        raise ValueError(msg)
    header_row = rows[1]
    headers = {col: str(header_row[col]).replace("\xa0", " ").strip() for col in sorted(header_row) if header_row[col]}
    header_names = [headers[col] for col in sorted(headers)]
    col_by_name = {name: col for col, name in headers.items()}

    records: list[dict[str, str]] = []
    for row_number in sorted(rows)[1:]:
        record: dict[str, str] = {}
        empty = True
        for name, col in col_by_name.items():
            value = _text(rows[row_number].get(col))
            record[name] = value
            if value:
                empty = False
        if not empty:
            records.append(record)
    return header_names, records


def load_sheet_records(path: Path, sheet_name: str) -> list[dict[str, str]]:
    _headers, records = read_sheet(path, sheet_name)
    return records


class PyramidSpec:
    """Hierarchy inferred from an org-unit list workbook."""

    def __init__(
        self,
        path: Path,
        geo_levels: list[dict[str, Any]],
        leaf_types: list[dict[str, Any]],
        records_by_sheet: dict[str, list[dict[str, str]]],
    ):
        self.path = path
        self.geo_levels = geo_levels
        self.leaf_types = leaf_types
        self.records_by_sheet = records_by_sheet

    @property
    def report_levels(self) -> list[dict[str, Any]]:
        return [*self.geo_levels, *self.leaf_types]


def _type_meta_by_name(path: Path, sheet_names: list[str]) -> dict[str, dict[str, Any]]:
    types_sheet = next((name for name in sheet_names if name.lower() == "org_unit_types"), None)
    if types_sheet is None:
        types_sheet = next((name for name in sheet_names if name.lower() == "types"), None)
    if types_sheet is None:
        return {}
    _headers, rows = read_sheet(path, types_sheet)
    meta: dict[str, dict[str, Any]] = {}
    for row in rows:
        by_key = {_text(key).lower().replace(" ", "_"): _text(value) for key, value in row.items()}
        name = by_key.get("name")
        if not name:
            continue
        depth_raw = by_key.get("depth") or ""
        meta[name] = {
            "name": name,
            "short_name": by_key.get("short_name") or _short_name(name),
            "depth": int(depth_raw) if depth_raw.isdigit() else None,
            "parent_type": by_key.get("parent_type") or "",
        }
    return meta


def _common_prefix_len(header_lists: list[list[str]]) -> int:
    if not header_lists:
        raise ValueError("Workbook has no data sheets of org units.")
    max_geo = min(len(headers) for headers in header_lists) - 1
    if max_geo < 1:
        raise ValueError("Each data sheet needs parent columns plus a last column for the leaf type.")
    length = 0
    while length < max_geo:
        names = {headers[length] for headers in header_lists}
        if len(names) != 1:
            break
        length += 1
    if length < 1:
        raise ValueError("Data sheets must share the same parent columns from the left.")
    return length


def load_pyramid_spec(path: Path | None = None) -> PyramidSpec:
    """Infer GEO_LEVELS and LEAF_TYPES from an org-unit list workbook."""
    workbook_path = Path(path) if path is not None else XLSX_PATH
    if not workbook_path.is_file():
        raise ValueError(f"Workbook not found: {workbook_path}")
    sheet_names = [name for name in list_sheet_names(workbook_path) if name]
    data_names = [name for name in sheet_names if name.lower() not in _META_SHEETS]
    if not data_names:
        raise ValueError(
            "Workbook needs at least one data sheet (a list of org units). "
            "Sheets named readme / org_unit_types / types are ignored."
        )
    header_lists: list[list[str]] = []
    records_by_sheet: dict[str, list[dict[str, str]]] = {}
    for sheet_name in data_names:
        headers, records = read_sheet(workbook_path, sheet_name)
        if len(headers) < 2:
            raise ValueError(f"Sheet '{sheet_name}' needs parent columns plus a leaf column.")
        header_lists.append(headers)
        records_by_sheet[sheet_name] = records
    prefix_len = _common_prefix_len(header_lists)
    type_meta = _type_meta_by_name(workbook_path, sheet_names)
    geo_headers = header_lists[0][:prefix_len]
    geo_levels: list[dict[str, Any]] = []
    for index, column in enumerate(geo_headers, start=1):
        meta = type_meta.get(column) or {}
        geo_levels.append(
            {
                "column": column,
                "name": column,
                "short_name": meta.get("short_name") or _short_name(column),
                "depth": int(meta["depth"]) if meta.get("depth") else index,
            }
        )
    leaf_depth = (geo_levels[-1]["depth"] + 1) if geo_levels else 1
    leaf_types: list[dict[str, Any]] = []
    for sheet_name, headers in zip(data_names, header_lists):
        column = headers[-1]
        meta = type_meta.get(column) or {}
        leaf_types.append(
            {
                "sheet": sheet_name,
                "column": column,
                "name": column,
                "short_name": meta.get("short_name") or _short_name(column),
                "depth": int(meta["depth"]) if meta.get("depth") else leaf_depth,
            }
        )
    return PyramidSpec(workbook_path, geo_levels, leaf_types, records_by_sheet)


def collect_nodes(
    spec: PyramidSpec | None = None,
) -> list[tuple[tuple[str, ...], str, dict[str, Any]]]:
    """Return (path, name, type_spec) in parent-before-child order. Dedupes by path+type."""
    pyramid = spec or load_pyramid_spec()
    seen: set[tuple[tuple[str, ...], str]] = set()
    nodes: list[tuple[tuple[str, ...], str, dict[str, Any]]] = []
    for leaf in pyramid.leaf_types:
        for row in pyramid.records_by_sheet.get(leaf["sheet"], []):
            path: list[str] = []
            for geo in pyramid.geo_levels:
                name = _text(row.get(geo["column"]))
                if not name:
                    raise ValueError(f"Empty '{geo['column']}' in sheet '{leaf['sheet']}'.")
                path.append(name)
                key = (tuple(path), geo["name"])
                if key not in seen:
                    seen.add(key)
                    nodes.append((tuple(path), name, geo))
            leaf_name = _text(row.get(leaf["column"]))
            if not leaf_name:
                continue
            leaf_path = (*path, leaf_name)
            key = (leaf_path, leaf["name"])
            if key not in seen:
                seen.add(key)
                nodes.append((leaf_path, leaf_name, leaf))
    return nodes


def summarize_pyramid(spec: PyramidSpec | None = None) -> dict[str, Any]:
    """Local dry-run of the workbook. Does not call IASO."""
    pyramid = spec or load_pyramid_spec()
    nodes = collect_nodes(pyramid)
    counts_by_level = []
    for level in pyramid.report_levels:
        counts_by_level.append(
            {
                "depth": level["depth"],
                "name": level["name"],
                "short_name": level["short_name"],
                "sheet": level.get("sheet"),
                "count": sum(1 for _path, _name, item in nodes if item["name"] == level["name"]),
            }
        )
    sample = [
        {
            "path": " / ".join(path),
            "name": name,
            "type": item["name"],
            "depth": item["depth"],
        }
        for path, name, item in nodes[:_PREVIEW_SAMPLE]
    ]
    return {
        "xlsx": pyramid.path.name,
        "sheets": [leaf["sheet"] for leaf in pyramid.leaf_types],
        "geo_levels": [
            {"name": level["name"], "short_name": level["short_name"], "depth": level["depth"]}
            for level in pyramid.geo_levels
        ],
        "leaf_types": [
            {
                "name": leaf["name"],
                "short_name": leaf["short_name"],
                "depth": leaf["depth"],
                "sheet": leaf["sheet"],
            }
            for leaf in pyramid.leaf_types
        ],
        "rows": sum(len(rows) for rows in pyramid.records_by_sheet.values()),
        "org_units": len(nodes),
        "types": [
            {
                "name": level["name"],
                "short_name": level["short_name"],
                "depth": level["depth"],
                "sheet": level.get("sheet"),
            }
            for level in pyramid.report_levels
        ],
        "counts_by_level": counts_by_level,
        "sample_org_units": sample,
    }


def session_pyramid_target(client: IasoClient) -> dict[str, Any]:
    """Resolve source, version, and project from the logged-in IASO account."""
    from iaso.mcp.recipes.fill_account.apply import current_account

    live = current_account(client)
    source_id = live.get("data_source_id")
    version_id = live.get("default_version_id")
    projects = live.get("projects") or []
    project_id = None
    if projects and isinstance(projects[0], dict):
        project_id = projects[0].get("id")
    missing = []
    if source_id is None:
        missing.append("data source")
    if version_id is None:
        missing.append("default version")
    if project_id is None:
        missing.append("project")
    if missing:
        raise ValueError(
            "Session account is missing "
            + ", ".join(missing)
            + ". Set a default data source version and at least one project "
            "before creating a pyramid."
        )
    return {
        "data_source_id": int(source_id),
        "source_version_id": int(version_id),
        "project_id": int(project_id),
        "account_id": live.get("account_id"),
        "account_name": live.get("account_name"),
        "data_source_name": live.get("data_source_name"),
    }


def _get(client: IasoClient, path: str, params: dict[str, Any] | None = None) -> Any:
    return client.transport.request("GET", path, params=params)


def _write(
    client: IasoClient,
    method: str,
    path: str,
    json_body: dict[str, Any] | None,
    *,
    dry_run: bool,
) -> Any:
    logger.debug(
        "%s %s /api/%s %s",
        "[DRY-RUN]" if dry_run else "[WRITE]",
        method,
        path.lstrip("/"),
        json.dumps(json_body, default=str),
    )
    if dry_run:
        return None
    return client.transport.request(method, path, json=json_body)


def list_existing_org_unit_types(client: IasoClient) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    page = 1
    while True:
        response = _get(
            client,
            "v2/orgunittypes/",
            params={"page": page, "limit": 50},
        )
        chunk = response.get("orgUnitTypes") or response.get("results") or []
        items.extend(chunk)
        pages = int(response.get("pages") or 1)
        if page >= pages:
            break
        page += 1
    return items


def list_org_units_for_source(client: IasoClient, source_id: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    page = 1
    while True:
        response = _get(
            client,
            "orgunits/",
            params={
                "page": page,
                "limit": 50,
                "source": source_id,
                "validation_status": "all",
            },
        )
        chunk = response.get("orgunits") or response.get("orgUnits") or []
        items.extend(chunk)
        pages = int(response.get("pages") or 1)
        if page >= pages or not chunk:
            break
        page += 1
    return items


def reuse_source_version(
    client: IasoClient,
    *,
    data_source_id: int,
    source_version_id: int,
) -> tuple[int, list[dict[str, Any]]]:
    """Use the existing default source version. Do not create versions or call accounts/."""
    source = _get(client, f"datasources/{data_source_id}/")
    name = source.get("name") or f"source {data_source_id}"
    default = source.get("default_version") or {}
    default_id = default.get("id")
    note = f"data source {data_source_id} ({name}) version {source_version_id}"
    if default_id is not None and int(default_id) != source_version_id:
        note = f"{note}; GET default_version is {default_id}, using session default version anyway"
    return source_version_id, [{"op": "reuse", "label": note}]


def _type_sub_ids(item: dict[str, Any]) -> list[int]:
    ids: list[int] = []
    for sub in item.get("sub_unit_types") or []:
        sub_id = sub.get("id") if isinstance(sub, dict) else None
        if sub_id is not None:
            ids.append(int(sub_id))
    return ids


def _merge_ids(*groups: list[int | None]) -> list[int]:
    merged: list[int] = []
    for group in groups:
        for item in group:
            if isinstance(item, int) and item > 0 and item not in merged:
                merged.append(item)
    return merged


def _upsert_org_unit_type(
    client: IasoClient,
    existing: dict[tuple[str, Any], dict[str, Any]],
    spec: dict[str, Any],
    child_ids: list[int],
    child_names: list[str],
    child_label: str | None,
    *,
    project_id: int,
    dry_run: bool,
) -> tuple[int, dict[str, Any]]:
    found = existing.get((spec["name"], spec["depth"]))
    real_child_ids = [item for item in child_ids if item > 0]
    body = {
        "name": spec["name"],
        "short_name": spec["short_name"],
        "depth": spec["depth"],
        "project_ids": [project_id],
        "sub_unit_type_ids": real_child_ids,
        "allow_creating_sub_unit_type_ids": real_child_ids,
        "reference_forms_ids": [],
    }
    if found:
        type_id = int(found["id"])
        current = _type_sub_ids(found)
        current_names = {sub.get("name") for sub in (found.get("sub_unit_types") or []) if isinstance(sub, dict)}
        missing_ids = [item for item in real_child_ids if item not in current]
        missing_names = [name for name in child_names if name not in current_names]
        if missing_ids or missing_names:
            merged = _merge_ids(current, real_child_ids)
            body["sub_unit_type_ids"] = merged
            body["allow_creating_sub_unit_type_ids"] = merged
            _write(
                client,
                "PATCH",
                f"v2/orgunittypes/{type_id}/",
                body,
                dry_run=dry_run,
            )
            op = "link"
        else:
            op = "reuse"
    else:
        created = _write(client, "POST", "v2/orgunittypes/", body, dry_run=dry_run)
        if dry_run:
            type_id = -(abs(hash(spec["name"])) % 10_000) - 1
        else:
            type_id = int(created["id"])
        op = "create"
        existing[(spec["name"], spec["depth"])] = {
            "id": type_id,
            "name": spec["name"],
            "sub_unit_types": [{"id": item, "name": name} for item, name in zip(child_ids, child_names)],
        }
    return type_id, {
        "op": op,
        "name": spec["name"],
        "short_name": spec["short_name"],
        "depth": spec["depth"],
        "child_name": child_label,
        "id": type_id if type_id > 0 else None,
    }


def ensure_org_unit_types(
    client: IasoClient,
    spec: PyramidSpec,
    *,
    project_id: int,
    dry_run: bool,
) -> tuple[dict[str, int], list[dict[str, Any]]]:
    """Reuse existing types. Add leaf siblings under the last geo level."""
    existing = {(item["name"], item.get("depth")): item for item in list_existing_org_unit_types(client)}
    ids: dict[str, int] = {}
    actions: list[dict[str, Any]] = []

    for leaf in spec.leaf_types:
        type_id, action = _upsert_org_unit_type(
            client, existing, leaf, [], [], None, project_id=project_id, dry_run=dry_run
        )
        ids[leaf["name"]] = type_id
        actions.append(action)

    leaf_ids = [ids[leaf["name"]] for leaf in spec.leaf_types]
    leaf_names = [leaf["name"] for leaf in spec.leaf_types]
    child_ids = leaf_ids
    child_names = leaf_names
    child_label = ", ".join(leaf["short_name"] for leaf in spec.leaf_types)
    for level in reversed(spec.geo_levels):
        type_id, action = _upsert_org_unit_type(
            client,
            existing,
            level,
            child_ids,
            child_names,
            child_label,
            project_id=project_id,
            dry_run=dry_run,
        )
        ids[level["name"]] = type_id
        actions.append(action)
        child_ids = [type_id]
        child_names = [level["name"]]
        child_label = level["name"]

    order = {level["name"]: index for index, level in enumerate(spec.report_levels)}
    actions.sort(key=lambda item: order.get(item["name"], 99))
    return ids, actions


def _ou_parent_id(item: dict[str, Any]) -> int | None:
    parent = item.get("parent")
    if isinstance(parent, dict):
        parent_id = parent.get("id")
        return int(parent_id) if parent_id is not None else None
    parent_id = item.get("parent_id")
    return int(parent_id) if parent_id is not None else None


def _ou_type_id(item: dict[str, Any]) -> int | None:
    org_unit_type = item.get("org_unit_type") or {}
    type_id = item.get("org_unit_type_id") or org_unit_type.get("id")
    return int(type_id) if type_id is not None else None


def ensure_org_units(
    client: IasoClient,
    spec: PyramidSpec,
    type_ids: dict[str, int],
    version_id: int | None,
    *,
    data_source_id: int,
    dry_run: bool,
) -> dict[str, Any]:
    existing_by_key: dict[tuple[int | None, str, int | None], dict[str, Any]] = {}
    for item in list_org_units_for_source(client, data_source_id):
        key = (_ou_parent_id(item), item["name"], _ou_type_id(item))
        existing_by_key[key] = item

    created_ids: dict[tuple[tuple[str, ...], str], int] = {}
    created = 0
    skipped = 0
    validated = 0
    failed: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []

    for path, name, item in collect_nodes(spec):
        parent_path = path[:-1]
        parent_spec_name = spec.geo_levels[len(parent_path) - 1]["name"] if parent_path else None
        parent_id = created_ids.get((parent_path, parent_spec_name)) if parent_path else None
        type_id = type_ids[item["name"]]
        lookup_type_id = type_id if type_id > 0 else None
        existing = existing_by_key.get((parent_id, name, lookup_type_id))
        label = " / ".join(path)
        parent_name = parent_path[-1] if parent_path else None
        if existing:
            org_unit_id = int(existing["id"])
            created_ids[(path, item["name"])] = org_unit_id
            status = existing.get("validation_status")
            if status != "VALID":
                try:
                    _write(
                        client,
                        "PATCH",
                        f"orgunits/{org_unit_id}/",
                        {"validation_status": "VALID"},
                        dry_run=dry_run,
                    )
                    validated += 1
                    actions.append(
                        {
                            "op": "validate",
                            "name": name,
                            "path": label,
                            "type": item["name"],
                            "depth": item["depth"],
                            "parent": parent_name,
                            "id": org_unit_id,
                        }
                    )
                except IasoHTTPError as exc:
                    failed.append(
                        {
                            "path": label,
                            "error": _error_message(exc),
                            "status_code": exc.status_code,
                        }
                    )
                    actions.append(
                        {
                            "op": "fail",
                            "name": name,
                            "path": label,
                            "type": item["name"],
                            "depth": item["depth"],
                            "parent": parent_name,
                            "error": _error_message(exc),
                        }
                    )
            else:
                skipped += 1
                actions.append(
                    {
                        "op": "skip",
                        "name": name,
                        "path": label,
                        "type": item["name"],
                        "depth": item["depth"],
                        "parent": parent_name,
                        "id": org_unit_id,
                    }
                )
            continue

        body: dict[str, Any] = {
            "name": name,
            "org_unit_type_id": lookup_type_id,
            "parent_id": parent_id,
            "groups": [],
            "aliases": [],
            "validation_status": "VALID",
        }
        if version_id is not None:
            body["version_id"] = version_id

        try:
            created_ou = _write(
                client,
                "POST",
                "orgunits/create_org_unit/",
                body,
                dry_run=dry_run,
            )
        except IasoHTTPError as exc:
            failed.append(
                {
                    "path": label,
                    "error": _error_message(exc),
                    "status_code": exc.status_code,
                }
            )
            actions.append(
                {
                    "op": "fail",
                    "name": name,
                    "path": label,
                    "type": item["name"],
                    "depth": item["depth"],
                    "parent": parent_name,
                    "error": _error_message(exc),
                }
            )
            continue

        if dry_run:
            org_unit_id = -(created + 1)
        else:
            org_unit_id = int(created_ou["id"])
        created_ids[(path, item["name"])] = org_unit_id
        created += 1
        actions.append(
            {
                "op": "create",
                "name": name,
                "path": label,
                "type": item["name"],
                "depth": item["depth"],
                "parent": parent_name,
                "id": org_unit_id if org_unit_id > 0 else None,
            }
        )

    return {
        "created": created,
        "skipped": skipped,
        "validated": validated,
        "failed": failed,
        "actions": actions,
    }


def run_import(
    client: IasoClient,
    *,
    dry_run: bool,
    xlsx_path: Path | None = None,
) -> dict[str, Any]:
    spec = load_pyramid_spec(xlsx_path)
    target = session_pyramid_target(client)
    summary = {**summarize_pyramid(spec), **target}
    version_id, source_actions = reuse_source_version(
        client,
        data_source_id=target["data_source_id"],
        source_version_id=target["source_version_id"],
    )
    type_ids, type_actions = ensure_org_unit_types(client, spec, project_id=target["project_id"], dry_run=dry_run)
    org_units = ensure_org_units(
        client,
        spec,
        type_ids,
        version_id,
        data_source_id=target["data_source_id"],
        dry_run=dry_run,
    )
    return {
        **summary,
        "version_id": version_id,
        "source_actions": source_actions,
        "type_actions": type_actions,
        "org_unit_results": org_units,
        "dry_run": dry_run,
    }


def _section(title: str, *, dry_run: bool) -> None:
    suffix = f"  {_paint('dry-run', _YELLOW)}" if dry_run else ""
    print()
    print(_paint(f"── {title}", _BOLD, _CYAN) + suffix)
    print()


def print_report(result: dict[str, Any], *, base_url: str) -> None:
    dry_run = bool(result["dry_run"])
    print()
    print(_paint("Pyramid import", _BOLD))
    print(f"  {_paint(base_url, _DIM)}  account {result['account_name']} ({result['account_id']})")
    print(
        f"  source {result['data_source_id']}  "
        f"version {result.get('version_id') or result.get('source_version_id')}  "
        f"project {result['project_id']}  "
        f"{result['xlsx']} / {', '.join(result.get('sheets') or [result.get('sheet') or ''])}"
    )
    print(f"  {result['rows']} rows → {result['org_units']} unique org units")

    _section("Data source version", dry_run=dry_run)
    for action in result["source_actions"]:
        print(f"  {_tag(action['op'])}  {action['label']}")

    _section("Org unit types", dry_run=dry_run)
    for action in result["type_actions"]:
        child = f"  → {action['child_name']}" if action.get("child_name") else ""
        type_id = action.get("id")
        id_bit = f"  id={type_id}" if type_id else ""
        print(f"  {_tag(action['op'])}  {action['depth']}. {action['name']} ({action['short_name']}){child}{id_bit}")

    _section("Org units", dry_run=dry_run)
    actions = result["org_unit_results"]["actions"]
    for level in result.get("types") or []:
        level_actions = [a for a in actions if a["type"] == level["name"]]
        if not level_actions:
            continue
        print(
            _paint(
                f"  {level['name']} ({len(level_actions)})",
                _BOLD,
            )
        )
        for action in level_actions:
            parent_name = action.get("parent")
            parent = f"  {_paint('← ' + str(parent_name), _DIM)}" if parent_name else ""
            extra = ""
            if action.get("id") and action["id"] > 0:
                extra = _paint(f"  id={action['id']}", _DIM)
            elif action.get("error"):
                extra = _paint(f"  {action['error']}", _RED)
            print(f"    {_tag(action['op'])}  {action['name']}{parent}{extra}")
        print()

    stats = result["org_unit_results"]
    type_ops = result["type_actions"]
    print()
    print(_paint("── Summary", _BOLD, _CYAN))
    print(
        f"  types     "
        f"create={sum(1 for a in type_ops if a['op'] == 'create')}  "
        f"reuse={sum(1 for a in type_ops if a['op'] == 'reuse')}  "
        f"link={sum(1 for a in type_ops if a['op'] == 'link')}"
    )
    print(
        f"  org units "
        f"create={stats['created']}  skip={stats['skipped']}  "
        f"validate={stats['validated']}  fail={len(stats['failed'])}"
    )
    print(f"  dry_run   {dry_run}")
    print()


def main() -> None:
    logging.basicConfig(level=logging.WARNING)
    client = build_client(enable_logging=False)
    result = run_import(client, dry_run=DRY_RUN)
    print_report(result, base_url=client.transport.base_url.rstrip("/"))
