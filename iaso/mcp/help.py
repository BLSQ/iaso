"""IASO get_help_or_doc — OpenHEXA shape, content from IASO docs."""

from __future__ import annotations

from typing import Any

from iaso.mcp.catalog import CATALOG_DOCS, fetch_design_system_doc


# MCP-only pages (not in the design-system / iaso docs trees).
_LOCAL_BLURBS: dict[str, str] = {
    "tools": ("Typed MCP tools, pagination (max 50), iaso_raw, and confirm=true writes."),
    "recipes": (
        "Case recipes: remapping rejected-OU instances and creating a pyramid "
        "from Excel. Preview, then apply with confirm=true."
    ),
    "fill-account": (
        "Account-setup Excel loop: download template, user fills yellow cells, "
        "preview_fill_account / apply_fill_account."
    ),
    "openhexa": (
        "IASO + OpenHEXA: auth is the logged-in IASO Django user (OAuth Bearer). "
        "Never .env and never an OpenHEXA workspace connection. "
        "Before any write, confirm url, user, account, project, data source."
    ),
}

_LOCAL_DOCS: dict[str, str] = {
    "tools": """# IASO MCP tools

Read tools are paginated (default 10, max 50).

**Identity**
- `iaso_whoami` — live user, account, URL from the IASO Django session (never secrets).
- `iaso_openhexa_auth_params` — url + login from that same session for OpenHEXA pipeline params. Topic `openhexa`.

**Org units**
- `list_org_units` / `get_org_unit`
- `list_org_unit_types` / `get_org_unit_type` / `get_org_unit_type_hierarchy`

**Forms and submissions**
- `list_forms` / `get_form`
- `list_form_versions` / `get_form_version`
- `list_instances` / `get_instance`
- `list_instance_files` / `count_instance_files`

**Escape hatch**
- `iaso_raw` — any `/api/` path via iaso-client. GET runs immediately. POST/PATCH/PUT/DELETE preview unless `confirm=true`.

**Writes**
Before any write (`iaso_raw` with confirm=true, apply tools, or an OpenHEXA
pipeline that POSTs to IASO): call `iaso_whoami`, show url, user, account,
project, and data source, and wait for the user to confirm. Never call an
apply tool unless the user explicitly confirms that target. Preview first:
- `preview_reattach_instances` / `apply_reattach_instances`
- `preview_create_pyramid` / `apply_create_pyramid`
- `preview_fill_account` / `apply_fill_account`

Product meaning comes from design-system topics (`claude`, `index`, `forms`, …), not from this page.
""",
    "recipes": """# IASO case recipes

Always **preview**, show `iaso_whoami` (url, user, account, project, data
source), wait for the user to confirm that target, then **apply** with
`confirm=true`.

**Migrate / reattach instances**
- `preview_reattach_instances` — dry-run, no writes.
- `apply_reattach_instances(confirm=true)` — PATCH instances.

**Create pyramid from Excel**
- Workbook is a list of org units: columns are the hierarchy left to right,
  last column is the leaf type, extra sheets add sibling leaves under the
  same parents. `GEO_LEVELS` / `LEAF_TYPES` are inferred from those columns.
- Omit `xlsx_path` to use the packaged Demo Republic sample (`Org_Units.xlsx`).
- `preview_create_pyramid` — planned org unit types and VALID org units.
- `apply_create_pyramid(confirm=true)` with the same file.

For filling a whole demo account from Excel, use topic `fill-account`.
For what an org unit or instance *is*, use topics `orgunits` / `forms` (iaso-design-system).
""",
    "fill-account": """# Fill an IASO account from Excel

Goal: put a small, fake, country-shaped pyramid into the **connected** IASO account. Do not create a new Account tenant. Product model: topics `accounts`, `projects`, `orgunits`.

**Human Excel loop (default)**
1. `download_account_setup_template` — user opens the xlsx, fills yellow cells, saves, attaches the file.
2. `preview_fill_account` with `xlsx_path` or `xlsx_base64`. Show `iaso_whoami` (url, user, account, project, data source) plus planned ops. Wait for confirmation.
3. `apply_fill_account` with the same file only after the user confirms (`confirm=true`).

Omit `xlsx_path` to use the packaged Demo Republic sample. Optional AI fill: `write_account_setup_workbook`.
""",
    "openhexa": """# OpenHEXA + IASO MCP auth

**The logged-in IASO Django user is the only IASO account.** MCP lives
inside this IASO process. OAuth consent uses `/login/`. Tools run
in-process as that user (same permissions as the web API). Call
`iaso_whoami` first. The URL, user, account, project, and data source
in that payload are the instance you may write to.

## Default: IASO Django user only

When a user is using **IASO MCP and OpenHEXA MCP together**, IASO auth
comes from this server — not from OpenHEXA, not from the environment:

1. `iaso_whoami` / `iaso_openhexa_auth_params` (url + login, no secrets)
2. Pass `iaso_url` / `iaso_login` as OpenHEXA pipeline parameters when
   a pipeline must call this IASO over HTTP

Do not hard-code credentials in `pipeline.py`.

## NEVER

Do **not** connect to IASO with:

- Local / repo credentials: `.env`, `IASO_BASE_URL`, `IASO_API_TOKEN`,
  `IASO_TOKEN`, `IASO_LOGIN`, `IASO_PASSWORD`
- An OpenHEXA workspace connection: `workspace.custom_connection(...)`,
  an `IASOConnection` parameter, or a CUSTOM / IASO slug
  (`iaso-client`, `iaso-local-bewi`, `iaso-demo`, `setuper-demo`, …)

**Listing OpenHEXA connections is inventory only.** That is not permission
to use them.

## Before any IASO write

Stop. Call `iaso_whoami`. Show and wait for the user to confirm:

- IASO URL
- user
- account
- project
- data source (and default version)

Do this for `iaso_raw` writes and apply tools. Do not write until they confirm.

## Prefer IASO MCP for the write

If the job is a single IASO write, use `iaso_raw` / apply tools
(`confirm=true`). Auth cannot drift: it is already the Django user.
""",
}


def local_doc(name: str) -> str | None:
    return _LOCAL_DOCS.get(name)


def all_topics() -> dict[str, str]:
    topics = {name: blurb for name, (_path, blurb) in CATALOG_DOCS.items()}
    topics.update(_LOCAL_BLURBS)
    return topics


def topic_blurb_block() -> str:
    return "\n".join(f"- {name}: {blurb}" for name, blurb in all_topics().items())


def help_tool_description() -> str:
    return (
        "Call this tool when you are stuck, unsure what to do next, or need "
        "guidance on IASO. Leave topic empty for the official catalog index "
        "(catalog/README.md) plus CLAUDE.md agent rules. Pass a reason "
        "describing what you are stuck on (e.g. 'unsure which tool to use', "
        "'cannot find submissions', 'what is an entity'). Pass a topic name "
        "to fetch that IASO design-system or product doc in full. Available "
        "topics:\n" + topic_blurb_block()
    )


def _suggest_topics(reason: str) -> list[str]:
    text = reason.lower()
    rules: list[tuple[tuple[str, ...], str]] = [
        (("vocabular", "spell", "terminology", "claude", "agent rule"), "claude"),
        (("who am", "whoami", "login", "connect", "token"), "tools"),
        (
            (
                "connection slug",
                "wrong account",
                "another account",
                ".env",
                "local credential",
                "iaso_base_url",
                "list_connections",
                "workspace connection",
                "custom_connection",
            ),
            "openhexa",
        ),
        (("account", "tenant", "tenancy"), "accounts"),
        (("project", "app id", "feature flag"), "projects"),
        (("tool", "iaso_raw", "api/", "endpoint", "paginat"), "tools"),
        (("form ai", "nl form"), "form-ai"),
        (("instance", "submission", "form", "xlsform"), "forms"),
        (("group set", "org unit type", "ou type"), "orgunits-config"),
        (("org unit", "orgunit", "pyramid", "facility", "district"), "orgunits"),
        (("data source", "datasource", "source version"), "datasources"),
        (("entit", "beneficiary", "duplicate", "workflow"), "entities"),
        (("planning", "mission", "assignment", "sampling"), "planning"),
        (("user", "role", "team"), "users"),
        (
            (
                "openhexa",
                "open hexa",
                "hexa connection",
                "custom_connection",
                "iaso-client connection",
                "pipeline auth",
                "pipeline param",
            ),
            "openhexa",
        ),
        (("pipeline",), "pipelines"),
        (("task", "async", "job"), "tasks"),
        (("import", "notification"), "apiimport"),
        (("reattach", "migrate", "rejected"), "recipes"),
        (("fill", "demo", "excel", "template", "workbook", "yellow"), "fill-account"),
        (("map", "leaflet", "cluster"), "data-maps"),
        (("accessib", "a11y"), "accessibility"),
        (("layout", "page shell"), "layouts"),
        (("principle", "brand"), "principles"),
    ]
    found: list[str] = []
    for needles, topic in rules:
        if any(n in text for n in needles) and topic not in found:
            found.append(topic)
    return found


def _overview(reason: str | None) -> dict[str, object]:
    suggested = _suggest_topics(reason) if reason else []
    if not suggested:
        suggested = ["claude", "index", "tools"]
    index = fetch_design_system_doc(CATALOG_DOCS["index"][0])
    claude = fetch_design_system_doc(CATALOG_DOCS["claude"][0])
    content = (
        "# IASO docs (official)\n\n"
        "Empty-topic overview is the design-system catalog index plus CLAUDE.md. "
        "Do not invent product meaning beyond these files.\n\n"
        "---\n\n"
        f"{index}\n\n---\n\n{claude}"
    )
    return {
        "topic": "overview",
        "title": "IASO catalog index + CLAUDE.md",
        "source": [
            "BLSQ/iaso-design-system/catalog/README.md",
            "BLSQ/iaso-design-system/CLAUDE.md",
        ],
        "reason": reason,
        "suggested_topics": suggested,
        "available_topics": [{"name": name, "summary": blurb} for name, blurb in all_topics().items()],
        "content": content,
    }


def get_help_or_doc_payload(
    topic: str | None = None,
    reason: str | None = None,
) -> dict[str, object]:
    key = (topic or "").strip().lower()
    if not key:
        return _overview(reason)

    topics = all_topics()
    if key not in topics:
        known = ", ".join(topics)
        return {
            "topic": key,
            "ok": False,
            "error": f"Unknown topic '{topic}'. Known: {known}.",
            "available_topics": list(topics),
        }

    if key in CATALOG_DOCS:
        path, blurb = CATALOG_DOCS[key]
        content = fetch_design_system_doc(path)
        title = blurb
        source = path
    else:
        content = _LOCAL_DOCS[key]
        title = topics[key]
        source = f"iaso.mcp:{key}"

    return {
        "topic": key,
        "title": title,
        "source": source,
        "reason": reason,
        "ok": True,
        "content": content,
    }


def mcp_auth_instructions() -> str:
    """MCP server instructions: clients read this first."""
    return (
        "Auth is the logged-in IASO user (OAuth Bearer on /mcp). "
        "iaso_whoami is the account. Tools run in-process with that user's "
        "permissions — no stored remote tokens. "
        "With OpenHEXA, pass iaso_url / iaso_login from iaso_openhexa_auth_params. "
        "NEVER use .env / IASO_* env vars. "
        "NEVER use an OpenHEXA workspace connection. "
        "Before ANY IASO write (iaso_raw confirm, apply_*): call iaso_whoami, "
        "show url, user, account, project, and data source, and wait for confirm. "
        "Topic: openhexa."
    )


def openhexa_pipeline_auth_params(whoami: dict[str, Any]) -> dict[str, Any]:
    """Public OpenHEXA pipeline params taken from IASO MCP identity. No secrets."""
    url = str(whoami.get("base_url") or "")
    login = str(whoami.get("login") or "")
    return {
        "ok": bool(whoami.get("ok")),
        "rule": (
            "Auth an OpenHEXA IASO pipeline from iaso_whoami / this payload. "
            "NEVER .env. NEVER an OpenHEXA workspace connection."
        ),
        "auth_source": (
            "IASO Django user from OAuth consent on this server. "
            "Tools run as that user; there is no stored remote token."
        ),
        "never_use": [
            ".env / IASO_BASE_URL / IASO_API_TOKEN / IASO_LOGIN / IASO_PASSWORD",
            "workspace.custom_connection",
            "OpenHEXA IASOConnection parameter",
            "CUSTOM connection slug (iaso-client, iaso-local-bewi, iaso-demo, …)",
        ],
        "never_use_unless_user_asks": [
            ".env / IASO_BASE_URL / IASO_API_TOKEN / IASO_LOGIN / IASO_PASSWORD",
            "workspace.custom_connection",
            "OpenHEXA IASOConnection parameter",
            "CUSTOM connection slug (iaso-client, iaso-local-bewi, iaso-demo, …)",
        ],
        "iaso_url": url,
        "iaso_login": login,
        "account_id": whoami.get("account_id"),
        "account_name": whoami.get("account_name"),
        "user_name": whoami.get("user_name"),
        "data_source_id": whoami.get("data_source_id"),
        "data_source_name": whoami.get("data_source_name"),
        "projects": whoami.get("projects"),
        "pipeline_config_public": {
            "iaso_url": url,
            "iaso_login": login,
        },
        "secrets": (
            "Pass iaso_token (preferred) or iaso_password as OpenHEXA Secret "
            "params from this same FastMCP session. Never copy secrets from "
            ".env or an OpenHEXA connection."
        ),
        "before_write": (
            "Call iaso_whoami. Show url, user, account, project, and data "
            "source. Wait for the user to confirm before any IASO write."
        ),
        "prefer_mcp_write": (
            "If the job is a single IASO write, use iaso_raw / apply tools on this MCP instead of OpenHEXA."
        ),
        "doc": "get_help_or_doc topic=openhexa",
    }
