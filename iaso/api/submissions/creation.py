"""Creating submissions from their flat content: each one checked (envelope, then content through odk_cli, which
builds the XML as ODK Collect would), then all of them saved with the mobile app's code - or none if any is refused.

Validation never writes anything, not even to the storage: a refused batch leaves no trace but its audit."""

import uuid as uuid_module

from dataclasses import dataclass, field
from typing import Any, Optional

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

from hat.api_import.models import APIImport
from hat.audit.models import INSTANCE_API, log_modification
from hat.sync.views import create_instance_file, process_instance_file
from iaso.api.instances.import_cache import InstanceImportCache
from iaso.api.instances.views import import_data
from iaso.api.submissions.common import (
    Batch,
    SubmissionError,
    attachments_sent,
    check_period,
    content_errors,
    find_org_unit,
    form_csvs,
    lock,
    org_unit_context,
    run_form,
    slot_conflict,
    slot_key,
    taken_slot,
    unknown_version,
)
from iaso.models import Entity, EntityType, Form, FormVersion, Instance, OrgUnit, Project
from iaso.odk.flat_content import INSTANCE_ID, FlatContent, same_text, to_xml_text
from iaso.odk.form_files import local_copy
from iaso.odk.instance_editor import new_instance


@dataclass
class PreparedSubmission:
    """A submission checked and built, ready to save - or `unchanged`: already saved with the same content."""

    ref: str
    uuid: str
    form: Form
    form_version: FormVersion
    project: Project
    org_unit: OrgUnit
    period: Optional[str]
    source_created_at: Any
    location: Optional[dict]
    xml: bytes = b""
    #: the flat content sent: compared with a submission saved with its uuid
    content: dict = field(default_factory=dict)
    existing: Optional[Instance] = None
    #: (name, file): the name the answer gives it, the file's own may differ
    attachments: list[tuple[str, UploadedFile]] = field(default_factory=list)
    #: (uuid, entity type id) of the entity it registers or follows
    entity: Optional[tuple[str, int]] = None
    warnings: list[SubmissionError] = field(default_factory=list)

    @property
    def status(self) -> str:
        return "unchanged" if self.existing else "created"

    def as_mobile_instance_data(self) -> dict[str, Any]:
        """The metadata as the mobile app sends them to `POST /api/instances/` (`import_data`)."""
        data = {
            "id": self.uuid,
            "file": f"{self.uuid}.xml",
            "name": self.form.name,
            "formId": self.form.id,
            "orgUnitId": self.org_unit.id,
            "period": self.period,
        }
        if self.entity:
            data["entityUuid"], data["entityTypeId"] = self.entity
        if self.source_created_at:
            data["created_at"] = int(self.source_created_at.timestamp())
        if self.location:
            data.update(
                {
                    "latitude": self.location["latitude"],
                    "longitude": self.location["longitude"],
                    "altitude": self.location.get("altitude") or 0,
                    "accuracy": self.location.get("accuracy"),
                }
            )
        return data


def prepare_submission(batch: Batch, ref: str, data: dict[str, Any]) -> tuple[Optional[PreparedSubmission], list]:
    """`data`: the envelope as validated by `SubmissionCreateSerializer`. The submission built, or the problems."""
    errors: list[SubmissionError] = []
    user = batch.user
    if ref in batch.refs:
        # the results and the files (`<ref>/<name>`) are told apart by it
        return None, [SubmissionError("INVALID", "ref", "Another submission of this request has this ref", answer=ref)]
    batch.refs.add(ref)

    form = batch.cached(
        ("form", data["form_id"]),
        lambda: Form.objects.filter_for_user_and_app_id(user).filter(id=data["form_id"]).first(),
    )
    if form is None:
        return None, [SubmissionError("UNKNOWN_REFERENCE", "form_id", f"Unknown form {data['form_id']}")]

    project = _project(batch, form, data.get("project_id"), errors)
    batch.project = batch.project or project
    org_unit = find_org_unit(batch, form, project, data["org_unit_id"], errors)
    check_period(form, data.get("period"), errors)
    content = data["content"]
    form_version = _form_version(batch, form, content.get("_version"), errors)
    if form_version is None:
        return None, errors

    flat = FlatContent(form_version.get_or_save_form_descriptor())
    answers = flat.to_answers(content)
    errors += content_errors(answers.problems)
    # a repeat absent has no instance: `null` only removes one on PATCH
    errors += [SubmissionError("INVALID", name, "Nothing to remove in a new submission") for name, _ in answers.removed]
    attachments = attachments_sent(batch, answers.attachments, errors, ref)
    submission_uuid = _uuid(batch, data.get("uuid"), answers.instance_id, errors)
    entity = _entity(batch, form, data.get("entity"), errors)
    if form.single_per_period and org_unit is not None and data.get("period"):
        slot = (form.id, org_unit.id, data["period"])
        taken = taken_slot(form, org_unit.id, data["period"], exclude_uuid=submission_uuid)
        if slot in batch.slots:
            errors.append(SubmissionError("CONFLICT", "period", "Another submission of this request has this slot"))
        elif taken:
            errors.append(slot_conflict(taken))
        batch.slots.add(slot)
    if errors or project is None or org_unit is None:
        return None, errors

    prepared = PreparedSubmission(
        ref=ref,
        uuid=submission_uuid,
        form=form,
        form_version=form_version,
        project=project,
        org_unit=org_unit,
        period=data.get("period") or None,
        source_created_at=data.get("source_created_at"),
        location=data.get("location"),
        attachments=attachments,
        entity=entity,
        content=content,
    )
    existing = _existing(batch, prepared, content, errors)
    if errors:
        return None, errors
    if existing:
        prepared.existing = existing
        return prepared, []

    prefilled = {INSTANCE_ID: f"uuid:{submission_uuid}", **org_unit_context(org_unit, flat.names())}
    run, errors = run_form(
        flat,
        answers.held_back,
        form,
        lambda: new_instance(
            local_copy(form_version.file),
            prefilled,
            answers.answers,
            batch.cached(("csvs", form.id), lambda: form_csvs(form)),
        ),
        batch.form_versions_cache,
    )
    if run is None:
        return None, errors
    prepared.xml = run.xml
    prepared.warnings = run.warnings
    return prepared, []


def recheck_under_lock(batch: Batch, submissions: list[PreparedSubmission]) -> dict[str, list[SubmissionError]]:
    """In the saving transaction, before `save_submissions`: each new uuid locked until the transaction ends, then
    checked again - a concurrent request (a client retrying too early) may have saved it since `prepare_submission`
    checked. The problems by ref; a submission saved meanwhile with the same content becomes `unchanged`."""
    new = [submission for submission in submissions if not submission.existing]
    uuids = sorted({submission.uuid for submission in new})
    if not uuids:
        return {}
    single = [submission for submission in new if submission.form.single_per_period and submission.period]
    lock(
        [f"submission_uuid:{submission_uuid}" for submission_uuid in uuids]
        + [slot_key(submission.form.id, submission.org_unit.id, submission.period) for submission in single]
    )
    taken = set(Instance.objects.filter(uuid__in=uuids).values_list("uuid", flat=True))
    problems: dict[str, list[SubmissionError]] = {}
    for submission in new:
        if submission.uuid not in taken:
            continue
        errors: list[SubmissionError] = []
        existing = _existing(batch, submission, submission.content, errors)
        if errors:
            problems[submission.ref] = errors
        elif existing:
            submission.existing = existing
    for submission in single:
        if submission.existing or submission.ref in problems:
            continue
        taken_id = taken_slot(submission.form, submission.org_unit.id, submission.period, exclude_uuid=submission.uuid)
        if taken_id:
            problems[submission.ref] = [slot_conflict(taken_id)]
    return problems


def save_submissions(
    submissions: list[PreparedSubmission], user: User, api_import: Optional[APIImport] = None
) -> list[Instance]:
    """Saves the new submissions as the mobile app's upload does (`import_data` then the XML), in the caller's
    transaction, linked to the request's `api_import`. The instances, in the order of `submissions` (the existing one
    for an unchanged submission)."""
    new = [submission for submission in submissions if not submission.existing]
    cache = InstanceImportCache([submission.uuid for submission in new])
    for project in {submission.project for submission in new}:
        import_data(
            [submission.as_mobile_instance_data() for submission in new if submission.project == project],
            user,
            project.app_id,
            api_import=api_import,
            cache=cache,
        )
    instances = []
    for submission in submissions:
        if submission.existing:
            instances.append(submission.existing)
            continue
        instance = cache.instance(submission.uuid)
        file = ContentFile(submission.xml, name=f"{submission.uuid}.xml")
        process_instance_file(instance, file, user, xml_content=submission.xml)
        for name, attachment in submission.attachments:
            create_instance_file(instance, name, attachment)
        log_modification(None, instance, INSTANCE_API, user=user)
        instances.append(instance)
    return instances


def _project(batch: Batch, form: Form, project_id: Optional[int], errors: list) -> Optional[Project]:
    projects = batch.cached(
        ("projects", form.id),
        lambda: list(
            Project.objects.filter_on_user_projects(batch.user).filter(account=batch.account, forms=form).order_by("id")
        ),
    )
    if project_id is not None:
        project = next((project for project in projects if project.id == project_id), None)
        if project is None:
            errors.append(SubmissionError("UNKNOWN_REFERENCE", "project_id", f"Form {form.id} isn't in this project"))
        return project
    if not projects:
        # the form is in none of the user's projects
        errors.append(SubmissionError("UNKNOWN_REFERENCE", "form_id", f"Unknown form {form.id}"))
        return None
    candidates = projects[:2]
    if len(candidates) != 1:
        errors.append(
            SubmissionError("INVALID", "project_id", f"Form {form.id} is in several projects: project_id is required")
        )
        return None
    return candidates[0]


def _form_version(batch: Batch, form: Form, version_id: Any, errors: list) -> Optional[FormVersion]:
    """The version `_version` names (a number is read as text, as on PATCH), the latest one without it."""
    if version_id is None:
        form_version = batch.cached(("latest_version", form.id), lambda: FormVersion.objects.latest_version(form))
        if form_version is None or not form_version.file:
            errors.append(SubmissionError("INVALID", "form_id", f"Form {form.id} has no version to fill"))
            return None
        return form_version
    form_version = FormVersion.objects.find_for_form(form.id, str(version_id), batch.form_versions_cache)
    if form_version is None or not form_version.file:
        errors.append(unknown_version(version_id))
        return None
    return form_version


def _uuid(batch: Batch, sent: Optional[uuid_module.UUID], instance_id: Optional[str], errors: list) -> str:
    """The submission's uuid: sent, else the one of its `instanceID`, else a new one."""
    submission_uuid = str(sent) if sent else None
    if instance_id:
        expected = f"uuid:{submission_uuid}" if submission_uuid else None
        if submission_uuid and instance_id != expected:
            errors.append(
                SubmissionError(
                    "INVALID", "content.instanceID", "Not the submission's uuid", answer=instance_id, expected=expected
                )
            )
        elif not submission_uuid:
            try:
                submission_uuid = str(uuid_module.UUID(instance_id.removeprefix("uuid:")))
            except ValueError:
                errors.append(SubmissionError("INVALID", "content.instanceID", "Not a uuid", answer=instance_id))
    submission_uuid = submission_uuid or str(uuid_module.uuid4())
    if submission_uuid in batch.uuids:
        errors.append(SubmissionError("INVALID", "uuid", "Used by another submission of this request"))
    batch.uuids.add(submission_uuid)
    return submission_uuid


def _entity(batch: Batch, form: Form, sent: Optional[dict], errors: list) -> Optional[tuple[str, int]]:
    """The entity a submission registers - its form is the entity type's reference form - or follows (any other
    form): checked against the form instead of trusted, as the mobile upload does (an unknown uuid there creates an
    entity whatever the form)."""
    if not sent:
        return None
    entity_type = EntityType.objects.filter(account=batch.account, id=sent["entity_type_id"]).first()
    if entity_type is None:
        errors.append(
            SubmissionError(
                "UNKNOWN_REFERENCE", "entity.entity_type_id", f"Unknown entity type {sent['entity_type_id']}"
            )
        )
        return None
    entity_uuid = str(sent["uuid"]) if sent.get("uuid") else None
    key = (entity_uuid, entity_type.id)
    known = entity_uuid is not None and (
        key in batch.registered_entities
        or Entity.objects_include_deleted.filter(
            account=batch.account, entity_type=entity_type, uuid=entity_uuid
        ).exists()
    )
    if entity_type.reference_form_id == form.id:
        if known:
            errors.append(SubmissionError("CONFLICT", "entity.uuid", "This entity is already registered"))
            return None
        key = (entity_uuid or str(uuid_module.uuid4()), entity_type.id)
        batch.registered_entities.add(key)
        return key
    if not known:
        errors.append(
            SubmissionError(
                "UNKNOWN_REFERENCE",
                "entity.uuid",
                f"Form {form.id} isn't the registration form of {entity_type.name}: the entity must exist",
            )
        )
        return None
    return key


def _existing(batch: Batch, submission: PreparedSubmission, content: dict, errors: list) -> Optional[Instance]:
    """A submission sent again (a retry after a timeout) is `unchanged`; another one with its uuid is refused."""
    existing = list(Instance.objects.filter(uuid=submission.uuid).order_by("id"))
    if not existing:
        return None
    visible_ids = set(
        Instance.objects.filter_for_user(batch.user)
        .filter_on_user_projects(batch.user)
        .filter(id__in=[instance.id for instance in existing])
        .values_list("id", flat=True)
    )
    if any(instance.id not in visible_ids for instance in existing):
        # whether in another account or out of the user's org units: nothing tells which
        errors.append(SubmissionError("UUID_NOT_AVAILABLE", "uuid", "This uuid can't be used"))
        return None
    instance = existing[0]
    if instance.form_id != submission.form.id or not _same_content(content, instance.json or {}):
        errors.append(
            SubmissionError("CONFLICT", "uuid", f"Submission {instance.id} has this uuid: use PATCH to change it")
        )
        return None
    return instance


def _same_content(sent: dict, stored: dict) -> bool:
    """Every value sent equals the stored one (as `mismatches` compares them); computed values not sent are ignored."""
    for name, value in sent.items():
        if name == "_version":
            continue
        stored_value = stored.get(name)
        if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
            if not isinstance(stored_value, list) or len(stored_value) < len(value):
                return False
            if not all(_same_content(item, stored_item) for item, stored_item in zip(value, stored_value)):
                return False
            continue
        try:
            if not same_text(to_xml_text(value), to_xml_text(stored_value)):
                return False
        except ValueError:
            return False
    return True
