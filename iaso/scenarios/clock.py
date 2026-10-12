"""The step's clock in its form: `today()` and `now()` replaced by the step's date and time in the XForm, so both form
engines - odk_cli for the runs, web-forms in the editor - fill it as a phone would on that day (a default date, a
`format-date(today(), ...)` kept on the entity...), the form being otherwise the same.

Only XPath is rewritten - binds, defaults and triggers (`setvalue`), outputs in labels, choice filters, repeat counts -
outside string literals, and only the functions themselves (not `my-today()`, `x:now()` nor a question named `today`).
`today()` becomes the step's date, `now()` its date and time with its offset (`date()` would drop the time).
Not covered: the `today`, `start` and `end` metadata, filled by the engine itself (`jr:preload`), not by an
expression.
"""

import datetime
import re

from typing import Optional

from lxml import etree


# element -> its attributes holding XPath (by local name: `jr:count` is `count`)
XPATH_ATTRIBUTES = {
    "bind": {"calculate", "constraint", "relevant", "required", "readonly"},
    "setvalue": {"value"},
    "output": {"value"},
    "itemset": {"nodeset"},
    "repeat": {"count"},
}

# a call of today() / now(), not part of a longer name (my-today(), x:now(), today.x())
_CLOCK_CALL = re.compile(r"(?<![\w.:-])(today|now)\s*\(\s*\)")
# XPath string literals: no escaping, a literal ends at the next quote of its kind
_LITERAL = re.compile(r"""('[^']*'|"[^"]*")""")


def _local(name: str) -> str:
    return etree.QName(name).localname


def expression_at(expression: str, at: datetime.datetime) -> str:
    """The XPath expression with `today()` and `now()` as at `at`; string literals are left as they are."""
    today = f"date('{at.date().isoformat()}')"
    now = f"date-time('{at.isoformat(timespec='milliseconds')}')"
    # split keeps the literals: they are the odd parts
    parts = _LITERAL.split(expression)
    return "".join(
        part if index % 2 else _CLOCK_CALL.sub(lambda call: today if call.group(1) == "today" else now, part)
        for index, part in enumerate(parts)
    )


def xform_at(xform: bytes, at: Optional[datetime.datetime]) -> bytes:
    """The XForm as filled at `at`; as it is without one (the engines' own clock: now)."""
    if at is None:
        return xform
    root = etree.fromstring(xform, parser=etree.XMLParser(huge_tree=True))
    for element in root.iter():
        if not isinstance(element.tag, str):
            continue
        attributes = XPATH_ATTRIBUTES.get(_local(element.tag))
        if not attributes:
            continue
        for name, expression in element.attrib.items():
            if _local(name) in attributes:
                element.set(name, expression_at(expression, at))
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8")
