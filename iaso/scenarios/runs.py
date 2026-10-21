"""Runs stored scenarios (`Scenario`) and keeps the last result on each: entity scenarios against a workflow version
(by default, their entity type's published one), form scenarios against the account's forms. Nothing else is saved.
"""

import datetime
import json

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from django.utils import timezone
from pydantic import ValidationError

from iaso.models import EntityType, Scenario, ScenarioKind, ScenarioStatus, WorkflowVersion
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.scenarios.clock import xform_at
from iaso.scenarios.entities import EntityScenarioRunner
from iaso.scenarios.form_engine import with_defaults
from iaso.scenarios.forms import FormScenarioRunner, FormSource, ScenarioResult, StepResult
from iaso.scenarios.runtime import NextForms, prefill, search_fields, search_values
from iaso.scenarios.schema import FormScenario, load_scenario


@dataclass
class ScenarioOutcome:
    """A stored scenario's run: `result` is None when it couldn't run at all (`failures` say why)."""

    scenario: Scenario
    status: ScenarioStatus
    failures: List[str] = field(default_factory=list)
    workflow_version: Optional[WorkflowVersion] = None
    result: Optional[ScenarioResult] = None
    # form_id -> {"name", "labels": {question: label}}: the forms filled and offered, to show labels, not names
    forms: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    @property
    def failed_step(self) -> Optional[int]:
        return self.result.failed_step if self.result else None

    @property
    def steps(self) -> List[StepResult]:
        return self.result.steps if self.result else []


def published_version(entity_type: EntityType) -> Optional[WorkflowVersion]:
    return (
        WorkflowVersion.objects.filter(workflow__entity_type=entity_type, status=WorkflowVersionsStatus.PUBLISHED)
        .order_by("-id")
        .first()
    )


def run_scenarios(
    scenarios: List[Scenario],
    workflow_version: Optional[WorkflowVersion] = None,
    now: Optional[datetime.datetime] = None,
) -> List[ScenarioOutcome]:
    """Runs the scenarios; `workflow_version` replaces the published version of the entity scenarios' entity type (the
    caller checks it is theirs). Forms and workflow configurations are loaded once for all scenarios."""
    now = now or timezone.now()
    sources: Dict[int, FormSource] = {}
    runners: Dict[Tuple[int, int], EntityScenarioRunner] = {}
    outcomes = []
    for scenario in scenarios:
        if scenario.account_id not in sources:
            sources[scenario.account_id] = FormSource(scenario.account)
        source = sources[scenario.account_id]
        try:
            definition = load_scenario(json.dumps(scenario.definition))
        except ValidationError as e:
            failure = f"This scenario file needs updating: {e.error_count()} error(s), {e.errors()[0]['msg']}"
            outcomes.append(ScenarioOutcome(scenario, ScenarioStatus.ERROR, [failure]))
            continue

        if isinstance(definition, FormScenario):
            result = FormScenarioRunner(source).run(definition)
            forms = _describe(source, [definition.form])
            outcomes.append(ScenarioOutcome(scenario, result.status, result.failures, result=result, forms=forms))
            continue

        version = workflow_version or published_version(scenario.entity_type)
        if version is None:
            failure = f"'{scenario.entity_type}' has no published workflow version"
            outcomes.append(ScenarioOutcome(scenario, ScenarioStatus.ERROR, [failure]))
            continue
        key = (version.id, scenario.account_id)
        if key not in runners:
            runners[key] = EntityScenarioRunner(version, source, now=now)
        runner = runners[key]
        result = runner.run(definition)
        form_ids = [step.form for step in definition.steps]
        form_ids += [form_id for followup in runner.followups for form_id in followup.form_ids]
        if runner.reference_form is not None:
            form_ids.append(runner.reference_form.form_id)
        forms = _describe(source, form_ids)
        outcomes.append(ScenarioOutcome(scenario, result.status, result.failures, version, result, forms))
    return outcomes


def _describe(source: FormSource, form_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    return {form_id: source.describe(form_id) for form_id in dict.fromkeys(form_ids)}


def save_last_runs(outcomes: List[ScenarioOutcome], results: List[Dict[str, Any]], now: datetime.datetime):
    """Keeps each outcome on its scenario, `results` being the outcomes as the API returns them."""
    scenarios = []
    for outcome, result in zip(outcomes, results):
        scenario = outcome.scenario
        scenario.last_run_at = now
        scenario.last_run_status = outcome.status
        scenario.last_run_workflow_version = outcome.workflow_version
        scenario.last_run_result = result
        scenarios.append(scenario)
    Scenario.objects.bulk_update(
        scenarios, ["last_run_at", "last_run_status", "last_run_workflow_version", "last_run_result"]
    )


class FormNotFound(Exception):
    pass


def prepare_step(
    scenario: Scenario,
    form_id: Optional[str],
    answers: Dict[str, str],
    context: Dict[str, str],
    workflow_version: Optional[WorkflowVersion] = None,
    search: Optional[Dict[str, str]] = None,
    at: Optional[datetime.datetime] = None,
) -> Dict[str, Any]:
    """The next step of a scenario being written (`scenario.definition`: the steps before it, not saved): the XForm
    to fill in web-forms, prefilled from the entity's information after those steps as the phone does, `answers` as
    default answers too (editing a step); and the forms the app offers at that point (entity scenarios). No
    `form_id`: the first form offered - none when the app offers nothing there. Registering: the search the app asks
    for before (its questions; `search`, its values, prefill the form). The forms offered are the app's when the entity
    is opened at `at`, the step's clock (none: now)."""
    source = FormSource(scenario.account)
    profile: Dict[str, Any] = {}
    offered: Optional[List[str]] = None
    next_: Optional[NextForms] = None
    registering = scenario.kind == ScenarioKind.ENTITY and not scenario.definition.get("steps")
    if scenario.kind == ScenarioKind.ENTITY:
        if scenario.definition.get("steps"):
            [outcome] = run_scenarios([scenario], workflow_version)
            last = outcome.steps[-1] if outcome.steps else None
            profile = getattr(last, "profile", None) or {}
            if getattr(last, "next", None) is not None:
                # opened again on this step's day: the follow-ups evaluated then, as in the run
                runner = EntityScenarioRunner(outcome.workflow_version, source)
                next_ = runner.next_forms(profile, at)
            offered = next_.form_ids if next_ else []
        else:
            # no step yet: this one registers the entity
            offered = [scenario.entity_type.reference_form.form_id]
    if scenario.kind == ScenarioKind.FORM:
        form_id = form_id or scenario.definition.get("form")
    form_id = form_id or (offered[0] if offered else None)
    if form_id is None:
        return {
            "form": None,
            "xform": None,
            "prefilled": {},
            "offered": offered,
            "next": next_,
            "profile": profile,
            "search": None,
        }
    questions = source.questions(form_id)
    if not questions:
        raise FormNotFound(source.not_found(form_id))

    # the entity's information, or before registering the search's values (PRE_FILLED_ANSWERS either way)
    prefill_from = profile
    search_step = None
    if registering:
        entity_type = scenario.entity_type
        labels = source.describe(form_id)["labels"]
        fields = search_fields(entity_type.fields_duplicate_search, questions)
        search_step = {
            "questions": [{"name": name, "label": labels.get(name, name)} for name in fields],
            "prevent_add": entity_type.prevent_add_if_duplicate_found,
        }
        # only what the app asks for (the run says when the step searches on something else)
        prefill_from = search_values({name: value for name, value in (search or {}).items() if name in fields})

    context = {**scenario.definition.get("context", {}), **context}
    prefilled = {name: str(value) for name, value in prefill(prefill_from, questions, context).items()}
    # web-forms shows the form as on the step's day: today() is its date
    xform = with_defaults(xform_at(source.xform(form_id), at), {**prefilled, **answers})
    return {
        "form": form_id,
        "xform": xform.decode("utf-8"),
        "prefilled": prefilled,
        "offered": offered,
        "next": next_,
        "profile": profile,
        "search": search_step,
    }
