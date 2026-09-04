from __future__ import annotations

import json

from typing import Any, Literal

from iaso.mcp.client import IasoClient, IasoError, IasoHTTPError


HttpMethod = Literal["GET", "POST", "PATCH", "PUT", "DELETE"]

WRITE_METHODS = frozenset({"POST", "PATCH", "PUT", "DELETE"})
ALLOWED_METHODS = frozenset({"GET", "POST", "PATCH", "PUT", "DELETE"})
_BLOCKED_PATHS = frozenset({"token", "token/"})
_RAW_MAX_CHARS = 20_000


def normalize_api_path(path: str) -> str:
    """Accept a path relative to /api/; reject URLs and the token endpoint."""
    cleaned = path.strip()
    if not cleaned:
        msg = "path is required (relative to /api/, e.g. instances/123/)."
        raise ValueError(msg)
    if "://" in cleaned or cleaned.startswith("//"):
        msg = "path must be relative to the IASO API, not a URL."
        raise ValueError(msg)
    cleaned = cleaned.lstrip("/")
    cleaned = cleaned.removeprefix("api/")
    keep_slash = cleaned.endswith("/")
    parts = [part for part in cleaned.split("/") if part not in ("", ".")]
    if ".." in parts:
        msg = "path must not contain '..'."
        raise ValueError(msg)
    cleaned = "/".join(parts)
    if keep_slash and cleaned:
        cleaned += "/"
    if cleaned.rstrip("/") in {"token"} or cleaned in _BLOCKED_PATHS:
        msg = "token endpoint is not allowed."
        raise ValueError(msg)
    return cleaned


def as_object(value: dict[str, Any] | str | None, *, label: str) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            msg = f"{label} is not valid JSON."
            raise ValueError(msg) from exc
        if not isinstance(parsed, dict):
            msg = f"{label} must be a JSON object."
            raise ValueError(msg)
        return parsed
    if not isinstance(value, dict):
        msg = f"{label} must be a JSON object."
        raise ValueError(msg)
    return value


def cap_payload(data: object) -> tuple[object, bool]:
    dumped = json.dumps(data, default=str)
    if len(dumped) <= _RAW_MAX_CHARS:
        return data, False
    return dumped[:_RAW_MAX_CHARS], True


def preview_raw(
    *,
    method: str,
    path: str,
    params: dict[str, Any] | None,
    json_body: dict[str, Any] | None,
) -> dict[str, Any]:
    return {
        "executed": False,
        "reason": ("confirm=false; nothing was written. Call again with confirm=true after reviewing this preview."),
        "method": method,
        "path": path,
        "params": params,
        "json": json_body,
    }


def execute_raw(
    client: IasoClient,
    *,
    method: str,
    path: str,
    params: dict[str, Any] | None,
    json_body: dict[str, Any] | None,
) -> dict[str, Any]:
    try:
        data = client.transport.request(
            method,
            path,
            params=params,
            json=json_body,
        )
    except IasoHTTPError as exc:
        return {
            "ok": False,
            "executed": True,
            "method": method,
            "path": path,
            "status_code": exc.status_code,
            "error": str(exc),
            "payload": exc.payload,
        }
    except IasoError as exc:
        return {
            "ok": False,
            "executed": True,
            "method": method,
            "path": path,
            "error": str(exc),
        }

    capped, truncated = cap_payload(data)
    return {
        "ok": True,
        "executed": True,
        "method": method,
        "path": path,
        "truncated": truncated,
        "data": capped,
    }
