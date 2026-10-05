"""Limits checked before anything runs, on top of the shape of the schema itself (flat filters, no cycle).

- `RootFieldLimitsRule`: at most one list of each kind (`orgUnits`, `instances`, ...) per operation - aliases and
  fragments included - and a few root fields overall. A second list is a second unbounded scan, it's what multiplied the
  cost in the strawberry POC (5 aliased lists of 10 000 rows).
- `NoNestedAliasesRule`: below the root, fields take no arguments, so an alias can only repeat a value already
  in the response - a cheap way to multiply a geometry by hundreds. Only root fields can be aliased.
- `MAX_TOKENS` (see `views.py`): the parser stops long before a huge document is built.
"""

from collections import Counter
from typing import Dict, Set

from graphql import (
    FieldNode,
    FragmentSpreadNode,
    GraphQLError,
    InlineFragmentNode,
    OperationDefinitionNode,
    SelectionSetNode,
    ValidationRule,
)


MAX_TOKENS = 2_000
#: per operation, by field name; root fields not listed here are capped by `MAX_ROOT_FIELDS` only
ROOT_FIELD_LIMITS = {
    "orgUnits": 1,
    "submissions": 1,
    "forms": 1,
    "formVersions": 1,
    "bulkUpdateOrgUnits": 1,
    "dataSources": 1,
    "orgUnitTypes": 1,
    "groups": 1,
    "users": 1,
    "sourceVersions": 1,
}
MAX_ROOT_FIELDS = 10


class RootFieldLimitsRule(ValidationRule):
    def enter_operation_definition(self, node: OperationDefinitionNode, *_args):
        response_keys = self._root_fields(node.selection_set, visited=set())
        counts = Counter(name for name in response_keys.values() if not name.startswith("__"))
        for name, limit in ROOT_FIELD_LIMITS.items():
            if counts[name] > limit:
                self.report_error(GraphQLError(f"At most {limit} `{name}` per operation, got {counts[name]}.", node))
        if sum(counts.values()) > MAX_ROOT_FIELDS:
            self.report_error(GraphQLError(f"At most {MAX_ROOT_FIELDS} root fields per operation.", node))

    def _root_fields(self, selection_set: SelectionSetNode, visited: Set[str]) -> Dict[str, str]:
        """response key -> field name, fragments expanded. `@skip`/`@include` are ignored: worst case."""
        fields = {}
        for selection in selection_set.selections:
            if isinstance(selection, FieldNode):
                key = selection.alias.value if selection.alias else selection.name.value
                fields[key] = selection.name.value
            elif isinstance(selection, InlineFragmentNode):
                fields.update(self._root_fields(selection.selection_set, visited))
            elif isinstance(selection, FragmentSpreadNode) and selection.name.value not in visited:
                visited.add(selection.name.value)
                fragment = self.context.get_fragment(selection.name.value)
                if fragment is not None:  # an unknown fragment is reported by graphql-core's own rules
                    fields.update(self._root_fields(fragment.selection_set, visited))
        return fields


class NoNestedAliasesRule(ValidationRule):
    def enter_field(self, node: FieldNode, *_args):
        parent_type = self.context.get_parent_type()
        root_types = (self.context.schema.query_type, self.context.schema.mutation_type)
        if node.alias and parent_type is not None and parent_type not in root_types:
            self.report_error(
                GraphQLError(f"Aliases are only allowed on root fields, not on `{parent_type.name}`.", node)
            )


VALIDATION_RULES = [RootFieldLimitsRule, NoNestedAliasesRule]
