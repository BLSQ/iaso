"""The entity workflow as the IASO app runs it, without the app: which forms are offered next, what a followup form
is prefilled with, how its answers change the entity's profile.

Pure Python over plain data - no database, nothing saved. What it does not do yet: run the forms themselves
(calculates, relevance, constraints): answers are taken as given and the profile's calculates aren't recomputed after
a change; that is the form engine's job (`odk_cli`).
"""

import datetime

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

from iaso.scenarios.device_values import DeviceValueError, device_data
from iaso.scenarios.jsonlogic import ConditionResult, evaluate_condition


JSON_LOGIC_CURRENT_DATETIME = "current_datetime"
JSON_LOGIC_CURRENT_TIME = "current_time"
JSON_LOGIC_CURRENT_DATE = "current_date"


@dataclass
class Followup:
    """A `WorkflowFollowup`, as the app gets it."""

    id: int
    order: int
    condition: Any
    form_ids: List[str]


@dataclass
class OfferedFollowup:
    followup: Followup
    result: ConditionResult


@dataclass
class NextForms:
    form_ids: List[str]
    followups: List[OfferedFollowup]
    errors: List[str] = field(default_factory=list)


def clock_variables(now: datetime.datetime) -> Dict[str, int]:
    """`EvaluateLogic`: `current_datetime` (epoch ms), `current_time` (seconds since midnight), `current_date` (epoch
    ms at midnight), in the time zone of `now`."""
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return {
        JSON_LOGIC_CURRENT_DATETIME: int(now.timestamp() * 1000),
        JSON_LOGIC_CURRENT_TIME: now.hour * 3600 + now.minute * 60 + now.second,
        JSON_LOGIC_CURRENT_DATE: int(midnight.timestamp() * 1000),
    }


def next_forms(
    profile: Dict[str, Any],
    profile_questions: Dict[str, dict],
    followups: List[Followup],
    now: datetime.datetime,
) -> NextForms:
    """`GetFollowUpForms`: every followup whose condition holds offers its forms, in the order of the list - the
    app doesn't sort on `order`. A condition the app couldn't evaluate is reported in `errors` (the app would fail)."""
    errors: List[str] = []
    try:
        data = device_data(profile, profile_questions, now.tzinfo or datetime.timezone.utc)
    except DeviceValueError as e:
        return NextForms([], [], [f"Profile: {e}"])
    data.update(clock_variables(now))
    offered: List[OfferedFollowup] = []
    form_ids: List[str] = []
    for followup in followups:
        result = evaluate_condition(followup.condition, data)
        offered.append(OfferedFollowup(followup, result))
        if result.error:
            errors.append(f"Followup {followup.id} (order {followup.order}): {result.error}")
        elif result.value:
            form_ids += [form_id for form_id in followup.form_ids if form_id not in form_ids]
    return NextForms(form_ids, offered, errors)


def prefill(profile: Dict[str, Any], form_questions: Dict[str, dict], context: Dict[str, Any]) -> Dict[str, Any]:
    """PRE_FILLED_ANSWERS then the org unit values: each profile answer goes to the question of the same name, or
    else to `_name`; the context (`current_ou_id`...) to the question of the same name only."""
    prefilled: Dict[str, Any] = {}
    for name, value in profile.items():
        if value in (None, ""):
            continue
        if name in form_questions:
            prefilled[name] = value
        elif f"_{name}" in form_questions:
            prefilled[f"_{name}"] = value
    for name, value in context.items():
        if name in form_questions:
            prefilled[name] = value
    return prefilled


@dataclass
class Change:
    source: str
    target: str
    before: Any
    after: Any


def apply_changes(
    profile: Dict[str, Any], mapping: Dict[str, str], submission: Dict[str, Any]
) -> Tuple[Dict[str, Any], List[Change]]:
    """`UpdateEntity`: each mapped answer of the followup (`{followup question: profile question}`) is copied into
    the profile. An unanswered one leaves the profile's value as it is (what the uploaded XML keeps)."""
    updated = dict(profile)
    changes: List[Change] = []
    for source, target in mapping.items():
        value = submission.get(source)
        if value in (None, ""):
            continue
        changes.append(Change(source, target, profile.get(target), value))
        updated[target] = value
    return updated, changes
