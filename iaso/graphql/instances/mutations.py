"""Writes on a submission, one mutation per kind of change: its period, its org unit, its answers. The checks of
their v1 counterparts - `PATCH /api/instances/<id>/` for the period and the org unit, the Enketo edit (here
JavaRosa through odk_cli, see `iaso.odk.instance_editor`) for the answers - and the same audit log entry (a
`Modification` from `instance_api`).

Each returns an `InstancePayload`: the submission as saved (any `Instance` field selectable), or every problem found
in `errors` (`..errors`) and nothing saved. Each runs in its own savepoint: the next mutations of the operation still
run (one after the other, in order)."""

import os

from copy import deepcopy
from typing import Dict, List, Optional

from ariadne import MutationType
from django.core.files.base import ContentFile
from graphql import GraphQLError, GraphQLResolveInfo

from hat.audit.models import INSTANCE_API, log_modification
from iaso import periods
from iaso.models import Instance
from iaso.odk.instance_editor import InstanceEditError, InstanceEditorUnavailable, edit_instance
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_UPDATE_PERMISSION

from ..common import requesting_user, selection_tree, visible_org_unit
from ..errors import Errors, Refused, payload
from .resolvers import instances_of
from .selection import load_selected


#: answers can come as variables, which `MAX_TOKENS` doesn't bound
MAX_ANSWERS = 1_000

#: odk_cli's codes about the question answered (`field: [..., "path"]`), the others about the value
QUESTION_CODES = {"UNKNOWN_QUESTION", "NOT_A_QUESTION", "READ_ONLY", "NOT_RELEVANT"}

mutation = MutationType()


def editable_instance(info: GraphQLResolveInfo, id: int) -> Instance:
    """The submission, locked until the end of the request: two edits of the same submission run one after the
    other, the second one seeing the first one's changes."""
    user = requesting_user(info)
    if not user.has_perm(CORE_SUBMISSIONS_UPDATE_PERMISSION.full_name()):
        raise GraphQLError("You do not have permission to edit submissions.", extensions={"code": "FORBIDDEN"})
    errors = Errors()
    try:
        instance = instances_of(user).select_related("form", "org_unit").select_for_update(of=("self",)).get(pk=id)
    except Instance.DoesNotExist:
        errors.add("NOT_FOUND", f"Submission {id} does not exist", ["id"])
        errors.raise_if_any()
    if instance.deleted:
        errors.add("NOT_EDITABLE", f"Submission {id} is deleted: restore it first", ["id"])
    elif instance.form is None:
        errors.add("NOT_EDITABLE", f"Submission {id} has no form", ["id"])
    elif not instance.can_user_modify(user):
        errors.add("NOT_EDITABLE", f"Submission {id} is locked by a user above you in the pyramid", ["id"])
    errors.raise_if_any()
    return instance


def saved(info: GraphQLResolveInfo, original: Instance, instance: Instance) -> Instance:
    user = info.context["request"].user
    instance.last_modified_by = user
    instance.save()
    log_modification(original, instance, INSTANCE_API, user=user)
    # read back like `instance(id:)`: the annotated fields (`status`, `location`...) as they are now
    selected = selection_tree(info).get("submission") or {}
    return load_selected(instances_of(user), selected).order_by().get(pk=instance.pk)


@mutation.field("updateSubmissionPeriod")
@payload("submission")
def resolve_update_period(_, info: GraphQLResolveInfo, id: int, period: str):
    instance = editable_instance(info, id)
    original = deepcopy(instance)
    errors = Errors()
    expected = instance.form.period_type
    if not expected:
        errors.add(
            "NOT_EDITABLE", f"Form {instance.form_id} has no period type: its submissions have no period", ["period"]
        )
        errors.raise_if_any()
    try:
        periods.Period.from_string(period).start_date()  # the parts in range: no `202413`
    except (ValueError, KeyError, IndexError):
        errors.add("INVALID", f"Invalid period {period!r}", ["period"])
        errors.raise_if_any()
    if periods.detect(period) != expected:
        errors.add("INVALID", f"Form {instance.form_id} expects a {expected} period, got {period!r}", ["period"])
    errors.raise_if_any()
    instance.period = period
    return saved(info, original, instance)


@mutation.field("updateSubmissionOrgUnit")
@payload("submission")
def resolve_update_org_unit(_, info: GraphQLResolveInfo, id: int, orgUnitId: int):
    instance = editable_instance(info, id)
    original = deepcopy(instance)
    errors = Errors()
    try:
        org_unit = visible_org_unit(info.context["request"].user, orgUnitId, "org_unit_type_id")
    except GraphQLError as error:
        errors.add("NOT_FOUND", error.message, ["orgUnitId"])
        errors.raise_if_any()
    if org_unit.id != instance.org_unit_id:
        if not instance.form.org_unit_types.filter(pk=org_unit.org_unit_type_id).exists():
            errors.add(
                "INVALID",
                f"Org unit {orgUnitId}'s type isn't one of form {instance.form_id}'s",
                ["orgUnitId"],
            )
            errors.raise_if_any()
        if instance.org_unit is not None:
            # a reference instance describes its org unit: it no longer does
            instance.unflag_reference_instance(instance.org_unit)
        instance.org_unit = org_unit
    return saved(info, original, instance)


@mutation.field("updateSubmissionContent")
@payload("submission")
def resolve_update_content(_, info: GraphQLResolveInfo, id: int, answers: List[Dict[str, Optional[str]]]):
    errors = Errors()
    if len(answers) > MAX_ANSWERS:
        errors.add("INVALID", f"At most {MAX_ANSWERS} answers at once", ["answers"])
        errors.raise_if_any()
    first_index: Dict[str, int] = {}
    for index, answer in enumerate(answers):
        if answer["path"] in first_index:
            errors.add(
                "INVALID",
                f"{answer['path']} answered more than once",
                ["answers", index, "path"],
                question=answer["path"],
            )
        first_index.setdefault(answer["path"], index)
    errors.raise_if_any()

    instance = editable_instance(info, id)
    original = deepcopy(instance)
    if not instance.file:
        errors.add("NOT_EDITABLE", f"Submission {id} has no XML file", ["id"])
    elif instance.form_version is None or not instance.form_version.file:
        errors.add("NOT_EDITABLE", f"Submission {id} has no form version: its form definition is unknown", ["id"])
    errors.raise_if_any()

    csvs = {
        attachment.name: read(attachment.file)
        for attachment in instance.form.attachments.filter(name__iendswith=".csv")
    }
    try:
        xml = edit_instance(
            read(instance.form_version.file),
            read(instance.file),
            {answer["path"]: answer.get("value") for answer in answers},
            csvs,
        )
    except InstanceEditError as error:
        raise Refused(answer_errors(error, first_index))
    except InstanceEditorUnavailable as error:
        raise GraphQLError(f"Submissions can't be edited: {error}", extensions={"code": "SERVICE_UNAVAILABLE"})

    # a new file: the previous one stays in the storage, as after an Enketo edit
    instance.file.save(os.path.basename(instance.file.name), ContentFile(xml), save=False)
    previous_location = (instance.json or {}).get(instance.form.location_field)
    instance.get_and_save_json_of_xml(force=True, save=False, xml_content=xml)
    if instance.form.location_field and instance.json.get(instance.form.location_field) != previous_location:
        # answered, or recomputed from the answers
        instance.location, instance.accuracy = None, None
        instance.convert_location_from_field(save=False)
    return saved(info, original, instance)


def answer_errors(error: InstanceEditError, answer_index: Dict[str, int]) -> List[dict]:
    """odk_cli's problems, located in the input: the answer to the question at fault, else `answers` as a whole (a
    question whose constraint the new answers break), else `id` (the submission itself)."""
    errors = Errors()
    for problem in error.problems:
        if problem.path in answer_index:
            part = "path" if problem.code in QUESTION_CODES else "value"
            field = ["answers", answer_index[problem.path], part]
        else:
            field = ["answers"] if problem.path else ["id"]
        # odk_cli's detailed codes are in the message: a client shows it next to the question
        code = "NOT_EDITABLE" if problem.code == "INVALID_SUBMISSION" else "INVALID"
        errors.add(code, problem.message, field, question=problem.path)
    return errors.errors


def read(file) -> bytes:
    with file.open("rb") as opened:
        return opened.read()
