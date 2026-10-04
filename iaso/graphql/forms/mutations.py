"""`createFormVersion`: a new version of a form from its XLSForm, uploaded as a GraphQL multipart request (`Upload`,
see `views.py`). The checks of `POST /api/formversions/` (`FormVersionSerializer`): IASO's own XLSForm checks
(`validate_xls_form`), pyxform's conversion, a version greater than the previous one, the `form_id` kept across
versions and not used by another form - each problem an `InputError`, all reported at once when they can be. And the
structural changes the submissions already collected or the entity workflows may not fit, as `warnings`
(`structural_changes`): created only with `force: true` when there is any."""

import os

from typing import Optional

from ariadne import MutationType
from django.core.files.uploadedfile import UploadedFile
from graphql import GraphQLError, GraphQLResolveInfo

from iaso import periods
from iaso.models import Form, FormVersion
from iaso.odk import parsing, validate_xls_form
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION

from ..common import requesting_user, selection_tree
from ..errors import Errors, Payload, payload
from .resolvers import visible_forms, visible_versions
from .selection import load_selected_versions
from .structural_changes import structural_warnings


#: an XLSForm is a few hundred KB; bigger is a mistake (a data export...)
MAX_XLSFORM_BYTES = 10 * 1024 * 1024
XLSFORM_EXTENSIONS = (".xlsx", ".xls")

mutation = MutationType()


@mutation.field("createFormVersion")
@payload("form_version")  # read by `FormVersionPayload.formVersion`
def resolve_create_form_version(
    _,
    info: GraphQLResolveInfo,
    formId: int,
    xlsFile: UploadedFile,
    startPeriod: Optional[str] = None,
    endPeriod: Optional[str] = None,
    force: bool = False,
):
    user = requesting_user(info)
    if not user.has_perm(CORE_FORMS_PERMISSION.full_name()):
        raise GraphQLError("You do not have permission to edit forms.", extensions={"code": "FORBIDDEN"})
    errors = Errors()
    form = visible_forms(info).filter(pk=formId).first()
    survey = None
    if form is None:
        errors.add("NOT_FOUND", f"Form {formId} does not exist", ["formId"])
    else:
        check_periods(form, startPeriod, endPeriod, errors)
    if os.path.splitext(xlsFile.name or "")[1].lower() not in XLSFORM_EXTENSIONS:
        errors.add("INVALID", f"{xlsFile.name!r} isn't an XLSForm: .xlsx or .xls expected", ["xlsFile"])
    elif xlsFile.size > MAX_XLSFORM_BYTES:
        errors.add("INVALID", f"An XLSForm can't be over {MAX_XLSFORM_BYTES // 1024 // 1024} MB", ["xlsFile"])
    elif form is not None:
        # along with the periods' problems, if any: all of them at once
        survey = parse_xlsform(form, xlsFile, errors)
    warnings = structural_warnings(form, survey) if survey is not None else []
    if warnings and not force:
        errors.add(
            "UNCONFIRMED_CHANGES",
            f"The new version removes or changes the type of questions of the previous one ({len(warnings)}, see "
            "`warnings`): pass `force: true` to create it anyway",
            ["force"],
        )
    errors.raise_if_any(warnings=warnings)
    form_version = FormVersion.objects.create_for_form_and_survey(
        form=form,
        survey=survey,
        xls_file=xlsFile,
        start_period=startPeriod,
        end_period=endPeriod,
        created_by=user,
        updated_by=user,
    )
    selected = selection_tree(info).get("formVersion") or {}
    created = load_selected_versions(visible_versions(info), selected).order_by().get(pk=form_version.pk)
    return Payload(form_version=created, warnings=warnings)


def check_periods(form: Form, start: Optional[str], end: Optional[str], errors: Errors) -> None:
    """Existing periods, of the form's period type if it has one, the start not after the end."""
    parsed = {}
    for field, period in (("startPeriod", start), ("endPeriod", end)):
        if period is None:
            continue
        try:
            parsed[field] = periods.Period.from_string(period)
            parsed[field].start_date()  # the parts in range: no `202413`
        except (ValueError, KeyError, IndexError):
            errors.add("INVALID", f"Invalid period {period!r}", [field])
            parsed.pop(field, None)
            continue
        if form.period_type and periods.detect(period) != form.period_type:
            errors.add("INVALID", f"Form {form.id} expects a {form.period_type} period, got {period!r}", [field])
    if len(parsed) == 2 and parsed["startPeriod"].start_date() > parsed["endPeriod"].start_date():
        errors.add("INVALID", f"The start period {start} is after the end period {end}", ["endPeriod"])


def parse_xlsform(form: Form, xls_file: UploadedFile, errors: Errors) -> Optional[parsing.Survey]:
    """The survey pyxform builds, after IASO's own checks: each problem found an `INVALID_XLSFORM` error."""
    content = xls_file.read()
    xls_file.seek(0)  # read again when saved
    try:
        problems = validate_xls_form(parsing.NamedBytesIO(content, name=xls_file.name))
    except Exception as error:  # pandas' readers raise anything on a file that isn't a spreadsheet
        errors.add("INVALID_XLSFORM", f"Not a readable spreadsheet: {error}", ["xlsFile"])
        return None
    for problem in problems:
        question = problem.get("question") or {}
        where = f"{problem.get('sheet', 'survey')} sheet"
        if "line_number" in question:
            # 0-based among the data rows: after the header row, 1-based in the spreadsheet
            where += f", row {question['line_number'] + 2}"
        errors.add("INVALID_XLSFORM", f"{where}: {problem['message']}", ["xlsFile"], question=question.get("name"))
    if problems:
        return None

    previous = FormVersion.objects.latest_version(form)
    try:
        survey = parsing.parse_xls_form(
            parsing.NamedBytesIO(content, name=xls_file.name),
            previous_version=previous.version_id if previous is not None else None,
        )
    except parsing.ParsingError as error:
        errors.add("INVALID_XLSFORM", str(error), ["xlsFile"])
        return None
    if form.form_id is not None and survey.form_id != form.form_id:
        errors.add(
            "INVALID_XLSFORM",
            f"The XLSForm's form_id is {survey.form_id!r}, form {form.id}'s is {form.form_id!r}: it stays the same "
            "across versions",
            ["xlsFile"],
        )
    if Form.objects.exists_with_same_version_id_within_projects(form, survey.form_id):
        errors.add("INVALID_XLSFORM", f"The form_id {survey.form_id!r} is already another form's", ["xlsFile"])
    return survey
