"""What creating and patching submissions share: the problems as the API reports them, the request's caches and
files, the envelope's checks (org unit, period, one submission per slot), and running a submission through odk_cli."""

from dataclasses import dataclass
from io import BytesIO
from types import SimpleNamespace
from typing import Any, Callable, Optional

from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from django.db import connection

from iaso.enketo.enketo_xml import ORG_UNIT_INJECTABLE_QUESTION_NAMES, build_substitutions
from iaso.models import Form, Instance, OrgUnit, Project
from iaso.odk.flat_content import ContentProblem, FlatContent, HeldBack
from iaso.odk.instance_editor import InstanceEditError
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


class Batch:
    """What the submissions of one request share: the user, lookups done once, the uuids and the attached files
    already used."""

    def __init__(self, user: User, files: Optional[dict[str, UploadedFile]] = None):
        self.user = user
        self.account = user.iaso_profile.account
        self.form_versions_cache: dict = {}
        self.uuids: set[str] = set()
        #: the request's files, by part name: `<ref>/<answer>`, or the answer alone
        self.files = files or {}
        self.used_files: set[str] = set()
        self.refs: set[str] = set()
        #: (form id, org unit id, period) of this request's submissions of `single_per_period` forms
        self.slots: set[tuple[int, int, str]] = set()
        #: the project of the first submission checked: the audit's app id
        self.project: Optional[Project] = None
        #: (uuid, entity type id) of the entities registered by this request's submissions
        self.registered_entities: set[tuple[str, int]] = set()
        self._cache: dict = {}

    def cached(self, key: tuple, compute: Callable[[], Any]) -> Any:
        """A lookup done once per request: the submissions of a batch mostly share a form, a project, a version."""
        if key not in self._cache:
            self._cache[key] = compute()
        return self._cache[key]

    def unused_files(self) -> list[str]:
        return sorted(set(self.files) - self.used_files)


@dataclass(frozen=True)
class FormRun:
    """odk_cli's submission, checked: its XML, the content read from it, and the warnings (computed values sent that
    can't be compared)."""

    xml: bytes
    json: dict[str, Any]
    warnings: list[SubmissionError]


def run_form(
    flat: FlatContent,
    held_back: list[HeldBack],
    form: Form,
    run: Callable[[], bytes],
    form_versions_cache: Optional[dict] = None,
) -> tuple[Optional[FormRun], list[SubmissionError]]:
    """`run`: odk_cli on the answers (`new_instance` or `edit_instance`). Its refusal is the submission's errors; the
    computed values the client sent are compared with odk_cli's: refused when they differ, warnings when volatile."""
    try:
        xml = run()
    except InstanceEditError as refusal:
        return None, [
            SubmissionError(p.code, flat.field_of(p.path), p.message, question=p.path, answer=p.answer)
            for p in refusal.problems
        ]
    computed = Instance(form=form).xml_file_to_json(BytesIO(xml), form_versions_cache)
    refused, ignored = flat.mismatches(held_back, computed)
    if refused:
        return None, content_errors(refused)
    return FormRun(xml=xml, json=computed, warnings=content_errors(ignored)), []


def content_errors(problems: list[ContentProblem]) -> list[SubmissionError]:
    return [SubmissionError(p.code, p.field, p.message, answer=p.answer, expected=p.expected) for p in problems]


def unknown_version(version_id: Any) -> SubmissionError:
    return SubmissionError(
        "UNKNOWN_REFERENCE", "content._version", "No such version of this form", answer=str(version_id)
    )


def attachments_sent(
    batch: Batch, answered: list[tuple[str, str]], errors: list, ref: Optional[str] = None
) -> list[tuple[str, UploadedFile]]:
    """The files the binary answers name, (name, file): each one sent, and used by one answer only.

    A file's part is named `<ref>/<name>` - several submissions of a request can each have their `photo.jpg` - or
    `<name>` alone, when no other submission has a file of that name."""
    attachments = []
    for field_name, file_name in answered:
        part = f"{ref}/{file_name}"
        if ref is None or part not in batch.files:
            part = file_name
        if part not in batch.files:
            errors.append(
                SubmissionError(
                    "MISSING_ATTACHMENT",
                    field_name,
                    f"No file of this name in the request: a part named {ref}/{file_name} or {file_name}"
                    if ref is not None
                    else "No file of this name in the request",
                    answer=file_name,
                )
            )
        elif part in batch.used_files:
            errors.append(
                SubmissionError("INVALID", field_name, "This file is already used by another answer", answer=file_name)
            )
        else:
            batch.used_files.add(part)
            attachments.append((file_name, batch.files[part]))
    return attachments


def find_org_unit(
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
    form_type_ids = batch.cached(
        ("org_unit_types", form.id), lambda: set(form.org_unit_types.values_list("id", flat=True))
    )
    if org_unit.org_unit_type_id not in form_type_ids:
        errors.append(
            SubmissionError("INVALID", "org_unit_id", f"Form {form.id} isn't filled for this org unit's type")
        )
    return org_unit


def check_period(form: Form, period: Optional[str], errors: list) -> None:
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


def lock(keys: list[str]) -> None:
    """Transaction-scoped advisory locks, in a fixed order: two requests locking the same keys can't wait on each
    other."""
    if not keys:
        return
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtext(key)) FROM unnest(%s::text[]) AS key ORDER BY key",
            [sorted(set(keys))],
        )


def slot_key(form_id: int, org_unit_id: int, period: str) -> str:
    return f"submission_slot:{form_id}:{org_unit_id}:{period}"


def taken_slot(form: Form, org_unit_id: int, period: str, exclude_uuid: Optional[str] = None) -> Optional[int]:
    """The submission of a `single_per_period` form (one per org unit and period) already in this slot, if any."""
    others = Instance.objects.filter(form=form, org_unit_id=org_unit_id, period=period).exclude(deleted=True)
    if exclude_uuid:
        others = others.exclude(uuid=exclude_uuid)
    return others.order_by("id").values_list("id", flat=True).first()


def slot_conflict(instance_id: int, field_name: str = "period") -> SubmissionError:
    return SubmissionError(
        "CONFLICT",
        field_name,
        f"Submission {instance_id} has this org unit and period, the form takes one per period: use PATCH to change it",
    )


def org_unit_context(org_unit: OrgUnit, form_names: set) -> dict[str, str]:
    """The org unit context Enketo injects (`current_ou_name`, `parent1_ou_id`...), for the questions the form has."""
    names = [name for name in ORG_UNIT_INJECTABLE_QUESTION_NAMES if name in form_names]
    if not names:
        return {}
    substitutions = build_substitutions(SimpleNamespace(org_unit=org_unit), names)
    return {key.removeprefix(".//"): "" if value is None else str(value) for key, value in substitutions.items()}


def form_csvs(form: Form) -> dict[str, bytes]:
    """The form's CSV attachments, for `pulldata()`."""
    return {
        attachment.name: read_file(attachment.file)
        for attachment in form.attachments.filter(name__iendswith=".csv").order_by("id")
    }


def read_file(file) -> bytes:
    file.open("rb")
    try:
        return file.read()
    finally:
        file.close()
