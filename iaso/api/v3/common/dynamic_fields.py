"""Serializer-driven `fields=` support for v3 endpoints.

A v3 serializer's declared fields ARE the `fields=` allowlist: validating a `fields=` tree, documenting it
(`describe_fields`), deciding what to load from the database (`optimize_queryset`) and flattening rows for
csv/xlsx exports (`tabular_columns`/`tabular_values`) all walk the same (pruned) serializer, so adding a
field to a v3 endpoint means declaring it on the serializer - nothing else.
"""

import json

from typing import Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from django.core.exceptions import FieldDoesNotExist
from django.db.models import Expression, Prefetch
from rest_framework import serializers

from .errors import bad_request


#: marks "no `field_tree` given" apart from `field_tree=None` ("use the default fields").
_NOT_PRUNED = object()


class BatchLoader:
    """Loads a field that isn't a plain Django relation (e.g. ancestors, from an ltree `path`) for a whole
    page/chunk of rows at once. `requires` are the row columns the loader reads, so `optimize_queryset`
    keeps them in `.only()`."""

    def __init__(self, load: Callable[[List, serializers.Serializer], None], requires: Sequence[str] = ()):
        self.load = load
        self.requires = tuple(requires)


class DynamicFieldsMixin:
    """Serializer pruned by a parsed `fields=` tree (see `fields_parser.parse_fields`), recursively for nested
    serializers. Output keys follow the order requested in `fields=` (or `default_fields`)."""

    #: fields returned when `fields=` is absent (or a relation is requested without a sub-selector).
    #: `None` means every declared field.
    default_fields: Optional[Tuple[str, ...]] = None
    #: False for fixed-shape relations, which always return every declared field.
    allow_sub_selector = True
    #: fields backed by a queryset annotation rather than a model column, only annotated when requested.
    annotations: Dict[str, Dict[str, Expression]] = {}
    #: fields loaded by a `BatchLoader` rather than through the ORM.
    batch_loaders: Dict[str, BatchLoader] = {}

    def __init__(self, *args, field_tree=_NOT_PRUNED, **kwargs):
        super().__init__(*args, **kwargs)
        self._field_tree = field_tree
        self._include_id = False

    def get_fields(self):
        """Pruned before DRF binds the fields, so nested serializers get their own sub-tree the same way."""
        fields = super().get_fields()
        if self._field_tree is _NOT_PRUNED:
            return fields
        field_tree = self._field_tree
        if not field_tree or not self.allow_sub_selector:
            field_tree = {name: {} for name in (self.default_fields or fields)}
        wanted = list(field_tree)
        if self._include_id and "id" in fields and "id" not in wanted:
            wanted.insert(0, "id")
        pruned = {name: fields[name] for name in wanted}
        for name, field in pruned.items():
            nested = nested_serializer(field)
            if nested is not None:
                nested._field_tree = field_tree.get(name) or {}
                # nested objects always carry their `id`, so a client can tell them apart
                nested._include_id = True
        return pruned

    @classmethod
    def validate_tree(cls, field_tree: Optional[dict], path: str = "") -> None:
        """Raise a 400 if `field_tree` references a field (or sub-field) the serializer doesn't declare, or
        uses a sub-selector on a plain or fixed-shape field."""
        if not field_tree:
            return
        declared = cls._declared_fields
        unknown = sorted(set(field_tree) - set(declared))
        if unknown:
            raise bad_request(
                f"Unknown field(s) in fields=: {', '.join(path + name for name in unknown)}",
                f"Allowed {path or 'top-level '}fields: {', '.join(sorted(declared))}",
            )
        for name, subtree in field_tree.items():
            if not subtree:
                continue
            nested = nested_serializer(declared[name])
            if nested is None or not nested.allow_sub_selector:
                raise bad_request(
                    f"{path}{name} doesn't support a sub-selector",
                    f"Request `{path}{name}` without parentheses.",
                )
            type(nested).validate_tree(subtree, path=f"{path}{name}.")


def nested_serializer(field) -> Optional[DynamicFieldsMixin]:
    """The nested serializer behind `field` (unwrapping `many=True`), or `None` for a plain field."""
    field = getattr(field, "child", field)
    return field if isinstance(field, DynamicFieldsMixin) else None


def is_many(field) -> bool:
    return isinstance(field, (serializers.ListSerializer, serializers.ManyRelatedField))


def describe_fields(serializer_class) -> dict:
    """Machine-readable description of what `fields=` accepts, built from the serializer declaration."""
    serializer = serializer_class()
    defaults = serializer.default_fields or tuple(serializer.fields)
    return {"default_fields": list(defaults), "fields": _describe(serializer, defaults)}


def _describe(serializer, defaults) -> Dict[str, dict]:
    description = {}
    for name, field in serializer.fields.items():
        entry = {"default": name in defaults}
        if getattr(field, "shape", None):
            entry["shape"] = field.shape
        nested = nested_serializer(field)
        if nested is not None:
            entry["many"] = is_many(field)
            entry["sub_selector"] = nested.allow_sub_selector
            entry["default_subfields"] = list(nested.default_fields or nested.fields)
            entry["allowed_subfields"] = sorted(nested.fields)
            entry["fields"] = _describe(nested, nested.default_fields or tuple(nested.fields))
        description[name] = entry
    return description


# -- loading ------------------------------------------------------------------------------------------


def optimize_queryset(queryset, serializer):
    """`.only()`/`.select_related()`/`Prefetch`/`.annotate()` for exactly the fields left in the pruned
    serializer: no JOIN, prefetch, annotation or heavy column unless `fields=` asked for it."""
    plan = _Plan()
    plan.walk(queryset.model, serializer, prefix="")
    prefetches = [
        Prefetch(lookup, queryset=model.objects.only(*columns).order_by("id"))
        for lookup, (model, columns) in plan.prefetch.items()
    ]
    queryset = queryset.annotate(**plan.annotations).prefetch_related(*prefetches).only(*plan.only)
    # guarded: `select_related()` with no argument means "follow every non-null FK", not "nothing"
    return queryset.select_related(*plan.select) if plan.select else queryset


def run_batch_loaders(rows: List, serializer) -> None:
    for name, loader in serializer.batch_loaders.items():
        if name in serializer.fields:
            loader.load(rows, nested_serializer(serializer.fields[name]))


def only_columns(model, serializer) -> Set[str]:
    """Columns needed on `model` rows to render `serializer`, for relations loaded outside the main query."""
    plan = _Plan()
    plan.walk(model, serializer, prefix="")
    return plan.only


class _Plan:
    def __init__(self):
        self.only: Set[str] = set()
        self.select: List[str] = []
        self.prefetch: Dict[str, Tuple[type, Set[str]]] = {}
        self.annotations: Dict[str, Expression] = {}

    def walk(self, model, serializer, prefix: str) -> None:
        self.only.add(f"{prefix}id")
        for name, field in serializer.fields.items():
            if name in serializer.annotations:
                self.annotations.update(serializer.annotations[name])
                continue
            if name in serializer.batch_loaders:
                self.only.update(prefix + column for column in serializer.batch_loaders[name].requires)
                continue
            root = field.source.split(".")[0]
            if root == "*":
                continue
            try:
                model_field = model._meta.get_field(root)  # also resolves attnames like `parent_id`
            except FieldDoesNotExist:
                continue
            nested = nested_serializer(field)
            if model_field.many_to_many or model_field.one_to_many:
                related_model = model_field.related_model
                columns = only_columns(related_model, nested) if nested is not None else {"id"}
                _, known = self.prefetch.setdefault(prefix + root, (related_model, set()))
                known.update(columns)
            elif model_field.many_to_one or model_field.one_to_one:
                self.only.add(prefix + model_field.attname)
                if nested is not None:
                    self.select.append(prefix + root)
                    self.walk(model_field.related_model, nested, prefix=f"{prefix}{root}__")
            else:
                self.only.add(prefix + root)


# -- csv/xlsx exports ---------------------------------------------------------------------------------
#
# A spreadsheet can't nest: a nested object becomes `<field>.<subfield>` columns, a list of plain values a
# `;`-joined cell, and a list of objects is spread by a `layout` entry - see `PositionalColumns` and
# `KeyedColumns`. Anything else non-scalar (e.g. GeoJSON) is written as JSON.


class PositionalColumns:
    """`<field>[i].<subfield>` columns, for lists where position means something (ancestors: 0 = root)."""

    def __init__(self, count: int):
        self.count = count

    def titles(self, nested, title: str) -> List[str]:
        return [t for i in range(self.count) for t in tabular_columns(nested, {}, f"{title}[{i}].")]

    def values(self, items: list, nested) -> list:
        return [v for i in range(self.count) for v in tabular_values(items[i] if i < len(items) else {}, nested, {})]


class KeyedColumns:
    """`<label>-<id>.<subfield>` columns, one set per key, for unordered sets (group membership: "the first
    group" doesn't mean the same group from one row to the next)."""

    def __init__(self, label: str, keys: Iterable[int]):
        self.label = label
        self.keys = sorted(keys)

    def titles(self, nested, title: str) -> List[str]:
        return [t for key in self.keys for t in tabular_columns(nested, {}, f"{self.label}-{key}.")]

    def values(self, items: list, nested) -> list:
        by_key = {item["id"]: item for item in items}
        return [v for key in self.keys for v in tabular_values(by_key.get(key, {}), nested, {})]


def tabular_columns(serializer, layout: dict, prefix: str = "") -> List[str]:
    titles = []
    for name, field in serializer.fields.items():
        title = f"{prefix}{name}"
        nested = nested_serializer(field)
        if nested is not None and not is_many(field):
            titles += tabular_columns(nested, {}, f"{title}.")
        elif nested is not None and name in layout:
            titles += layout[name].titles(nested, title)
        else:
            titles.append(title)
    return titles


def tabular_values(row: dict, serializer, layout: dict) -> list:
    values = []
    for name, field in serializer.fields.items():
        value = row.get(name)
        nested = nested_serializer(field)
        if nested is not None and not is_many(field):
            values += tabular_values(value or {}, nested, {})
        elif nested is not None and name in layout:
            values += layout[name].values(value or [], nested)
        else:
            values.append(_tabular_cell(value))
    return values


def _tabular_cell(value):
    if isinstance(value, list) and not any(isinstance(item, (dict, list)) for item in value):
        return ";".join(str(item) for item in value)
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return value
