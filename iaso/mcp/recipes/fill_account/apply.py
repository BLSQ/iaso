from __future__ import annotations

import json
import logging

from typing import Any

from iaso.mcp.client import IasoClient, IasoHTTPError
from iaso.mcp.recipes.fill_account.workbook import unique_nodes


logger = logging.getLogger(__name__)


def _error_message(exc: IasoHTTPError) -> str:
    payload = exc.payload
    if isinstance(payload, dict):
        message = payload.get("error") or payload.get("detail")
        if message:
            return str(message)
        return json.dumps(payload, default=str)
    if payload:
        return str(payload)
    return str(exc)


def _get(client: IasoClient, path: str, params: dict[str, Any] | None = None) -> Any:
    return client.transport.request("GET", path, params=params)


def _write(
    client: IasoClient,
    method: str,
    path: str,
    json_body: dict[str, Any] | list[Any] | None,
    *,
    dry_run: bool,
    params: dict[str, Any] | None = None,
) -> Any:
    logger.debug(
        "%s %s /api/%s %s %s",
        "[DRY-RUN]" if dry_run else "[WRITE]",
        method,
        path.lstrip("/"),
        json.dumps(params, default=str) if params else "",
        json.dumps(json_body, default=str),
    )
    if dry_run:
        return None
    return client.transport.request(method, path, params=params, json=json_body)


def _paginate(
    client: IasoClient,
    path: str,
    results_key: str,
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    page = 1
    query = dict(params or {})
    while True:
        query["page"] = page
        query["limit"] = 50
        response = _get(client, path, params=query)
        chunk = response.get(results_key) or response.get("results") or []
        items.extend(chunk)
        pages = int(response.get("pages") or 1)
        if page >= pages or not chunk:
            break
        page += 1
    return items


def _slim_projects(raw: Any) -> list[dict[str, Any]]:
    items = raw if isinstance(raw, list) else []
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        out.append(
            {
                "id": item.get("id"),
                "name": item.get("name"),
                "app_id": item.get("app_id") or item.get("appId"),
            }
        )
    return out


def _account_projects(client: IasoClient, me: dict[str, Any]) -> list[dict[str, Any]]:
    projects = _slim_projects(me.get("projects"))
    if projects:
        return projects
    try:
        page = _get(client, "projects/", params={"limit": 20, "page": 1})
    except IasoHTTPError:
        return []
    return _slim_projects(page.get("projects") or page.get("results") or [])


def current_account(client: IasoClient) -> dict[str, Any]:
    me = _get(client, "profiles/me/")
    account = me.get("account") or {}
    default = account.get("default_version") or {}
    source = default.get("data_source") or {}
    first = (me.get("first_name") or "").strip()
    last = (me.get("last_name") or "").strip()
    full_name = " ".join(part for part in (first, last) if part)
    return {
        "account_id": account.get("id"),
        "account_name": account.get("name"),
        "default_version_id": default.get("id"),
        "data_source_id": source.get("id"),
        "data_source_name": source.get("name"),
        "projects": _account_projects(client, me),
        "user_name": me.get("user_name"),
        "user_id": me.get("user_id"),
        "user_full_name": full_name or None,
        "is_superuser": bool(me.get("is_superuser")),
        "base_url": client.transport.base_url.rstrip("/"),
    }


def _project_line(info: dict[str, Any]) -> str:
    projects = info.get("projects")
    if isinstance(projects, list) and projects:
        bits: list[str] = []
        for item in projects[:8]:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or "?"
            pid = item.get("id")
            bits.append(f"{name} ({pid})" if pid is not None else str(name))
        extra = len(projects) - len(bits)
        line = ", ".join(bits) if bits else "none"
        if extra > 0:
            line = f"{line} +{extra}"
        return f"project  {line}"
    name = info.get("project_name")
    pid = info.get("project_id")
    if name or pid is not None:
        if pid is not None:
            return f"project  {name or '?'} ({pid})"
        return f"project  {name}"
    return "project  none"


def _source_line(info: dict[str, Any]) -> str:
    name = info.get("data_source_name")
    sid = info.get("data_source_id")
    vid = info.get("default_version_id") or info.get("source_version_id")
    if name or sid is not None:
        label = f"{name or '?'} ({sid})" if sid is not None else str(name)
        if vid is not None:
            return f"source   {label}  version {vid}"
        return f"source   {label}"
    if vid is not None:
        return f"source   version {vid}"
    return "source   none"


def connection_lines(info: dict[str, Any]) -> list[str]:
    who = str(info.get("user_name") or "?")
    full = info.get("user_full_name")
    if full:
        who = f"{who} ({full})"
    if info.get("is_superuser"):
        who = f"{who}  superuser"
    return [
        f"url      {info.get('base_url')}",
        f"user     {who}",
        f"account  {info.get('account_name')} ({info.get('account_id')})",
        _project_line(info),
        _source_line(info),
    ]


def connection_prompt(info: dict[str, Any]) -> str:
    lines = connection_lines(info)
    return (
        "Before any IASO write, confirm this FastMCP session target "
        "(not .env, not an OpenHEXA connection):\n"
        + "\n".join(f"  {line}" for line in lines)
        + "\nDo you confirm to proceed?"
    )


def _feature_flag_payloads(client: IasoClient, codes: tuple[str, ...]) -> list[dict[str, Any]]:
    """ProjectSerializer requires id + name + code, not code alone."""
    flags = _paginate(client, "featureflags/", "featureflags")
    by_code = {item.get("code"): item for item in flags}
    missing = [code for code in codes if code not in by_code]
    if missing:
        msg = f"Unknown feature flag codes on this IASO: {', '.join(missing)}."
        raise ValueError(msg)
    payloads: list[dict[str, Any]] = []
    for code in codes:
        item = by_code[code]
        payloads.append(
            {
                "id": item["id"],
                "name": item["name"],
                "code": item["code"],
                "description": item.get("description") or "",
            }
        )
    return payloads


def ensure_project(
    client: IasoClient,
    settings: dict[str, str],
    *,
    dry_run: bool,
) -> tuple[int | None, dict[str, Any]]:
    name = settings["project_name"]
    app_id = settings["project_app_id"]
    existing = _paginate(client, "projects/", "projects")
    by_name = next((item for item in existing if item.get("name") == name), None)
    by_app = next((item for item in existing if item.get("app_id") == app_id), None)
    if by_name:
        return int(by_name["id"]), {
            "op": "reuse",
            "id": int(by_name["id"]),
            "name": name,
            "app_id": by_name.get("app_id"),
            "label": f"project {name} ({by_name['id']})",
        }
    if by_app:
        msg = (
            f"project_app_id '{app_id}' is already used by project "
            f"'{by_app.get('name')}' ({by_app.get('id')}). "
            "Change project_app_id in settings, or reuse that project by name."
        )
        raise ValueError(msg)
    body = {
        "name": name,
        "app_id": app_id,
        "description": settings.get("project_description") or "",
        "feature_flags": _feature_flag_payloads(client, ("REQUIRE_AUTHENTICATION", "ENTITY")),
        "color": settings.get("project_color") or "#1976D2",
    }
    created = _write(client, "POST", "projects/", body, dry_run=dry_run)
    project_id = None if dry_run else int(created["id"])
    return project_id, {
        "op": "create",
        "id": project_id,
        "name": name,
        "app_id": app_id,
        "label": f"project {name}",
    }


def _project_ids(source: dict[str, Any]) -> list[int]:
    ids: list[int] = []
    projects = source.get("projects") or []
    # API sometimes wraps the list in an extra list: [[ {id, name, ...} ]]
    if projects and isinstance(projects[0], list):
        projects = projects[0]
    for item in projects:
        if isinstance(item, dict) and item.get("id") is not None:
            ids.append(int(item["id"]))
        elif isinstance(item, int):
            ids.append(item)
    return ids


def ensure_data_source(
    client: IasoClient,
    settings: dict[str, str],
    project_id: int | None,
    *,
    dry_run: bool,
) -> tuple[dict[str, Any], dict[str, Any]]:
    name = settings["data_source_name"]
    existing = _paginate(client, "datasources/", "sources")
    found = next((item for item in existing if item.get("name") == name), None)
    description = settings.get("source_version_description") or ""
    if found:
        source_id = int(found["id"])
        linked = _project_ids(found)
        op = "reuse"
        if project_id is not None and project_id not in linked:
            linked = [*linked, project_id]
            _write(
                client,
                "PUT",
                f"datasources/{source_id}/",
                {
                    "name": name,
                    "description": found.get("description") or description,
                    "project_ids": linked,
                    "read_only": bool(found.get("read_only")),
                    "default_version_id": (found.get("default_version") or {}).get("id"),
                },
                dry_run=dry_run,
            )
            op = "link"
        return found, {
            "op": op,
            "id": source_id,
            "name": name,
            "label": f"data source {name} ({source_id})",
        }

    body: dict[str, Any] = {
        "name": name,
        "description": description,
        "read_only": False,
        "project_ids": [project_id] if project_id is not None else [],
    }
    created = _write(client, "POST", "datasources/", body, dry_run=dry_run)
    if dry_run:
        return {"id": None, "name": name, "versions": [], "default_version": None}, {
            "op": "create",
            "id": None,
            "name": name,
            "label": f"data source {name}",
        }
    source_id = int(created["id"])
    fetched = _get(client, f"datasources/{source_id}/")
    return fetched, {
        "op": "create",
        "id": source_id,
        "name": name,
        "label": f"data source {name} ({source_id})",
    }


def ensure_source_version(
    client: IasoClient,
    source: dict[str, Any],
    settings: dict[str, str],
    project_id: int | None,
    *,
    dry_run: bool,
    set_as_default: bool,
) -> tuple[int | None, list[dict[str, Any]]]:
    actions: list[dict[str, Any]] = []
    source_id = source.get("id")
    default = source.get("default_version") or {}
    versions = source.get("versions") or []
    description = settings.get("source_version_description") or ""

    version_id = default.get("id")
    version_number = default.get("number")
    if version_id is None and versions:
        latest = max(versions, key=lambda item: item.get("number") or 0)
        version_id = latest.get("id")
        version_number = latest.get("number")

    if version_id is not None:
        actions.append(
            {
                "op": "reuse",
                "id": int(version_id),
                "label": (f"source version {version_number} ({version_id})"),
            }
        )
    elif source_id is None and dry_run:
        actions.append(
            {
                "op": "create",
                "id": None,
                "label": "source version 1 (after data source is created)",
            }
        )
        return None, actions
    else:
        created = _write(
            client,
            "POST",
            "sourceversions/",
            {
                "data_source_id": source_id,
                "description": description,
            },
            dry_run=dry_run,
        )
        if dry_run:
            version_id = None
            version_number = 1
        else:
            version_id = int(created["id"])
            version_number = created.get("number")
        actions.append(
            {
                "op": "create",
                "id": version_id,
                "label": f"source version {version_number}",
            }
        )

    if set_as_default and source_id is not None and version_id is not None:
        current_default = (source.get("default_version") or {}).get("id")
        if current_default != version_id:
            project_ids = _project_ids(source)
            if project_id is not None and project_id not in project_ids:
                project_ids = [*project_ids, project_id]
            _write(
                client,
                "PUT",
                f"datasources/{source_id}/",
                {
                    "name": source.get("name") or settings["data_source_name"],
                    "description": source.get("description") or description,
                    "project_ids": project_ids,
                    "default_version_id": version_id,
                    "read_only": bool(source.get("read_only")),
                },
                dry_run=dry_run,
            )
            actions.append(
                {
                    "op": "link",
                    "id": version_id,
                    "label": f"data source default_version={version_id}",
                }
            )
        else:
            actions.append(
                {
                    "op": "reuse",
                    "id": version_id,
                    "label": f"already data source default ({version_id})",
                }
            )

    return int(version_id) if version_id is not None else None, actions


def set_account_default_version(
    client: IasoClient,
    account_id: int | None,
    version_id: int | None,
    current_default: int | None,
    *,
    dry_run: bool,
    set_as_default: bool,
) -> dict[str, Any]:
    if not set_as_default:
        return {"op": "skip", "label": "set_as_default=false"}
    if version_id is None:
        return {"op": "skip", "label": "no version id yet (dry-run of a new source)"}
    if current_default == version_id:
        live = current_account(client).get("default_version_id")
        if live != version_id:
            msg = f"Account {account_id} default_version is {live!r}, expected {version_id}."
            raise ValueError(msg)
        return {
            "op": "reuse",
            "id": version_id,
            "label": f"account already defaults to version {version_id}",
        }
    if dry_run:
        extra = ""
        if current_default is None:
            extra = " (account currently has none)"
        return {
            "op": "link",
            "id": version_id,
            "label": f"account default_version={version_id}{extra}",
        }
    if account_id is None:
        raise ValueError("Cannot set account default version: no account id.")
    try:
        _write(
            client,
            "PUT",
            f"accounts/{account_id}/set-default-version/",
            {"default_version": version_id},
            dry_run=False,
        )
    except IasoHTTPError as exc:
        raise ValueError(
            f"PUT accounts/{account_id}/set-default-version/ failed ({exc.status_code}: {_error_message(exc)})."
        ) from exc
    live = current_account(client).get("default_version_id")
    if live != version_id:
        raise ValueError(
            f"Account {account_id} default_version is still {live!r} "
            f"after PUT (expected {version_id}). "
            "IASO /api/groups/dropdown/?defaultVersion=true will 500 until this is set."
        )
    return {
        "op": "link",
        "id": version_id,
        "label": f"account default_version={version_id} (verified)",
    }


def ensure_org_unit_types(
    client: IasoClient,
    types: list[dict[str, Any]],
    project_id: int | None,
    *,
    dry_run: bool,
) -> tuple[dict[int, int], list[dict[str, Any]]]:
    existing_items = _paginate(client, "v2/orgunittypes/", "orgUnitTypes")
    existing = {(item["name"], item.get("depth")): item for item in existing_items}
    ids: dict[int, int] = {}
    actions_by_index: dict[int, dict[str, Any]] = {}
    child_id: int | None = None
    for index in range(len(types) - 1, -1, -1):
        level = types[index]
        child_name = types[index + 1]["name"] if index + 1 < len(types) else None
        found = existing.get((level["name"], level["depth"]))
        current_projects = []
        current_subs = []
        current_allow = []
        current_forms = []
        if found:
            current_projects = [
                int(pid)
                for pid in (
                    proj.get("id") if isinstance(proj, dict) else proj for proj in (found.get("projects") or [])
                )
                if pid is not None
            ]
            current_subs = [
                int(sub["id"])
                for sub in (found.get("sub_unit_types") or [])
                if isinstance(sub, dict) and sub.get("id") is not None
            ]
            current_allow = [
                int(sub["id"])
                for sub in (found.get("allow_creating_sub_unit_types") or [])
                if isinstance(sub, dict) and sub.get("id") is not None
            ]
            current_forms = [
                int(form["id"])
                for form in (found.get("reference_forms") or [])
                if isinstance(form, dict) and form.get("id") is not None
            ]
        project_ids = list(current_projects)
        if project_id is not None and project_id not in project_ids:
            project_ids.append(project_id)
        sub_ids = list(current_subs)
        if child_id is not None and child_id not in sub_ids:
            sub_ids.append(child_id)
        allow_ids = list(current_allow)
        if child_id is not None and child_id not in allow_ids:
            allow_ids.append(child_id)
        body = {
            "name": level["name"],
            "short_name": level["short_name"],
            "depth": level["depth"],
            "project_ids": project_ids,
            "sub_unit_type_ids": sub_ids,
            "allow_creating_sub_unit_type_ids": allow_ids,
            "reference_forms_ids": current_forms,
        }
        if found:
            type_id = int(found["id"])
            needs_link = bool(
                (child_id is not None and child_id not in current_subs)
                or (project_id is not None and project_id not in current_projects)
            )
            if needs_link:
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
            type_id = None if dry_run else int(created["id"])
            op = "create"
        ids[index] = type_id if type_id is not None else -index - 1
        actions_by_index[index] = {
            "op": op,
            "name": level["name"],
            "short_name": level["short_name"],
            "depth": level["depth"],
            "child_name": child_name,
            "id": type_id,
        }
        child_id = type_id if type_id is not None else ids[index]
    actions = [actions_by_index[index] for index in range(len(types))]
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


def _geo_kind(geo: dict[str, Any] | None) -> str:
    if not geo:
        return ""
    has_point = geo.get("latitude") is not None
    has_shape = bool(geo.get("shape"))
    if has_point and has_shape:
        return "point+shape"
    if has_point:
        return "point"
    if has_shape:
        return "shape"
    return ""


def _geo_create_body(geo: dict[str, Any] | None) -> dict[str, Any]:
    if not geo:
        return {}
    body: dict[str, Any] = {}
    if geo.get("latitude") is not None and geo.get("longitude") is not None:
        body["latitude"] = geo["latitude"]
        body["longitude"] = geo["longitude"]
        if geo.get("altitude") is not None:
            body["altitude"] = geo["altitude"]
        else:
            body["altitude"] = 0
    if geo.get("shape"):
        body["geom"] = geo["shape"]
    return body


def _existing_missing_geo(existing: dict[str, Any], geo: dict[str, Any] | None) -> dict[str, Any]:
    if not geo:
        return {}
    patch: dict[str, Any] = {}
    if geo.get("latitude") is not None and existing.get("latitude") is None:
        patch["latitude"] = geo["latitude"]
        patch["longitude"] = geo["longitude"]
        patch["altitude"] = geo.get("altitude") if geo.get("altitude") is not None else 0
    if geo.get("shape") and not existing.get("has_geo_json"):
        patch["geom"] = json.dumps(geo["shape"])
    return patch


def ensure_org_units(
    client: IasoClient,
    types: list[dict[str, Any]],
    rows: list[dict[str, str]],
    type_ids: dict[int, int],
    source_id: int | None,
    version_id: int | None,
    *,
    dry_run: bool,
    org_unit_geo: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    geo_by_name = {item["name"]: item for item in org_unit_geo or []}
    existing_by_key: dict[tuple[int | None, str, int | None], dict[str, Any]] = {}
    if source_id is not None:
        for item in _paginate(
            client,
            "orgunits/",
            "orgunits",
            params={"source": source_id, "validation_status": "all"},
        ):
            key = (_ou_parent_id(item), item["name"], _ou_type_id(item))
            existing_by_key[key] = item

    created_ids: dict[tuple[str, ...], int] = {}
    created = 0
    skipped = 0
    validated = 0
    geocoded = 0
    failed: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []

    for path, name, type_index in unique_nodes(types, rows):
        parent_path = path[:-1]
        parent_id = created_ids.get(parent_path) if parent_path else None
        type_id = type_ids[type_index]
        existing = existing_by_key.get((parent_id, name, type_id))
        label = " / ".join(path)
        level = types[type_index]
        parent_name = parent_path[-1] if parent_path else None
        geo = geo_by_name.get(name)
        if existing:
            org_unit_id = int(existing["id"])
            created_ids[path] = org_unit_id
            status = existing.get("validation_status")
            op = "skip"
            error = None
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
                    op = "validate"
                except IasoHTTPError as exc:
                    failed.append(
                        {
                            "path": label,
                            "error": _error_message(exc),
                            "status_code": exc.status_code,
                        }
                    )
                    op = "fail"
                    error = _error_message(exc)
            else:
                skipped += 1
            geo_patch = _existing_missing_geo(existing, geo) if op != "fail" else {}
            if geo_patch:
                try:
                    _write(
                        client,
                        "PATCH",
                        f"orgunits/{org_unit_id}/",
                        geo_patch,
                        dry_run=dry_run,
                    )
                    if op == "skip":
                        skipped -= 1
                    geocoded += 1
                    op = "link"
                except IasoHTTPError as exc:
                    failed.append(
                        {
                            "path": label,
                            "error": _error_message(exc),
                            "status_code": exc.status_code,
                        }
                    )
                    op = "fail"
                    error = _error_message(exc)
            actions.append(
                {
                    "op": op,
                    "name": name,
                    "path": label,
                    "type": level["name"],
                    "depth": level["depth"],
                    "parent": parent_name,
                    "id": org_unit_id,
                    "geo": _geo_kind(geo),
                    "error": error,
                }
            )
            continue

        body: dict[str, Any] = {
            "name": name,
            "org_unit_type_id": type_id,
            "parent_id": parent_id,
            "groups": [],
            "aliases": [],
            "validation_status": "VALID",
            **_geo_create_body(geo),
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
                    "type": level["name"],
                    "depth": level["depth"],
                    "parent": parent_name,
                    "error": _error_message(exc),
                }
            )
            continue

        org_unit_id = None if dry_run else int(created_ou["id"])
        if org_unit_id is not None:
            created_ids[path] = org_unit_id
        else:
            created_ids[path] = -(created + 1)
        created += 1
        if geo:
            geocoded += 1
        actions.append(
            {
                "op": "create",
                "name": name,
                "path": label,
                "type": level["name"],
                "depth": level["depth"],
                "parent": parent_name,
                "id": org_unit_id,
                "geo": _geo_kind(geo),
            }
        )

    return {
        "created": created,
        "skipped": skipped,
        "validated": validated,
        "geocoded": geocoded,
        "failed": failed,
        "actions": actions,
        "ids_by_name": {path[-1]: org_id for path, org_id in created_ids.items()},
        "ids_by_path": {" / ".join(path): org_id for path, org_id in created_ids.items()},
    }
