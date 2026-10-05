import typing

from django.utils.html import strip_tags

from iaso.models import WorkflowChange, WorkflowFollowup
from iaso.odk import parsing
from iaso.odk.parsing import Survey
from iaso.utils.jsonlogic import variables


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def compute_form_version_diff(
    previous_form_version: typing.Optional["FormVersion"],
    survey: Survey,
) -> dict:
    """Return a diff of questions added/removed/modified between a survey and the previous form version, and what in
    the entity workflows reads the removed or modified ones (`workflow_impacts`, see `compute_workflow_impacts()`)."""
    new_questions_by_name = parsing.to_questions_by_name(survey.to_json())
    new_question_names = set(new_questions_by_name.keys())

    removed_questions = []
    added_questions = []
    modified_questions = []
    previous_version_id = None

    if previous_form_version:
        previous_version_id = previous_form_version.version_id
        current_fields = previous_form_version.possible_fields or []
        current_by_name = {q["name"]: q for q in current_fields}
        current_question_names = set(current_by_name.keys())

        removed_questions = [q for q in current_fields if q["name"] not in new_question_names]

        for name in new_question_names:
            q = new_questions_by_name[name]
            label = q.get("label", "")
            if isinstance(label, dict):
                label = next(iter(label.values()), "")
            new_type = q.get("type", "")

            if name not in current_question_names:
                added_questions.append({"name": name, "label": strip_tags(str(label)), "type": new_type})
            else:
                old_type = current_by_name[name].get("type", "")
                if old_type != new_type:
                    modified_questions.append(
                        {
                            "name": name,
                            "label": strip_tags(str(label)),
                            "old_type": old_type,
                            "new_type": new_type,
                        }
                    )

    workflow_impacts = []
    if previous_form_version:
        changed = {q["name"] for q in removed_questions} | {q["name"] for q in modified_questions}
        workflow_impacts = compute_workflow_impacts(previous_form_version.form_id, changed)

    return {
        "previous_version_id": previous_version_id,
        "removed_questions": removed_questions,
        "added_questions": added_questions,
        "modified_questions": modified_questions,
        "workflow_impacts": workflow_impacts,
    }


def compute_workflow_impacts(form_id: int, question_names: typing.Set[str]) -> typing.List[dict]:
    """What in the entity workflows reads these questions of the form `form_id` - one entry per reference:
    - `follow_up_condition`: a follow-up's condition (JsonLogic, `{"var": "age"}`) reads it, the form being the
      reference form of the workflow's entity type (the entity's attributes);
    - `change_mapping`: a workflow change maps it - from the change's form (the mapping's keys) or to the reference
      form (its values) -, the types of both having to match.

    Deleted workflows and workflow versions left out, the others whatever their status."""
    if not question_names:
        return []
    alive = {"workflow_version__deleted_at": None, "workflow_version__workflow__deleted_at": None}
    related = "workflow_version__workflow__entity_type"
    impacts = []

    followups = WorkflowFollowup.objects.filter(
        workflow_version__workflow__entity_type__reference_form_id=form_id, **alive
    )
    for followup in followups.select_related(related).order_by("workflow_version_id", "order", "id"):
        for name in sorted(set(variables(followup.condition)) & question_names):
            impacts.append(
                _impact(
                    "follow_up_condition",
                    name,
                    followup.workflow_version,
                    follow_up_order=followup.order,
                    follow_up_condition=followup.condition,
                )
            )

    changes = WorkflowChange.objects.filter(form_id=form_id, **alive) | WorkflowChange.objects.filter(
        workflow_version__workflow__entity_type__reference_form_id=form_id, **alive
    )
    for change in changes.select_related(related).order_by("id"):
        reference_form_id = change.workflow_version.workflow.entity_type.reference_form_id
        for source, target in sorted((change.mapping or {}).items()):
            # a change of the reference form into itself can map a question to itself: one entry, not two
            names = {name for name, side in ((source, change.form_id), (target, reference_form_id)) if side == form_id}
            for name in sorted(names & question_names):
                impacts.append(
                    _impact(
                        "change_mapping",
                        name,
                        change.workflow_version,
                        mapping_source=source,
                        mapping_target=target,
                    )
                )
    return impacts


def _impact(kind: str, question: str, workflow_version, **details) -> dict:
    return {
        "kind": kind,
        "question": question,
        "entity_type_id": workflow_version.workflow.entity_type_id,
        "entity_type_name": workflow_version.workflow.entity_type.name,
        "workflow_version_id": workflow_version.id,
        "workflow_version_name": workflow_version.name,
        "workflow_version_status": workflow_version.status,
        "follow_up_order": details.get("follow_up_order"),
        "follow_up_condition": details.get("follow_up_condition"),
        "mapping_source": details.get("mapping_source"),
        "mapping_target": details.get("mapping_target"),
    }
