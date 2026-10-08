"""A markdown report of scenario results, for humans: a summary, then each scenario's steps - for a failing step,
everything needed to understand it: the failures, the answers, what was prefilled, the form as filled, the copy
rules applied, the profile, and each followup's condition with the values it read.
"""

import datetime
import json

from typing import Any, Dict, List, Optional

from iaso.scenarios.entities import EntityStepResult
from iaso.scenarios.forms import ScenarioResult, StepResult
from iaso.scenarios.runtime import NextForms
from iaso.scenarios.schema import EntityScenario


def _cell(value: Any) -> str:
    if value is None:
        return "*empty*"
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    return f"`{text}`".replace("|", "\\|") if text != "" else '`""`'


def _table(rows: List[List[str]], header: List[str]) -> List[str]:
    if not rows:
        return ["*none*", ""]
    lines = ["| " + " | ".join(header) + " |", "|" + "|".join("---" for _ in header) + "|"]
    lines += ["| " + " | ".join(row) + " |" for row in rows]
    return lines + [""]


def _values(values: Dict[str, Any], changed: Optional[Dict[str, Any]] = None) -> List[str]:
    """`changed`: question -> its value before this step, for the ones this step changed."""
    rows = []
    for name, value in values.items():
        row = [f"`{name}`", _cell(value)]
        if changed is not None:
            row.append(f"was {_cell(changed[name])}" if name in changed else "")
        rows.append(row)
    return _table(rows, ["question", "value"] + (["changed in this step"] if changed is not None else []))


def _next_forms(next_: NextForms) -> List[str]:
    rows = []
    for offered in next_.followups:
        result = offered.result
        verdict = f"**error**: {result.error}" if result.error else ("yes" if result.value else "no")
        read = ", ".join(f"`{name}` = {_cell(value)}" for name, value in result.read.items()) or "-"
        rows.append(
            [
                f"{offered.followup.id} (order {offered.followup.order})",
                f"`{json.dumps(offered.followup.condition, ensure_ascii=False)}`".replace("|", "\\|"),
                read,
                verdict,
                ", ".join(offered.followup.form_ids),
            ]
        )
    lines = [f"Offered: **{', '.join(next_.form_ids) or 'nothing'}**", ""]
    return lines + _table(rows, ["followup", "condition", "values read (as the app types them)", "true?", "forms"])


def _step(result: StepResult, scenario_form: Optional[str], detailed: bool) -> List[str]:
    form = getattr(result.step, "form", None) or scenario_form
    lines = [f"### Step {result.index} · `{form}` — {result.status}", ""]
    if result.step.description:
        lines += [f"*{result.step.description}*", ""]
    if result.failures:
        lines += ["**What went wrong**", ""]
        # the first line of each failure: its details are the tables below
        lines += [f"- {failure.splitlines()[0].rstrip(':')}" for failure in result.failures]
        lines.append("")
    if not detailed:
        return lines

    lines += ["<details open><summary>Answers given</summary>", ""] + _values(result.step.answers) + ["</details>", ""]
    if result.prefilled:
        lines += ["<details><summary>Prefilled (profile, context)</summary>", ""] + _values(result.prefilled)
        lines += ["</details>", ""]
    if result.problems:
        rows = [
            [f"`{problem.path}`", problem.code, problem.message, _cell(problem.answer)] for problem in result.problems
        ]
        lines += ["**The form refuses**", ""] + _table(rows, ["question", "code", "message", "answer"])
    if result.submission:
        lines += ["<details><summary>The form as filled</summary>", ""] + _values(result.submission)
        lines += ["</details>", ""]
    if isinstance(result, EntityStepResult):
        if result.changes:
            rows = [
                [f"`{change.source}`", f"`{change.target}`", _cell(change.before), _cell(change.after)]
                for change in result.changes
            ]
            lines += ["**Copy rules applied**", ""] + _table(
                rows, ["from the form", "to the profile", "before", "after"]
            )
        lines += ["<details><summary>Profile after the step</summary>", ""]
        lines += _values(result.profile, {change.target: change.before for change in result.changes})
        lines += ["</details>", ""]
        if result.status == "not_offered" and result.offered_before is not None:
            lines += ["**Forms offered at this point**", ""] + _next_forms(result.offered_before)
        elif result.next is not None and result.next is not result.offered_before:
            lines += ["**Forms offered next**", ""] + _next_forms(result.next)
    return lines


def markdown_report(results: List[ScenarioResult], now: Optional[datetime.datetime] = None) -> str:
    """The report of these results. Passing scenarios are summed up, failing ones detailed step by step."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    failed = [result for result in results if not result.passed]
    lines = [
        "# Scenario report",
        "",
        f"{now:%Y-%m-%d %H:%M %Z} · {len(results)} scenarios · {len(results) - len(failed)} passed · "
        f"**{len(failed)} failed**",
        "",
    ]
    rows = []
    for result in results:
        scenario = result.scenario
        stopped = next((step for step in result.steps if step.status != "ok"), None)
        verdict = "passed" if result.passed else f"**failed** at step {stopped.index if stopped else '?'}"
        run = f"{len(result.steps)}/{len(scenario.steps)}"
        rows.append([scenario.name, scenario.kind, verdict, run])
    lines += _table(rows, ["scenario", "kind", "result", "steps run"])

    for result in results:
        scenario = result.scenario
        verdict = "passed" if result.passed else "FAILED"
        lines += [f"## {scenario.name} — {verdict}", ""]
        subject = "entity workflow" if isinstance(scenario, EntityScenario) else f"form `{scenario.form}`"
        lines += [f"Kind: {scenario.kind} ({subject})", ""]
        if scenario.description:
            lines += [f"> {scenario.description}", ""]
        scenario_form = getattr(scenario, "form", None)
        for step in result.steps:
            lines += _step(step, scenario_form, detailed=step.status != "ok")
        not_run = scenario.steps[len(result.steps) :]
        for index, step in enumerate(not_run, start=len(result.steps) + 1):
            form = getattr(step, "form", None) or scenario_form
            lines += [f"### Step {index} · `{form}` — not run", ""]
    return "\n".join(lines).rstrip() + "\n"
