"""`forms(filters: FormFilter)` and `formVersions(filters: FormVersionFilter)`: flat inputs, all AND-ed.

The many-to-many filters (`projectId`, `orgUnitTypeId`) are `EXISTS` subqueries rather than joins: a join repeats a
form once per matching project, and a `DISTINCT` to undo it would sort the whole result.
"""

from typing import Any, Dict, List

from django.db.models import Exists, OuterRef, QuerySet

from iaso.models import Form

from ..common import FilterMethod, apply_filters as apply_lookups_and_methods


FORM_LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "nameIContains": "name__icontains",
    "odkFormId": "form_id",
    "odkFormIdIn": "form_id__in",
    "periodType": "period_type",
    "periodTypeIsNull": "period_type__isnull",
    "singlePerPeriod": "single_per_period",
    "derived": "derived",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
    "updatedAtGte": "updated_at__gte",
    "updatedAtLte": "updated_at__lte",
}


def _linked(through, column: str) -> FilterMethod:
    """Forms linked to any of the given ids, through the `through` table of a many-to-many."""

    def apply(queryset: QuerySet, value, user) -> QuerySet:
        ids: List[int] = value if isinstance(value, list) else [value]
        return queryset.filter(Exists(through.objects.filter(form_id=OuterRef("pk"), **{f"{column}__in": ids})))

    return apply


_projects = _linked(Form.projects.through, "project_id")
_org_unit_types = _linked(Form.org_unit_types.through, "orgunittype_id")

FORM_METHODS: Dict[str, FilterMethod] = {
    "projectId": _projects,
    "projectIdIn": _projects,
    "orgUnitTypeId": _org_unit_types,
    "orgUnitTypeIdIn": _org_unit_types,
}

VERSION_LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "formId": "form_id",
    "formIdIn": "form_id__in",
    "versionId": "version_id",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
    "updatedAtGte": "updated_at__gte",
    "updatedAtLte": "updated_at__lte",
}


def apply_form_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    return apply_lookups_and_methods(queryset, filters, user, FORM_LOOKUPS, FORM_METHODS)


def apply_version_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    return apply_lookups_and_methods(queryset, filters, user, VERSION_LOOKUPS, {})
