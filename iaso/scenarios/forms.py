"""Filling forms and checking them, shared by both kinds of scenarios - and the runner of form scenarios
(`"kind": "form"`): each step fills the form with the app's engine (`form_engine`) and checks what it gives or that it
refuses the answers.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from django.db.models import Exists, OuterRef, QuerySet

from iaso.models import Account, Form, FormVersion, Project, ScenarioStatus, StepStatus
from iaso.scenarios import form_engine
from iaso.scenarios.form_engine import FormEngineError, FormFill, FormProblem
from iaso.scenarios.runtime import prefill
from iaso.scenarios.schema import EntityScenario, FillStep, FormExpect, FormScenario, Refusal


def _label(label: Any) -> str:
    """A question's label: text, or one text per language (the first one is taken)."""
    if isinstance(label, dict):
        return next((str(text) for text in label.values() if text), "")
    return str(label) if label else ""


# XLSForm types -> the editor's: what a person types or picks (no calculate, note, group, hidden...)
_FILLABLE_TYPES = {
    "text": "text",
    "string": "text",
    "integer": "integer",
    "int": "integer",
    "decimal": "decimal",
    "date": "date",
    "datetime": "datetime",
    "time": "time",
    "select one": "select_one",
    "select_one": "select_one",
    "select all that apply": "select_multiple",
    "select_multiple": "select_multiple",
}


def _is_true(value: Any) -> bool:
    return str(value).strip().lower() in ("yes", "true", "true()", "1")


def fillable_questions(questions: Dict[str, dict]) -> List[Dict[str, Any]]:
    """The questions a person answers, in the form's order, for the scenario editor: no calculate, note, group or
    read-only question. `relevant`: when it is asked (its XPath), empty when always."""
    fillable = []
    for name, question in questions.items():
        kind = _FILLABLE_TYPES.get(question.get("type", ""))
        bind = question.get("bind") or {}
        if kind is None or _is_true(bind.get("readonly")):
            continue
        choices = question.get("choices") or question.get("children") or []
        fillable.append(
            {
                "name": name,
                "label": _label(question.get("label")) or name,
                "type": kind,
                "required": _is_true(bind.get("required")),
                "relevant": str(bind.get("relevant", "")),
                "choices": [
                    {"name": str(choice["name"]), "label": _label(choice.get("label")) or str(choice["name"])}
                    for choice in choices
                    if "name" in choice
                ],
            }
        )
    return fillable


def account_forms(account: Account) -> "QuerySet[Form]":
    """The forms of the account's projects (not deleted)."""
    return Form.objects.filter(Exists(Project.objects.filter(account=account, forms=OuterRef("pk"))))


class FormSource:
    """The forms of the scenarios, by `form_id`, among the account's forms: their latest version's questions and
    XForm, loaded once. A `form_id` used by two different forms of the account is ambiguous: no form."""

    def __init__(self, account: Account):
        self.account = account
        self._versions: Dict[str, Optional[FormVersion]] = {}
        self._ambiguous: Dict[str, List[Form]] = {}
        self._questions: Dict[str, Dict[str, dict]] = {}
        self._xforms: Dict[str, bytes] = {}

    def version(self, form_id: str) -> Optional[FormVersion]:
        if form_id not in self._versions:
            forms = list(account_forms(self.account).filter(form_id=form_id).order_by("id")[:2])
            if len(forms) > 1:
                self._ambiguous[form_id] = forms
            form = forms[0] if len(forms) == 1 else None
            self._versions[form_id] = form.form_versions.order_by("-created_at", "-id").first() if form else None
        return self._versions[form_id]

    def describe(self, form_id: str) -> Dict[str, Any]:
        """The form's name and its questions' labels (by question name), for people; empty when not found."""
        version = self.version(form_id)
        if version is None:
            return {"name": "", "labels": {}}
        labels = {name: _label(question.get("label")) for name, question in self.questions(form_id).items()}
        return {"name": version.form.name, "labels": {name: label for name, label in labels.items() if label}}

    def editor_form(self, form_id: str) -> Optional[Dict[str, Any]]:
        """The form as the scenario editor shows it: its name, the questions to answer and the labels of all its
        questions (the hidden ones too: the entity's information); None when not found."""
        if self.version(form_id) is None:
            return None
        return {
            "form_id": form_id,
            "name": self.version(form_id).form.name,
            "questions": fillable_questions(self.questions(form_id)),
            "labels": self.describe(form_id)["labels"],
        }

    def not_found(self, form_id: str) -> str:
        """Why the form can't be filled (`questions` is empty)."""
        if form_id in self._ambiguous:
            names = " and ".join(f"'{form.name}' (#{form.id})" for form in self._ambiguous[form_id])
            return f"Several forms of the account have the form_id '{form_id}': {names}"
        return f"No form '{form_id}' (or it has no version)"

    def questions(self, form_id: str) -> Dict[str, dict]:
        """The questions of the form's latest version, by name; empty when there's no such form."""
        if form_id not in self._questions:
            version = self.version(form_id)
            self._questions[form_id] = version.questions_by_name() if version else {}
        return self._questions[form_id]

    def xform(self, form_id: str) -> bytes:
        if form_id not in self._xforms:
            with self.version(form_id).file.open("rb") as xform_file:
                self._xforms[form_id] = xform_file.read()
        return self._xforms[form_id]


@dataclass
class StepResult:
    index: int
    step: FillStep
    status: StepStatus = StepStatus.OK
    prefilled: Dict[str, Any] = field(default_factory=dict)
    problems: List[FormProblem] = field(default_factory=list)
    submission: Dict[str, Optional[str]] = field(default_factory=dict)
    failures: List[str] = field(default_factory=list)


@dataclass
class ScenarioResult:
    scenario: Union[EntityScenario, FormScenario]
    steps: List[StepResult]

    @property
    def passed(self) -> bool:
        return len(self.steps) == len(self.scenario.steps) and all(step.status == StepStatus.OK for step in self.steps)

    @property
    def status(self) -> ScenarioStatus:
        if self.passed:
            return ScenarioStatus.PASSED
        if any(step.status == StepStatus.ERROR for step in self.steps):
            return ScenarioStatus.ERROR
        return ScenarioStatus.FAILED

    @property
    def failed_step(self) -> Optional[int]:
        return next((step.index for step in self.steps if step.status != StepStatus.OK), None)

    @property
    def failures(self) -> List[str]:
        return [f"Step {step.index}: {failure}" for step in self.steps for failure in step.failures]


def refusals(expected: List[Refusal]) -> List[str]:
    return sorted(f"{refusal.question}: {refusal.code}" for refusal in expected)


def fill_and_check(
    source: FormSource, form_id: str, result: StepResult, expect: FormExpect, prefilled: Dict[str, str]
) -> Optional[FormFill]:
    """Fills the form with the step's answers and checks `expect` (refusals, submission). The fill when the form
    accepts the answers, None when it refuses them or can't be filled - `result` says why."""
    result.prefilled = prefilled
    try:
        filled = form_engine.fill(source.xform(form_id), prefilled, result.step.answers)
    except FormEngineError as e:
        result.status = StepStatus.ERROR
        result.failures.append(str(e))
        return None

    if filled.problems:
        result.problems = filled.problems
        found = sorted(f"{(problem.path or '').split('/')[-1]}: {problem.code}" for problem in filled.problems)
        details = "\n".join(
            f"  {problem.path}: {problem.code} - {problem.message}"
            + (f" (answer: {problem.answer!r})" if problem.answer is not None else "")
            for problem in filled.problems
        )
        if expect.refused is None:
            result.status = StepStatus.REFUSED
            result.failures.append(f"The form refuses the answers:\n{details}")
        elif found != refusals(expect.refused):
            result.status = StepStatus.FAILED
            result.failures.append(f"The form should refuse {refusals(expect.refused)}, it refuses {found}:\n{details}")
        return None

    if expect.refused is not None:
        result.failures.append(f"The form should refuse {refusals(expect.refused)}, it accepts the answers")
    result.submission = filled.values
    for name, expected in expect.submission.items():
        actual = filled.values.get(name)
        if actual != expected:
            result.failures.append(f"'{name}' should be {expected!r} in the form, was {actual!r}")
    if result.failures:
        result.status = StepStatus.FAILED
    return filled


class FormScenarioRunner:
    """Runs form scenarios: each step is an independent fill of the scenario's form, all of them run."""

    def __init__(self, source: FormSource):
        self.source = source

    def run(self, scenario: FormScenario) -> ScenarioResult:
        questions = self.source.questions(scenario.form)
        results = []
        for index, step in enumerate(scenario.steps, start=1):
            result = StepResult(index, step)
            if not questions:
                result.status = StepStatus.ERROR
                result.failures.append(self.source.not_found(scenario.form))
            else:
                context = {**scenario.context, **step.context}
                fill_and_check(self.source, scenario.form, result, step.expect, prefill({}, questions, context))
            results.append(result)
        return ScenarioResult(scenario, results)
