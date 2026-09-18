"""Parser for the v3 `fields=` query parameter sub-selector grammar.

Grammar (informal)::

    fields := ws field ws (',' ws field ws)*
    field  := name ws ['(' ws fields ws ')']
    name   := [A-Za-z_][A-Za-z0-9_]*
    ws     := whitespace (optional, anywhere between tokens)

Example::

    >>> parse_fields("id,name,ancestors(id,name,source_ref)")
    {'id': {}, 'name': {}, 'ancestors': {'id': {}, 'name': {}, 'source_ref': {}}}
    >>> parse_fields("id, name, ancestors( id, name )")
    {'id': {}, 'name': {}, 'ancestors': {'id': {}, 'name': {}}}

A field with no sub-selector maps to an empty dict. A relation requested without a sub-selector (e.g.
plain `ancestors`) also maps to `{}`, meaning "use the default sub-fields for that relation". Whitespace
around commas/parentheses/names is ignored, so a `fields=` value copied from formatted code or a
comma-space-separated list (`id, name, ...`) works the same as a tightly-packed one.
"""

from typing import Dict, Tuple


class FieldsParseError(ValueError):
    """Raised when a `fields=` query parameter value doesn't match the expected grammar."""


#: common wrong-bracket typos and the correct replacement, so the error message can point people at the
#: actual grammar instead of just saying "unexpected character" (e.g. `ancestors[id,name]` -> use `(...)`).
_BRACKET_TYPOS = {"[": "(", "]": ")", "{": "(", "}": ")"}


def _bracket_typo_hint(char: str) -> str:
    replacement = _BRACKET_TYPOS.get(char)
    if not replacement:
        return ""
    return (
        f" Did you mean {replacement!r} instead of {char!r}? "
        "Sub-selectors use parentheses, e.g. fields=id,name,ancestors(id,name)."
    )


def parse_fields(fields_param: str) -> Dict[str, dict]:
    fields_param = (fields_param or "").strip()
    if not fields_param:
        return {}
    tree, index = _parse_field_list(fields_param, 0)
    index = _skip_ws(fields_param, index)
    if index != len(fields_param):
        char = fields_param[index]
        raise FieldsParseError(
            f"Unexpected character {char!r} at position {index} in fields={fields_param!r} "
            f"(expected ',' or '(' here).{_bracket_typo_hint(char)}"
        )
    return tree


def _skip_ws(text: str, index: int) -> int:
    while index < len(text) and text[index].isspace():
        index += 1
    return index


def _parse_field_list(text: str, index: int) -> Tuple[Dict[str, dict], int]:
    result: Dict[str, dict] = {}
    while True:
        index = _skip_ws(text, index)
        name, index = _parse_name(text, index)
        index = _skip_ws(text, index)
        children: Dict[str, dict] = {}
        if index < len(text) and text[index] == "(":
            children, index = _parse_field_list(text, index + 1)
            index = _skip_ws(text, index)
            if index >= len(text) or text[index] != ")":
                got = repr(text[index]) if index < len(text) else "end of string"
                hint = _bracket_typo_hint(text[index]) if index < len(text) else ""
                raise FieldsParseError(
                    f"Expected ')' to close {name!r}(...) but got {got} at position {index} in fields={text!r}.{hint}"
                )
            index += 1
            index = _skip_ws(text, index)
        result[name] = children
        if index < len(text) and text[index] == ",":
            index += 1
            continue
        break
    return result, index


def _parse_name(text: str, index: int) -> Tuple[str, int]:
    start = index
    while index < len(text) and (text[index].isalnum() or text[index] == "_"):
        index += 1
    name = text[start:index]
    if not name:
        raise FieldsParseError(f"Expected a field name at position {start} in fields={text!r}")
    return name, index
