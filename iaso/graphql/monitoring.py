"""What the web server's access log can't tell about `POST /api/graphql/` - which operation ran, on which filters, at
what cost -, as two JSON lines on the `iaso.graphql.operations` logger (one JSON object per line, see `LOGGING`):

- `graphql.start`, before the operation runs: the operation, its root fields and the names of their arguments, the
  user and their account - an operation that never finishes (a timeout, a killed worker) still leaves this one;
- `graphql.end`, after: the same, plus the duration, the SQL statements run and their time, the error codes, the
  mutations' refusals and the response size. `WARNING` above `settings.GRAPHQL_SLOW_MS`, with the query text.

Both share a `request_id`. Never the variables' or the arguments' values (names, phone numbers... in filters): only
their names, and `limit`/`offset`."""

import json
import logging
import time
import uuid

from typing import Any, Dict, List, Optional

from django.conf import settings
from django.utils import timezone
from graphql import (
    DocumentNode,
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    ObjectValueNode,
    OperationDefinitionNode,
    SelectionSetNode,
    VariableNode,
)


logger = logging.getLogger("iaso.graphql.operations")

#: arguments whose values are logged: sizes, not data
LOGGED_VALUES = ("limit", "offset")


class OperationLog:
    """The two log lines of one operation: `start()` once the document is parsed, `end()` with the response."""

    def __init__(self, request, data: Dict[str, Any]):
        self.request_id = uuid.uuid4().hex
        user = getattr(request, "user", None)
        profile = getattr(user, "iaso_profile", None) if user is not None and user.is_authenticated else None
        self.context: Dict[str, Any] = {
            "request_id": self.request_id,
            "user_id": user.id if user is not None and user.is_authenticated else None,
            "account_id": profile.account_id if profile is not None else None,
            "operation": data.get("operationName") or None,
        }
        self.query_text = data.get("query") if isinstance(data.get("query"), str) else None
        self.variables = data.get("variables") if isinstance(data.get("variables"), dict) else {}
        self.started = time.monotonic()
        self.sql = {"count": 0, "ms": 0.0}

    def describe(self, document: DocumentNode) -> None:
        """The operation's type, name and root fields, from the parsed `document`."""
        fragments = {d.name.value: d for d in document.definitions if isinstance(d, FragmentDefinitionNode)}
        operation = _operation(document, self.context["operation"])
        if operation is None:
            return
        self.context["operation"] = operation.name.value if operation.name else None
        self.context["type"] = operation.operation.value
        roots = _root_fields(operation.selection_set, fragments)
        self.context["root"] = [field.name.value for field in roots]
        self.context["args"] = {field.name.value: self._arguments(field) for field in roots if field.arguments}
        self.context["fields"] = _count_fields(operation.selection_set, fragments, set())

    def start(self) -> None:
        self._log(logging.INFO, "graphql.start", {})

    def wrap_sql(self, execute, sql, params, many, context):
        """A `connection.execute_wrapper`: counts and times the statements."""
        started = time.monotonic()
        try:
            return execute(sql, params, many, context)
        finally:
            self.sql["count"] += 1
            self.sql["ms"] += (time.monotonic() - started) * 1000

    def end(self, status: int, result: Optional[Dict[str, Any]], size: int) -> None:
        duration = (time.monotonic() - self.started) * 1000
        slow = duration >= settings.GRAPHQL_SLOW_MS
        fields = {
            "status": status,
            "ms": round(duration),
            "sql": {"count": self.sql["count"], "ms": round(self.sql["ms"])},
            "errors": _error_codes(result),
            "refused": _refusals(result),
            "bytes": size,
        }
        if slow:
            # to reproduce it: the text, never the variables
            fields["query"] = self.query_text
        self._log(logging.WARNING if slow else logging.INFO, "graphql.end", fields)

    def _arguments(self, field: FieldNode) -> Dict[str, Any]:
        """Argument name -> `true`; the names of the keys given to an input object (`filters`); the value of
        `limit`/`offset`."""
        arguments: Dict[str, Any] = {}
        for argument in field.arguments:
            name, value = argument.name.value, argument.value
            if isinstance(value, VariableNode):
                given = self.variables.get(value.name.value)
                if name in LOGGED_VALUES and isinstance(given, int):
                    arguments[name] = given
                elif isinstance(given, dict):
                    arguments[name] = sorted(key for key, item in given.items() if item is not None)
                else:
                    arguments[name] = True
            elif name in LOGGED_VALUES and hasattr(value, "value"):
                arguments[name] = int(value.value) if str(value.value).isdigit() else True
            elif isinstance(value, ObjectValueNode):
                arguments[name] = sorted(item.name.value for item in value.fields)
            else:
                arguments[name] = True
        return arguments

    def _log(self, level: int, event: str, fields: Dict[str, Any]) -> None:
        line = {"ts": timezone.now().isoformat(), "level": logging.getLevelName(level), "event": event}
        logger.log(level, json.dumps({**line, **self.context, **fields}, default=str))


def _operation(document: DocumentNode, name: Optional[str]) -> Optional[OperationDefinitionNode]:
    """The operation `name` names, else the only one: as graphql-core picks it."""
    operations = [d for d in document.definitions if isinstance(d, OperationDefinitionNode)]
    if name:
        return next((operation for operation in operations if operation.name and operation.name.value == name), None)
    return operations[0] if len(operations) == 1 else None


def _root_fields(selection_set: SelectionSetNode, fragments: Dict[str, FragmentDefinitionNode]) -> List[FieldNode]:
    fields: List[FieldNode] = []
    for selection in selection_set.selections:
        if isinstance(selection, FieldNode):
            if not selection.name.value.startswith("__"):
                fields.append(selection)
        elif isinstance(selection, InlineFragmentNode):
            fields += _root_fields(selection.selection_set, fragments)
        elif isinstance(selection, FragmentSpreadNode) and selection.name.value in fragments:
            fields += _root_fields(fragments[selection.name.value].selection_set, fragments)
    return fields


def _count_fields(selection_set: Optional[SelectionSetNode], fragments, visited: set) -> int:
    """How many fields are selected, at any depth, fragments expanded once: the size of the selection."""
    if selection_set is None:
        return 0
    count = 0
    for selection in selection_set.selections:
        if isinstance(selection, FieldNode):
            count += 1 + _count_fields(selection.selection_set, fragments, visited)
        elif isinstance(selection, InlineFragmentNode):
            count += _count_fields(selection.selection_set, fragments, visited)
        elif isinstance(selection, FragmentSpreadNode) and selection.name.value not in visited:
            visited.add(selection.name.value)
            fragment = fragments.get(selection.name.value)
            count += _count_fields(fragment.selection_set if fragment else None, fragments, visited)
    return count


def _error_codes(result: Optional[Dict[str, Any]]) -> List[str]:
    """The top-level errors' codes, sorted, once each."""
    errors = (result or {}).get("errors") or []
    return sorted({(error.get("extensions") or {}).get("code", "UNKNOWN") for error in errors})


def _refusals(result: Optional[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Mutation root field -> the codes of the `errors` its payload returned (`InputError`), when it has any - `?` for
    one whose `code` the client didn't select."""
    data = (result or {}).get("data") or {}
    refusals = {}
    for key, value in data.items():
        if isinstance(value, dict) and value.get("errors"):
            refusals[key] = sorted({error.get("code") or "?" for error in value["errors"] if isinstance(error, dict)})
    return refusals
