"""Resolvers of the `Form`, `FormSummary` and `FormVersion` fields that aren't a plain attribute: each reads what
`load_selected_forms()`/`load_selected_versions()` loaded."""

from ariadne import ObjectType


form = ObjectType("Form")
form_summary = ObjectType("FormSummary")
form_version = ObjectType("FormVersion")


@form.field("odkFormId")
@form_summary.field("odkFormId")
def resolve_odk_form_id(form, _info):
    return form.form_id  # `formId` would read as the form's own id, like `Instance.formId`


@form.field("periodType")
@form_summary.field("periodType")
def resolve_period_type(form, _info):
    return form.period_type or None  # a blank column isn't a `PeriodType`


@form.field("labelKeys")
def resolve_label_keys(form, _info):
    return form.label_keys or []


@form.field("projects")
def resolve_projects(form, _info):
    return form.projects.all()  # prefetched


@form.field("orgUnitTypes")
def resolve_org_unit_types(form, _info):
    return form.org_unit_types.all()  # prefetched


@form.field("versions")
def resolve_versions(form, _info):
    return form.versions  # prefetched, see `load_selected_forms()`


@form.field("latestVersion")
def resolve_latest_version(form, _info):
    return form.latest_versions[0] if form.latest_versions else None


@form_version.field("fileUrl")
def resolve_file_url(version, _info):
    return version.file.url if version.file else None


@form_version.field("xlsFileUrl")
def resolve_xls_file_url(version, _info):
    return version.xls_file.url if version.xls_file else None
