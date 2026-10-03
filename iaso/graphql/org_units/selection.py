"""From the GraphQL selection to the queryset: only what is selected is loaded.

`load_selected()` turns the selection (`common.selection_tree()`) into plain queryset calls - `only()`,
`select_related()`, `prefetch_related()`, `annotate()` - on `OrgUnit` instances, which the resolvers (`types.py`, else the default
ones reading the `snake_case` attribute) read without ever hitting the database again.
"""

from django.contrib.gis.db.models.functions import AsGeoJSON
from django.db.models import Prefetch, QuerySet

from iaso.models import Group

from ..common import SelectionTree, columns
from .expressions import (
    AncestorsJson,
    depth,
    has_children,
    has_geo_json,
    has_geometry,
    instance_count,
    location_coordinate,
)


#: GraphQL field -> model column, for the fields read straight from a column
ORG_UNIT_COLUMNS = {
    "id": "id",
    "name": "name",
    "uuid": "uuid",
    "validationStatus": "validation_status",
    "sourceRef": "source_ref",
    "code": "code",
    "aliases": "aliases",
    "openingDate": "opening_date",
    "closedDate": "closed_date",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "sourceCreatedAt": "source_created_at",
    "parentId": "parent_id",
    "orgUnitTypeId": "org_unit_type_id",
    "versionId": "version_id",
}
SUMMARY_COLUMNS = {
    "id": "id",
    "name": "name",
    "sourceRef": "source_ref",
    "validationStatus": "validation_status",
    "orgUnitTypeId": "org_unit_type_id",
    "parentId": "parent_id",
}
ORG_UNIT_TYPE_COLUMNS = {"id": "id", "name": "name", "shortName": "short_name", "category": "category"}
SOURCE_VERSION_COLUMNS = {"id": "id", "number": "number", "dataSourceId": "data_source_id"}
DATA_SOURCE_COLUMNS = {"id": "id", "name": "name"}
USER_COLUMNS = {
    "id": "id",
    "username": "username",
    "firstName": "first_name",
    "lastName": "last_name",
    "email": "email",
}
GROUP_COLUMNS = {"id": "id", "name": "name"}

#: page size cap of the fields whose cost grows with the page, beyond a column read: a big value (a geometry),
#: other rows read per row (`ancestors`), or a whole history read per row (`instanceCount`: every instance of the
#: org unit is fetched from the table to check `deleted`/`file`/`device`). The lowest cap selected applies.
FIELD_LIMITS = {"geom": 1_000, "simplifiedGeom": 1_000, "catchment": 1_000, "ancestors": 1_000, "instanceCount": 100}


def load_selected(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` loading only the selected org unit `fields`: every query a page needs is decided here."""
    only = ["id", *columns(fields, ORG_UNIT_COLUMNS)]

    # to-one relations: a LEFT JOIN selecting only the related model's selected columns. `only()` needs the
    # foreign key itself (`parent`) alongside the related columns
    if "parent" in fields:
        queryset = queryset.select_related("parent")
        only += ["parent", *columns(fields["parent"], SUMMARY_COLUMNS, "parent__")]
    if "orgUnitType" in fields:
        queryset = queryset.select_related("org_unit_type")
        only += ["org_unit_type", *columns(fields["orgUnitType"], ORG_UNIT_TYPE_COLUMNS, "org_unit_type__")]
    if "version" in fields:
        queryset = queryset.select_related("version")
        only += ["version", *columns(fields["version"], SOURCE_VERSION_COLUMNS, "version__")]
        if "dataSource" in fields["version"]:
            queryset = queryset.select_related("version__data_source")
            data_source = fields["version"]["dataSource"]
            only += ["version__data_source", *columns(data_source, DATA_SOURCE_COLUMNS, "version__data_source__")]
    if "createdBy" in fields:
        queryset = queryset.select_related("creator")
        only += ["creator", *columns(fields["createdBy"], USER_COLUMNS, "creator__")]

    # to-many: `groups` is a second query for the whole page; the ancestors have no relation to prefetch through,
    # they are a subquery on the ltree `path` (see `AncestorsJson`)
    if "groups" in fields:
        groups = Group.objects.only("id", *columns(fields["groups"], GROUP_COLUMNS)).order_by("id")
        queryset = queryset.prefetch_related(Prefetch("groups", queryset=groups))
    if "ancestors" in fields:
        queryset = queryset.annotate(
            ancestors_json=AncestorsJson(["id", *columns(fields["ancestors"], SUMMARY_COLUMNS)])
        )

    # computed by postgres: the geometry columns themselves are never loaded nor parsed by GEOS
    if "location" in fields:
        queryset = queryset.annotate(
            latitude=location_coordinate("ST_Y"),
            longitude=location_coordinate("ST_X"),
            altitude=location_coordinate("ST_Z"),
        )
    if "geom" in fields:
        queryset = queryset.annotate(geom_geo_json=AsGeoJSON("geom"))
    if "simplifiedGeom" in fields:
        queryset = queryset.annotate(simplified_geom_geo_json=AsGeoJSON("simplified_geom"))
    if "catchment" in fields:
        queryset = queryset.annotate(catchment_geo_json=AsGeoJSON("catchment"))

    if "depth" in fields:
        queryset = queryset.annotate(depth=depth())
    if "hasGeoJson" in fields:
        queryset = queryset.annotate(has_geo_json=has_geo_json())
    if "hasGeometry" in fields:
        queryset = queryset.annotate(has_geometry=has_geometry())
    if "hasChildren" in fields:
        queryset = queryset.annotate(has_children=has_children())
    if "instanceCount" in fields:
        queryset = queryset.annotate(instance_count=instance_count())

    return queryset.only(*only)
