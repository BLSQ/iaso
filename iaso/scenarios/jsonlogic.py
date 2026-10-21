"""JsonLogic evaluated like the IASO app does it: json-logic-java 1.1.0, called by `EvaluateLogic` / `GetFollowUpForms`.

The quirks are on purpose, each one checked against the library (`iaso/tests/scenarios/jsonlogic_parity/`):

- numbers read by `var` and written in the logic are doubles: `1 in [1, 2]`, `12.0 == 12`;
- `==` is loose and asymmetric in surprising ways: `0 == "0"`, `0 == ""`, `"01" == 1`, `true == "no"` (a boolean is
  compared to the truthiness of a string), `false == 0`, a list is equal to nothing but another falsy value;
- `<`, `<=`, `>`, `>=` parse strings as numbers (`"100" < 24` is false, unlike JavaScript) and are false as soon as
  one side is not a number (`null < 24` is false, and so is `null >= 0`);
- `"0"` and `"false"` are truthy, `0`, `""` and `[]` are not;
- `var` doesn't find keys holding a dot (`"x.y"` is a path);
- an object with no key, an unknown operation, `and`/`or` without arguments raise.

The app then casts the result to a Boolean: a result that isn't one (a parse error returns the logic itself) fails
there, see `evaluate_condition`.
"""

import json
import math

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


class JsonLogicError(Exception):
    """json-logic-java's `JsonLogicParseException` / `JsonLogicEvaluationException`."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def parse(logic: str) -> Any:
    """The logic as json-logic-java's gson reads it: every number a double."""
    try:
        return json.loads(logic, parse_int=float)
    except ValueError as e:
        raise JsonLogicError("PARSE_ERROR", f"Not JSON: {e}")


def apply(logic: Any, data: Any) -> Any:
    """`JsonLogic.apply(logic, data)`; `logic` already parsed (see `parse`)."""
    if isinstance(logic, list):
        return [apply(item, data) for item in logic]
    if not isinstance(logic, dict):
        return _number(logic)
    if len(logic) != 1:
        raise JsonLogicError("PARSE_ERROR", f"objects must have exactly 1 key defined, found {len(logic)}")
    operation, raw_args = next(iter(logic.items()))
    args = raw_args if isinstance(raw_args, list) else [raw_args]
    if operation in LAZY_OPERATIONS:
        return LAZY_OPERATIONS[operation](args, data)
    if operation not in OPERATIONS:
        raise JsonLogicError("EVALUATION_ERROR", f"Undefined operation '{operation}'")
    return OPERATIONS[operation]([apply(arg, data) for arg in args])


def truthy(value: Any) -> bool:
    """`JsonLogic.truthy`."""
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return False
        return value != 0
    if isinstance(value, (str, list, dict)):
        return len(value) > 0
    return True


def variables(logic: Any) -> List[str]:
    """The names read by `var`, in order, for the trace."""
    found: List[str] = []
    if isinstance(logic, list):
        for item in logic:
            found += [name for name in variables(item) if name not in found]
    elif isinstance(logic, dict):
        for operation, args in logic.items():
            if operation == "var":
                name = args[0] if isinstance(args, list) and args else args
                if isinstance(name, str) and name and name not in found:
                    found.append(name)
            else:
                found += [name for name in variables(args) if name not in found]
    return found


def _number(value: Any) -> Any:
    # json-logic-java turns every Number into a Double; a Python bool is an int, it stays a bool
    if isinstance(value, int) and not isinstance(value, bool):
        return float(value)
    return value


def _var(args: List[Any], data: Dict[str, Any]) -> Any:
    key = apply(args[0], data) if args else None
    default = apply(args[1], data) if len(args) > 1 else None
    if key is None or key == "":
        return data
    current: Any = data
    for part in str(key if not isinstance(key, float) else int(key)).split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return default
    return _number(current) if current is not None else default


def _missing(args: List[Any], data: Dict[str, Any]) -> List[Any]:
    keys = [apply(arg, data) for arg in args]
    if keys and isinstance(keys[0], list):
        keys = keys[0]
    return [key for key in keys if _var([key], data) in (None, "")]


def _java_double(text: str) -> Optional[float]:
    """`Double.parseDouble`: surrounding blanks allowed; None when it would throw."""
    stripped = text.strip()
    if "_" in stripped:  # Python reads "1_000", Java doesn't
        return None
    if stripped.lower() in ("nan", "inf", "+inf", "-inf", "infinity", "+infinity", "-infinity") and stripped not in (
        "NaN",
        "Infinity",
        "+Infinity",
        "-Infinity",
    ):
        return None
    try:
        return float(stripped)
    except ValueError:
        return None


def _number_equals_string(number: float, text: str) -> bool:
    parsed = _java_double("0" if text.strip() == "" else text)
    return parsed is not None and float(number) == parsed


def _number_equals_boolean(number: float, boolean: bool) -> bool:
    return float(number) == (1.0 if boolean else 0.0)


def _equals(left: Any, right: Any) -> bool:
    """`EqualityExpression`."""
    if left is None and right is None:
        return True
    if left is None or right is None:
        return False
    left_bool, right_bool = isinstance(left, bool), isinstance(right, bool)
    left_number = isinstance(left, (int, float)) and not left_bool
    right_number = isinstance(right, (int, float)) and not right_bool
    if left_number and right_number:
        return float(left) == float(right)
    if left_number and isinstance(right, str):
        return _number_equals_string(left, right)
    if left_number and right_bool:
        return _number_equals_boolean(left, right)
    if isinstance(left, str) and isinstance(right, str):
        return left == right
    if isinstance(left, str) and right_number:
        return _number_equals_string(right, left)
    if isinstance(left, str) and right_bool:
        return truthy(left) == right
    if left_bool and right_bool:
        return left == right
    if left_bool and right_number:
        return _number_equals_boolean(right, left)
    if left_bool and isinstance(right, str):
        return truthy(right) == left
    return not truthy(left) and not truthy(right)


def _strict_equals(left: Any, right: Any) -> bool:
    """`StrictEqualityExpression`: same kind of value, then equal (numbers as doubles)."""
    left_number = isinstance(left, (int, float)) and not isinstance(left, bool)
    right_number = isinstance(right, (int, float)) and not isinstance(right, bool)
    if left_number and right_number:
        return float(left) == float(right)
    return type(left) is type(right) and left == right


def _compare(operation: str, args: List[Any]) -> bool:
    """`NumericComparisonExpression`: strings parsed as numbers, anything else not a number makes it false."""
    if len(args) < 2:
        raise JsonLogicError("EVALUATION_ERROR", f"'{operation}' requires at least 2 arguments")
    numbers = []
    for arg in args[:3]:
        if isinstance(arg, str):
            parsed = _java_double(arg)
            if parsed is None:
                return False
            numbers.append(parsed)
        elif isinstance(arg, (int, float)) and not isinstance(arg, bool):
            numbers.append(float(arg))
        else:
            return False
    checks = {
        "<": lambda a, b: a < b,
        "<=": lambda a, b: a <= b,
        ">": lambda a, b: a > b,
        ">=": lambda a, b: a >= b,
    }[operation]
    if len(numbers) == 3 and operation in ("<", "<="):
        return checks(numbers[0], numbers[1]) and checks(numbers[1], numbers[2])
    return checks(numbers[0], numbers[1])


def _in(args: List[Any]) -> bool:
    """`InExpression`: substring of a string, or element of a list (Java `equals`: same type and value)."""
    if len(args) < 2:
        return False
    needle, haystack = args[0], args[1]
    if isinstance(haystack, str):
        return needle is not None and str(needle) in haystack
    if isinstance(haystack, list):
        return any(type(item) is type(needle) and item == needle for item in haystack)
    return False


def _logic(operation: str, args: List[Any], data: Dict[str, Any]) -> Any:
    if not args:
        raise JsonLogicError("EVALUATION_ERROR", f"{operation} operator expects at least 1 argument")
    result = None
    for arg in args:
        result = apply(arg, data)
        if (operation == "and") != truthy(result):
            return result
    return result


def _if(args: List[Any], data: Dict[str, Any]) -> Any:
    index = 0
    while index + 1 < len(args):
        if truthy(apply(args[index], data)):
            return apply(args[index + 1], data)
        index += 2
    return apply(args[index], data) if index < len(args) else None


def _array_has(operation: str, args: List[Any], data: Dict[str, Any]) -> bool:
    items = apply(args[0], data) if args else None
    if not isinstance(items, list) or not items:
        return operation == "none"
    # the sub-logic sees the item itself as its data: {"var": ""} is the item
    matches = [truthy(apply(args[1], item)) for item in items]
    if operation == "some":
        return any(matches)
    if operation == "all":
        return all(matches)
    return not any(matches)


LAZY_OPERATIONS = {
    "var": _var,
    "missing": _missing,
    "and": lambda args, data: _logic("and", args, data),
    "or": lambda args, data: _logic("or", args, data),
    "if": _if,
    "?:": _if,
    "some": lambda args, data: _array_has("some", args, data),
    "all": lambda args, data: _array_has("all", args, data),
    "none": lambda args, data: _array_has("none", args, data),
}


def _two(operation: str, args: List[Any]) -> List[Any]:
    if len(args) != 2:
        raise JsonLogicError("EVALUATION_ERROR", f"{operation} expressions expect exactly 2 arguments")
    return args


OPERATIONS = {
    "==": lambda args: _equals(*_two("equality", args)),
    "!=": lambda args: not _equals(*_two("equality", args)),
    "===": lambda args: _strict_equals(*_two("equality", args)),
    "!==": lambda args: not _strict_equals(*_two("equality", args)),
    "<": lambda args: _compare("<", args),
    "<=": lambda args: _compare("<=", args),
    ">": lambda args: _compare(">", args),
    ">=": lambda args: _compare(">=", args),
    "!": lambda args: not truthy(args[0] if args else None),
    "!!": lambda args: truthy(args[0] if args else None),
    "in": _in,
    "cat": lambda args: "".join("" if arg is None else str(arg) for arg in args),
    "merge": lambda args: [item for arg in args for item in (arg if isinstance(arg, list) else [arg])],
}


@dataclass
class ConditionResult:
    """A followup condition evaluated like `GetFollowUpForms`: `evaluateLogic(...) as Boolean`.

    `error` when the app would fail instead of answering: the logic can't be parsed (`EvaluateLogic` then returns the
    logic itself, which can't be cast to a Boolean), raises, or returns something that isn't a Boolean. `read`: the
    variables the condition reads, with the values it got."""

    value: bool
    raw: Any = None
    error: Optional[JsonLogicError] = None
    read: Dict[str, Any] = field(default_factory=dict)


def evaluate_condition(condition: Any, data: Dict[str, Any]) -> ConditionResult:
    """`condition` as stored on `WorkflowFollowup` (a dict, or JSON text); the app receives `json.dumps(condition)`."""
    text = condition if isinstance(condition, str) else json.dumps(condition)
    try:
        logic = parse(text)
        read = {name: data.get(name) for name in variables(logic)}
        raw = apply(logic, data)
    except JsonLogicError as e:
        return ConditionResult(False, error=e)
    if not isinstance(raw, bool):
        return ConditionResult(
            False, raw, JsonLogicError("NOT_BOOLEAN", f"The condition gives {raw!r}, not true or false"), read
        )
    return ConditionResult(raw, raw, read=read)
