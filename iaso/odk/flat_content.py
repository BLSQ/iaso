"""The flat content of a submission (`Instance.json`: question names, groups flattened away, repeats as lists of dicts)
turned into the answers odk_cli takes (question path below the root, `child[2]/age` for the 2nd repeat instance), and
the computed values compared back.

The form version's descriptor (pyxform's JSON) gives each name its path. Names are unique in an XLSForm, within the
root and within each repeat, so a flat key always finds its question.

Values the form computes - calculates, metadata (`start`, `deviceid`...), the org unit context the server injects -
aren't answers: odk_cli computes them. They are held back, then compared with what odk_cli computed (`mismatches`):
a client can send back what it read without stripping anything, and learns where the form logic disagrees with it."""

import math
import re

from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Any, Optional

from iaso.enketo.enketo_xml import ORG_UNIT_INJECTABLE_QUESTION_NAMES


GROUP_TYPES = ("survey", "group")
#: answered with a file name: the file comes with the submission (`InstanceFile`)
BINARY_TYPES = frozenset({"image", "audio", "video", "file", "background-audio"})
REPEAT_TYPE = "repeat"
SELECT_MULTIPLE_TYPE = "select all that apply"

#: pyxform's metadata types: filled by the device, never answered
METADATA_TYPES = frozenset(
    {
        "start",
        "end",
        "today",
        "deviceid",
        "phonenumber",
        "username",
        "email",
        "simserial",
        "subscriberid",
        "audit",
        "start-geopoint",
    }
)

#: a calculate using one of these has a value that depends on when or where it was computed: never compared
VOLATILE_EXPRESSION = re.compile(r"\b(now|today|random|uuid|once)\s*\(|instance\(\s*['\"]last-saved")

#: `meta/instanceID`: `uuid:<the submission's uuid>`, checked apart
INSTANCE_ID = "instanceID"

#: names that aren't questions in any form, read by `Instance.json` consumers: ignored when sent back
IGNORED_KEYS = frozenset({"_version", "deprecatedID", "uuid"})

#: relative tolerance for decimals: JavaRosa writes 0.1 + 0.2 as 0.30000000000000004
DECIMAL_TOLERANCE = 1e-9


@dataclass(frozen=True)
class ContentProblem:
    """`field`: where in the input (`content.child[2].age`). `code`: as odk_cli's (`UNKNOWN_QUESTION`, `INVALID`), or
    `CALCULATION_MISMATCH`."""

    code: str
    field: str
    message: str
    answer: Optional[str] = None
    expected: Optional[str] = None


@dataclass(frozen=True)
class HeldBack:
    """A computed value the client sent: compared with odk_cli's once it ran. `volatile`: can't match by nature
    (`now()`, metadata), only reported."""

    field: str
    path: str
    value: Optional[str]
    volatile: bool


@dataclass
class Answers:
    answers: dict[str, Optional[str]] = field(default_factory=dict)
    held_back: list[HeldBack] = field(default_factory=list)
    problems: list[ContentProblem] = field(default_factory=list)
    instance_id: Optional[str] = None
    #: (field, file name) of the binary questions answered
    attachments: list[tuple[str, str]] = field(default_factory=list)
    #: repeat instances to remove (`null` in a repeat's list, or for the whole repeat), before the answers: (field,
    #: path in the submission as it is, every repeat indexed - `child[2]`, `child[1]/toy[*]` for all of them). The
    #: answers' paths are those after the removals.
    removed: list[tuple[str, str]] = field(default_factory=list)


@dataclass(frozen=True)
class _Question:
    path: str  # below its scope (the root or its repeat), groups included: `household/age`
    node: dict[str, Any]


class FlatContent:
    """The questions of one form version, by name, per scope (the root, each repeat)."""

    def __init__(self, form_descriptor: dict[str, Any]):
        self.descriptor = form_descriptor or {}
        self._scopes: dict[int, dict[str, _Question]] = {}
        # generic paths (no index) of the repeats, to map odk_cli's paths back to fields
        self.repeat_paths = set()
        self._index(self.descriptor, "")

    def _index(self, scope_node: dict[str, Any], scope_path: str) -> dict[str, _Question]:
        questions: dict[str, _Question] = {}

        def visit(node: dict[str, Any], path: str):
            for child in node.get("children", []):
                name = child.get("name")
                if not name:
                    continue
                child_path = f"{path}/{name}" if path else name
                if child.get("type") in GROUP_TYPES:
                    visit(child, child_path)
                    continue
                questions[name] = _Question(child_path, child)
                if child.get("type") == REPEAT_TYPE:
                    full_path = f"{scope_path}/{child_path}" if scope_path else child_path
                    self.repeat_paths.add(full_path)
                    self._index(child, full_path)

        visit(scope_node, "")
        self._scopes[id(scope_node)] = questions
        return questions

    def questions(self, scope_node: Optional[dict[str, Any]] = None) -> dict[str, _Question]:
        return self._scopes[id(scope_node if scope_node is not None else self.descriptor)]

    def names(self) -> set:
        """Every name of the form, all scopes."""
        return {name for questions in self._scopes.values() for name in questions}

    def to_answers(self, content: dict[str, Any]) -> Answers:
        result = Answers()
        self._scope_answers(self.descriptor, content, "", "", "content", result)
        return result

    def _scope_answers(
        self, scope_node, content: dict[str, Any], prefix: str, saved_prefix: str, field_prefix: str, result: Answers
    ):
        """`prefix`: the scope's path once the removals done (the answers'), `saved_prefix`: in the submission as it
        is (the removals')."""
        questions = self.questions(scope_node)
        for name, value in content.items():
            field_name = f"{field_prefix}.{name}"
            if scope_node is self.descriptor and name in IGNORED_KEYS:
                continue
            if scope_node is self.descriptor and name == INSTANCE_ID:
                # `meta/instanceID`: the submission uuid, checked apart from the questions
                try:
                    result.instance_id = to_xml_text(value)
                except ValueError as error:
                    result.problems.append(ContentProblem("INVALID", field_name, str(error), _shown(value)))
                continue
            question = questions.get(name)
            if question is None:
                result.problems.append(ContentProblem("UNKNOWN_QUESTION", field_name, "No such question in this form"))
                continue
            path = f"{prefix}{question.path}"
            node_type = question.node.get("type")
            if node_type == REPEAT_TYPE:
                self._repeat_answers(question, value, path, f"{saved_prefix}{question.path}", field_name, result)
                continue
            try:
                text = to_xml_text(value)
            except ValueError as error:
                result.problems.append(ContentProblem("INVALID", field_name, str(error), _shown(value)))
                continue
            if _is_computed(question.node):
                result.held_back.append(HeldBack(field_name, path, text, _is_volatile(question.node)))
            else:
                result.answers[path] = text
                if text and question.node.get("type") in BINARY_TYPES:
                    result.attachments.append((field_name, text))

    def _repeat_answers(
        self, question: _Question, value: Any, path: str, saved_path: str, field_name: str, result: Answers
    ):
        counted = "jr:count" in (question.node.get("control") or {})
        if value is None or (isinstance(value, list) and None in value):
            if counted:
                result.problems.append(
                    ContentProblem("INVALID", field_name, "Its instances follow its count: change the count instead")
                )
                return
        if value is None:
            result.removed.append((field_name, f"{saved_path}[*]"))
            return
        if not isinstance(value, list) or not all(item is None or isinstance(item, dict) for item in value):
            result.problems.append(
                ContentProblem("INVALID", field_name, "A repeat is a list of objects, one per repeat instance")
            )
            return
        kept = 0
        for index, item in enumerate(value, start=1):
            if item is None:
                result.removed.append((f"{field_name}[{index}]", f"{saved_path}[{index}]"))
                continue
            kept += 1
            instance_path = path if kept == 1 else f"{path}[{kept}]"
            self._scope_answers(
                question.node,
                item,
                f"{instance_path}/",
                f"{saved_path}[{index}]/",
                f"{field_name}[{index}]",
                result,
            )

    def field_of(self, path: Optional[str]) -> Optional[str]:
        """The input field of an odk_cli path: `household/child[2]/age` → `content.child[2].age` (groups dropped,
        repeats kept with their 1-based index)."""
        if not path:
            return None
        parts = []
        generic = ""
        segments = path.split("/")
        for position, segment in enumerate(segments):
            name, _, index = segment.partition("[")
            generic = f"{generic}/{name}" if generic else name
            if generic in self.repeat_paths:
                parts.append(f"{name}[{index.rstrip(']') or '1'}]")
            elif position == len(segments) - 1:
                parts.append(name)
        return ".".join(["content", *parts])

    def mismatches(self, held_back: Iterable[HeldBack], computed: dict[str, Any]) -> tuple[list, list]:
        """`computed`: the flat content of the XML odk_cli returned. (refused, ignored): the values sent that differ
        from the computed ones, and the volatile ones, which are never compared."""
        refused, ignored = [], []
        for value in held_back:
            stored = to_xml_text(_value_at(computed, value.field))
            if value.volatile:
                if not same_text(value.value, stored):
                    ignored.append(
                        ContentProblem(
                            "CALCULATION_IGNORED",
                            value.field,
                            "Computed by the server, the value sent is ignored",
                            value.value,
                            stored,
                        )
                    )
            elif not same_text(value.value, stored):
                refused.append(
                    ContentProblem(
                        "CALCULATION_MISMATCH",
                        value.field,
                        f"The form computes {stored!r}, not {value.value!r}",
                        value.value,
                        stored,
                    )
                )
        return refused, ignored


def to_xml_text(value: Any) -> Optional[str]:
    """A JSON value as the XML holds it: `None` for empty, numbers as text, a select multiple's list space-separated."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise ValueError("Booleans aren't XForm values: use the choice's value")
    if isinstance(value, (int, float)):
        if isinstance(value, float) and not math.isfinite(value):
            raise ValueError("Not a number")
        return str(value)
    if isinstance(value, str):
        return value
    if isinstance(value, list) and all(isinstance(item, str) and item and " " not in item for item in value):
        return " ".join(value) or None
    raise ValueError("Expected a text, a number, or a list of choices")


def same_text(sent: Optional[str], stored: Optional[str]) -> bool:
    """Numbers compared as numbers (`7` = `7.0`, decimals within a relative tolerance), the rest as text; empty =
    absent."""
    if (sent or None) is None or (stored or None) is None:
        return (sent or None) == (stored or None)
    try:
        return math.isclose(float(sent), float(stored), rel_tol=DECIMAL_TOLERANCE)
    except ValueError:
        return sent == stored


def _value_at(flat: dict[str, Any], field_name: str) -> Any:
    """`content.child[2].age` in the flat content."""
    value: Any = flat
    for part in field_name.split(".")[1:]:
        name, _, index = part.partition("[")
        if not isinstance(value, dict):
            return None
        value = value.get(name)
        if index:
            position = int(index.rstrip("]")) - 1
            value = value[position] if isinstance(value, list) and position < len(value) else None
    return value


def _is_computed(node: dict[str, Any]) -> bool:
    return node.get("type") in ("calculate", *METADATA_TYPES) or node.get("name") in ORG_UNIT_INJECTABLE_QUESTION_NAMES


def _is_volatile(node: dict[str, Any]) -> bool:
    if node.get("type") in METADATA_TYPES:
        return True
    expression = node.get("calculation") or node.get("bind", {}).get("calculate") or ""
    return bool(VOLATILE_EXPRESSION.search(expression))


def _shown(value: Any) -> Optional[str]:
    return None if value is None else str(value)
