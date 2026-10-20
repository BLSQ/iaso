"""MCP JSON-RPC 2.0 (OpenHEXA shape) — WSGI-safe, no FastMCP."""

from __future__ import annotations

import ast
import enum
import inspect
import json
import logging
import sys
import types
import typing

from typing import Any

from iaso.mcp.models import ToolCall
from iaso.mcp.session import set_current_user


logger = logging.getLogger(__name__)

MCP_SERVER_NAME = "IASO"
MCP_SERVER_VERSION = "0.1.0"
PROTOCOL_VERSION = "2025-03-26"

TYPE_MAP = {str: "string", int: "integer", float: "number", bool: "boolean"}

_TOOLS = {}

_REDACT_KEYS = frozenset(
    {
        "xlsx_base64",
        "password",
        "token",
        "secret",
        "authorization",
        "access_token",
        "refresh_token",
        "client_secret",
        "api_key",
        "json_body",
    }
)
_REDACT_FRAGMENTS = ("password", "token", "secret", "base64")
_MAX_STORED_STRING = 500
_MAX_STORED_LIST = 50
_MAX_STORED_JSON_CHARS = 8000


def _should_redact_key(key: str) -> bool:
    lower = key.lower()
    if lower in _REDACT_KEYS:
        return True
    return any(fragment in lower for fragment in _REDACT_FRAGMENTS)


def _redact_value(value: Any) -> str:
    if isinstance(value, str):
        return f"[redacted {len(value)} chars]"
    if isinstance(value, (bytes, bytearray)):
        return f"[redacted {len(value)} bytes]"
    if isinstance(value, (list, dict)):
        return "[redacted]"
    return "[redacted]"


def _sanitize_mapping(value: dict) -> dict[str, Any]:
    return {
        str(key): _redact_value(item) if _should_redact_key(str(key)) else _sanitize_value(item)
        for key, item in value.items()
    }


def _sanitize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return _sanitize_mapping(value)
    if isinstance(value, list):
        return [_sanitize_value(item) for item in value[:_MAX_STORED_LIST]]
    if isinstance(value, str) and len(value) > _MAX_STORED_STRING:
        return f"{value[:_MAX_STORED_STRING]}… [truncated {len(value)} chars]"
    if isinstance(value, (bytes, bytearray)):
        return f"[binary {len(value)} bytes]"
    return value


def sanitize_tool_arguments(arguments: Any) -> dict[str, Any]:
    """Drop secrets and oversized payloads before persisting a ToolCall row."""
    if not isinstance(arguments, dict):
        return {}
    sanitized = _sanitize_mapping(arguments)
    try:
        encoded = json.dumps(sanitized, default=str)
    except (TypeError, ValueError):
        return {"_error": "arguments could not be stored"}
    if len(encoded) <= _MAX_STORED_JSON_CHARS:
        return sanitized
    return {
        "_truncated": True,
        "preview": encoded[:_MAX_STORED_JSON_CHARS],
        "original_chars": len(encoded),
    }


def tool(func=None, *, description=None):
    def register(fn):
        fn._mcp_description = description if description is not None else (fn.__doc__ or "")
        _TOOLS[fn.__name__] = fn
        return fn

    if func is None:
        return register
    return register(func)


class _BitOrToUnion(ast.NodeTransformer):
    """Rewrite ``X | Y`` to ``Union[X, Y]`` so annotations eval on Python 3.9."""

    def visit_BinOp(self, node):
        self.generic_visit(node)
        if not isinstance(node.op, ast.BitOr):
            return node
        return ast.Subscript(
            value=ast.Name(id="Union", ctx=ast.Load()),
            slice=ast.Tuple(elts=[node.left, node.right], ctx=ast.Load()),
            ctx=ast.Load(),
        )


def _type_hints(func):
    if sys.version_info >= (3, 10):
        return typing.get_type_hints(func)
    module = sys.modules.get(func.__module__)
    globalns = dict(getattr(module, "__dict__", {}))
    globalns.setdefault("Union", typing.Union)
    hints = {}
    for name, value in func.__annotations__.items():
        if not isinstance(value, str):
            hints[name] = value
            continue
        tree = _BitOrToUnion().visit(ast.parse(value, mode="eval"))
        ast.fix_missing_locations(tree)
        hints[name] = eval(compile(tree, "<annotation>", "eval"), globalns)
    return hints


def _base_type(annotation):
    origin = typing.get_origin(annotation)
    union_type = getattr(types, "UnionType", None)
    if origin not in (typing.Union, union_type):
        return annotation
    args = [item for item in typing.get_args(annotation) if item is not type(None)]
    if len(args) == 1:
        return args[0]
    return annotation


def _enum_schema(enum_cls):
    values = [member.value for member in enum_cls]
    value_type = type(values[0]) if values else str
    return {"type": TYPE_MAP.get(value_type, "string"), "enum": values}


def _property_schema(annotation):
    base = _base_type(annotation)
    if isinstance(base, type) and issubclass(base, enum.Enum):
        return _enum_schema(base)
    if typing.get_origin(base) is list:
        args = typing.get_args(base) or (str,)
        item = args[0] if args else str
        item_base = _base_type(item)
        if isinstance(item_base, type) and issubclass(item_base, enum.Enum):
            return {"type": "array", "items": _enum_schema(item_base)}
        if typing.get_origin(item_base) is dict or item_base is dict:
            return {"type": "array", "items": {"type": "object"}}
        return {"type": "array", "items": {"type": TYPE_MAP.get(item_base, "string")}}
    if typing.get_origin(base) is dict or base is dict:
        return {"type": "object"}
    if base is type(None):
        return {"type": "null"}
    return {"type": TYPE_MAP.get(base, "string")}


def _get_tool_schema(func):
    hints = _type_hints(func)
    sig = inspect.signature(func)
    properties = {}
    required = []
    for name, param in sig.parameters.items():
        if name == "user":
            continue
        annotation = hints.get(name, str)
        properties[name] = _property_schema(annotation)
        if param.default is inspect.Parameter.empty:
            required.append(name)
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


def get_tools_list():
    return [
        {
            "name": name,
            "description": getattr(func, "_mcp_description", None) or func.__doc__ or "",
            "inputSchema": _get_tool_schema(func),
        }
        for name, func in _TOOLS.items()
    ]


def tools_catalog() -> dict:
    return {
        "server_name": MCP_SERVER_NAME,
        "server_version": MCP_SERVER_VERSION,
        "protocol_version": PROTOCOL_VERSION,
        "tools": get_tools_list(),
    }


_TRUE_STRINGS = frozenset({"true", "1", "yes"})
_FALSE_STRINGS = frozenset({"false", "0", "no"})


def _coerce_scalar(value: Any, annotation: Any) -> Any:
    """Cast a stringly JSON value onto the annotated scalar.

    Safety net for clients that ignore the schema. Unknown booleans are
    rejected so ``confirm="nope"`` cannot pass ``if not confirm``.
    """
    if value is None:
        return None
    base = _base_type(annotation)
    if base is int and not isinstance(value, bool):
        if isinstance(value, int):
            return value
        if isinstance(value, float) and value.is_integer():
            return int(value)
        if isinstance(value, str):
            try:
                return int(value.strip())
            except ValueError:
                return value
    if base is float and not isinstance(value, bool):
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value.strip())
            except ValueError:
                return value
    if base is bool and not isinstance(value, bool):
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in _TRUE_STRINGS:
                return True
            if lowered in _FALSE_STRINGS:
                return False
            raise ValueError(f"{value!r} is not a boolean.")
        if isinstance(value, int) and value in (0, 1):
            return bool(value)
        raise ValueError(f"{value!r} is not a boolean.")
    return value


def coerce_tool_arguments(func, arguments: dict[str, Any]) -> dict[str, Any]:
    """Match incoming arguments to the tool signature."""
    hints = _type_hints(func)
    signature = inspect.signature(func)
    coerced = dict(arguments)
    for name in signature.parameters:
        if name not in coerced or name == "user":
            continue
        annotation = hints.get(name)
        if annotation is None:
            continue
        coerced[name] = _coerce_scalar(coerced[name], annotation)
    return coerced


def call_tool(name, arguments, user):
    func = _TOOLS.get(name)
    if not func:
        raise ValueError(f"Unknown tool: {name}")
    set_current_user(user)
    stored = sanitize_tool_arguments(arguments or {})
    try:
        coerced = coerce_tool_arguments(func, arguments or {})
        result = func(**coerced)
        ToolCall.objects.create(user=user, tool_name=name, arguments=stored, success=True)
        return result
    except Exception as exc:
        ToolCall.objects.create(
            user=user,
            tool_name=name,
            arguments=stored,
            success=False,
            error=str(exc)[:2000],
        )
        raise


def handle_jsonrpc(body: bytes, user) -> dict | None:
    try:
        request = json.loads(body or b"{}")
    except (json.JSONDecodeError, ValueError):
        return {"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": None}

    method = request.get("method")
    req_id = request.get("id")
    params = request.get("params") or {}

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": MCP_SERVER_NAME, "version": MCP_SERVER_VERSION},
            },
        }

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": get_tools_list()}}

    if method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments") or {}
        try:
            result = call_tool(tool_name, tool_args, user)
            content = json.dumps(result, default=str) if not isinstance(result, str) else result
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": content}]},
            }
        except ValueError as exc:
            text = str(exc)
            logger.info("Tool call rejected: %s: %s", tool_name, text)
        except Exception:
            logger.exception("Tool call failed: %s", tool_name)
            text = "An internal error occurred while running the tool."
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": text}],
                "isError": True,
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }
