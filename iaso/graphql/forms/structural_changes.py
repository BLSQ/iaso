"""The structural changes of a new form version the data already collected or configured may not fit, as
`FormVersionWarning`s: those `compute_form_version_diff` finds against the latest version - the preview endpoint's
(`POST /api/formversions/preview/`) - with a message each. The questions removed or changing type (the added ones are
harmless), then what in the entity workflows reads them (`compute_workflow_impacts`)."""

from typing import Dict, List

from iaso.models import Form, FormVersion
from iaso.odk import parsing
from iaso.odk.diff import compute_form_version_diff


Warning = Dict[str, str]


def structural_warnings(form: Form, survey: parsing.Survey) -> List[Warning]:
    diff = compute_form_version_diff(FormVersion.objects.latest_version(form), survey)
    #: question name -> what happens to it, in the workflows' messages
    changes: Dict[str, str] = {}
    warnings = []
    for question in diff["removed_questions"]:
        changes[question["name"]] = "is removed"
        warnings.append(
            {
                "code": "QUESTION_REMOVED",
                "message": f"Question {question['name']!r} ({question.get('type')}) is removed: the answers already "
                "collected to it are no longer part of the form",
                "question": question["name"],
            }
        )
    for question in diff["modified_questions"]:
        changes[question["name"]] = f"changes type, {question['old_type']} -> {question['new_type']}"
        warnings.append(
            {
                "code": "QUESTION_TYPE_CHANGED",
                "message": f"Question {question['name']!r} changes type, {question['old_type']} -> "
                f"{question['new_type']}: the answers already collected may not fit",
                "question": question["name"],
            }
        )
    for impact in diff["workflow_impacts"]:
        name = impact["question"]
        workflow = (
            f"workflow version {impact['workflow_version_name']!r} ({impact['workflow_version_status']}) of entity "
            f"type {impact['entity_type_name']!r}"
        )
        if impact["kind"] == "follow_up_condition":
            code = "WORKFLOW_CONDITION"
            reads = f"the condition of follow-up {impact['follow_up_order']} of {workflow} reads it"
        else:
            code = "WORKFLOW_MAPPING"
            reads = f"a change of {workflow} maps {impact['mapping_source']!r} to {impact['mapping_target']!r}"
        warnings.append({"code": code, "message": f"Question {name!r} {changes[name]}, but {reads}", "question": name})
    return warnings
