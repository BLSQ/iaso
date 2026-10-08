"""Runs entity scenarios (`"kind": "entity"`) - register an entity, fill the followup forms, check what the app would
offer and what the profile becomes - against a workflow version, as the IASO app would, without saving anything.

    {
        "$schema": "./scenario.schema.json",
        "format": "iaso-scenarios/1",
        "kind": "entity",
        "name": "Oedema leads to OTP",
        "steps": [
            {"form": "child_registration", "answers": {"first_name": "Luke", "age_months": "11"},
             "expect": {"next_forms": ["anthropometry"]}},
            {"form": "anthropometry", "answers": {"muac": "12.0", "oedema": "yes"},
             "expect": {"attributes": {"oedema_status": "yes"}, "next_forms": ["anthropometry", "otp_admission"]}}
        ]
    }

Each form is filled and checked as in a form scenario (`forms.fill_and_check`); the workflow's part - forms offered,
prefill, copy rules - is `runtime`'s.
"""

import datetime
import json

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from django.utils import timezone

from iaso.models import WorkflowVersion
from iaso.scenarios.forms import FormSource, ScenarioResult, StepResult, fill_and_check
from iaso.scenarios.runtime import Change, Followup, NextForms, apply_changes, next_forms, prefill
from iaso.scenarios.schema import EntityScenario, EntityStep


@dataclass
class EntityStepResult(StepResult):
    offered_before: Optional[NextForms] = None
    changes: List[Change] = field(default_factory=list)
    profile: Dict[str, Any] = field(default_factory=dict)
    next: Optional[NextForms] = None


def describe_next(next_: NextForms) -> str:
    lines = []
    for offered in next_.followups:
        verdict = "error" if offered.result.error else ("yes" if offered.result.value else "no")
        lines.append(
            f"  followup {offered.followup.id} (order {offered.followup.order}) {verdict}: "
            f"{json.dumps(offered.followup.condition)} with {json.dumps(offered.result.read)} -> "
            f"{offered.followup.form_ids}"
        )
    return "\n".join(lines)


class EntityScenarioRunner:
    """Loads a workflow version's configuration once; `run` replays entity scenarios against it, in memory."""

    def __init__(
        self,
        workflow_version: WorkflowVersion,
        now: Optional[datetime.datetime] = None,
        source: Optional[FormSource] = None,
    ):
        self.workflow_version = workflow_version
        self.reference_form = workflow_version.workflow.entity_type.reference_form
        self.now = now or timezone.now()
        self.source = source or FormSource()
        # the app keeps the list as the API sends it, which has no ordering: by creation, here
        self.followups = [
            Followup(followup.id, followup.order, followup.condition, [form.form_id for form in followup.forms.all()])
            for followup in workflow_version.follow_ups.order_by("id").prefetch_related("forms")
        ]
        self.mappings = {
            change.form.form_id: change.mapping for change in workflow_version.changes.select_related("form")
        }

    def run(self, scenario: EntityScenario) -> ScenarioResult:
        profile: Dict[str, Any] = {}
        offered: Optional[NextForms] = None
        results: List[StepResult] = []
        for index, step in enumerate(scenario.steps, start=1):
            result = self._run_step(index, step, profile, offered)
            results.append(result)
            if result.status in ("not_offered", "refused", "error"):
                break
            profile, offered = result.profile, result.next
        return ScenarioResult(scenario, results)

    def _run_step(
        self, index: int, step: EntityStep, profile: Dict[str, Any], offered: Optional[NextForms]
    ) -> EntityStepResult:
        # nothing saved unless the form accepts the answers: the profile and the forms offered stay as they were
        result = EntityStepResult(index, step, offered_before=offered, profile=profile, next=offered)
        reference_form_id = self.reference_form.form_id
        form_questions = self.source.questions(step.form)
        if not form_questions:
            result.status = "error"
            result.failures.append(f"No form '{step.form}' (or it has no version)")
            return result
        # no entity yet (first step, or its registration refused): this step registers it
        registering = offered is None
        if registering and step.form != reference_form_id:
            result.status = "error"
            result.failures.append(
                f"The entity isn't registered yet: the step must fill '{reference_form_id}', not '{step.form}'"
            )
            return result
        if not registering and not step.force and step.form not in offered.form_ids:
            result.status = "not_offered"
            result.failures.append(
                f"'{step.form}' isn't offered, the app offers {offered.form_ids}:\n{describe_next(offered)}"
            )
            return result

        prefilled = prefill({} if registering else profile, form_questions, step.context)
        filled = fill_and_check(self.source, step.form, result, step.expect, prefilled)
        if filled is None:
            return result

        answered = {name: value for name, value in filled.values.items() if value is not None}
        if registering or step.form == reference_form_id:
            result.profile = answered
        else:
            result.profile, result.changes = apply_changes(profile, self.mappings.get(step.form, {}), answered)

        result.next = next_forms(
            result.profile, self.source.questions(reference_form_id), self.followups, step.at or self.now
        )
        if result.next.errors:
            result.status = "error"
            result.failures += [f"The app would fail: {error}" for error in result.next.errors]
            return result

        self._check(result)
        return result

    def _check(self, result: EntityStepResult):
        expect = result.step.expect
        if expect.next_forms is not None and result.next.form_ids != expect.next_forms:
            result.failures.append(
                f"Forms offered next should be {expect.next_forms}, were {result.next.form_ids}:\n"
                f"{describe_next(result.next)}"
            )
        for name, expected in expect.attributes.items():
            actual = result.profile.get(name)
            if (None if actual in (None, "") else str(actual)) != (None if expected is None else str(expected)):
                change = next((change for change in result.changes if change.target == name), None)
                origin = f" (copied from '{change.source}')" if change else " (no copy rule changed it in this step)"
                result.failures.append(f"'{name}' should be {expected!r}, was {actual!r}{origin}")
        if result.failures:
            result.status = "failed"
