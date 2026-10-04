"""`dataSources(filters: DataSourceFilter)` and `sourceVersions(filters: SourceVersionFilter)`: flat inputs, all
AND-ed. The project and version filters are `EXISTS` subqueries rather than joins: no source repeated per match."""

from typing import Any, Dict, List

from django.db.models import Exists, F, OuterRef, Q, QuerySet

from iaso.models import DataSource, SourceVersion

from ..common import FilterMethod, apply_filters as apply_lookups_and_methods


SOURCE_LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "nameIContains": "name__icontains",
    "readOnly": "read_only",
    "public": "public",
}


def _projects(queryset: QuerySet, value, user) -> QuerySet:
    ids: List[int] = value if isinstance(value, list) else [value]
    linked = DataSource.projects.through.objects.filter(datasource_id=OuterRef("pk"), project_id__in=ids)
    return queryset.filter(Exists(linked))


def _has_versions(queryset: QuerySet, value: bool, user) -> QuerySet:
    versions = Exists(SourceVersion.objects.filter(data_source_id=OuterRef("pk")))
    return queryset.filter(versions if value else ~versions)


SOURCE_METHODS: Dict[str, FilterMethod] = {
    "projectId": _projects,
    "projectIdIn": _projects,
    "hasVersions": _has_versions,
}

VERSION_LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "dataSourceId": "data_source_id",
    "dataSourceIdIn": "data_source_id__in",
    "number": "number",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
}


def _is_default(queryset: QuerySet, value: bool, user) -> QuerySet:
    default = Q(data_source__default_version_id=F("id"))
    return queryset.filter(default) if value else queryset.exclude(default)


VERSION_METHODS: Dict[str, FilterMethod] = {"isDefault": _is_default}


def apply_source_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    return apply_lookups_and_methods(queryset, filters, user, SOURCE_LOOKUPS, SOURCE_METHODS)


def apply_version_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    return apply_lookups_and_methods(queryset, filters, user, VERSION_LOOKUPS, VERSION_METHODS)
