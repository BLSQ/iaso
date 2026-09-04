"""IASO MCP tools. They run as the OAuth Bearer user via in-process API calls."""

from __future__ import annotations

from typing import Any, Literal

from iaso.mcp.client import IasoError
from iaso.mcp.fill_account import (
    download_template,
    run_fill_with_client,
    slim_fill_result,
    write_custom_workbook,
    write_template,
)
from iaso.mcp.help import (
    get_help_or_doc_payload,
    help_tool_description,
    mcp_auth_instructions,
    openhexa_pipeline_auth_params,
)
from iaso.mcp.protocol import tool
from iaso.mcp.pyramid import apply_pyramid, plan_pyramid, resolve_pyramid_xlsx
from iaso.mcp.raw import (
    ALLOWED_METHODS,
    WRITE_METHODS,
    as_object,
    execute_raw,
    normalize_api_path,
    preview_raw,
)
from iaso.mcp.reattach import apply_plan, plan_reattach, summarize_plan
from iaso.mcp.recipes.fill_account.apply import connection_prompt, current_account
from iaso.mcp.serialize import (
    clamp_limit,
    page_meta,
    slim_form,
    slim_form_version,
    slim_instance,
    slim_instance_file,
    slim_org_unit,
    slim_org_unit_type,
    slim_org_unit_type_hierarchy,
)
from iaso.mcp.session import account_info, get_client


# Keep help text aligned with the protocol initialize payload.
MCP_INSTRUCTIONS = (
    "IASO MCP on the IASO Django session (OAuth Bearer = logged-in IASO user). "
    "A submission is an instance (one filled form). "
    "An org unit is a node in the geographic hierarchy. "
    "Typed tools: org units, org unit types, forms, form versions, "
    "instances, instance files. Read tools are paginated (max 50). "
    "iaso_raw is an in-process /api/ call (GET/POST/PATCH/PUT/DELETE). "
    "Writes need confirm=true "
    "(iaso_raw, apply_reattach_instances, apply_create_pyramid, "
    "apply_fill_account). " + mcp_auth_instructions()
)


def _write_target() -> dict[str, Any]:
    try:
        live = current_account(get_client())
    except IasoError as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True, "target": live, "prompt": connection_prompt(live)}


def _filters(**kwargs: Any) -> dict[str, Any]:
    return {key: value for key, value in kwargs.items() if value is not None}


@tool()
def get_help_or_doc(topic: str | None = None, reason: str | None = None) -> dict[str, Any]:
    """Guidance and product docs. Empty topic = overview; topic = full page."""
    return get_help_or_doc_payload(topic=topic, reason=reason)


get_help_or_doc._mcp_description = help_tool_description()


@tool()
def iaso_whoami() -> dict[str, Any]:
    """Live IASO identity from the logged-in Django user (never secrets)."""
    env = account_info()
    try:
        live = current_account(get_client())
    except IasoError as exc:
        return {**env, "ok": False, "error": str(exc)}
    return {**env, **live, "ok": True, "prompt": connection_prompt(live)}


@tool()
def iaso_openhexa_auth_params() -> dict[str, Any]:
    """Public OpenHEXA pipeline params from this IASO user (url + login, no secrets)."""
    identity = iaso_whoami()
    return openhexa_pipeline_auth_params(identity)


@tool()
def list_org_units(
    search: str | None = None,
    validation_status: str | None = None,
    parent_id: int | None = None,
    org_unit_type_id: int | None = None,
    source_id: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of org units. validation_status: NEW, VALID, REJECTED."""
    limit = clamp_limit(limit)
    response = get_client().org_units_list_page(
        page=page,
        limit=limit,
        **_filters(
            search=search,
            validation_status=validation_status,
            parent_id=parent_id,
            org_unit_type_id=org_unit_type_id,
            source_id=source_id,
        ),
    )
    return {
        **page_meta(response),
        "org_units": [slim_org_unit(item) for item in response.get("orgunits") or []],
    }


@tool()
def get_org_unit(org_unit_id: int) -> dict[str, Any]:
    """Retrieve one org unit by id (slim fields, no geometry)."""
    detail = get_client().org_units_retrieve(org_unit_id=org_unit_id)
    return slim_org_unit(dict(detail))


@tool()
def list_org_unit_types(
    search: str | None = None,
    project: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of org unit types."""
    limit = clamp_limit(limit)
    response = get_client().org_unit_types_list_page(
        page=page,
        limit=limit,
        **_filters(search=search, project=project),
    )
    return {
        **page_meta(response),
        "org_unit_types": [slim_org_unit_type(item) for item in response.get("orgUnitTypes") or []],
    }


@tool()
def get_org_unit_type(org_unit_type_id: int) -> dict[str, Any]:
    """Retrieve one org unit type by id (slim fields)."""
    detail = get_client().org_unit_types_retrieve(org_unit_type_id=org_unit_type_id)
    return slim_org_unit_type(dict(detail))


@tool()
def get_org_unit_type_hierarchy(org_unit_type_id: int) -> dict[str, Any]:
    """Retrieve the org unit type hierarchy (children nested)."""
    detail = get_client().org_unit_types_hierarchy(org_unit_type_id=org_unit_type_id)
    return slim_org_unit_type_hierarchy(dict(detail))


@tool()
def list_forms(
    search: str | None = None,
    org_unit_id: int | None = None,
    org_unit_type_id: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of forms."""
    limit = clamp_limit(limit)
    response = get_client().forms_list_page(
        page=page,
        limit=limit,
        **_filters(search=search, org_unit_id=org_unit_id, org_unit_type_id=org_unit_type_id),
    )
    return {**page_meta(response), "forms": [slim_form(item) for item in response.get("forms") or []]}


@tool()
def get_form(form_id: int) -> dict[str, Any]:
    """Retrieve one form by id. Omits possible_fields and project details."""
    detail = get_client().forms_retrieve(form_id=form_id)
    return slim_form(dict(detail))


@tool()
def list_form_versions(
    form_id: int | None = None,
    search_name: str | None = None,
    mapped: bool | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of form versions (XLSForm versions). Omits descriptors."""
    limit = clamp_limit(limit)
    response = get_client().form_versions_list_page(
        page=page,
        limit=limit,
        **_filters(form_id=form_id, search_name=search_name, mapped=mapped),
    )
    return {
        **page_meta(response),
        "form_versions": [slim_form_version(item) for item in response.get("form_versions") or []],
    }


@tool()
def get_form_version(form_version_id: int) -> dict[str, Any]:
    """Retrieve one form version by id. Omits descriptor and possible_fields."""
    detail = get_client().form_versions_retrieve(form_version_id=form_version_id)
    return slim_form_version(dict(detail))


@tool()
def list_instances(
    org_unit_id: int | None = None,
    form_id: int | None = None,
    org_unit_status: str | None = None,
    status: str | None = None,
    search: str | None = None,
    show_deleted: bool | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of submissions (instances). org_unit_status: NEW, VALID, REJECTED."""
    limit = clamp_limit(limit)
    response = get_client().instances_list_page(
        page=page,
        limit=limit,
        **_filters(
            org_unit_id=org_unit_id,
            form_id=form_id,
            org_unit_status=org_unit_status,
            status=status,
            search=search,
            show_deleted=show_deleted,
        ),
    )
    return {
        **page_meta(response),
        "instances": [slim_instance(item) for item in response.get("instances") or []],
    }


@tool()
def get_instance(instance_id: int) -> dict[str, Any]:
    """Retrieve one submission (instance) by id. Omits form answers and files."""
    detail = get_client().instances_retrieve(instance_id=instance_id)
    return slim_instance(dict(detail))


@tool()
def list_instance_files(
    form_id: int | None = None,
    org_unit_id: int | None = None,
    search: str | None = None,
    image_only: bool | None = None,
    video_only: bool | None = None,
    document_only: bool | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    """List one page of instances (attachments live on instance detail)."""
    limit = clamp_limit(limit)
    response = get_client().instance_files_list_page(
        page=page,
        limit=limit,
        **_filters(
            form_id=form_id,
            org_unit_id=org_unit_id,
            search=search,
            image_only=image_only,
            video_only=video_only,
            document_only=document_only,
        ),
    )
    items = response.get("results") or response.get("instances") or []
    return {
        **page_meta(response),
        "instance_files": [slim_instance_file(item) if "file" in item else slim_instance(item) for item in items],
    }


@tool()
def count_instance_files(
    form_id: int | None = None,
    org_unit_id: int | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    """Return instance counts for the given filters."""
    return dict(get_client().instance_files_count(**_filters(form_id=form_id, org_unit_id=org_unit_id, search=search)))


@tool()
def iaso_raw(
    method: Literal["GET", "POST", "PATCH", "PUT", "DELETE"],
    path: str,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    confirm: bool = False,
) -> dict[str, Any]:
    """Call IASO /api/ as the logged-in user. Writes need confirm=true."""
    method_upper = method.upper()
    if method_upper not in ALLOWED_METHODS:
        allowed = ", ".join(sorted(ALLOWED_METHODS))
        return {"ok": False, "error": f"method must be one of {allowed}."}

    try:
        path = normalize_api_path(path)
        params = as_object(params, label="params")
        json_body = as_object(json_body, label="json_body")
    except ValueError as exc:
        return {"ok": False, "error": str(exc)}

    if method_upper in WRITE_METHODS and not confirm:
        preview = preview_raw(method=method_upper, path=path, params=params, json_body=json_body)
        preview["identity"] = _write_target()
        return preview

    return execute_raw(get_client(), method=method_upper, path=path, params=params, json_body=json_body)


@tool()
def preview_reattach_instances() -> dict[str, Any]:
    """Dry-run the migrate_instances CSV remapping. Does not write to IASO."""
    return summarize_plan(plan_reattach())


@tool()
def apply_reattach_instances(confirm: bool = False) -> dict[str, Any]:
    """PATCH instances from migrate_instances CSVs. No-op unless confirm=true."""
    actions = plan_reattach()
    summary = summarize_plan(actions)
    if not confirm:
        return {
            "applied": False,
            "reason": "confirm=false; nothing was written. Call again with confirm=true after preview.",
            "identity": _write_target(),
            **summary,
        }
    result = apply_plan(get_client(), actions)
    return {"applied": True, **summary, **result}


@tool()
def preview_create_pyramid(
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
) -> dict[str, Any]:
    """Dry-run an org-unit list workbook. Hierarchy is read from the Excel columns."""
    try:
        path = resolve_pyramid_xlsx(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64)
        return plan_pyramid(get_client(), xlsx_path=path)
    except (ValueError, FileNotFoundError, OSError, PermissionError) as exc:
        return {"ok": False, "error": str(exc)}


@tool()
def apply_create_pyramid(
    confirm: bool = False,
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
) -> dict[str, Any]:
    """Create org unit types and VALID org units from an org-unit list workbook."""
    try:
        path = resolve_pyramid_xlsx(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64)
        summary = plan_pyramid(get_client(), xlsx_path=path)
    except (ValueError, FileNotFoundError, OSError, PermissionError) as exc:
        return {"applied": False, "ok": False, "error": str(exc)}
    if not confirm:
        return {
            "applied": False,
            "reason": "confirm=false; nothing was written. Call again with confirm=true after preview.",
            "identity": _write_target(),
            **summary,
        }
    try:
        result = apply_pyramid(get_client(), xlsx_path=path)
    except ValueError as exc:
        return {"applied": False, "ok": False, "error": str(exc), **summary}
    return {"applied": True, **result}


@tool()
def download_account_setup_template(save_path: str | None = None) -> dict[str, Any]:
    """Save the account-setup Excel template into MEDIA_ROOT/mcp (filename only)."""
    try:
        return download_template(save_path)
    except (ValueError, OSError, IasoError) as exc:
        return {"ok": False, "error": str(exc)}


@tool()
def write_account_setup_template(xlsx_path: str | None = None) -> dict[str, Any]:
    """Write the sample Demo Republic workbook into the MCP media jail."""
    return write_template(xlsx_path)


@tool()
def write_account_setup_workbook(
    xlsx_path: str | None = None,
    settings: dict[str, Any] | None = None,
    org_unit_types: list[dict[str, Any]] | None = None,
    org_units: list[dict[str, Any]] | None = None,
    org_unit_geo: list[dict[str, Any]] | None = None,
    forms: list[dict[str, Any]] | None = None,
    entity_types: list[dict[str, Any]] | None = None,
    entities: list[dict[str, Any]] | None = None,
    instances: list[dict[str, Any]] | None = None,
    workflows: list[dict[str, Any]] | None = None,
    workflow_followups: list[dict[str, Any]] | None = None,
    workflow_changes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Write an account-setup Excel from JSON (AI-generated fake demo data)."""
    try:
        return write_custom_workbook(
            xlsx_path=xlsx_path,
            settings=settings,
            org_unit_types=org_unit_types,
            org_units=org_units,
            org_unit_geo=org_unit_geo,
            forms=forms,
            entity_types=entity_types,
            entities=entities,
            instances=instances,
            workflows=workflows,
            workflow_followups=workflow_followups,
            workflow_changes=workflow_changes,
        )
    except (ValueError, FileNotFoundError, OSError, IasoError) as exc:
        return {"ok": False, "error": str(exc)}


@tool()
def preview_fill_account(
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
) -> dict[str, Any]:
    """Dry-run fill of the connected IASO account from an uploaded Excel."""
    try:
        return slim_fill_result(run_fill_with_client(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64, dry_run=True))
    except (ValueError, FileNotFoundError, OSError, IasoError) as exc:
        return {"ok": False, "error": str(exc)}


@tool()
def apply_fill_account(
    xlsx_path: str | None = None,
    xlsx_base64: str | None = None,
    confirm: bool = False,
) -> dict[str, Any]:
    """Apply a filled account-setup Excel to the connected IASO account."""
    if not confirm:
        try:
            preview = slim_fill_result(run_fill_with_client(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64, dry_run=True))
        except (ValueError, FileNotFoundError, OSError, IasoError) as exc:
            return {"applied": False, "ok": False, "error": str(exc)}
        return {
            "applied": False,
            "reason": connection_prompt(preview) + " Nothing was written. Call again with confirm=true to proceed.",
            **preview,
        }
    try:
        result = run_fill_with_client(xlsx_path=xlsx_path, xlsx_base64=xlsx_base64, dry_run=False)
    except (ValueError, FileNotFoundError, OSError, IasoError) as exc:
        return {"applied": False, "ok": False, "error": str(exc)}
    return {"applied": True, **slim_fill_result(result)}
