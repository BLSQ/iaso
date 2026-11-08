"""Creating submissions from their flat content: each one checked (envelope, then content through odk_cli, which
builds the XML as ODK Collect would), then all of them saved with the mobile app's code - or none if any is refused.

Validation never writes anything, not even to the storage: a refused batch leaves no trace but its audit."""

import uuid as uuid_module

from dataclasses import dataclass, field
from io import BytesIO
from types import SimpleNamespace
from typing import Any, Optional

from django.contrib.auth.models import User
from django.core.files.base import ContentFile

from hat.audit.models import INSTANCE_API, log_modification
from hat.sync.views import process_instance_file
from iaso.api.instances.import_cache import InstanceImportCache
from iaso.api.instances.views import import_data
from iaso.enketo.enketo_xml import ORG_UNIT_INJECTABLE_QUESTION_NAMES, build_substitutions
from iaso.models import Form, FormVersion, Instance, OrgUnit, Project
from iaso.odk.flat_content import INSTANCE_ID, FlatContent, same_text, to_xml_text
from iaso.odk.instance_editor import InstanceEditError, new_instance
from iaso.periods import detect


@dataclass(frozen=True)
class SubmissionError:
    """One problem of a submission. `field`: where in the input (`org_unit_id`, `content.child[2].age`); `question`:
    the XForm path, for content problems found by odk_cli."""

    code: str
    field: Optional[str]
    message: str
    question: Optional[str] = None
    answer: Optional[str] = None
    expected: Optional[str] = None

    def as_json(self) -> dict[str, Any]:
        return {key: value for key, value in self.__dict__.items() if value is not None or key == "field"}


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
    existing: Optional[Instance] = None
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


class Batch:
    """What the submissions of one request share: the user, lookups done once, the uuids already used."""

    def __init__(self, user: User):
        self.user = user
        self.account = user.iaso_profile.account
        self.form_versions_cache: dict = {}
        self.uuids: set[str] = set()


def prepare_submission(batch: Batch, ref: str, data: dict[str, Any]) -> tuple[Optional[PreparedSubmission], list]:
    """`data`: the envelope as validated by `SubmissionCreateSerializer`. The submission built, or the problems."""
    errors: list[SubmissionError] = []
    user = batch.user

    form = Form.objects.filter_for_user_and_app_id(user).filter(id=data["form_id"]).first()
    if form is None:
        return None, [SubmissionError("UNKNOWN_REFERENCE", "form_id", f"Unknown form {data['form_id']}")]

    project = _project(batch, form, data.get("project_id"), errors)
    org_unit = _org_unit(batch, form, project, data["org_unit_id"], errors)
    _check_period(form, data.get("period"), errors)
    content = data["content"]
    form_version = _form_version(batch, form, content.get("_version"), errors)
    if form_version is None:
        return None, errors

    flat = FlatContent(form_version.get_or_save_form_descriptor())
    answers = flat.to_answers(content)
    errors += [SubmissionError(p.code, p.field, p.message, answer=p.answer) for p in answers.problems]
    submission_uuid = _uuid(batch, data.get("uuid"), answers.instance_id, errors)
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
    )
    existing = _existing(batch, prepared, content, errors)
    if errors:
        return None, errors
    if existing:
        prepared.existing = existing
        return prepared, []

    prefilled = {INSTANCE_ID: f"uuid:{submission_uuid}", **_injected(org_unit, flat.names())}
    try:
        prepared.xml = new_instance(_read(form_version.file), prefilled, answers.answers, _csvs(form))
    except InstanceEditError as refusal:
        return None, [
            SubmissionError(p.code, flat.field_of(p.path), p.message, question=p.path, answer=p.answer)
            for p in refusal.problems
        ]

    computed = Instance(form=form).xml_file_to_json(BytesIO(prepared.xml), batch.form_versions_cache)
    refused, ignored = flat.mismatches(answers.held_back, computed)
    if refused:
        return None, [
            SubmissionError(p.code, p.field, p.message, answer=p.answer, expected=p.expected) for p in refused
        ]
    prepared.warnings = [
        SubmissionError(p.code, p.field, p.message, answer=p.answer, expected=p.expected) for p in ignored
    ]
    return prepared, []


def save_submissions(submissions: list[PreparedSubmission], user: User) -> list[Instance]:
    """Saves the new submissions as the mobile app's upload does (`import_data` then the XML), in the caller's
    transaction. The instances, in the order of `submissions` (the existing one for an unchanged submission)."""
    new = [submission for submission in submissions if not submission.existing]
    cache = InstanceImportCache([submission.uuid for submission in new])
    for project in {submission.project for submission in new}:
        import_data(
            [submission.as_mobile_instance_data() for submission in new if submission.project == project],
            user,
            project.app_id,
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
        log_modification(None, instance, INSTANCE_API, user=user)
        instances.append(instance)
    return instances


def _project(batch: Batch, form: Form, project_id: Optional[int], errors: list) -> Optional[Project]:
    projects = Project.objects.filter_on_user_projects(batch.user).filter(account=batch.account, forms=form)
    if project_id is not None:
        project = projects.filter(id=project_id).first()
        if project is None:
            errors.append(SubmissionError("UNKNOWN_REFERENCE", "project_id", f"Form {form.id} isn't in this project"))
        return project
    candidates = list(projects.order_by("id")[:2])
    if len(candidates) != 1:
        errors.append(
            SubmissionError("INVALID", "project_id", f"Form {form.id} is in several projects: project_id is required")
        )
        return None
    return candidates[0]


def _org_unit(
    batch: Batch, form: Form, project: Optional[Project], org_unit_id: int, errors: list
) -> Optional[OrgUnit]:
    org_unit = (
        OrgUnit.objects.filter_for_user_and_project(batch.user, project)
        .filter(id=org_unit_id)
        .select_related("org_unit_type", "parent")
        .first()
    )
    if org_unit is None:
        errors.append(SubmissionError("UNKNOWN_REFERENCE", "org_unit_id", f"Unknown org unit {org_unit_id}"))
        return None
    if not form.org_unit_types.filter(id=org_unit.org_unit_type_id).exists():
        errors.append(
            SubmissionError("INVALID", "org_unit_id", f"Form {form.id} isn't filled for this org unit's type")
        )
    return org_unit


def _check_period(form: Form, period: Optional[str], errors: list) -> None:
    if not form.period_type:
        if period:
            errors.append(SubmissionError("INVALID", "period", f"Form {form.id} has no period"))
        return
    if not period:
        errors.append(SubmissionError("INVALID", "period", f"Form {form.id} needs a {form.period_type} period"))
        return
    try:
        period_type = detect(period)
    except ValueError:
        period_type = None
    if period_type != form.period_type:
        errors.append(SubmissionError("INVALID", "period", f"Not a {form.period_type} period", answer=period))


def _form_version(batch: Batch, form: Form, version_id: Any, errors: list) -> Optional[FormVersion]:
    if version_id is None:
        form_version = FormVersion.objects.latest_version(form)
    elif isinstance(version_id, str):
        form_version = FormVersion.objects.find_for_form(form.id, version_id, batch.form_versions_cache)
    else:
        form_version = None
    if form_version is None or not form_version.file:
        errors.append(SubmissionError("INVALID", "content._version", f"Unknown version of form {form.id}"))
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


def _injected(org_unit: OrgUnit, form_names: set) -> dict[str, str]:
    """The org unit context Enketo injects (`current_ou_name`, `parent1_ou_id`...), for the questions the form has."""
    names = [name for name in ORG_UNIT_INJECTABLE_QUESTION_NAMES if name in form_names]
    if not names:
        return {}
    substitutions = build_substitutions(SimpleNamespace(org_unit=org_unit), names)
    return {key.removeprefix(".//"): "" if value is None else str(value) for key, value in substitutions.items()}


def _csvs(form: Form) -> dict[str, bytes]:
    """The form's CSV attachments, for `pulldata()`."""
    return {
        attachment.name: _read(attachment.file)
        for attachment in form.attachments.filter(name__iendswith=".csv").order_by("id")
    }


def _read(file) -> bytes:
    file.open("rb")
    try:
        return file.read()
    finally:
        file.close()
