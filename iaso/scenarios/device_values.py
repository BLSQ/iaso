"""The values the IASO app gives to the followup conditions: the entity's profile, typed.

On the device, `GetFollowUpForms` evaluates the conditions on `List<Question>.data`, read back from the entity's
SQLite table, whose column types come from `GetFormStructure`: the question type, or for a calculate the suffix of
its name (`age__int__`). So the same answer `"0"` is the number 0 or the text "0" depending on the name of the
question - and the conditions compare differently (see `jsonlogic`).

Typing (`GetFormStructure.toQuestion`, `Question.copyString`, `List<Question>.data`):

- integer, `__int__`, `__integer__`, `__long__` -> int (Kotlin `toInt()`: "12.0" or "abc" fail);
- decimal, `__decimal__`, `__double__` -> float;
- `__bool__`, `__boolean__` -> True only for "1" (`copyString`: an XPath "true" is False - to confirm on a device);
- date / `__date__` -> epoch ms at midnight, dateTime / `__datetime__` / `__date_time__` -> epoch ms,
  time / `__time__` -> seconds since midnight; the device uses its own time zone, here `tz` (UTC by default);
- select one -> text, select multiple -> list of the chosen values;
- everything else, calculates without (or with an unknown) suffix -> text;
- a blank answer -> None (not answered).
"""

import datetime
import re

from typing import Any, Dict, Optional


CALCULATE_TYPE = re.compile(r"__(.*)__$")

INT_TYPES = {"integer", "int", "long"}
DECIMAL_TYPES = {"decimal", "double"}
BOOL_TYPES = {"bool", "boolean"}
DATE_TYPES = {"date"}
DATETIME_TYPES = {"datetime", "date_time", "dateTime"}
TIME_TYPES = {"time"}
SELECT_MULTIPLE_TYPES = {"select all that apply", "select_multiple"}


class DeviceValueError(Exception):
    """The app couldn't read this answer as the type the form gives it (`Couldn't parse value ...`)."""

    def __init__(self, name: str, value: str, kind: str):
        super().__init__(f"'{value}' can't be read as {kind} for {name}")
        self.name = name
        self.value = value
        self.kind = kind


def device_kind(name: str, question: Optional[dict]) -> str:
    """The kind of value the app makes of this question: int, decimal, bool, date, datetime, time, list or text."""
    question_type = (question or {}).get("type", "")
    if question_type == "calculate":
        match = CALCULATE_TYPE.search(name)
        question_type = match.group(1) if match else "string"
    if question_type in INT_TYPES:
        return "int"
    if question_type in DECIMAL_TYPES:
        return "decimal"
    if question_type in BOOL_TYPES:
        return "bool"
    if question_type in DATE_TYPES:
        return "date"
    if question_type in DATETIME_TYPES:
        return "datetime"
    if question_type in TIME_TYPES:
        return "time"
    if question_type in SELECT_MULTIPLE_TYPES:
        return "list"
    return "text"


def device_value(name: str, value: Any, question: Optional[dict], tz: datetime.tzinfo = datetime.timezone.utc) -> Any:
    """One answer, as stored in an `Instance.json` (text), typed like the app does."""
    if value is None:
        return None
    text = str(value)
    if not text.strip():
        return None
    kind = device_kind(name, question)
    try:
        if kind == "int":
            if not re.fullmatch(r"[+-]?\d+", text):
                raise ValueError(text)
            return int(text)
        if kind == "decimal":
            return float(text)
        if kind == "bool":
            return text == "1"
        if kind == "date":
            day = datetime.date.fromisoformat(text[:10])
            return int(datetime.datetime.combine(day, datetime.time(), tz).timestamp() * 1000)
        if kind == "datetime":
            moment = datetime.datetime.fromisoformat(text.replace("Z", "+00:00"))
            if moment.tzinfo is None:
                moment = moment.replace(tzinfo=tz)
            return int(moment.timestamp() * 1000)
        if kind == "time":
            hours, minutes, seconds = (text.split("+")[0].split("-")[0].split(":") + ["0", "0"])[:3]
            return int(hours) * 3600 + int(minutes) * 60 + int(float(seconds))
        if kind == "list":
            return text.split()
    except ValueError:
        raise DeviceValueError(name, text, kind)
    return text


def device_data(
    answers: Dict[str, Any], questions_by_name: Dict[str, dict], tz: datetime.tzinfo = datetime.timezone.utc
) -> Dict[str, Any]:
    """The profile's answers (`Instance.json`, keyed by question name) typed like `List<Question>.data`. `instanceID`
    is left out, as `GetFormStructure` does; answers the form doesn't know are left out too (no column for them)."""
    return {
        name: device_value(name, value, questions_by_name.get(name), tz)
        for name, value in answers.items()
        if name != "instanceID" and name in questions_by_name
    }
