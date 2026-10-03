"""From the GraphQL selection to the queryset, same as `org_units/selection.py`: plain `only()`,
`select_related()` and `annotate()` calls on `Instance` instances, decided here for the whole page."""

from django.db.models import QuerySet

from ..common import SelectionTree, columns
from ..forms.selection import FORM_SUMMARY_COLUMNS, PROJECT_COLUMNS, VERSION_SUMMARY_COLUMNS
from ..org_units.expressions import AncestorsJson
from ..org_units.selection import SUMMARY_COLUMNS, USER_COLUMNS
from .expressions import is_reference_instance, location_coordinate, status


#: GraphQL field -> model column, for the fields read straight from a column
INSTANCE_COLUMNS = {
    "id": "id",
    "uuid": "uuid",
    "formId": "form_id",
    "formVersionId": "form_version_id",
    "orgUnitId": "org_unit_id",
    "projectId": "project_id",
    "period": "period",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "sourceCreatedAt": "source_created_at",
    "sourceUpdatedAt": "source_updated_at",
    "createdById": "created_by_id",
    "lastModifiedById": "last_modified_by_id",
    "accuracy": "accuracy",
    "deviceId": "device_id",
    "entityId": "entity_id",
    "planningId": "planning_id",
    "deleted": "deleted",
    "fileName": "file_name",
    "exportId": "export_id",
    "content": "json",
}

#: page size cap of the fields whose cost grows with the page: `content` is the whole submitted form, of any size;
#: `orgUnit.ancestors` reads other rows per row
FIELD_LIMITS = {"content": 1_000, "orgUnit.ancestors": 1_000}


def load_selected(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` loading only the selected instance `fields`: every query a page needs is decided here."""
    only = ["id", *columns(fields, INSTANCE_COLUMNS)]

    # to-one relations: a LEFT JOIN selecting only the related model's selected columns
    if "form" in fields:
        queryset = queryset.select_related("form")
        only += ["form", *columns(fields["form"], FORM_SUMMARY_COLUMNS, "form__")]
    if "formVersion" in fields:
        queryset = queryset.select_related("form_version")
        only += ["form_version", *columns(fields["formVersion"], VERSION_SUMMARY_COLUMNS, "form_version__")]
    if "orgUnit" in fields:
        queryset = queryset.select_related("org_unit")
        only += ["org_unit", *columns(fields["orgUnit"], SUMMARY_COLUMNS, "org_unit__")]
        if "ancestors" in fields["orgUnit"]:
            # read from the instance by `Instance.orgUnit` (see `types.py`)
            ancestors = AncestorsJson(
                ["id", *columns(fields["orgUnit"]["ancestors"], SUMMARY_COLUMNS)], "org_unit__path"
            )
            queryset = queryset.annotate(org_unit_ancestors_json=ancestors)
    if "project" in fields:
        queryset = queryset.select_related("project")
        only += ["project", *columns(fields["project"], PROJECT_COLUMNS, "project__")]
    if "createdBy" in fields:
        queryset = queryset.select_related("created_by")
        only += ["created_by", *columns(fields["createdBy"], USER_COLUMNS, "created_by__")]
    if "lastModifiedBy" in fields:
        queryset = queryset.select_related("last_modified_by")
        only += ["last_modified_by", *columns(fields["lastModifiedBy"], USER_COLUMNS, "last_modified_by__")]

    # computed by postgres
    if "location" in fields:
        queryset = queryset.annotate(
            latitude=location_coordinate("ST_Y"),
            longitude=location_coordinate("ST_X"),
            altitude=location_coordinate("ST_Z"),
        )
    if "status" in fields:
        queryset = queryset.annotate(status=status())
    if "isReferenceInstance" in fields:
        # the name the model's `is_reference_instance` property reads
        queryset = queryset.annotate(_is_reference_instance=is_reference_instance())

    return queryset.only(*only)
