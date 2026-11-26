from __future__ import annotations

from typing import Any

from iaso.api.serializers import OrgUnitSearchSerializer


_PAGE_LIMIT_MAX = 50


def clamp_limit(limit: int) -> int:
    return max(1, min(limit, _PAGE_LIMIT_MAX))


def page_meta(response: dict[str, Any]) -> dict[str, Any]:
    return {
        "count": response.get("count"),
        "page": response.get("page"),
        "pages": response.get("pages"),
        "limit": response.get("limit"),
        "has_next": response.get("has_next"),
        "has_previous": response.get("has_previous"),
    }


# The fields the org unit tools return, sent as `fields`: the API then skips instances_count
# (list: a join of every org unit to its instances, detail: all the descendants) and the fields dropped here.
ORG_UNIT_SLIM_FIELDS = [
    "id",
    "name",
    "validation_status",
    "parent_id",
    "parent_name",
    "org_unit_type_id",
    "org_unit_type_name",
    "source",
]


# with_most_details=True: the API's fields without instances_count (and, for the detail, reference_instances
# and catchment). `parent` (nested up to the root) only with with_ancestors, returned flattened as `ancestors`.
ORG_UNIT_LIST_MOST_DETAILS_FIELDS = [
    field for field in OrgUnitSearchSerializer.Meta.fields if field not in ("instances_count", "parent")
]
ORG_UNIT_DETAIL_MOST_DETAILS_FIELDS = [
    "id",
    "name",
    "code",
    "aliases",
    "validation_status",
    "source",
    "source_id",
    "source_ref",
    "source_url",
    "sub_source",
    "version",
    "version_id",
    "parent_id",
    "parent_name",
    "org_unit_type_id",
    "org_unit_type_name",
    "org_unit_type",
    "groups",
    "latitude",
    "longitude",
    "altitude",
    "has_geo_json",
    "opening_date",
    "closed_date",
    "created_at",
    "updated_at",
    "creator",
    "default_image_id",
]
# Common to the nested `parent` of the list and of the detail
ORG_UNIT_ANCESTOR_FIELDS = ["id", "name", "org_unit_type_id", "org_unit_type_name"]


def slim_org_unit(item: dict[str, Any]) -> dict[str, Any]:
    return {field: item.get(field) for field in ORG_UNIT_SLIM_FIELDS}


def org_unit_fields(
    most_details_fields: list[str], with_most_details: bool, with_ancestors: bool, with_geo_json: bool = False
) -> str:
    """The `fields` param of the org units API for these options."""
    fields = most_details_fields if with_most_details else ORG_UNIT_SLIM_FIELDS
    fields = fields + (["parent"] if with_ancestors else []) + (["geo_json"] if with_geo_json else [])
    return ",".join(fields)


def org_unit_result(
    item: dict[str, Any], with_most_details: bool, with_ancestors: bool, with_geo_json: bool = False
) -> dict[str, Any]:
    """The org unit as returned by the tools, from the API item fetched with org_unit_fields."""
    if with_most_details:
        org_unit = {key: value for key, value in item.items() if key not in ("parent", "geo_json")}
    else:
        org_unit = slim_org_unit(item)
    if with_ancestors:
        org_unit["ancestors"] = _ancestors(item.get("parent"))
    if with_geo_json:
        org_unit["geo_json"] = item.get("geo_json")
    return org_unit


def _ancestors(parent: dict[str, Any] | None) -> list[dict[str, Any]]:
    """The nested parents flattened, from the direct parent to the root."""
    ancestors = []
    while parent:
        ancestors.append({field: parent.get(field) for field in ORG_UNIT_ANCESTOR_FIELDS})
        parent = parent.get("parent")
    return ancestors


def slim_form(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "form_id": item.get("form_id"),
        "instances_count": item.get("instances_count"),
        "period_type": item.get("period_type"),
        "project_ids": item.get("project_ids"),
    }


def slim_instance(item: dict[str, Any]) -> dict[str, Any]:
    org_unit = item.get("org_unit") or {}
    created_by = item.get("created_by") or {}
    return {
        "id": item.get("id"),
        "uuid": item.get("uuid"),
        "form_id": item.get("form_id"),
        "form_name": item.get("form_name"),
        "status": item.get("status"),
        "org_unit_id": org_unit.get("id"),
        "org_unit_name": org_unit.get("name"),
        "org_unit_validation_status": org_unit.get("validation_status"),
        "period": item.get("period"),
        "created_by": created_by.get("username"),
        "updated_at": item.get("updated_at"),
    }


def slim_form_version(item: dict[str, Any]) -> dict[str, Any]:
    created_by = item.get("created_by") or {}
    return {
        "id": item.get("id"),
        "version_id": item.get("version_id"),
        "form_id": item.get("form_id"),
        "form_name": item.get("form_name"),
        "full_name": item.get("full_name"),
        "mapped": item.get("mapped"),
        "created_by": created_by.get("username"),
        "updated_at": item.get("updated_at"),
        "start_period": item.get("start_period"),
        "end_period": item.get("end_period"),
    }


def slim_org_unit_type(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "short_name": item.get("short_name"),
        "depth": item.get("depth"),
        "units_count": item.get("units_count"),
        "sub_unit_types": [
            {"id": child.get("id"), "name": child.get("name")} for child in (item.get("sub_unit_types") or [])
        ],
    }


def slim_org_unit_type_hierarchy(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "short_name": item.get("short_name"),
        "depth": item.get("depth"),
        "category": item.get("category"),
        "sub_unit_types": [slim_org_unit_type_hierarchy(dict(child)) for child in (item.get("sub_unit_types") or [])],
    }


def slim_instance_file(item: dict[str, Any]) -> dict[str, Any]:
    org_unit = item.get("org_unit") or {}
    return {
        "id": item.get("id"),
        "instance_id": item.get("instance_id"),
        "name": item.get("name"),
        "file_type": item.get("file_type"),
        "question_name": item.get("question_name"),
        "form_name": item.get("form_name"),
        "org_unit_id": org_unit.get("id"),
        "org_unit_name": org_unit.get("name"),
        "created_at": item.get("created_at"),
    }
