"""Patching a submission: its envelope (org unit, period) and its content, a JSON Merge Patch (RFC 7396) on the flat
content - a name sent is set, `null` clears it, a name absent is untouched; a repeat's list gives its instances by
position, `{}` leaves one as it is, a longer list adds instances, `null` removes one (`null` for the whole repeat: all of
them), before the answers.

`content._version` moves the submission to another version of its form: the answers of questions that version doesn't
have are dropped (`DROPPED` warnings), the questions it adds are answered as any other.

The content goes through odk_cli `edit` (as Collect reopens a submission): what depends on the answers is computed
again, and the submission must be valid afterwards: a problem it already had on a question the patch doesn't answer
(saved before its form changed...) is reported in the warnings, any other one refuses it. The org unit context (`current_ou_name`...) is injected
again, as Enketo does on an edit."""

import logging

from copy import copy
from dataclasses import dataclass, field
from io import BytesIO
from typing import Any, Optional

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

from hat.audit.models import INSTANCE_API, log_modification
from hat.sync.views import create_instance_file
from iaso.api.submissions.creation import (
    Batch,
    SubmissionError,
    attachments_sent,
    check_period,
    find_org_unit,
    form_csvs,
    org_unit_context,
    read_file,
)
from iaso.models import FormVersion, Instance, OrgUnit
from iaso.odk.flat_content import FlatContent, dropped_answers
from iaso.odk.instance_editor import EditProblem, InstanceEditError, edit_instance
from iaso.odk.submission_xml import NoSuchElement, move_to_version, remove_repeat_instances


logger = logging.getLogger(__name__)


@dataclass
class PreparedPatch:
    instance: Instance
    org_unit: Optional[OrgUnit] = None
    period: Optional[str] = None
    period_changed: bool = False
    xml: Optional[bytes] = None
    #: the content once saved: what `dry_run` shows
    json: Optional[dict] = None
    #: the files sent for its binary answers, to attach
    attachments: list[tuple[str, UploadedFile]] = field(default_factory=list)
    warnings: list[SubmissionError] = field(default_factory=list)


def prepare_patch(
    user: User, instance: Instance, data: dict[str, Any], files: Optional[dict[str, UploadedFile]] = None
) -> tuple[Optional[PreparedPatch], list]:
    """`data`: as validated by `SubmissionPatchSerializer`; `files`: those sent with it, by name. The patch ready to
    save, or the problems."""
    errors: list[SubmissionError] = []
    patch = PreparedPatch(instance=instance)
    form = instance.form

    expected = data.get("expected_updated_at")
    if expected is not None and expected != instance.updated_at:
        errors.append(
            SubmissionError(
                "CONFLICT",
                "expected_updated_at",
                "The submission changed since: read it again",
                expected=_iso(instance),
            )
        )
        return None, errors

    if "org_unit_id" in data and data["org_unit_id"] != instance.org_unit_id:
        patch.org_unit = find_org_unit(Batch(user), form, instance.project, data["org_unit_id"], errors)
    if "period" in data:
        patch.period = data["period"] or None
        patch.period_changed = patch.period != instance.period
        check_period(form, patch.period, errors)

    content = data.get("content")
    batch = Batch(user, files or {})
    if content is None and patch.org_unit is None:
        errors += _unused_files(batch)
        return (None, errors) if errors else (patch, [])

    content = content or {}
    form_version = _form_version(instance, content.get("_version"), errors)
    if form_version is None:
        return None, errors
    moved = form_version != instance.form_version
    flat = FlatContent(form_version.get_or_save_form_descriptor())
    answers = flat.to_answers(content)
    errors += [SubmissionError(p.code, p.field, p.message, answer=p.answer) for p in answers.problems]
    if answers.instance_id is not None and answers.instance_id != f"uuid:{instance.uuid}":
        errors.append(
            SubmissionError(
                "INVALID",
                "content.instanceID",
                "A submission's instanceID can't change",
                answer=answers.instance_id,
                expected=f"uuid:{instance.uuid}",
            )
        )
    patch.attachments = _attachments_of_patch(batch, instance, answers.attachments, errors)
    errors += _unused_files(batch)
    if errors:
        return None, errors

    if moved and answers.removed:
        return None, [
            SubmissionError(
                "INVALID",
                answers.removed[0][0],
                "Move the submission to another form version and remove repeat instances in two PATCHes",
            )
        ]
    submission = read_file(instance.file)
    if answers.removed:
        try:
            submission = remove_repeat_instances(submission, [path for _, path in answers.removed])
        except NoSuchElement as missing:
            field_name = next(name for name, path in answers.removed if path == str(missing))
            return None, [SubmissionError("INVALID", field_name, "No such repeat instance in this submission")]
    xform = read_file(form_version.file)
    if moved:
        submission = move_to_version(submission, xform, form_version.version_id)

    org_unit = patch.org_unit or instance.org_unit
    prefilled = org_unit_context(org_unit, flat.names()) if org_unit else {}
    # moved, what the version adds would pass for problems already there: the moved submission must be valid
    existing_problems: Optional[list[EditProblem]] = None if moved else []
    try:
        patch.xml = edit_instance(xform, submission, answers.answers, form_csvs(form), prefilled, existing_problems)
    except InstanceEditError as refusal:
        return None, [
            SubmissionError(p.code, flat.field_of(p.path), p.message, question=p.path, answer=p.answer)
            for p in refusal.problems
        ]

    computed = Instance(form=form).xml_file_to_json(BytesIO(patch.xml))
    patch.json = computed
    refused, ignored = flat.mismatches(answers.held_back, computed)
    if refused:
        return None, [
            SubmissionError(p.code, p.field, p.message, answer=p.answer, expected=p.expected) for p in refused
        ]
    patch.warnings = [
        SubmissionError(p.code, p.field, p.message, answer=p.answer, expected=p.expected) for p in ignored
    ]
    patch.warnings += [
        SubmissionError(
            p.code,
            flat.field_of(p.path),
            f"Already in the submission, left as it is: {p.message}",
            question=p.path,
            answer=p.answer,
        )
        for p in existing_problems or []
    ]
    if moved:
        patch.warnings += [
            SubmissionError("DROPPED", name, "Not in this form version: the answer is dropped", answer=value)
            for name, value in dropped_answers(instance.json or {}, computed)
        ]
    return patch, []


def _attachments_of_patch(
    batch: Batch, instance: Instance, answered: list[tuple[str, str]], errors: list
) -> list[tuple[str, UploadedFile]]:
    """The files sent for the binary answers. An answer can name a file of the submission instead: one it has (as
    `GET` returns it); a file sent must have a name the submission's files don't, so a name never means two files."""
    if not answered:
        return []
    attached = set(instance.instancefile_set.filter(deleted=False).values_list("name", flat=True))
    new = []
    for field_name, file_name in answered:
        if file_name in batch.files and file_name in attached:
            batch.used_files.add(file_name)
            errors.append(
                SubmissionError(
                    "CONFLICT",
                    field_name,
                    "The submission has a file of this name already: send this one under another name",
                    answer=file_name,
                )
            )
        elif file_name not in attached:
            new.append((field_name, file_name))
    return attachments_sent(batch, new, errors)


def _unused_files(batch: Batch) -> list[SubmissionError]:
    # a typo in an answer mustn't lose a file silently
    return [SubmissionError("INVALID", name, "Not the answer of any question") for name in batch.unused_files()]


def _form_version(instance: Instance, version_id: Any, errors: list) -> Optional[FormVersion]:
    """The version the patched submission is of: its own, or the one `_version` moves it to."""
    if version_id is None or str(version_id) == getattr(instance.form_version, "version_id", None):
        form_version = instance.form_version
        if form_version is None or not form_version.file:
            errors.append(SubmissionError("INVALID", "content", "This submission's form version can't be edited"))
            return None
        return form_version
    form_version = FormVersion.objects.find_for_form(instance.form_id, str(version_id))
    if form_version is None or not form_version.file:
        errors.append(
            SubmissionError(
                "UNKNOWN_REFERENCE", "content._version", "No such version of this form", answer=str(version_id)
            )
        )
        return None
    return form_version


def save_patch(patch: PreparedPatch, user: User) -> Instance:
    """In the caller's transaction, the instance locked (`select_for_update`). A new XML file: the previous one stays
    in the storage, as after an Enketo edit."""
    instance = patch.instance
    original = copy(instance)
    if patch.org_unit is not None:
        if original.is_reference_instance:
            # the reference submission of its former org unit no more
            original.unflag_reference_instance(original.org_unit)
            original.org_unit.save()
        instance.org_unit = patch.org_unit
    if patch.period_changed:
        instance.period = patch.period
    if patch.xml is not None:
        instance.file = ContentFile(patch.xml, name=f"{instance.uuid or instance.id}.xml")
        instance.get_and_save_json_of_xml(force=True, save=False, xml_content=patch.xml)
        try:
            instance.convert_location_from_field(save=False)
        except ValueError as error:
            # as on upload (`process_instance_file`): a location question that can't be read isn't the edit's fault
            logger.exception(error)
    instance.last_modified_by = user
    instance.save()
    for name, attachment in patch.attachments:
        create_instance_file(instance, name, attachment)
    log_modification(original, instance, INSTANCE_API, user=user)
    return instance


def _iso(instance: Instance) -> str:
    return instance.updated_at.isoformat()
