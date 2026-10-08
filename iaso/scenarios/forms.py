"""Filling forms and checking them, shared by both kinds of scenarios - and the runner of form scenarios
(`"kind": "form"`): each step fills the form with the app's engine (`form_engine`) and checks what it gives or that it
refuses the answers.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from iaso.models import Form, FormVersion
from iaso.scenarios import form_engine
from iaso.scenarios.form_engine import FormEngineError, FormFill, FormProblem
from iaso.scenarios.runtime import prefill
from iaso.scenarios.schema import EntityScenario, FillStep, FormExpect, FormScenario, Refusal


class FormSource:
    """The forms of the scenarios, by `form_id`: their latest version's questions and XForm, loaded once."""

    def __init__(self):
        self._versions: Dict[str, Optional[FormVersion]] = {}
        self._questions: Dict[str, Dict[str, dict]] = {}
        self._xforms: Dict[str, bytes] = {}

    def version(self, form_id: str) -> Optional[FormVersion]:
        if form_id not in self._versions:
            form = Form.objects.filter(form_id=form_id).first()
            self._versions[form_id] = form.form_versions.order_by("-created_at").first() if form else None
        return self._versions[form_id]

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
    """`status`: ok, failed (an expectation isn't met), refused (the form refuses the answers, unexpectedly), error
    (the step can't run) - and for entity steps not_offered."""

    index: int
    step: FillStep
    status: str = "ok"
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
        return len(self.steps) == len(self.scenario.steps) and all(step.status == "ok" for step in self.steps)

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
        result.status = "error"
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
            result.status = "refused"
            result.failures.append(f"The form refuses the answers:\n{details}")
        elif found != refusals(expect.refused):
            result.status = "failed"
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
        result.status = "failed"
    return filled


class FormScenarioRunner:
    """Runs form scenarios: each step is an independent fill of the scenario's form, all of them run."""

    def __init__(self, source: Optional[FormSource] = None):
        self.source = source or FormSource()

    def run(self, scenario: FormScenario) -> ScenarioResult:
        questions = self.source.questions(scenario.form)
        results = []
        for index, step in enumerate(scenario.steps, start=1):
            result = StepResult(index, step)
            if not questions:
                result.status = "error"
                result.failures.append(f"No form '{scenario.form}' (or it has no version)")
            else:
                context = {**scenario.context, **step.context}
                fill_and_check(self.source, scenario.form, result, step.expect, prefill({}, questions, context))
            results.append(result)
        return ScenarioResult(scenario, results)
