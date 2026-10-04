"""From the GraphQL selection to the queryset, same as `org_units/selection.py`: plain `only()`,
`select_related()`, `prefetch_related()` calls on `DataSource` and `SourceVersion` instances, decided here for the
whole page. The columns of `SourceVersion` and `DataSourceSummary` serve `OrgUnit.version` too."""

from django.db.models import Prefetch, QuerySet

from iaso.models import Project, SourceVersion

from ..common import PROJECT_COLUMNS, SelectionTree, columns


#: GraphQL field -> model column, for the fields read straight from a column
DATA_SOURCE_COLUMNS = {
    "id": "id",
    "name": "name",
    "description": "description",
    "readOnly": "read_only",
    "public": "public",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "treeConfigStatusFields": "tree_config_status_fields",
    "defaultVersionId": "default_version_id",
}
DATA_SOURCE_SUMMARY_COLUMNS = {"id": "id", "name": "name", "readOnly": "read_only", "public": "public"}
SOURCE_VERSION_COLUMNS = {
    "id": "id",
    "number": "number",
    "description": "description",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "dataSourceId": "data_source_id",
}
SOURCE_VERSION_SUMMARY_COLUMNS = {
    "id": "id",
    "number": "number",
    "description": "description",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
}

#: page size caps of the fields whose cost grows with the page: a list per source
SOURCE_FIELD_LIMITS = {"versions": 100}


def load_selected_versions(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` of `SourceVersion` loading only the selected `fields`, its data source joined if selected."""
    only = ["id", *columns(fields, SOURCE_VERSION_COLUMNS)]
    if "dataSource" in fields:
        queryset = queryset.select_related("data_source")
        only += ["data_source", *columns(fields["dataSource"], DATA_SOURCE_SUMMARY_COLUMNS, "data_source__")]
    return queryset.only(*only)


def load_selected_sources(queryset: QuerySet, fields: SelectionTree, account_id: int) -> QuerySet:
    """`queryset` of `DataSource` loading only the selected `fields`: one query for the page, one more per selected
    list (`versions`, `projects`) for the whole page. Only the projects of the account (`account_id`): a source can
    be linked to another account's."""
    only = ["id", *columns(fields, DATA_SOURCE_COLUMNS)]
    if "defaultVersion" in fields:
        queryset = queryset.select_related("default_version")
        only += [
            "default_version",
            *columns(fields["defaultVersion"], SOURCE_VERSION_SUMMARY_COLUMNS, "default_version__"),
        ]
    if "versions" in fields:
        # `data_source`: to match them to their source
        versions = SourceVersion.objects.only(
            "id", "data_source", *columns(fields["versions"], SOURCE_VERSION_SUMMARY_COLUMNS)
        )
        queryset = queryset.prefetch_related(
            Prefetch("versions", queryset=versions.order_by("-created_at", "-id"), to_attr="version_list")
        )
    if "projects" in fields:
        projects = Project.objects.filter(account_id=account_id).only(
            "id", *columns(fields["projects"], PROJECT_COLUMNS)
        )
        queryset = queryset.prefetch_related(Prefetch("projects", queryset=projects.order_by("id")))
    return queryset.only(*only)
