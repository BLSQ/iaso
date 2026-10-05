"""From the GraphQL selection to the queryset, same as `org_units/selection.py`: plain `only()`,
`select_related()`, `prefetch_related()` calls on `Form` and `FormVersion` instances, decided here for the whole
page."""

from django.db.models import Prefetch, QuerySet

from iaso.models import FormVersion, OrgUnitType, Project

from ..common import PROJECT_COLUMNS, SelectionTree, columns
from ..org_units.selection import ORG_UNIT_TYPE_COLUMNS, USER_COLUMNS


#: GraphQL field -> model column, for the fields read straight from a column
FORM_COLUMNS = {
    "id": "id",
    "uuid": "uuid",
    "name": "name",
    "odkFormId": "form_id",
    "periodType": "period_type",
    "singlePerPeriod": "single_per_period",
    "periodsBeforeAllowed": "periods_before_allowed",
    "periodsAfterAllowed": "periods_after_allowed",
    "deviceField": "device_field",
    "locationField": "location_field",
    "correlatable": "correlatable",
    "correlationField": "correlation_field",
    "derived": "derived",
    "labelKeys": "label_keys",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "possibleFields": "possible_fields",
    "legendThreshold": "legend_threshold",
}
FORM_SUMMARY_COLUMNS = {
    "id": "id",
    "name": "name",
    "odkFormId": "form_id",
    "periodType": "period_type",
    "singlePerPeriod": "single_per_period",
}
VERSION_COLUMNS = {
    "id": "id",
    "versionId": "version_id",
    "formId": "form_id",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "startPeriod": "start_period",
    "endPeriod": "end_period",
    "fileUrl": "file",
    "xlsFileUrl": "xls_file",
    "formDescriptor": "form_descriptor",
    "possibleFields": "possible_fields",
}
VERSION_SUMMARY_COLUMNS = {
    "id": "id",
    "versionId": "version_id",
    "startPeriod": "start_period",
    "endPeriod": "end_period",
    "createdAt": "created_at",
}

#: page size caps of the fields whose cost grows with the page: a list per form (`versions`), a whole form
#: (`formDescriptor`, ~20 kB for a small one) per row
FORM_FIELD_LIMITS = {"versions": 100, "latestVersion.formDescriptor": 100}
VERSION_FIELD_LIMITS = {"formDescriptor": 100}


def load_selected_versions(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` of `FormVersion` loading only the selected `fields` - the `formVersions` page, or the versions
    prefetched for a page of forms (which needs `form_id` to match them to their form: always loaded)."""
    only = ["id", "form", *columns(fields, VERSION_COLUMNS)]
    if "form" in fields:
        queryset = queryset.select_related("form")
        only += columns(fields["form"], FORM_SUMMARY_COLUMNS, "form__")
    if "createdBy" in fields:
        queryset = queryset.select_related("created_by")
        only += ["created_by", *columns(fields["createdBy"], USER_COLUMNS, "created_by__")]
    if "updatedBy" in fields:
        queryset = queryset.select_related("updated_by")
        only += ["updated_by", *columns(fields["updatedBy"], USER_COLUMNS, "updated_by__")]
    return queryset.only(*only)


def load_selected_forms(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` of `Form` loading only the selected `fields`: one query for the page, one more per selected list
    (`projects`, `orgUnitTypes`, `latestVersion`, `versions`) for the whole page."""
    queryset = queryset.only("id", *columns(fields, FORM_COLUMNS))
    if "projects" in fields:
        projects = Project.objects.only("id", *columns(fields["projects"], PROJECT_COLUMNS)).order_by("id")
        queryset = queryset.prefetch_related(Prefetch("projects", queryset=projects))
    if "orgUnitTypes" in fields:
        org_unit_types = OrgUnitType.objects.only("id", *columns(fields["orgUnitTypes"], ORG_UNIT_TYPE_COLUMNS))
        queryset = queryset.prefetch_related(Prefetch("org_unit_types", queryset=org_unit_types.order_by("id")))
    if "versions" in fields:
        versions = load_selected_versions(FormVersion.objects.all(), fields["versions"]).order_by("-created_at", "-id")
        queryset = queryset.prefetch_related(Prefetch("form_versions", queryset=versions, to_attr="versions"))
    if "latestVersion" in fields:
        # postgres' `DISTINCT ON`: the first version of each form, in the `ORDER BY` - the newest
        latest = (
            load_selected_versions(FormVersion.objects.all(), fields["latestVersion"])
            .order_by("form_id", "-created_at", "-id")
            .distinct("form_id")
        )
        queryset = queryset.prefetch_related(Prefetch("form_versions", queryset=latest, to_attr="latest_versions"))
    return queryset
