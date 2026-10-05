"""Resolvers of the `DataSource` fields that aren't a plain attribute: each reads what `load_selected_sources()`
loaded."""

from ariadne import ObjectType


data_source = ObjectType("DataSource")


@data_source.field("versions")
def resolve_versions(source, _info):
    return source.version_list  # prefetched


@data_source.field("projects")
def resolve_projects(source, _info):
    return source.projects.all()  # prefetched


@data_source.field("treeConfigStatusFields")
def resolve_tree_config_status_fields(source, _info):
    return source.tree_config_status_fields or []
