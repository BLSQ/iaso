from __future__ import annotations

from typing import Any


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


def slim_org_unit(item: dict[str, Any]) -> dict[str, Any]:
    org_unit_type = item.get("org_unit_type") or {}
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "validation_status": item.get("validation_status"),
        "parent_id": item.get("parent_id"),
        "parent_name": item.get("parent_name"),
        "org_unit_type_id": item.get("org_unit_type_id") or org_unit_type.get("id"),
        "org_unit_type_name": item.get("org_unit_type_name") or org_unit_type.get("name"),
        "source": item.get("source"),
        "instances_count": item.get("instances_count"),
    }


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
