import typing

from django.utils.html import strip_tags

from iaso.odk import parsing
from iaso.odk.parsing import Survey


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def compute_form_version_diff(
    previous_form_version: typing.Optional["FormVersion"],
    survey: Survey,
) -> dict:
    """Return a diff of questions added/removed/modified between a survey and the previous form version."""
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

    return {
        "previous_version_id": previous_version_id,
        "removed_questions": removed_questions,
        "added_questions": added_questions,
        "modified_questions": modified_questions,
    }
