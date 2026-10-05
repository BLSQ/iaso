import typing

from iaso.models import WorkflowChange, WorkflowFollowup
from iaso.utils.jsonlogic import variables

from .common import ConfigurationImpactKind, impact


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def workflows_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: typing.Set[str],
    modified_question_names: typing.Set[str],
) -> typing.List[dict]:
    """What in the entity workflows reads it (target: the workflow version):
    - `follow_up_condition`: a follow-up's condition (JsonLogic, `{"var": "age"}`) reads it, the form being the
      reference form of the workflow's entity type (the entity's attributes);
    - `change_mapping`: a workflow change maps it - from the change's form (the mapping's keys) or to the reference
      form (its values) -, the types of both having to match.

    Deleted workflows and workflow versions left out, the others whatever their status."""
    form_id = previous_form_version.form_id
    question_names = removed_question_names | modified_question_names
    alive = {"workflow_version__deleted_at": None, "workflow_version__workflow__deleted_at": None}
    related = "workflow_version__workflow__entity_type"
    impacts = []

    followups = WorkflowFollowup.objects.filter(
        workflow_version__workflow__entity_type__reference_form_id=form_id, **alive
    )
    for followup in followups.select_related(related).order_by("workflow_version_id", "order", "id"):
        for name in sorted(set(variables(followup.condition)) & question_names):
            impacts.append(
                _workflow_impact(
                    ConfigurationImpactKind.FOLLOW_UP_CONDITION,
                    name,
                    followup.workflow_version,
                    follow_up_order=followup.order,
                    condition=followup.condition,
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
                    _workflow_impact(
                        ConfigurationImpactKind.CHANGE_MAPPING,
                        name,
                        change.workflow_version,
                        mapping_source=source,
                        mapping_target=target,
                    )
                )
    return impacts


def _workflow_impact(kind: str, question: str, workflow_version, **details) -> dict:
    entity_type = workflow_version.workflow.entity_type
    return impact(
        kind,
        question,
        workflow_version.id,
        f"{entity_type.name} / {workflow_version.name} ({workflow_version.status})",
        entity_type_id=entity_type.id,
        **details,
    )
